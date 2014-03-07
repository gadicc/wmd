Tasks = new Meteor.Collection('tasks');
Meteor.subscribe('tasks');

Router.map(function() {
	this.route('tasks', {
		before: function() {
			this.subscribe('tasks');
		}
	});
});

Template.tasks.tasks = function() {
	return Tasks.find({}, {
		sort: { createdAt: 1 }
	});
}
