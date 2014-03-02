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
			out += 'upstream ' + app.name + ' {\n'
				+ '\tip_hash;\n';
			_.each(app.instances.data, function(ai) {
				var server = Servers.findOne(ai.serverId); // TODO, cache
				out += '\tserver ' + server.ip
					+ ':' + ai.port
					+ (ai.state == 'running' ? '' : ' down')
					+ ';\n';
			});

			out += '}\n\nserver {\n'
				+ '\tlisten 80;\n'
				+ '\tserver_name ' + app.name + '.gadi.cc';
			_.each(app.vhosts, function(host) {
				out += ' ' + host;
			});
			out += ';\n';

			if (app.ssl) {
				var prefix = '/etc/ssl/certs/' + app.name;
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
				+ '\t\tproxy_pass http://' + app.name + '/;\n'
				+ '\t\tproxy_http_version 1.1;\n'
	        	+ '\t\tproxy_set_header Upgrade $http_upgrade;\n'
	        	+ '\t\tproxy_set_header Connection "upgrade";\n'
	        	+ '\t\tproxy_set_header Host $host;\n' // override
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
	Files.update('/etc/nginx/conf.d/wmd.conf', conf,
		'nginx', null, { postAction: {
			cmd: 'kill',
			data: {
				pidFile: '/var/run/nginx.pid',
				signal: 'SIGHUP'
			}
		}});
});