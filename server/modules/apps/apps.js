if (Meteor.isClient) {
	Router.map(function() {
		this.route('apps', {
			before: function() {
				this.subscribe('wmdRepos');
			},
			data: function() {
				var user = Meteor.user();

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

	var updateName = function() {
		var repoName = $('#appAdd_repoId option:selected').text();
		var branch = $('#appAdd_branch').val();
		$('#appAdd_name').attr('placeholder',
			'Default: ' + repoName + '#' + branch);
	}

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
				meteorDir: repo.meteorDir,
				appId: 1000 + incrementCounter('apps'),
				instances: {
					min: undefined,
					max: undefined,
					running: 0,
					desired: 1
				},
				servers: {
					forcedOn: deployOptions.servers.forcedOn,
					deployedOn: [],
					runningOn: [],
					desiredOn: [],
				}
			}
			
			// ext.registerPlugin('addApp', 'github', '0.1.0', callback)
			// Can modify appData if desired before db insert
			if (!Extensions.runPlugin('addApp', repo.service,
					{ repo: repo, branch: branch, appData: appData })) {
				console.log('[addApp] No ' + repo.service
					+ ' plugin (or no return value)');
			}

			Apps.insert(appData);
		},

		'appAction': function(appId, action) {
			var app = Apps.findOne(appId);
			if (!app)
				throw new Meteor.Error(404, 'No such app');

			switch(action) {

				case 'delete':
				// TODO, safely stop all instances, delete from server
				Apps.remove(appId);
				break;

			}
		}
	});
}