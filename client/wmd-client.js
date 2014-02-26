#!/usr/bin/env node
var child_process = require('child_process');
var DDPClient = require("ddp");
var os = require('os');
var osUtils = require('os-utils');
var _ = require('underscore');
var forever = require('forever-monitor');

var credentials = require('./credentials.json');
var cslog = require('./cslog.js');

console.log('wmd-client starting...');

// forever not using --sourceDir for CWD?
if (process.cwd() == '/')
	process.chdir('/root/wmd-client');
console.log('CWD: ' + process.cwd());

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
	//console.log(data);
	if (!(data.msg == 'added' && data.collection == 'Commands'))
		return;

	ddpclient.call('/Commands/update', [
		{ _id: data.id },
		{ $set: { status: 'received' } }
	], function(err, result) {
		if (err) throw (err);
	});

	var createdAt = new Date(data.fields.createdAt.$date);
	execCommand(data.id, data.fields.command, data.fields.options);
});

ps = child_process.exec(cmd, psFunc);

commands = {
	'spawnAndLog': function(data, done) {
		console.log('spawnAndLog', data);
		spawnAndLog(data.cmd, data.args || [], data.options, done);
	},
	'foreverStart': function(data, done) {
		console.log('appStart', data);
		foreverStart('mrt', data.args, data.options, done, {
			error: function(error) {
				console.log('error', error, data);
			},
			exit: function(forever) {
				console.log('exit', forever, data);
			}
		});
	}
};

function execDone(err, result) {
	console.log('execDone', this.commandId, err, result);
	ddpclient.call('cmdResult', [this.commandId, result], function(error, result) {
		console.log(error);
		//if (error) throw error;
	});
}

function execCommand(id, cmd, options) {
	console.log('Exec: ' + cmd + '(' + JSON.stringify(options) + ')');
	if (commands[cmd])
		commands[cmd](options, _.bind(execDone, { commandId: id }));
}

var spawnAndLog = function(cmd, args, options, done) {
	// Preserve PATH
	if (options && options.env && !options.env.PATH)
		options.env.PATH = process.env.PATH;

	var child = child_process.spawn(cmd, args || [], options);
	var log = new cslog(ddpclient, cmd + (args ? ' ' + args + args.join(' ') : ''));

	child.stdout.on('data', function(data) {
		log.addLine(data);
	});
	child.stderr.on('data', function(data) {
		log.addLine(data);
	});

	child.on('close', function(code) {
		if (code) { // i.e. non zero
			log.close('child process exited with code ' + code);
			if (done) done(null, { status: 'failed', code: code });
		} else {
			log.close();
			if (done) done(null, { status: 'success', code: code });
		}
	});

	child.on('error', function(error) {
		log.addLine('Error spawning "' + cmd + '"\n' + error.toString());
	});

	return child;
}

var forevers = {};
var foreverStart = function(cmd, args, options, done, callbacks) {
	console.log('options', options);
	var child = forever.start(_.union([cmd], args), options);
	var log = new cslog(ddpclient, cmd + (args ? ' ' + args.join(' ') : ''));
	var childId = new Date().getTime() + Math.random();
	//forevers[childId] = child;

	child.on('stdout', function(data) {
		log.addLine(data);
	});
	child.on('stderr', function(data) {
		log.addLine(data);
	});

	child.on('start', function(process,data) {
		log.addLine('Started successfully');
		done(null, { status: 'started', childId: childId, log: 1 });
	});

	child.on('error', function(error) {
		log.addLine('Error spawning "' + cmd + '"\n' + error.toString());
		if (callbacks.error)
			callbacks.error(error);
	});

	if (callbacks.exit)
		child.on('exit', callbacks.exit);

	return child;
}
