Package.describe({
    summary: "[WMD] Digital Ocean support"
});

Npm.depends({
  "digitalocean-api": "0.1.1"
});

Package.on_use(function (api) {
	api.use('extensions', 'server');
	api.use('templating', ['server', 'client']);

	api.add_files('digitalocean.js', 'server');

	api.add_files(['lib/user/user.html', 'lib/user/user.css'], 'client');
	api.add_files(['lib/user/user.js'], ['server', 'client']);
});
