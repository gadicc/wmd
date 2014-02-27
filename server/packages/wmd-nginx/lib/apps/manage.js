/*
 * TODO
 *
 * We might consider having nginx check the file before sending SIGHUP
 *
 */

if (Meteor.isServer) {

	var nginxGenConf = function() {
		var out = 'server_names_hash_bucket_size 64;\n\n';
		var apps = Apps.find().fetch();
		_.each(apps, function(app) {
			out += 'upstream app' + app.appId + ' {\n'
				+ '\tip_hash;\n';
			_.each(app.instances.data, function(ai) {
				if (_.indexOf(['running','stopped','started'], ai.state) != -1) {
					var server = Servers.findOne(ai.serverId); // TODO, cache
					out += '\tserver ' + server.ip
						+ ':' + ai.port
						+ (ai.state == 'stopped' || ai.state == 'started' ? ' down' : '')
						+ ';\n';
				}
			});

			out += '}\n\nserver {\n'
				+ '\tlisten 80;\n'
				+ '\tserver_name app' + app.appId + '.gadi.cc';
			_.each(app.vhosts, function(host) {
				out += ' ' + host;
			});
			out += ';\n';

			if (app.ssl) {
				var prefix = '/etc/ssl/certs/app' + app.appId;
				Files.update(prefix+'.crt', app.ssl.cert, 'nginx', app.ssl.cert_hash);
				Files.update(prefix+'.key', app.ssl.key, 'nginx', app.ssl.key_hash);
				out += '\tlisten 443 ssl;\n'
					+ '\tssl on;\n'
					+ '\tssl_certificate ' + prefix + '.crt;\n'
					+ '\tssl_certificate_key ' + prefix + '.key;\n';
			}

			out += '\tfastcgi_buffer_size 4K;\n'
				+ '\tfastcgi_buffers 64 4k;\n';

			out	+= '\tlocation / {\n'
				+ '\t\tproxy_pass http://app' + app.appId + '/;\n'
				+ '\t\tproxy_http_version 1.1;\n'
	        	+ '\t\tproxy_set_header Upgrade $http_upgrade;\n'
	        	+ '\t\tproxy_set_header Connection "upgrade";\n'
	        	+ '\t}\n'
	        	+ '}\n\n';
      });
      return out;
	}
}

ext.on('appUpdated', '0.1.0', function(data) {
	var conf = nginxGenConf();
	var servers = Servers.find({ $and: [
		{ destroyedAt: {$exists: false} },
		{ $or: [ {type: 'nginx'}, { type: 'combo'} ] }
	]}).fetch();
	var updated = Files.update('/etc/nginx/conf.d/wmd.conf', conf);
	if (!updated) return;
	_.each(servers, function(server) {
		sendCommand(server._id, 'writeAndKill', {
			filename: '/etc/nginx/conf.d/wmd.conf',
			contents: conf,
			pidFile: '/var/run/nginx.pid',
			signal: 'SIGHUP'
		}, function(err, result) {
			if (err) {
				console.log("Error updating nginx config on " + server.username);
				console.log(err);
			} else {
				console.log("Updated nginx config on " + server.username);
			}
		});
	});
});