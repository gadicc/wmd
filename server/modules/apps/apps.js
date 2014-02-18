if (Meteor.isClient) {
	Router.map(function() {
		this.route('apps', {
			before: function() {
				this.subscribe('wmdRepos');
			},
			data: function() {
				var user = Meteor.user();
				return {
					repos: wmdRepos.find({
						userId: user._id,
						// should excluse if all branches are deployed
						//appId: { $exists: false }
					}, {
						sort: { repo: 1 }
					})
				}
			}
		});
	});

	Template.appAdd.rendered = function() {
		Session.set('selectedRepo', $('#appAdd_repo').val());
	}

	Template.appAdd.helpers({
		'branches': function() {
			var repo = Session.get('selectedRepo');
			repo = wmdRepos.findOne({repo: repo});
			return repo ? repo.branches : null;
		}
	});

	Template.appAdd.events({
		'change #appAdd_repo': function(event, tpl) {
			Session.set('selectedRepo', $('#appAdd_repo').val());
		},
		'submit': function(event, tpl) {
			console.log(tpl);
			event.preventDefault();
			var repo = $(tpl.find('#appAdd_repo')).val();
			repo = wmdRepos.findOne({repo: repo});
			console.log(repo);
		}
	});
}

if (Meteor.isServer) {
}