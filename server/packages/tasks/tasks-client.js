Tasks = new Meteor.Collection('tasks');
Meteor.subscribe('tasks');

Router.map(function() {
	this.route('tasks', {
		onBeforeAction: function() {
			this.subscribe('tasks');
		}
	});
});

Template.tasks.tasks = function() {
	return Tasks.find({}, {
		sort: { startedAt: -1 }
	});
}
