Tasks = new Meteor.Collection('Tasks');

if (Meteor.isClient) {
	Router.map(function() {
		this.route('tasks', {
			before: function() {
			}
		});
	});
}

if (Meteor.isServer) {

	Task = function(data) {
		this.desc = data.desc || 'New Task';
		this.serverId = data.serverId;
		this.appId = data.appId;
		this.state = 'running'; // failed, completed, aborted
		this.percent = 0;
		this.log;
	}

}