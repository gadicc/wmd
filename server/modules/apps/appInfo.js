if (Meteor.isClient) {
	Handlebars.registerHelper('serverName', function(serverId) {
		if (!serverId)
			serverId = this.serverId;
		if (!serverId)
			return '(undefined)';
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
			var appId, instanceId, app = null;
			if (tpl.data.serverId) {
				app = tpl.__component__.parent.parent.parent.data();
				appId = app._id;
				instanceId = tpl.data._id;
			} else {
				appId = tpl.data._id;
				instanceId = undefined;
			}
			var action = $(event.target).data('action');

			// TODO, better
			var what = 'appAction';
			if ((this.name && this.name.match(/^db-/)) ||
					(app && app.name && app.name.match(/^db-/)))
				what = 'dbAction';
			console.log(what, appId, action, instanceId);
			Meteor.call(what, appId, action, instanceId);
		}
	});
	Template.appButtons.active = function() {

	};
	Template.appButtons.config = function(action) {
		var disabled = null;
		var cssClass = 'btn ';
		switch(action) {
			case 'setup':
				cssClass += 'btn-primary';
				break;

			case 'update':
				cssClass += 'btn-info';
				break;

			case 'start':
				cssClass += 'btn-success';
				if (this.state == 'running') {
					disabled = true;
					cssClass += ' active';
				}
				break;

			case 'stop':
				cssClass += 'btn-warning';
				if (this.state == 'stopped') {
					disabled = true;
					cssClass += ' active'
				}
				break;

			case 'delete':
				cssClass += 'btn-danger';
				if (this.state == 'running')
					disabled = true;
				break;
		}
		return { 'data-action': action, disabled: disabled, class: cssClass }
	}

	Template.appConfig.helpers({
		vhosts: function() {
			return this.vhosts ? this.vhosts.join('\n') : '';
		},
		env: function() {
			var out = '';
			for (key in this.env)
				out += key + '=' + this.env[key] + '\n';
			return out;
		}
	});

	Template.appConfig.events({
		'change #vhosts': function(event, tpl) {
			var appId = tpl.data._id;
			var vhosts = $(event.target).val().split('\n');
			Apps.update(appId, {$set: { vhosts: vhosts }});
		},
		'change #env': function(event, tpl) {
			var appId = tpl.data._id;
			var env = {};
			_.each($(event.target).val().split('\n'), function(pair) {
				pair = /^([^=]+)=(['"]?)(.*)\2$/.exec(pair);
				if (pair)
					env[pair[1]] = pair[3];
			});
			Apps.update(appId, {$set: { env: env }});
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