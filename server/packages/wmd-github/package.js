Package.describe({
    summary: "[WMD] Digital Ocean support"
});

Npm.depends({
  "github": "0.1.14"
});

Package.on_use(function (api) {
	api.use('extensions', 'server');
	api.use([
		'templating',
		'deps',
		'livedata',
		'mongo-livedata'
	], ['server', 'client']);

	api.add_files('wmd-github.js', 'server');

	//api.add_files(['lib/apps/apps.html', 'lib/apps/apps.css'], 'client');
	api.add_files(['lib/apps/apps.js'], ['server', 'client']);
});
