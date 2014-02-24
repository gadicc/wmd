if (Meteor.isServer) {

	/*
	 *  { name: 'can-i-eat#master',
	 *    source: 'repo',
	 *    repoId: 'ruQNQPFTKRYNptHYr',
	 *    appId: 1008,
	 *    instances: { min: null, max: null, running: 0, desired: 1 },
	 *    servers: 
	 *     { forcedOn: [ 'fm8wRWewifDnwKsKv' ],
	 *       deployedOn: [],
	 *       runningOn: [],
	 *       desiredOn: [] },
	 *    _id: 'AYLhiET3YcRC8FyTy' }
	*/

	/*
	 * Note: the entire 'servers' section will probably become
	 * part of an array/object of 'datacenters' in the future.
	 */

	var appCheck = function(appOrig) {
		var app = _.clone(appOrig);
		console.log(app);

		// forcedOn list must always be in desiredOn list too
		_.each(app.servers.forcedOn, function(forcedId) {
			if (!_.contains(app.servers.desiredOn, forcedId))
				app.servers.desiredOn.push(forcedId);
		});

		// check if all desireds are deployed (and run setup)
		_.each(app.servers.desiredOn, function(desiredId) {
			if (!_.contains(app.servers.deployedOn, desiredId))
				appInstall(app, desiredId);
		});

		// is the app running on all servers it's deployed to?
		_.each(app.servers.deployedOn, function(deployedId) {
			if (!_.contains(app.servers.runningOn, deployedId))
				appStart(app, deployedId);
		});

		// update if changed
	}

	var appInstall = function(app, serverId) {
		console.log('starting setup');

		var data = {
			env: {
				'APPID': app.appId,
				'APPNAME': app.name,
			}
		};

		var source = app.source;

		// move to seperate repo package
		if (source == 'repo') {
			data.repo = wmdRepos.findOne(app.repoId);
			data.env.BRANCH = app.branch;
			console.log(data.repo);
			Extensions.runPlugin('appInstall',
				data.repo.service, data, true);
		}

		console.log(data);

		sendCommand(serverId, 'spawnAndLog', {
			cmd: './appInstall.sh',
			options: { env: data.env }
		}, function(error, result) {
			if (result.code) // i.e. non-zero, failure
				Apps.update(app._id, {
					$push: { 'servers.failingOn': serverId }
				});
			else // install success
				Apps.update(app._id, {
					$push: { 'servers.deployedOn': serverId }
				});
		});
	}
	Extensions.registerPluginType('appInstall', '0.1.0');

	var appStart = function(app, serverId) {
		console.log('starting app');

		var data = {
			cmd: 'mrt',
			args: [],
			options: {
				silent: false, // for now, but we have our own log
				uid: app.appId,
				max: 3,
				killTree: true,
				minUptime: 2000,
				spinSleepTime: 1000,
				cwd: '/home/app' + app.appId + '/' + app.repo + '/'
					+ (app.meteorDir == '.' ? '' : app.meteorDir),
				env: {
					USER: 'app' + app.appId,
					HOME: '/home/app' + app.appId,
					PATH: '/bin:/usr/bin:/usr/local/bin'
				}
			}
		};

		sendCommand(serverId, 'foreverStart', data, function(error, result) {
			console.log(error, result);
			if (result.code) // i.e. non-zero, failure
				Apps.update(app._id, {
					$push: { 'servers.failingOn': serverId }
				});
			else // start success
				Apps.update(app._id, {
					$push: { 'servers.runningOn': serverId }
				});
		});
	}

	Apps.find().observe({
		added: appCheck, changed: appCheck
	});

}