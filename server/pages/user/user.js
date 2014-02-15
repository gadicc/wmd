if (Meteor.isClient) {
	Router.map(function() {
		this.route('user', {
			data: function() {
				return {
					user: Meteor.user()
				}
			}
		});
	});

	Template.user.events({
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

	// If a user logins in and doesn't have a keypair yet,
	// generate them and upload to Digital Ocean
	Deps.autorun(function() {
		var user = Meteor.user();
		if (subAll.ready() && user && !user.sshKey) {
			console.log('Generating an SSH key pair for you');
			//Meteor.call('genSshKeyPair');
		}
	});
}

if (Meteor.isServer) {

	Meteor.methods({
		'genSshKeyPair': function() {
			var keygen = Meteor.require('ssh-keypair');
			var user = Meteor.users.findOne(this.userId);
			var creds = user.apis.digitalocean;
			var DO = new DigitalOceanAPI(creds.clientId, creds.apiKey);
			DO = Async.wrap(DO, ['sshKeyAdd']);
			var name = user.profile.name + ' (WMD)';

			var response = Async.runSync(function(done) {
				keygen(name, function (error, privkey, pubkey) {
					done(error, { pubkey: pubkey, privkey: privkey });
				});
			});

			// TODO, handle error


			// store in user's account
			Meteor.users.update(this.userId, { $set: {
				'sshKey': {
					privkey: response.result.privkey,
					pubkey: response.result.pubkey
				}
			}});

			// upload to Digital Ocean
			var result = DO.sshKeyAdd(name, response.result.pubkey);
			Meteor.users.update(this.userId, { $set: {
				'sshKey.doId': result.id
			}});
		}
	});
}