// Commands from server to client

var Commands = new Meteor.Collection('Commands');
var commandCallbacks = {};

if (Meteor.isServer) {
	Meteor.publish('commands', function() {
		// console.log('cmd sub ' + this.userId);
		return Commands.find({
			serverId: this.userId,
			status: 'new'
		});
	});

	Meteor.methods({

		'cmdResult': function(commandId, data) {
			var command = Commands.findOne(commandId);
			if (!_.isObject(data))
				data = { result: data };

			if (!command)
				console.log("Got cmdReturn for non-existant cmd " + commandId);

			if (this.userId != command.serverId)
				console.log(this.userId + ' tried to give cmdReturn for '
					+ command.serverId + ', ignoring...');

			console.log('cmdResult', commandId, data);
			Commands.update(commandId, { $set: data } );

			if (commandCallbacks[commandId]) {
				commandCallbacks[commandId].call(command, data.error, data);
				delete(commandCallbacks[commandId]);
			}
		},

		// TODO, DISABLE
		'cmdTest': function(serverId, command, options, callback) {
			var wrappedSendCommand = Async.wrap(sendCommand);
			try {
				var result = wrappedSendCommand(serverId, command, options);
			} catch (err) {
				throw new Meteor.error(err);
			}
			return result;
		}
	});
}


sendCommand = function(serverId, command, options, callback) {
	var commandId = Commands.insert({
		serverId: serverId,
		status: 'new',
		command: command,
		options: options,
		createdAt: new Date()
	});

	console.log("Command '" + commandId + "' created for " + serverId);

	if (callback)
		commandCallbacks[commandId] = callback;

	return commandId;
}

if (Meteor.isClient) {
	Meteor.subscribe('commands');
	Commands.find({status:'new'}).observe({
		added: function(doc) {
			console.log(doc);
		}
	});
}

