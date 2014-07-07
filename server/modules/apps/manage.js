if (Meteor.isServer) {

	var LOCAL_METEORS_START_PORT = 4000;
	APP_START_PORT = 5000;

	var path = Meteor.require('path');
	var LOCAL_HOME = process.env.HOME + '/wmd-local';
	BUILD_HOME = LOCAL_HOME + '/build';
	var SCRIPT_HOME = process.env.NODE_ENV && process.env.NODE_ENV == 'production'
		? path.normalize(process.cwd() + '/assets/app/scripts/')
		: path.normalize(process.cwd() + '/../../../../../private/scripts');
	console.log(SCRIPT_HOME);

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
//			if (ai.deployed < ai.target)
//				appInstall(app, freeServer('meteor'));

			Extensions.runHooks('appUpdated', { app: app });
		},

		start: function(app, instance) {
			console.log('starting app');

			var port = APP_START_PORT + incrementCounter('appPort_' + instance.serverId);

			//var instance = _.findWhere(app.instances.data, { _id: instanceId });

			var proto = 'http';
			if (app.ssl && app.ssl.cert)
				proto += 's';

			var data = {
				slug: 'app'+":"+app._id+":"+instance._id,
				cmd: 'node',
				args: [
					'main.js'
				],
				options: {
					silent: false, // for now, but we have our own log
					max: 3,
					killTree: true,
					minUptime: 2000,
					spinSleepTime: 1000,
					cwd: '/home/app' + app.appId + '/' + app.repo,
					env: {
						ROOT_URL: proto + '://' + app.vhosts[0] + '/',
						NODE_ENV: 'production',
						USER: 'app' + app.appId,
						HOME: '/home/app' + app.appId,
						PATH: '/bin:/usr/bin:/usr/local/bin',
						HTTP_FORWARDED_COUNT: 1,
						PORT: port

					},
					spawnWith: {
						uid: app.appId,
						gid: app.appId
					}
				}
			};

			if (app.dbId) {
				var db = Databases.findOne(app.dbId);
				data.options.env.MONGO_URL = mongoUrl(db);
				data.options.env.MONGO_OPLOG_URL = oplogUrl(db);
			}

			// Override our defaults with user specified variables
			_.extend(data.options.env, app.env);

			console.log(data.options.env);

			sendCommand(instance.serverId, 'foreverStart', data, function(error, result) {
				console.log(error, result);
				if (result.code) // i.e. non-zero, failure
					Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
						$set: { 'instances.data.$.state': 'startFailed' },
						$inc: { 'instances.failing': 1 }
					});
				else { // start success
					Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
						$set: {
							'instances.data.$.state': 'running',
							'instances.data.$.port': port
						},
						$inc: { 'instances.running': 1 }
					});

					instance.state = 'running';
					if (_.every(app.instances.data, function(instance) { return instance.state == 'running' } ))
						Apps.update(app._id, { $set: { state: 'running' }} );
				}
			});
		},

		'stop': function(app, instance) {
			var data = {};
			data.slug = 'app'+":"+app._id+":"+instance._id;
			sendCommand(instance.serverId, 'foreverStop', data, function(error, result) {
				console.log(error, result);
				// if (error)
				// Couldn't stop?  If we tried to stop an already stopped

				Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
					$set: { 'instances.data.$.state': 'stopped' },
					$inc: { 'instances.running': -1 }
				});

				instance.state = 'stopped';
				if (_.every(app.instances.data, function(instance) { return instance.state == 'stopped' } ))
					Apps.update(app._id, { $set: { state: 'stopped' }} );

			});			
		},

		'delete': function(app, instance) {

			var data = {
				app: app,
				source: app.source,
				env: {
					'APPID': app.appId,
				}
			};

			// any hooks?
			console.log(instance);

			var inc = {};
			inc['instances.' + instance.state] = -1;

			// NB!  abort if more than 1 instance on this server
			var instancesOnThisServer = 0;
			for (var i=0; i < app.instances.data.length; i++) {
				if (app.instances.data[i].serverId == instance.serverId)
					instancesOnThisServer++;
			}

			if (instancesOnThisServer > 1) {

				console.log('deleting >1 instance on same server');
				Apps.update({ _id: app._id}, {
					$pull: { 'instances.data': { _id: instance._id } },
					$inc: inc
				});

			} else {

				sendCommand(instance.serverId, 'spawnAndLog', {
					instanceId: instance._id,
					cmd: './appDelete.sh',
					options: { env: data.env }
				}, function(error, result) {
					console.log('cmd return');
					console.log(error, result);
					if (result.code) // i.e. non-zero, failure, i.e. couldn't delete
						Apps.update({ _id: app._id, 'instances.data._id': instance._id }, {
							$set: { 'instances.data.$.state': 'deleteFailed' },
						});
					else // delete success
						Apps.update({ _id: app._id}, {
							$pull: { 'instances.data': { _id: instance._id } },
							$inc: inc
						});
				});

			}

		}

	}


	// find (or create, if necessary and allowed)
	// server with sufficient resources
	freeServer = function(type) {
		var query = type == 'combo'
			? { type: 'combo' }
			: { $or: [ {type: 'combo'}, {type: type} ] };
		query = { $and: [ { destroyedAt: {$exists: false}}, query ]};
		return Servers.findOne(query)._id;
	}

	var localMeteors = {};
	var localMeteorCount = 0;

	Tasks.define('appInstall', {
		manageLogs: true,

	}, [
		{
			// Step 1
			desc: 'Retrieving from Github',
			func: function(data, prevData, log) {

				// move to seperate repo package (duped in apps.js)
				if (data.source == 'repo') {
					data.repo = wmdRepos.findOne(data.app.repoId);
					data.env.BRANCH = data.app.branch;
					//console.log(data.repo);
					Extensions.runPlugin('appInstall',
						data.repo.service, data, true);
				}

				var result = Tasks.spawnAndLog(SCRIPT_HOME + '/appInstall.sh', [], {
					env: data.env
				}, log);
				console.log('end');
				console.log('result', result);

				if (result.code)
					throw new Error(result);
			}
		},
		{
			desc: 'Start app locally',
			func: function(data, prevData, log) {
				var appDir = data.env.BUILD_HOME + '/'
					+ data.env.APPNAME + '/'
					+ data.env.REPO + '/'
					+ data.env.METEOR_DIR;
					console.log(appDir);

				// start Meteor if not already running; task completes on lastStart

				//TODO store in db for persistance!
				if (!localMeteors[data.app.name]) {
					// required for rapidRedeploy
					var localLog = new slog('Meteor run for task ' + this.task.id);
					localMeteors[data.app.name] = Tasks.asyncSpawnAndLog('mrt', [
						'--production', '--port',
						(LOCAL_METEORS_START_PORT+localMeteorCount++)
					], {
						cwd: appDir
					}, localLog, function(error, done) {
						console.log('meteor done');
						delete(localMeteors[data.app.name]);
					});
				}
				console.log('waiting for start');

				// Once app is started, task is done.  Kill if not a rapidRedeploy TODO
				var build = appDir + '/.meteor/local/build';

				// changed in 0.7.2 i think
				var waitFor1 = build + '/programs/server/lastStart';
				var waitFor2 = appDir + '/lastStart';

				console.log(waitFor1, waitFor2);
				Tasks.waitForChange([waitFor1, waitFor2]);

				console.log('started');
			}
		},
		{
			// Step 3
			desc: 'SSH to server',
			func: function(data, prevData, log) {

				// TODO, record user who owns the package?
				var user = Meteor.users.findOne({sshKey: {$exists: true}});
				data.env.SSH_PRV = user.sshKey.privkey.replace(/\n/g, '\\n');
				data.env.SSH_PUB = user.sshKey.pubkey;

				// TODO, parallelize for multiple servers, think about step 1, etc.

				var server = Servers.findOne(data.serverId);
				data.env.SERVER = server.ip;

				console.log('start ssh');
				var result = Tasks.spawnAndLog(SCRIPT_HOME + '/appSSH.sh', [], {
					env: data.env
				}, log);
				console.log('end ssh');
				console.log('result', result);

				var instanceId = Random.id();
				var set = {};

				// TODO, update commit running on each instance?
				if (data.isUpdate)
					return;

				if (result.code) { // i.e. non-zero, failure
					if (!data.app.instances.data.length)
						set.state = 'deployFailed';
					Apps.update(data.app._id, { $push: { 'instances.data': {
						_id: instanceId,
						state: 'deployFailed',
						serverId: data.serverId
					}}, $inc: { 'instances.failing': 1 }, $set: set });
				} else { // install success
					if (!data.app.instances.data.length)
						set.state = 'deployed';
					Apps.update(data.app._id, { $push: { 'instances.data': {
						_id: instanceId,
						state: 'deployed',
						serverId: data.serverId
					}}, $inc: { 'instances.deployed': 1 }, $set: set });
				}
			}
		}, {
			// Step 4
			desc: 'Start new instance and kill old',
			func: function(data, prevData, log) {				
				var oldInstance = _.findWhere(data.app.instances.data,
					{ _id: data.instanceId });
				var newInstance = _.clone(oldInstance);
				newInstance._id = Random.id();
				newInstance.state = 'deployed';
				Apps.update(data.app._id, { $push: { 'instances.data': newInstance } });

				if (oldInstance.state == 'running')
					App.start(data.app, newInstance);

				/*
				 * 1. code for started -> running
				 * 2. when running, switch old instance to down, update proxy
				 * 3. down old instance for real
				 */

				// TODO, immediately change state of oldInstance for proxy,
				// but only after new app is fully loaded
				App.stop(data.app, oldInstance);

				//inc['instances.' + instance.state] = -1;
				Apps.update({ _id: data.app._id}, {
					$pull: { 'instances.data': { _id: oldInstance._id } }
					//,$inc: inc
				});
			}
		}
	]);

	appInstall = function(app, serverId) {

		var data = {
			app: app,
			source: app.source,
			serverId: serverId,
			env: {
				'APPID': app.appId,
				'APPNAME': app.name,
				'BUILD_HOME': BUILD_HOME,
				'METEOR_DIR': app.meteorDir,
				'REPO': app.repo
			},
			alsoUpdateCollection: { 'Apps': app._id }
		};

		var task = new Task('appInstall', data);

	}

	appInstall_old = function(app, serverId) {
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
			var exists = Apps.findOne({
				_id: app._id,
				'instances.data.serverId': serverId});
			// we don't reall care, just updating setup again
			if (exists) return;

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