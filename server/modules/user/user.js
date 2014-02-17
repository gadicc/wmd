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

	// If a user logins in and doesn't have a keypair yet,
	// generate them and upload to Digital Ocean
	Deps.autorun(function() {
		var user = Meteor.user();
		if (subAll.ready() && user && !user.sshKey) {
			console.log('Generating an SSH key pair for you');
			Meteor.call('genSshKeyPair');
		}
	});
}

if (Meteor.isServer) {

	Meteor.methods({
		'genSshKeyPair': function() {
			var keygen = Meteor.require('ssh-keypair');
			var user = Meteor.users.findOne(this.userId);
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

			Extensions.runHooks('ssh.keygen', {
				name: name,
				user: user,
				pubkey: response.result.pubkey
			});
		}
	});
}