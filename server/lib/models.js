clients = new Meteor.Collection('clients');
apps = new Meteor.Collection('apps');
servers = new Meteor.Collection('servers');
serverStats = new Meteor.Collection('serverStats');
databases = new Meteor.Collection('databases');

if (Meteor.isClient) {
	subAll = Meteor.subscribe('all');
}

if (Meteor.isServer) {
	Meteor.publish('all', function() {
		// prototyping, TODO, proper pub/subs
		var cols = ['clients', 'servers', 'serverStats', 'databases'];
		cols = cols.map(function(col) { return root[col].find() });
		cols.push(Meteor.users.find({_id: this.userId},
			{fields: {apis: 1, 'sshKey.doId': 1}}));
		return cols;
	});

	Meteor.users.allow({
		update: function(userId, doc, fieldNames, modifier) {
			return userId == doc._id
				&& fieldNames.length == 1 && fieldNames[0] == 'apis';
		}
	});

	/*
	Meteor.publish("userData", function() {
		return Meteor.users.find({_id: this.userId},
			{fields: {apis: 1, 'sshKey.doId': 1}});
	});
	*/
}
