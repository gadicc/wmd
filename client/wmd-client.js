#!/usr/bin/env node

// node core
var child_process = require('child_process');
var os = require('os');
var fs = require('fs');
var sha1 = require('sha1');
var util = require('util')

// npm
var forever = require('forever-monitor');
var _ = require('underscore');
var osUtils = require('os-utils');
var DDPClient = require("ddp");


var credentials = require('./credentials.json');
var cslog = require('./cslog.js');

console.log('wmd-client starting...');

var stateFile = './state.json';
var state = {
	files: {},
	forevers: {}
};
var saveState = _.debounce(function() {
	fs.writeFile(stateFile, JSON.stringify(state), function(err) {
		if (err)
		console.log("Can't save state.json!  Not reboot safe.");
	});
}, 1000);

// forever not using --sourceDir for CWD?
if (process.cwd() == '/')
	process.chdir('/root/wmd-client');
console.log('CWD: ' + process.cwd());

// sync to ensure we load state before doing anything else
try {
	var data = fs.readFileSync(stateFile);
	state = JSON.parse(data);
} catch (err) {
	if (err.errno == 34)
		console.log('No preexisting ' + stateFile + ', running fresh...');
	else
		throw(err)
}

// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
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

function psExec() {
	ps = child_process.exec(cmd, psFunc);
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
	//global.gc();
	setTimeout(psExec, updateInterval);
}

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

  	ddpclient.subscribe('commands', [], function(err) {
	});
	var stateFiles = {};
	for (key in state.files)
		stateFiles[key] = state.files[key].hash;
	ddpclient.subscribe('files', [stateFiles], function(err) {
	});
});

// ddp message: {"msg":"added","collection":"commands","id":"GFJrxCLD4p7L5Enzo","fields":{"serverId":"mK6KLKE4zDNSccLP3","status":"new","command":"moo","options":{"a":1}}}
ddpclient.on('message', function(msg) {
	var data = JSON.parse(msg);
	//console.log(data);
	if (data.collection == 'files') {
		incomingFile(data.id, data.fields.filename, data.fields.contents, data.fields.hash);
		return;
	}

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

function incomingFile(id, filename, contents, hash) {
	if (!filename) // update (filename change not supported)
		filename = state.files[id].filename;

	fs.writeFile(filename, contents, function(err) {
		console.log('incoming ' + filename);
		if (err) {
			console.log(err);
			return;
		}

		state.files[id] = {
			filename: filename,
			hash: hash
		}
		saveState();
	});
}

commands = {
	'spawnAndLog': function(data, done) {
		spawnAndLog(data.cmd, data.args || [], data.options, done);
	},
	'foreverStart': function(data, done) {
		var slug = data.slug || data.options.slug || new Date().getTime() + Math.random();
		if (!data.options.slug) data.options.slug = slug;
		if (state.forevers[slug] && !data.options.forceRestart) {
			console.log('slug "' + slug + '" already strarted');
			done(new Error('slug "' + slug + '" already strarted'));
			return;
		}
		state.forevers[slug] = data;
		saveState();

		forevers[slug]
			= foreverStart(data.cmd, data.args, data.options, done, {
			error: function(error) {
				console.log('error', error, data);
			},
			exit: function(forever) {
				// If stopped manually, entry will be deleted already
				var slug = data.slug || data.options.slug;
				var expected = !forevers[slug];
				delete(forevers[slug]);
				delete(state.forevers[slug]);
				saveState();
				if (expected) return;
				console.log('foreverExit');
				ddpclient.call('foreverExit', [data.slug || data.options.slug]);
			}
		});
	},
	'foreverStop': function(data, done) {
		foreverStop(data.slug || data.options.slug, done);
	},
	'kill': function(data, done) {
		processKill(data, data.signal, done);
	}
};

function execDone(err, result) {
	console.log('execDone', this.commandId, err, result);

	if (!result) result = {};

	if (err && !result.err && !result.error) {
		result.status = 'error';
		result.error = util.isError(err) ? JSON.stringify(err) : err;
	}

	if (_.keys(result).length == 0)
		result.status = 'success';

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
	var child = forever.start(_.union([cmd], args), options);
	var log = new cslog(ddpclient, cmd + (args ? ' ' + args.join(' ') : ''));

	child.on('stdout', function(data) {
		log.addLine(data);
	});
	child.on('stderr', function(data) {
		log.addLine(data);
	});

	child.on('start', function(process,data) {
		log.addLine('Started successfully');
		done(null, { status: 'started', slug: options.slug, rlog: log.localId });
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

var foreverStop = function(slug, done) {
	var child = forevers[slug];
	if (child) {
		delete(forevers[slug]);
		delete(state.forevers[slug]);
		saveState();
		console.log('forever ' + slug + ' successfully stopped');
		child.stop();
		done(null, true);
	} else {
		done(new Error("Couldn't stop non-existant slug '" + slug + "'"));
	}
}

var processKill = function(data, signal, done) {
	if (data.pid) {

		try {
			process.kill(data.pid, signal);
		} catch (err) {
			done(err);
			return;
		}
		done(null, true);

	} else if (data.pidFile) {

		fs.readFile(data.pidFile, function(err, pid) {
			if (err) done(err);
			try {
				process.kill(parseInt(pid), signal);
			} catch (err) {
				done(err);
				return;
			}
			done(null, true);
		});

	} else if (data.all) {

		done(new Error('killAll not implemented yet'));

	} else {

		done(new Error('no pid/pidFile/all specified'));

	}
}

for (slug in state.forevers) {
	var data = state.forevers[slug];
	data.options.forceRestart = true;
	commands.foreverStart(data, function(err, data) {
		// TODO, ,done, callbacks
		console.log(err, data);		
	});
}

psExec();
