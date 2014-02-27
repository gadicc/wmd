Package.describe({
    summary: "[WMD] nginx support (load balancer, static cache, vhosts)"
});

Package.on_use(function (api) {
	api.use('extensions', ['client', 'server']);
	api.use([
		'templating',
		'deps',
		'livedata',
		'mongo-livedata',
		'iron-router'
	], ['server', 'client']);

	api.add_files('wmd-nginx.js', ['client', 'server']);

	api.add_files(['lib/apps/apps.html', 'lib/apps/apps.css'], 'client');
	api.add_files(['lib/apps/apps.js', 'lib/apps/manage.js'], ['server', 'client']);
});
