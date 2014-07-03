if (Meteor.isServer) {

	Meteor.methods({

		'dbAction': function(dbId, action, instanceId) {
			var db = Databases.findOne(dbId);
			var instance = null;
			if (!db)
				throw new Meteor.Error(404, 'No such db ID');
			console.log(dbId,action,instanceId);
			if (dbMethods[action]) {
				this.unblock();
				if (instanceId)
					instance = _.findWhere(db.instances.data, {_id: instanceId});
				dbMethods[action](db, instance);
			} else
				throw new Meteor.Error(404, 'No such db action');
		},

	});

	dbMethods = {

		'setup': function(db, instance) {
			new Task('dbSetup', {
				db: db, instance: instance,
				alsoUpdateCollection: { 'Databases': db._id }
			});
		},

		'start': function(db, instance) {
			console.log('starting db');
			var instances;
			if (instance)
				instances = [ instance ];
			else
				instances = [];

			var HOME_DIR = '/home/db' + db.uid;
			var data = {
				//slug: 'db'+':'+db._id+":"+instance._id,  DO BELOW PER INSTANCE
				cmd: 'mongod',
				args: [
					'--smallfiles',
					'--nohttpinterface',
					'--port',
					db.port,
					'--dbpath',
					'db',
					'--oplogSize',
					256,
					'--auth',
					'--replSet',
					'meteor'
				],
				options: {
					silent: false, // for now, but we have our own log
					max: 3,
					killTree: true,
					minUptime: 2000,
					spinSleepTime: 1000,
					cwd: HOME_DIR,
					env: {
						USER: 'db' + db.uid,
						HOME: HOME_DIR,
						PATH: '/bin:/usr/bin:/usr/local/bin',
					},
					spawnWith: {
						uid: db.uid,
						gid: db.uid
					}
				}
			};



			_.each(instances, function(instance) {
				data.slug = 'db'+':'+db._id+":"+instance._id;

				sendCommand(instance.serverId, 'foreverStart', data, function(error, result) {
					console.log(error, result);
					if (result.code) // i.e. non-zero, failure
						Databases.update({ _id: db._id, 'instances.data._id': instance._id }, {
							$set: { 'instances.data.$.state': 'startFailed' },
							$inc: { 'instances.failing': 1 }
						});
					else { // start success
						Databases.update({ _id: db._id, 'instances.data._id': instance._id }, {
							$set: { 'instances.data.$.state': 'running' },
							$inc: { 'instances.running': 1 }
						});

						instance.state = 'running';
						if (_.every(db.instances.data, function(instance) { return instance.state == 'running' } ))
							Databases.update(db._id, { $set: { state: 'running' }} );
					}
				});
			});


		}, /* start */


		'stop': function(db, instance) {
			var data = {};
			data.slug = 'db'+":"+db._id+":"+instance._id;
			sendCommand(instance.serverId, 'foreverStop', data, function(error, result) {
				console.log(error, result);
				// if (error)
				// Couldn't stop?  If we tried to stop an already stopped

				Databases.update({ _id: db._id, 'instances.data._id': instance._id }, {
					$set: { 'instances.data.$.state': 'stopped' },
					$inc: { 'instances.running': -1 }
				});

				instance.state = 'stopped';
				if (_.every(db.instances.data, function(instance) { return instance.state == 'stopped' } ))
					Databases.update(db._id, { $set: { state: 'stopped' }} );

			});			
		}, /* stop */


		delete: function(db, instance) {

			var data = {
				db: db,
				env: {
					'UID': db.uid,
				}
			};

			// any hooks?

			sendCommand(instance.serverId, 'spawnAndLog', {
				instanceId: instance._id,
				cmd: './dbDelete.sh',
				options: { env: data.env }
			}, function(error, result) {
				console.log('cmd return');
				console.log(error, result);
				var inc = {};
				inc['instances.' + instance.state] = -1;
				if (result.code) // i.e. non-zero, failure, i.e. couldn't delete
					Databases.update({ _id: db._id, 'instances.data._id': instance._id }, {
						$set: { 'instances.data.$.state': 'deleteFailed' },
					});
				else // delete success
					Databases.update({ _id: db._id}, {
						$pull: { 'instances.data': { _id: instance._id } },
						$inc: inc
					});
			});

		} /* delete */

	}; /* dbMethods */


	// { adminUser: 'admin', adminPassword: 'password', oplogUser: 'oplogger', oplogPassword: 'PasswordForOplogger'}

	Tasks.define('dbSetup', { manageLogs: true }, [
		{
			desc: 'Create user & database',
			func: function(data, prevData, log) {
				var self = this;

				var serverId = data.db.forcedOn[0] || freeServer('mongo');
				if (!serverId)
					throw err ('No free servers');

				var result = sendCommandSync(serverId, 'spawnAndLog', {
					//instanceId: instance._id,
					cmd: './dbInstall.sh',
					updateCallback: function(update) { self.update(null, update); },
					options: {
						logId: log.logId,
						env: {
							UID: data.db.uid,
							PORT: data.db.port,
							ADMIN_USER: data.db.adminUser,
							ADMIN_PASSWORD: data.db.adminPassword,
							OPLOG_USER: data.db.oplogUser,
							OPLOG_PASSWORD: data.db.oplogPassword,
							METEOR_USER: data.db.meteorUser,
							METEOR_PASSWORD: data.db.meteorPassword
						}
					}
				});

				console.log('cmd return');
				console.log(result);
				var inc = {}, set = {};
				var instanceId = Random.id();
//				inc['instances.' + instance.state] = -1;

				if (result.code) { // i.e. non-zero, failure
					if (!data.db.instances.data.length)
						set.state = 'deployFailed';
					Databases.update(data.db._id, { $push: { 'instances.data': {
						_id: instanceId,
						state: 'deployFailed',
						serverId: serverId,
						port: 5000
					}}, $inc: { 'instances.failing': 1 }, $set: set });
				} else { // install success
					if (!data.db.instances.data.length)
						set.state = 'deployed';
					Databases.update(data.db._id, { $push: { 'instances.data': {
						_id: instanceId,
						state: 'deployed',
						serverId: serverId,
						port: 5000
					}}, $inc: { 'instances.deployed': 1 }, $set: set });
				}
			}
		}
	]);
}