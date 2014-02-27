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
	Accounts.validateNewUser(function(user) {
		var existingNonServer
			= Meteor.users.findOne({server: {$exists: false}});
		if (existingNonServer)
			return false;
		return true;
	});

	var cols = ['Apps', 'Servers', 'ServerStats', 'databases'];
	Meteor.publish('all', function() {
		if (!this.userId) return;

		// prototyping, TODO, proper pub/subs
		var finds = cols.map(function(col) { return root[col].find() });
		finds.push(Meteor.users.find({_id: this.userId},
			{fields: {apis: 1, 'sshKey.doId': 1}}));
		return finds;
	});

	_.each(cols, function(col) {
		root[col].allow({
			insert: function() { return this.userId; },
			update: function() { return this.userId; },
			remove: function() { return this.userId; }
		});
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
