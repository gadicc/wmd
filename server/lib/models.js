//clients = new Meteor.Collection('clients');
Apps = new Meteor.Collection('Apps');
Servers = new Meteor.Collection('servers');
ServerStats = new Meteor.Collection('serverStats');
databases = new Meteor.Collection('databases');
wmdRepos = new Meteor.Collection('repos');

if (Meteor.isClient) {
	subAll = Meteor.subscribe('all');
}

if (Meteor.isServer) {
	Meteor.publish('all', function() {
		// prototyping, TODO, proper pub/subs
		var cols = ['Apps', 'Servers', 'ServerStats', 'databases'];
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

	Meteor.publish('wmdRepos', function() {
		return wmdRepos.find({userId: this.userId});
	});

	/*
	Meteor.publish("userData", function() {
		return Meteor.users.find({_id: this.userId},
			{fields: {apis: 1, 'sshKey.doId': 1}});
	});
	*/
}
