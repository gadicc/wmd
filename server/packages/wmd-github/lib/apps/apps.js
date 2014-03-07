if (Meteor.isClient) {
	Deps.autorun(function() {
		if (Meteor.userId()) {
			Meteor.call('wmd.github.updateRepos');
		}
	});

	ext.plugin('appOptions', 'github', '0.1.0', function(data) {
		var repo = ghRepos.findOne(data.repo.serviceId);
		var branch = data.branch;
		return Template.ghAppOptions;
	});

	Template.ghAppOptions.events({
		'click [name="autoUpdate"]': function(event, tpl) {
			var appId = this._id;
			var enabled = $(event.target).is(':checked');
			Meteor.call('wmd.github.setAutoUpdate', appId, enabled);
		}
	});
}

if (Meteor.isServer) {
	var path = Meteor.require('path');

	var findMeteorDir = function(github, repo, branches) {
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
				return path.dirname(req.tree[i].path);
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
			this.unblock();

			var self = this;
			var user = Meteor.users.findOne(this.userId);
			var github = authedWrappedGithub(user);

	    // where we store eTags for this user's github requests
	    var meta = ghRepos.findOne({userId: this.userId, repo: '_meta'});

	    var allRepos = [];

	    /* --- User Repos --- */

			var reposGetAll = github.repos.getAll({
				type: 'all',
				per_page: 100,
				headers: {
					'If-None-Match': meta && meta.etags.reposGetAll || undefined
				}
			});

			if (reposGetAll.meta.status == '304 Not Modified') {
				console.log('no changes to user repos');
			} else {
				if (meta) {
					ghRepos.update(meta._id, { $set: {
						'etags.reposGetAll': reposGetAll.meta.etag
					}} );
				} else {
					meta = {
						userId: this.userId,
						repo: '_meta',
						etags: {
							reposGetAll: reposGetAll.meta.etag,
							reposGetFromOrg: {}
						}
					};
					meta._id = ghRepos.insert(meta);
				}
				allRepos = _.union(reposGetAll);
			}

			/* --- User orgs and org repos --- */

			var userGetOrgs = github.user.getOrgs({
				type: 'all',
				per_page: 100,
				headers: {
					'If-None-Match': meta && meta.etags.userGetOrgs || undefined
				}
			});

			if (userGetOrgs.meta.status == '304 Not Modified') {
				console.log('no changes to list of orgs');
				userGetOrgs = meta.userGetOrgs;
			} else {
				ghRepos.update(meta._id, { $set: {
					'etags.userGetOrgs': userGetOrgs.meta.etag,
					userGetOrgs: userGetOrgs
				}});
			}

			// For each org, get their list of repos
			_.each(userGetOrgs, function(org) {

				var orgRepos = github.repos.getFromOrg({
					org: org.login,
					per_page: 100,
					headers: {
						'If-None-Match': meta && meta.etags.reposGetFromOrg[org.id] || undefined
					}
				});

				if (orgRepos.meta.status == '304 Not Modified') {
					console.log('no changes to repos of org ' + org.login);
				} else {
						var data = {};
						data['etags.reposGetFromOrg.'+org.id]
							= orgRepos.meta.etag;
						ghRepos.update(meta._id, { $set: data });
						allRepos = _.union(allRepos, orgRepos);
				}

			});

			/* --- Iterate through all Repos --- */

			_.each(allRepos, function(repo) {

				var myRepo = ghRepos.findOne({
					userId: self.userId, name: repo.name
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
					console.log('no changes to branches of ' + repo.name);
					return; /* from _.each func */
				}

				if (myRepo) {
					console.log('updating ' + repo.name);
					ghRepos.update(myRepo._id, { $set: {
						etagBranches: branches.meta.etag
					}} );
				} else {
					console.log('added ' + repo.name);
					myRepo = { _id: ghRepos.insert({
						userId: self.userId,
						name: repo.name,
						repo: repo,
						etagBranches: branches.meta.etag
					})};
				}

				var meteorDir = findMeteorDir(github, repo, branches);
				if (meteorDir) {

					ghRepos.update(myRepo._id, { $set: {
						branches: branches,
						meteorDir: meteorDir == '.' ? '' : meteorDir
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
						branches: branchArray,
						meteorDir: meteorDir
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

			// finished updating.
			delete(updatingUserRepos[this.userId]);
		}, /* Method wmd.github.updateRepos */

		'wmd.github.setAutoUpdate': function(appId, enabled) {
			this.unblock();
			var app = Apps.findOne(appId);
			var repo = wmdRepos.findOne(app.repoId);
			var ghRepo = ghRepos.findOne(repo.serviceId);
			var user = Meteor.users.findOne(this.userId);
			var github = authedWrappedGithub(user);
			var rootUrl = extRootUrl();
			var self = this;

			if (app.github && app.github.autoUpdate == enabled)
				return;

			if (enabled) {
				var hook = github.repos.createHook({
					user: ghRepo.repo.owner.login,
					repo: ghRepo.repo.name,
					name: 'web',
					config: {
						url: rootUrl.href + 'gitHubHook',
						// TODO, secret + UI for insecure_ssl
						// secret: 'xx'
						insecure_ssl: 1
					}
				});
				Apps.update(appId, { $set: { 'github.autoUpdate': hook.id }});
			} else {
				github.repos.deleteHook({
					user: ghRepo.repo.owner.login,
					repo: ghRepo.repo.name,
					id: app.github.autoUpdate
				});
				Apps.update(appId, { $set: { 'github.autoUpdate': false }});
			}

		},

		'hooktest': function() {
			var github = authedWrappedGithub(this.userId);
			github.repos.testHook({
				user: 'gadicohen',
				repo: 'meteor-messageformat',
				id: 1878974
			});
		}

	}); /* Meteor methods */

	function authedWrappedGithub(user) {
		if (!_.isObject(user))
			user = Meteor.users.findOne(user);

			var Github = Meteor.require('github');
			var github = new Github({version: "3.0.0"});

			github.user = Async.wrap(github.user, [
				'getOrgs'
			]);
			github.gitdata = Async.wrap(github.gitdata, [
				'getTree'
			]);
			github.repos = Async.wrap(github.repos, [
				'getAll', 'getFromOrg', 'getBranches', 'getContent',
				'createHook', 'deleteHook', 'testHook'
			]);

	    github.authenticate({
	        type: "oauth",
	        token: user.services.github.accessToken
	    });

	    return github;
	}

	/*
	ext.plugin('addApp', 'github', '0.1.0', function(data) {
		var repo = ghRepos.findOne(data.repo.serviceId);
		var branch = data.branch;

		appData.github = {};
		return true;
	});
	*/

	/* server side routing on iron-router#blaze-integration seems to be broken 
	Router.map(function() {
		this.route('gitHubHook', {
			where: 'server',
			action: function() {
				console.log('action');
				this.response.writeHead(200);
				this.response.end();

				var data = JSON.parse(this.request.body.payload);

				// wow, a bit convoluted... reconsider how we store everything?
				var ghRepo = ghRepos.findOne({'repo.id': data.repository.id});
				var repo = wmdRepos.findOne({
					service:'github', serviceId: ghRepo._id
				});
				var app = Apps.findOne({repoId: repo._id});

				console.log('Github push for ' + app.name + ', updating...');
				appActions.update(app);
			}
		})
	});
  */

  var connect = Npm.require('connect');
  var Fiber = Npm.require('fibers');
	WebApp.connectHandlers
		.use(connect.urlencoded())
		.use(connect.json())
		.use('/gitHubHook', function(req, res, next) {
			res.writeHead(200);
			res.end();

			var data = JSON.parse(req.body.payload);

			if (data.hook_id) {
				console.log('Hook ' + data.hook_id + ' successfully created');
				return;
			}

			Fiber(function(data) {
				// wow, a bit convoluted... reconsider how we store everything?
				var ghRepo = ghRepos.findOne({'repo.id':data.repository.id});
				var repo = wmdRepos.findOne({
					service:'github', serviceId: ghRepo._id
				});
				var app = Apps.findOne({repoId: repo._id});

				console.log('Github push for ' + app.name + ', updating...');
				appMethods.update(app);
			}).run(data);
		});	
}