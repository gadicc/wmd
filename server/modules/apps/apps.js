if (Meteor.isClient) {
	Router.map(function() {
		this.route('apps', {
			before: function() {
				this.subscribe('wmdRepos');
			},
			data: function() {
				var user = Meteor.user();
				if (!user) return;

				var repos = wmdRepos.find({
						userId: user._id,
						// should excluse if all branches are deployed
						//appId: { $exists: false }
					}, {
						sort: { name: 1 }
					});

				var servers = Servers.find({
					$or: [ { type: 'meteor' }, { type: 'combo'} ]
				});

				var apps = Apps.find();

				console.log(servers.fetch());

				return { repos: repos, servers: servers, apps: apps };
			}
		});
	});

	// template-engine-preview-10.1 fixes
	Template.apps.name = function() {
		return this.name;
	}


	var updateName = function() {
		var repoName = $('#appAdd_repoId option:selected').text();
		var branch = $('#appAdd_branch').val();
		$('#appAdd_name').attr('placeholder',
			repoName + '#' + branch);

		var repo = wmdRepos.findOne($('#appAdd_repoId option:selected').val());
		console.log(repo);
		$('#appAdd_meteorDir').attr('placeholder',
			repo.meteorDir == '.' ? '(project root)' : repo.meteorDir);
	}

	Template.allApps.sourceOptions = function() {
		// move to seperate repo package
		if (this.source == 'repo') {
			var repo = wmdRepos.findOne(this.repoId);
			if (!repo) return;
			return Extensions.runPlugin('appOptions', repo.service, {
				app: this, repo: repo
			});
		}
	}
	Extensions.declarePlugin('appOptions', '0.1.0');

	Template.allApps.events({
		'click button': function(event, tpl) {
			event.preventDefault();
			var target = $(event.target);
			var appId = target.closest('table').data('app-id');
			var action = target.data('action');
			Meteor.call('appAction', appId, action);
		}
	});

	Template.appAdd.rendered = function() {
		Session.set('selectedRepoId', $('#appAdd_repoId').val());
		updateName();
	}

	/*
	Template.addApp.showRepos = function() {
		return Extensions.runFirstTrueHook('provides.repo').ranSomething;
	}
	*/

	Template.appAdd.helpers({
		'branches': function() {
			var repoId = Session.get('selectedRepoId');
			repo = wmdRepos.findOne(repoId);
			return repo ? repo.branches : null;
		}
	});

	Template.appAdd.events({
		'change #appAdd_repoId': function(event, tpl) {
			Session.set('selectedRepoId', $('#appAdd_repoId').val());
			updateName();
		},
		'change #appAdd_branch': function(event, tpl) {
			updateName();
		},
		'submit': function(event, tpl) {
			event.preventDefault();
			var repoId = $(tpl.find('#appAdd_repoId')).val();
			var branch = $(tpl.find('#appAdd_branch')).val();
			var deployOptions = {
				servers: {
					forcedOn: [ $(tpl.find('#appAdd_server')).val() ]
				}
			}
			var meteorDir = $(tpl.find('#appAdd_meteorDir')).val();
			if (meteorDir) deployOptions.meteorDir = meteorDir;
			Meteor.call('appAdd', name, repoId, branch, deployOptions);
		}
	});
}

if (Meteor.isServer) {


	Meteor.methods({
		'appAdd': function(name, repoId, branch, deployOptions) {
			var repo = wmdRepos.findOne(repoId);
			if (!repo)
				throw new Meteor.Error(404, 'Not such repo');

			var appData = {
				name: name || repo.name + '#' + branch,
				branch: branch,
				source: 'repo',
				repoId: repoId,
				repo: repo.name,
				meteorDir: deployOptions.meteorDir || repo.meteorDir,
				appId: 1000 + incrementCounter('apps'),
				instances: {
					min: 1,
					max: 1,
					target: 1,
					deployed: 0,
					running: 0,
					data: []
				}
			}

			// ext.registerPlugin('addApp', 'github', '0.1.0', callback)
			// Can modify appData if desired before db insert
			Extensions.runPlugin('addApp', repo.service,
					{ repo: repo, branch: branch, appData: appData });

			Apps.insert(appData);
		},

		'appAction': function(appId, action) {
			var app = Apps.findOne(appId);
			if (!app)
				throw new Meteor.Error(404, 'No such app');
			if (appMethods[action])
				appMethods[action](app);
		}
	});

	var appMethods = {
		setup: function(app) {
			// actually "re" setup
			appInstall(app, freeServer('meteor'));
		},

		start: function(app) {
			_.each(app.instances.data, function(instance) {
				if (instance.state == 'deployed' || instance.state == 'stopped')
					App.start(app, instance);
			});
		},

		delete: function(app) {
			// TODO, safely stop all instances, delete from server
			Apps.remove(app._id);
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

			_.each(app.servers.deployedOn, function(serverId) {
				console.log(serverId);
				sendCommand(serverId, 'spawnAndLog', spawnData, function(err, data) {
					console.log(data);
				});
			});		

		}
	};
}