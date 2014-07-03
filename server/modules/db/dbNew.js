if (Meteor.isClient) {

	Template.dbNew.helpers({

		servers: function() {
			return Servers.find({$or: [ {type:'combo'}, {type:'mongo'} ]});
		}

	});

	Template.dbNew.events({
		'submit': function(event, tpl) {
			event.preventDefault();
			Meteor.call('dbNew', tpl.$('#dbName').val(), tpl.$('#dbServer').val());
		}
	});

}

if (Meteor.isServer) {

	Meteor.methods({

		dbNew: function(name, serverIds, appIds) {
			check(name, Match.Optional(String));
			check(serverIds, Match.OneOf(String, [String]));
			check(appIds, Match.Optional(Match.OneOf(String, [String])));

			var dbCounter = incrementCounter('db')
			var dbId = Databases.insert({
				name: name || 'db-' + dbCounter,
				uid: UID_START + incrementCounter('uids'),
				instances: {
					min: 1,
					max: 1,
					target: 1,
					deployed: 0,
					running: 0,
					data: []
				},
				forcedOn: _.isArray(serverIds) ? serverIds : [serverIds],
				appIds: _.isArray(serverIds) ? appIds : [appIds],
				port: DB_PORT_START + dbCounter,
				adminUser: 'admin',
				adminPassword: Random.id(),
				oplogUser: 'oplogger',
				oplogPassword: Random.id(),
				meteorUser: 'meteor',
				meteorPassword: Random.id()
			});

		}

	});

}