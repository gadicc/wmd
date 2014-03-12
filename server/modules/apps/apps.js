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
			var instance = null;
			if (!app)
				throw new Meteor.Error(404, 'No such app ID');
			if (appMethods[action]) {
				this.unblock();
				if (instanceId)
					instance = _.findWhere(app.instances.data, {_id: instanceId});
				appMethods[action](app, instance);
			} else
				throw new Meteor.Error(404, 'No such app action');
		},

		// now handles apps and databases!  TODO, move somewhere good, cleanup
		'foreverExit': function(slug) {
			slug = slug.split(':');
			console.log(slug);
			var what = slug[0], id = slug[1], instanceId = slug[2];
			var Collection = what == 'app' ? Apps : Databases;
			var app = Collection.findOne(id);
			var instance = _.findWhere(app.instances.data, {_id: instanceId});
			Collection.update({ _id: app._id, 'instances.data._id': instanceId }, {
				$set: {
					'instances.data.$.state':
						instance.state != 'stopping' ? 'crashed' : 'stopped'
				},
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

		update: function(app, instance) {
			console.log('update');

			var data = {
				isUpdate: true,
				app: app,
				source: app.source,
				env: {
					'APPID': app.appId,
					'APPNAME': app.name,
					'BUILD_HOME': BUILD_HOME,
					'METEOR_DIR': app.meteorDir,
					'REPO': app.repo
				},
				alsoUpdateCollection: { 'Apps': app._id }
			};

			// TODO, better instance handling as part of single task!!
			var instances = instance ? [instance] : app.instances.data;
			_.each(instances, function(instance) {
				var localData = _.clone(data);
				localData.serverId = instance.serverId;
				new Task('appInstall', localData);
			});

		}
	};
}