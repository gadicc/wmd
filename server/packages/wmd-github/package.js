Package.describe({
    summary: "[WMD] Digital Ocean support"
});

Npm.depends({
  "github": "0.1.14",
  "connect": "2.13.0"
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

	// for github hook, see note about iron-router
	api.use('webapp', 'server');

	api.add_files('wmd-github.js', ['client', 'server']);

	api.add_files(['lib/apps/apps.html', 'lib/apps/apps.css'], 'client');
	api.add_files(['lib/apps/apps.js', 'lib/apps/manage.js'], ['server', 'client']);
});
