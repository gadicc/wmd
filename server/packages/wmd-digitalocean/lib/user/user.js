if (Meteor.isClient) {
	Template.user_digitalocean.events({
		'submit #digitalocean': function(event, tpl) {
			event.preventDefault();
			Meteor.users.update(Meteor.userId(), {$set: {
				'apis.digitalocean': {
					clientId: $(tpl.find('#digitalocean [name="clientId"]')).val(),
					apiKey: $(tpl.find('#digitalocean [name="apiKey"]')).val(),
					sshKeyId: parseInt($(tpl.find('#digitalocean [name="sshKeyId"]')).val())
				}
			}});
		}
	});
}

if (Meteor.isServer) {

	ext.addHook('ssh.keygen', '0.1.0', function(data) {
		var creds = data.user.apis.digitalocean;
		var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
		DO = Async.wrap(DO, ['sshKeyAdd']);

		var result = DO.sshKeyAdd(data.name, data.pubkey);
		Meteor.users.update(data.user._id, { $set: {
			'sshKey.doId': result.id
		}});
	});

}