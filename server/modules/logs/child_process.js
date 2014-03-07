// mods of same routines from wmd-client.js incl Fiber support
// TODO, share lib somehow?  difficult with fibers, etc

var child_process = Meteor.require('child_process');
//child_process = Async.wrap(child_process, ['spawn']);

// don't generate our own log, pass it as extra parameter
spawnAndLog = function(cmd, args, options, done, log, dontClose) {
	// Preserve PATH
	if (options && options.env && !options.env.PATH)
		options.env.PATH = process.env.PATH;

	var child = child_process.spawn(cmd, args || [], options);

	child.stdout.on('data', Meteor.bindEnvironment(function(data) {
		log.addLine(data);
	}));
	child.stderr.on('data', Meteor.bindEnvironment(function(data) {
		log.addLine(data);
	}));

	child.on('close', Meteor.bindEnvironment(function(code) {
		if (code) { // i.e. non zero
			log.close('child process exited with code ' + code);
			if (done) done(null, { status: 'failed', code: code });
		} else {
			log.close();
			if (done) done(null, { status: 'success', code: code });
		}
	}));

	child.on('error', Meteor.bindEnvironment(function(error) {
		log.addLine('Error spawning "' + cmd + '"\n' + error.toString());
	}));

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
