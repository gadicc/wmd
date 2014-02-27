/*
 * TODO
 *
 * We might consider having nginx check the file before sending SIGHUP
 *
 */

if (Meteor.isServer) {

	var nginxGenConf = function() {
		var out = '';
		var apps = Apps.find().fetch();
		_.each(apps, function(app) {
			out += 'server_names_hash_bucket_size 64;\n\n'
				+ 'upstream app' + app.appId + ' {\n'
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
			out += ';\n'
				+ '\tlocation / {\n'
				+ '\t\tproxy_pass http://app' + app.appId + '/;\n'
				+ '\t\tproxy_http_version 1.1;\n'
	        	+ '\t\tproxy_set_header Upgrade $http_upgrade;\n'
	        	+ '\t\tproxy_set_header Connection "upgrade";\n'
	        	+ '\t}\n'
	        	+ '}\n\n';
      });
      console.log(out);
      return out;
	}
}

ext.on('appUpdated', '0.1.0', function(data) {
	var conf = nginxGenConf();
	var servers = Servers.find({
		$or: [ {type: 'nginx'}, { type: 'combo'} ]
	}).fetch();
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