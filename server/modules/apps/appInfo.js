if (Meteor.isClient) {
	Router.map(function() {
		this.route('appInfo', {
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

	Template.appInfo.name = function() {
		return this.name;
	}
	Template.appInfo.app = function() {
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
		},
		'click #ssl_update': function(event, tpl) {
			var appId = tpl.data._id;
			var cert = $('#ssl_cert').val();
			var key = $('#ssl_key').val();
			Meteor.call('appUpdateSSL', appId, cert, key);
		}
	});
}

if (Meteor.isServer) {
	Meteor.methods({
		'appUpdateSSL': function(appId, cert, key) {
			if (!this.userId) return;
			Apps.update(appId, { $set: { ssl: {
				cert: cert,
				key: key,
				cert_hash: sha1(cert),
				key_hash: sha1(key)
			}}});
		}
	});
}