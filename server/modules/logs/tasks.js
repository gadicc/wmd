Tasks = new Meteor.Collection('Tasks');

if (Meteor.isClient) {
	Router.map(function() {
		this.route('tasks', {
			before: function() {
			}
		});
	});
}