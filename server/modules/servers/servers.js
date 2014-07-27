if (Meteor.isClient) {
	Router.map(function() {
		this.route('servers', {
			layoutTemplate: 'sidebar-layout',
			action: function() {
				this.render();
				this.render('serverSidebar', { to: 'sidebar' });
			}
		});
		this.route('serverNew', {
			path: '/servers/new',
			layoutTemplate: 'sidebar-layout',
			action: function() {
				this.render('serverNew');
				this.render('serverSidebar', { to: 'sidebar' });
			}
		});
		this.route('serverInfo', {
			path: 'servers/:server',
			layoutTemplate: 'sidebar-layout',
			waitOn: subAll,
			data: function() {
				var server = Servers.findOne({
					$or: [
						{_id: this.params.server},
						{username: this.params.server}
					]
				});
				return {
					server: server
				}
			},
			action: function() {
				this.render('serverSidebar', { to: 'sidebar' });
				this.render();
			}
		});
	});

	Template.servers.servers = function() {
		return Servers.find({$and: [
			{ username: { $not: 'devServer'}},
			{ destroyedAt: { $exists: false }}
		]}, {
			sort: { name: 1 }
		});
	}
	Template.serverSidebar.servers = Template.servers.servers;
	Template.serverSidebar.rendered = activeLinks;

	Template.servers.helpers({
		'hours': function() {
			return Math.floor((new Date() - this.createdAt) / 1000 / 60 / 60);
		},
		'totalCost': function() {
			var floorHours = Math.floor((new Date() - this.createdAt) / 1000 / 60 / 60);
			return (this.costPerHour * floorHours).toFixed(2);
		}
	});

	Template.servers.events({
		'click .destroy': function(event, tpl) {
			if (confirm('Are you sure?')) {
				var serverId = $(event.target).data('id');
				Meteor.call('DO_destroy', serverId, function(error, result) {
					if (error) alert(error);
				});
			}
		},
		'click .setup': function(event, tpl) {
			var serverId = $(event.target).data('id');
			Meteor.call('DO_installClient', serverId, function(err, data) {
				Router.go('/logs/' + data);
			});
		}
	});

}

if (Meteor.isServer) {

	Meteor.methods({

		DO_destroy: function(serverId) {
			var user = Meteor.users.findOne(this.userId);
			var creds = user.apis.digitalocean;
	  		var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
	  		DO = Async.wrap(DO, ['dropletDestroy']);

			var server = Servers.findOne(serverId);

			// Failure in creating, just delete stale entry
			if (!server.digitalocean) {
				Meteor.users.remove(serverId);
				Servers.remove(serverId);
				ServerStats.remove(serverId);
				return;
			}

			var dropletId = server.digitalocean.id;

			try {
				var eventId = DO.dropletDestroy(dropletId);
			} catch (error) {
				//console.log(error.toString());
				throw new Meteor.Error(404, error.toString());
			}
			// console.log(result);

			DO_eventCheck(eventId, user, null,
				function(result, data) {
					Meteor.users.remove(serverId);
					ServerStats.remove(serverId);

					// Don't delete historical cost data
					// Servers.remove(serverId);
					Servers.update(serverId, { $set: {
						destroyedAt: new Date()
					}});
				}, {});

			return {};
		},

		DO_installClient: function(serverId) {
			var user = Meteor.users.findOne(this.userId);
			var server = Servers.findOne(serverId);
			var Connection = new Meteor.require('ssh2');
			var heredoc = new Meteor.require('heredoc');

			var log = new slog('Install client on ' + server.username);
			log.addLine('Initiating SSH connection to '
				+ server.username + ' (root@' 
				+ server.digitalocean.ip_address + ')...\n');

			log.addLine = Meteor.bindEnvironment(log.addLine, null, log);
			log.close = Meteor.bindEnvironment(log.close, null, log);

			/*
			var script = heredoc.strip(function() {/*
				cat > install.sh << __EOF__
				#!/bin/sh
				echo hello
				ls
				__EOF__
				chmod a+x install.sh
				./install.sh
			*/    //});

			var rootUrl = extRootUrl();
			var script = 'mkdir wmd-client ; cd wmd-client\n';
			for (file in installScripts)
				script += 'cat > ' + file + ' <<"__WMD_EOF__"\n'
					+ installScripts[file] + '\n__WMD_EOF__\n';
			script += 'cat > credentials.json <<"__WMD_EOF__"\n'
			  + JSON.stringify({
			  	username: server.username,
			  	password: server.password,
			  	host: rootUrl.hostname,
			  	port: rootUrl.port
			  }) + '\n__WMD_EOF__\n'
				+ 'chmod a+x dropletSetup.sh\n'
				+ './dropletSetup.sh';

			var c = new Connection();
			c.on('ready', function() {
				log.addLine('Connected, executing script...\n\n');
				c.exec(script, function(err, stream) {
					if (err) throw err;
					stream.on('data', log.addLine);
					//stream.on('end', ...);
					//stream.on('close', ...);
					stream.on('exit', function(code, signal) {
						if (code)
							log.addLine('Stream :: exit :: code: '
								+ code + ', signal: ' + signal);
						c.end();
					});
				});
			});

			c.on('end', function() { DO_setupEnd(log); });
			c.on('close', function() { DO_setupEnd(log); });
			c.on('error', function(err) {
  			log.addLine('Connection :: error :: ' + err);
			});

			//console.log({
			c.connect({
				username: 'root',
				host: server.digitalocean.ip_address,
				privateKey: user.sshKey.privkey
			});

			return log.logId;
		}

	}); /* Meteor.methods */

	var DO_setupEnd = function(log) {
		log.close();
	}

	var DO_runScript = function(serverId, userId, script, title) {

	}

	/*
	 * Follow event progress, requires: eventId, user
	 * Will call update() callback and finished() callback when relevant
	 * with callback(result, data);  (Data is passed on first call)
	 */
	DO_eventCheck = function(eventId, user, update, finished, data) {
		var creds = user.apis.digitalocean;
  	var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
  	DO = Async.wrap(DO, ['eventGet']);

  	data.eventId = eventId;
  	data.user = user;

  	var result = DO.eventGet(eventId);

		var eventDesc;
		switch (result.event_type_id) {
			case 1: eventDesc = 'Creating Droplet...'; break;
			case 10: eventDesc = 'Destroying Droplet...'; break;
		}
		result.event_desc = eventDesc;

		Servers.update({'digitalocean.id': result.droplet_id}, {$set: {
			event: result
		}});

  	if (result.action_status) {
  		if (finished)
  			finished(result, data);
  	} else {
  		if (update)
  			update(result, data);
			Meteor.setTimeout(function() {
				DO_eventCheck(eventId, user, update, finished, data);
			}, 1000);
  	}
	}

	var glob = Meteor.require('glob');
	var fs = Meteor.require('fs');

	var installScripts = {};
	/*
	var path = process.env.NODE_ENV && process.env.NODE_ENV == 'production'
		? path.normalize(process.cwd() + '/assets/app/scripts/')
		: path.normalize(process.cwd() + '/../../../../../private/scripts');
	*/
	// scripts: /../../../../../private/scripts
	//  client: /../../../../../../client/
	var path = process.env.NODE_ENV && process.env.NODE_ENV == 'production'
		? path.normalize(process.env.HOME + '/wmd-client/')
		: path.normalize(process.cwd() + '/../../../../../../client/');

	var loadScript = function(file) {
		fs.readFile(path + file, 'utf8', function(err, data) {
			if (err) throw err;
			installScripts[file] = data;
		});		
	}
	glob('{*.js,*.sh,*.json}', { cwd: path }, function(err, files) {
		if (err) throw err;
		_.each(files, function(file) {
			if (file == "credentials.json" || file == "state.json")
				return;
			loadScript(file);
		});
	});

	var Inotify = Meteor.require('inotify').Inotify;
	var inotify = new Inotify();
	var watch	= inotify.addWatch({
		path: path,
		watch_for: Inotify.IN_MODIFY | Inotify.IN_CREATE
			| Inotify.IN_CLOSE_WRITE | Inotify.IN_MOVED_TO,
		callback: function(event) {
			if (!event.name.match(/\.js$|\.sh$|\.json$/)
					|| event.name == 'credentials.json'
					|| event.name == 'state.json')
				return;
			console.log('[wmd] ' + event.name + ' modified, refreshing cache...');
			loadScript(event.name);
		}
	});

	config.add('dyndnsHost', null);

} /* isServer */
