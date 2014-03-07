Package.describe({
    summary: "Taskrunner for Meteor, with resume and reactive collections"
});

/*
Npm.depends({
	"fibers": "1.0.1"
});
*/

Package.on_use(function (api) {
	api.use(['underscore','npm'], 'server');
	api.add_files(['tasks.js','child_process.js'], 'server');

	api.use(['templating', 'iron-router'], 'client');
	api.add_files(['tasks.html', 'tasks-client.js'], 'client');

	api.export(['Task', 'Tasks'], 'server');
	api.export(['Tasks', 'client']);
});
