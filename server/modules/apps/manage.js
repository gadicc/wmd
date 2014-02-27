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

	Extensions.declareHook('appUpdated', '0.1.0');
	App = {

		check: function(app) {
			var ai = app.instances;

			/*
			 * TODO, check for failed deploys, try deploy on another
			 * server if available, otherwise notify admin
			 */
			if (ai.deployed < ai.target)
				appInstall(app, freeServer('meteor'));

			Extensions.runHooks('appUpdated', { app: app });
		},

		start: function(app, instance) {
			console.log('starting app');
			//var instance = _.findWhere(app.instances.data, { _id: instanceId });

			var data = {
				cmd: 'mrt',
				args: [
					'--production',
					'--port',
					instance.port
				],
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

			sendCommand(instance.serverId, 'foreverStart', data, function(error, result) {
				console.log(error, result);
				if (result.code) // i.e. non-zero, failure
					Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
						$set: { 'instances.data.$.state': 'startFailed' },
						$inc: { 'instances.failing': 1 }
					});
				else // start success
					Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
						$set: { 'instances.data.$.state': 'running' },
						$inc: { 'instances.running': 1 }
					});
			});
		},

		'stop': function(app, instance) {
			var data = {};
			Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
				$set: { 'instances.data.$.state': 'stopped' },
				$inc: { 'instances.running': 1 }
			});

			return;
			sendCommand(instance.serverId, 'foreverStop', data, function(error, result) {
				console.log(error, result);
				if (result.code) // i.e. non-zero, failure
					Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
						$set: { 'instances.data.$.state': 'startFailed' },
						$inc: { 'instances.failing': 1 }
					});
				else // start success
					Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
						$set: { 'instances.data.$.state': 'stopped' },
						$inc: { 'instances.running': 1 }
					});
			});			
		}




	}


	// find (or create, if necessary and allowed)
	// server with sufficient resources
	freeServer = function(type) {
		var query = type == 'combo'
			? { type: 'combo' }
			: { $or: [ {type: 'combo'}, {type: type} ] };
		return Servers.findOne(query)._id;
	}

	appInstall = function(app, serverId) {
		console.log('starting setup');

		var data = {
			env: {
				'APPID': app.appId,
				'APPNAME': app.name,
			}
		};

		var source = app.source;

		// move to seperate repo package (duped in apps.js)
		if (source == 'repo') {
			data.repo = wmdRepos.findOne(app.repoId);
			data.env.BRANCH = app.branch;
			console.log(data.repo);
			Extensions.runPlugin('appInstall',
				data.repo.service, data, true);
		}

		console.log(data);

		var instanceId = Random.id();
		sendCommand(serverId, 'spawnAndLog', {
			instanceId: instanceId,
			cmd: './appInstall.sh',
			options: { env: data.env }
		}, function(error, result) {
			if (result.code) // i.e. non-zero, failure
				Apps.update(app._id, { $push: { 'instances.data': {
					_id: instanceId,
					state: 'deployFailed',
					serverId: serverId,
					port: 5000
				}}, $inc: { 'instances.failing': 1 }});
			else // install success
				Apps.update(app._id, { $push: { 'instances.data': {
					_id: instanceId,
					state: 'deployed',
					serverId: serverId,
					port: 5000
				}}, $inc: { 'instances.deployed': 1 }});
		});
	}
	Extensions.registerPluginType('appInstall', '0.1.0');

	Apps.find().observe({
		added: App.check, changed: App.check
	});

}