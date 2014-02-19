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
						sort: { repo: 1 }
					});

				var dServers = servers.find({
					$or: [ { type: 'meteor' }, { type: 'combo'} ]
				});

				return { repos: repos, servers: dServers };
			}
		});
	});

	var updateName = function() {
		var repoName = $('#appAdd_repoId option:selected').text();
		var branch = $('#appAdd_branch').val();
		$('#appAdd_name').attr('placeholder',
			'Default: ' + repoName + '#' + branch);
	}

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
			Meteor.call('appAdd', name, repoId, branch, deployData);
		}
	});
}

if (Meteor.isServer) {
	Meteor.methods({
		'appAdd': function(name, repoId, branch, deployData) {
			var repo = wmdRepos.findOne(repoId);
			if (!repo)
				throw new Meteor.Error(404, 'Not such repo');

			var appData = {
				name: name,
				repoId: repoId,
				minInstances: undefined,
				maxInstances: undefined,
				currentInstances: 0,
				desiredInstances: 1
			}
			
			if (!Extensions.runPlugin('addApp', repo.service,
					{ repo: repo, branch: branch, appData: appData })) {
				console.log('[addApp] No ' + repo.service
					+ ' plugin (or no return value)');
			}

			console.log('storing');
		}
	});
}