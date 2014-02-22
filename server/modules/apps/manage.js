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
				if (appInstall(app, desiredId)) // on Success
					app.servers.deployedTo.push(desiredId);
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
			console.log(data.repo);
			Extensions.runPlugin('appInstall',
				data.repo.service, data, true);
		}

		console.log(data);

		sendCommand(serverId, 'appInstall', {
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
	Extensions.registerPluginType('appInstall_cmd', '0.1.0');

	Apps.find().observe({
		added: appCheck, changed: appCheck
	});

}