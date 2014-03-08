if (Meteor.isClient) {
	Router.map(function() {
		this.route('apps', {
			layoutTemplate: 'sidebar-layout',
			action: function() {
				this.render();
				this.render('appSidebar', { to: 'sidebar' });
			}
		});

		this.route('appNew', {
			layoutTemplate: 'sidebar-layout',
			path: '/apps/new',
			before: function() {
				this.subscribe('wmdRepos');
			},
			action: function() {
				this.render();
				this.render('appSidebar', { to: 'sidebar' });
			}
		});

		this.route('appInfo', {
			path: '/apps/:app',
			layoutTemplate: 'sidebar-layout',
			before: function() {
				this.subscribe('wmdRepos');
			},
			action: function() {
				if (!subAll.ready())
					return;
				var app = Apps.findOne({ $or: [
					{ _id: this.params.app },
					{ name: this.params.app }
				]});
				Session.set('appId', app._id);
				if (app) {
					this.render();
					this.render('appSidebar', { to: 'sidebar' });
				}
			}
		});

	});

	Template.apps.apps = function() {
		return Apps.find();
	}
	Template.appSidebar.apps = Template.apps.apps;
	Template.appSidebar.rendered = activeLinks;

	Template.apps.servers = function() {
		return Servers.find({ $and: [
			{ destroyedAt: {$exists: false} },
			{ $or: [ { type: 'meteor' }, { type: 'combo'} ] }
		]});
	}

}

if (Meteor.isServer) {

	Meteor.methods({

		'appAction': function(appId, action, instanceId) {
			var app = Apps.findOne(appId);
			if (!app)
				throw new Meteor.Error(404, 'No such app');
			if (appMethods[action]) {
				this.unblock();
				appMethods[action](app, app.instances.data[instanceId]);
			}
		},

		'foreverExit': function(slug) {
			slug = slug.split(':');
			console.log(slug);
			var app = Apps.findOne({name:slug[0]});
			var instanceId = slug[1];
			Apps.update({ _id: app._id, 'instances.data._id': instanceId }, {
				$set: { 'instances.data.$.state': 'crashed' },
				$inc: { 'instances.failing': 1 }
			});
		}
	});

	// global.  might be called from packages
	appMethods = {
		setup: function(app) {
			appInstall(app, freeServer('meteor'));
		},

		start: function(app, instance) {
			var instances = instance ? [instance] : app.instances.data;
			_.each(instances, function(instance) {
				if (instance.state == 'deployed' || instance.state == 'stopped' || instance.state == 'crashed')
					App.start(app, instance);
			});
		},

		stop: function(app, instance) {
			var instances = instance ? [instance] : app.instances.data;
			_.each(instances, function(instance) {
				if (instance.state == 'started' || instance.state == 'running')
					App.stop(app, instance);
			});
		},

		delete: function(app, instance) {
			var instances = instance ? [instance] : app.instances.data;
			_.each(instances, function(instance) {
				// Can delete all stopped, crashed, deployed instances
				if (instance.state != 'running')
					App.delete(app, instance);
			});
			// If global delete and nothing exists 
			// Was a global Delete, delete app data
			//if (!instance)
			//	Apps.remove(app._id);
		},

		update: function(app) {
			console.log('update');
			var data = {
				env: {
					USER: 'app' + app.appId,
					HOME: '/home/app' + app.appId,
					PATH: '/bin:/usr/bin:/usr/local/bin'
				}
			};

			var source = app.source;

			// move to seperate repo package (dupe from manage.js)
			if (source == 'repo') {
				data.repo = wmdRepos.findOne(app.repoId);
				data.env.BRANCH = app.branch;
				console.log(data.repo);
				Extensions.runPlugin('appInstall',
					data.repo.service, data, true);
			}

			var spawnData = {
				cmd: './appUpdate.sh',
				options: {
					cwd: '/home/app' + app.appId,
					env: data.env
				}
			};

			_.each(app.instances.data, function(ai) {
				console.log(ai.serverId);
				sendCommand(ai.serverId, 'spawnAndLog', spawnData, function(err, data) {
					console.log(data);
				});
			});		

		}
	};
}