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
				if (appSetup(app)) // on Success
					app.servers.deployedTo.push(desiredId);
		});

		// update if changed
	}

	var appSetup = function(app) {
		console.log('starting setup');
	}

	Apps.find().observe({
		added: appCheck, changed: appCheck
	});

}