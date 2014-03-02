if (Meteor.isClient) {
	Router.map(function() {
		this.route('appInfo', {
			path: '/apps/:app',
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
				if (app)
					this.render();
			}
		});
	});

	Handlebars.registerHelper('serverName', function(serverId) {
		if (!serverId)
			serverId = this.serverId;
		return Servers.findOne(serverId).username;
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
			var appId, instanceId;
			if (tpl.data.serverId) {
				appId = tpl.__component__.parent.parent.templateInstance.data._id;
				instanceId = tpl.data._id;
			} else {
				appId = tpl.data._id;
				instanceId = undefined;
			}
			var action = $(event.target).data('action');
			Meteor.call('appAction', appId, action, instanceId);
		}
	});
	Template.appButtons.config = function(action) {
		var disabled = null;
		switch(action) {
			case 'start':
				if (this.state == 'running')
					disabled = true;
				break;

			case 'stop':
				if (this.state == 'stopped')
					disabled = true;
				break;

			case 'delete':
				if (this.state == 'running')
					disabled = true;
				break;
		}
		return { 'data-action': action, disabled: disabled }
	}

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

	Template.appConfig.sourceOptions = function() {
		// move to seperate repo package
		if (this.source == 'repo') {
			console.log(this.repoId);
			var repo = wmdRepos.findOne(this.repoId);
			if (!repo) return null;
			return Extensions.runPlugin('appOptions', repo.service, {
				app: this, repo: repo
			});
		}
	}
	Extensions.declarePlugin('appOptions', '0.1.0');

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