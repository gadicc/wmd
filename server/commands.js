// Commands from server to client

commands = new Meteor.Collection('commands');

if (Meteor.isServer) {
	Meteor.publish('commands', function() {
		return commands.find({
			serverId: this.userId,
			status: 'new'
		});
	});

	// TODO, DISABLE
	Meteor.methods({
		'cmdTest': function(serverId, command, options) {
			sendCommand(serverId, command, options);
		}
	});
}

sendCommand = function(serverId, command, options) {
	commands.insert({
		serverId: serverId,
		status: 'new',
		command: command,
		options: options,
		createdAt: new Date()
	});
}

if (Meteor.isClient) {
	Meteor.subscribe('commands');
	commands.find({status:'new'}).observe({
		added: function(doc) {
			console.log(doc);
		}
	});
}

