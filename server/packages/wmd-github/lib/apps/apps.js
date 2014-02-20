if (Meteor.isClient) {
	Deps.autorun(function() {
		if (Meteor.userId()) {
			Meteor.call('wmd.github.updateRepos');
		}
	});
}

if (Meteor.isServer) {
	var ghRepos = new Meteor.Collection('github_repos');

	var isMeteorProject = function(github, repo, branches) {
		var master = _.findWhere(branches, { name: 'master' });

		var req = github.gitdata.getTree({
			user: repo.owner.login,
			repo: repo.name,
			sha: master.commit.sha,
			recursive: true
		});

		for (var i=0; i < req.tree.length; i++) {
			if (req.tree[i].type == 'tree'
					&& req.tree[i].path.match(/\/?.meteor$/))
				return true;
		}

		return false;
	}

	var updatingUserRepos = {};

	Meteor.methods({

		'wmd.github.updateRepos': function() {

			// ensure we are only being run once at a time per user
			if (updatingUserRepos[this.userId])
				return;
			updatingUserRepos[this.userId] = true;

			var user = Meteor.users.findOne(this.userId);
			var self = this;

			var Github = Meteor.require('github');
			var github = new Github({version: "3.0.0"});

			//github.user = Async.wrap(github.user, ['get']);
			github.gitdata = Async.wrap(github.gitdata, [
				'getTree'
			]);
			github.repos = Async.wrap(github.repos, [
				'getAll', 'getBranches', 'getContent'
			]);

		    github.authenticate({
		        type: "oauth",
		        token: user.services.github.accessToken
		    });

		    var meta = ghRepos.findOne({userId: this.userId, repo: '_meta'});

			var reposGetAll = github.repos.getAll({
				per_page: 100,
				headers: {
					'If-None-Match': meta && meta.etag || undefined
				}
			});

			if (reposGetAll.meta.status == '304 Not Modified') {
				console.log('no changes to user repos');
				return;
			}

			if (meta)
				ghRepos.update(meta._id, { $set: {
					etag: reposGetAll.meta.etag
				}} );
			else
				ghRepos.insert({
					userId: this.userId,
					repo: '_meta',
					etag: reposGetAll.meta.etag
				});

			_.each(reposGetAll, function(repo) {

				console.log(repo.name);

				var myRepo = ghRepos.findOne({
					userId: self.userId, repo: repo.name
				});

				var branches = github.repos.getBranches({
					user: repo.owner.login,
					repo: repo.name,
					per_page: 100,
					headers: {
						'If-None-Match': myRepo && myRepo.etagBranches || undefined
					}
				});

				if (branches.meta.status == '304 Not Modified') {
					console.log('no changes to branches');
					return;
				}

				if (myRepo) {
					ghRepos.update(myRepo._id, { $set: {
						etagBranches: branches.meta.etag
					}} );
				} else {
					myRepo = { _id: ghRepos.insert({
						userId: self.userId,
						repo: repo.name,
						etagBranches: branches.meta.etag
					})};
				}

				if (isMeteorProject(github, repo, branches)) {

					ghRepos.update(myRepo._id, { $set: {
						branches: branches,
						isMeteorProject: true
					}});

					var branchArray = _.pluck(branches, 'name');
					if (branchArray.length > 1) {
						// move 'master' to head of the list
						branchArray = _.without(branchArray, 'master');
						branchArray.unshift('master');

					}

					wmdRepos.upsert({
						userId: self.userId, name: repo.name
					}, { $set: {
						service: 'github',
						serviceId: myRepo._id,
						branches: branchArray
					}});

				} else {

					// do we need this for anything?
					ghRepos.update(myRepo._id, { $set: {
						isMeteorProject: false
					}});

					wmdRepos.remove({
						userId: self.userId, repo: repo.name
					});

				}

			}); /* each repo */

			//console.log(reposGetAll);

			delete(updatingUserRepos[this.userId]);
		} /* Method wmd.github.updateRepos */

	}); /* Meteor methods */

	ext.registerPlugin('addApp', 'github', '0.1.0', function(data) {
		var repo = ghRepos.findOne(data.repo.serviceId);
		var branch = data.branch;
		
		return true;
	});
}