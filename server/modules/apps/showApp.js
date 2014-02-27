if (Meteor.isClient) {
	Router.map(function() {
		this.route('showApp', {
			path: '/apps/:app',
			action: function() {
				if (!subAll.ready())
					return;
				var app = Apps.findOne({ $or: [
					{ _id: this.params.app },
					{ name: this.params.app }
				]});
				Session.set('appId', app._id);
				if (app)
					this.render();
			}
		});
	});

	Template.showApp.name = function() {
		return this.name;
	}
	Template.showApp.app = function() {
		return Apps.findOne(Session.get('appId'));
	}

	Template.appButtons.events({
		'click button': function(event, tpl) {
			event.preventDefault();
			var target = $(event.target);
			var appId = target.data('app-id');
			var serverId = target.data('server-id');
			var action = target.data('action');
			Meteor.call('appAction', appId, action, serverId);
		}
	});

	Template.appConfig.helpers({
		vhosts: function() {
			return this.vhosts ? this.vhosts.join('\n') : '';
		}
	});

	Template.appConfig.events({
		'change #vhosts': function(event, tpl) {
			var appId = tpl.data._id;
			var vhosts = $(event.target).val().split('\n');
			Apps.update(appId, {$set: { vhosts: vhosts }});
		}
	});
}