if (Meteor.isClient) {

	var updateName = function() {
		var repoName = $('#appAdd_repoId option:selected').text();
		var branch = $('#appAdd_branch').val() || 'master';
		$('#appAdd_name').attr('placeholder',
			repoName.replace(/^[Mm]eteor-?/, '')
			+ (branch == 'master' ? '' : '-' + branch));

		var repo = wmdRepos.findOne($('#appAdd_repoId option:selected').val());
		if (!repo) return;
		$('#appAdd_meteorDir').attr('placeholder',
			repo.meteorDir == '.' ? '(project root)' : repo.meteorDir);
	}

	Template.appAdd.rendered = function() {
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
		},
		'repos': function() {
			var user = Meteor.user();
			if (!user) return;
			var repos = wmdRepos.find({
				userId: user._id,
				// should excluse if all branches are deployed
				//appId: { $exists: false }
			}, {
				sort: { name: 1 }
			});
			var reposFetch = repos.fetch();
			if (reposFetch.length && !Session.get('selectedRepoId')) {
				Session.set('selectedRepoId', reposFetch[0]._id)
			}
			return repos;
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
			var name = $(tpl.find('#appAdd_name')).val();
			var repoId = $(tpl.find('#appAdd_repoId')).val();
			var branch = $(tpl.find('#appAdd_branch')).val();
			var deployOptions = {
				servers: {
					forcedOn: [ $(tpl.find('#appAdd_server')).val() ]
				}
			}
			var meteorDir = $(tpl.find('#appAdd_meteorDir')).val();
			if (meteorDir) deployOptions.meteorDir = meteorDir;
			Meteor.call('appAdd', name, repoId, branch, deployOptions,
				function(error) { console.log(error); });
		}
	});

}

if (Meteor.isServer) {

	Meteor.methods({
		'appAdd': function(name, repoId, branch, deployOptions) {
			var repo = wmdRepos.findOne(repoId);
			if (!repo)
				throw new Meteor.Error(404, 'Not such repo');
			if (name && !name.match(/^[a-z][a-z0-9-_]{0,30}[a-z0-9]$/))
				throw new Meteor.Error(403, 'Invalid username (see rules)');
			if (Apps.findOne({name:name}))
				throw new Meteor.Error(403, 'There is already an app called "' + name + '"');

			var appData = {
				name: name || 
					(repo.name.replace(/^[Mm]eteor-?/, '')
					+ (branch == 'master' ? '' : '-' + branch)).substr(0,32),
				branch: branch,
				source: 'repo',
				repoId: repoId,
				repo: repo.name,
				meteorDir: deployOptions.meteorDir || repo.meteorDir,
				appId: 1000 + incrementCounter('apps'), /* deprecated? */
				uid: 1000 + incrementCounter('uids'),
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
		}
	}); /* Methods */

} /* isServer */