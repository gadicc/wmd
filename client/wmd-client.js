#!/usr/bin/env node
var child_process = require('child_process');
var DDPClient = require("ddp");
var os = require('os');
var osUtils = require('os-utils');

var credentials = require('./credentials.json');

// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function psFunc(error, stdout, stderr) {
	if (error) throw new Error(error);
	var procs = [];
	var ps = {};
	var i=1;
	psRE.lastIndex = 0;
	while ((proc = psRE.exec(stdout)) !== null) {
		for (var i=0; i < psInfo.length; i++)
			ps[psInfo[i]] = isNumber(proc[i+1]) ? parseFloat(proc[i+1]) : proc[i+1];
		procs.push(ps);
		ps = {};
	}

	var osData = {
		cpuUsage: cpuUsage,
		hostname: os.hostname(),
		uptime: os.uptime(),
		loadavg: os.loadavg(),
		totalmem: os.totalmem(),
		freemem: os.freemem(),
		cpus: os.cpus()
	}

	// TODO, security etc
	ddpclient.call('updateStats', [osData, procs], function(error, result) {
		if (!result)
			return;
		if (result.updateInterval && updateInterval != result.updateInterval) {
			console.log('Updating updateInterval to ' + result.updateInterval);
			updateInterval = result.updateInterval;
		}
	});

	osUtils.cpuUsage(function setCpuUsage(usage) { cpuUsage = usage; });

	// start interval after we finish current lap
	setTimeout(function() {
		ps = child_process.exec(cmd, psFunc);
	}, updateInterval);
}

// Gets updated after every DDP call
var updateInterval = 1000;

var cpuUsage = 0;
osUtils.cpuUsage(function setCpuUsage(usage) { cpuUsage = usage; });

// expected 'pid' to be first, and 'cmd' must be last (because of spaces)
var psInfo = ['pid', 'user', 'pcpu', 'pmem', 'cputime', 'cmd'];
var cmd = 'ps wax -o ' + psInfo.join(',') + ' | grep -E "node|mongo"';
var ps;

var psRE = '^';
for (var i=0; i < psInfo.length-1; i++)
	psRE += '([^ ]+) +';
psRE = new RegExp(psRE + '(.+)$', 'mg');

var ddpclient = new DDPClient({
  host: credentials.host, 
  port: credentials.port,
  auto_reconnect: true,
  auto_reconnect_timer: 500,
  use_ejson: true
  // TODO, SSL
});

ddpclient.connect(function(error) {
	if (error) {
    console.log('DDP connection error!');
    return;
  }
  console.log('Connected to DDP server...');

  ddpclient.loginWithUsername(
  	credentials.username,
  	credentials.password,
  	function(error) {
      if (error) {
      	console.log('Authentication failed');
      	console.log(error);
      	process.exit();
      }
      console.log('Logged in as ' + credentials.username);
  	});

  ddpclient.subscribe('commands', [], function() {
		//console.log('commands complete:');
		//console.log(ddpclient.collections.commands);
	});
});

// ddp message: {"msg":"added","collection":"commands","id":"GFJrxCLD4p7L5Enzo","fields":{"serverId":"mK6KLKE4zDNSccLP3","status":"new","command":"moo","options":{"a":1}}}
ddpclient.on('message', function(msg) {
	var data = JSON.parse(msg);
	if (!(data.msg == 'added' && data.collection == 'commands'))
		return;

	ddpclient.call('/commands/update', [
		{ _id: data.id },
		{ $set: { status: 'received' } }
	], function(err, result) {
		if (err) throw (err);
	});

	var createdAt = new Date(data.fields.createdAt.$date);
	execCommand(data.fields.command, data.fields.options);
});

ps = child_process.exec(cmd, psFunc);

function execCommand(cmd, options) {
	console.log('cmd(' + JSON.stringify(options) + ')');
}
