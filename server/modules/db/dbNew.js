if (Meteor.isClient) {

	Template.dbNew.events({
		'submit': function(event, tpl) {
			event.preventDefault();
			Meteor.call('dbNew');
		}
	});

}

if (Meteor.isServer) {

	Meteor.methods({

		dbNew: function(name, appIds, serverIds) {

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