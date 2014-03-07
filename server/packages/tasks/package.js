Package.describe({
    summary: "Taskrunner for Meteor, with resume and reactive collections"
});

Package.on_use(function (api) {
	api.use('underscore', 'server');
	api.add_files('tasks.js', 'server');

	api.use(['templating', 'iron-router'], 'client');
	api.add_files(['tasks.html', 'tasks-client.js'], 'client');

	api.export(['Task', 'Tasks'], 'server');
	api.export(['Tasks', 'client']);
});
