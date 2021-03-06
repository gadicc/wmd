//clients = new Meteor.Collection('clients');
Apps = new Meteor.Collection('Apps');
Servers = new Meteor.Collection('servers');
ServerStats = new Meteor.Collection('serverStats');
Databases = new Meteor.Collection('databases');
wmdRepos = new Meteor.Collection('repos');
subs = {};

var validEmails = [
	'dean@myresidence.com',
	'tarang.com@gmail.com'
];

if (Meteor.isClient) {
	subAll = Meteor.subscribe('all');
}

if (Meteor.isServer) {
	Accounts.validateNewUser(function(user) {
		console.log(user);

		// always allow creation of new servers
		if (_.contains(validServers, user.username))
			return true;

		var existingNonServer
			= Meteor.users.findOne({server: {$exists: false}});

		if (_.contains(validEmails, user.emails[0].address))
			return true;

		if (existingNonServer)
			throw new Meteor.Error(403, "Additional users require preapproval.");

		// Only the first real (non-server) user will make it this far
		return true;
	});

	var cols = ['Apps', 'Servers', 'ServerStats', 'Databases'];
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
			insert: function(userId) { return userId; },
			update: function(userId) { return userId; },
			remove: function(userId) { return userId; }
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
