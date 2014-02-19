# Extensions

Via the
[meteor extensions](https://atmosphere.meteor.com/package/extensions)
smart package.

## Available Hooks

e.g. ext.addHook('ssh.keygen', '0.1.0', callback);

**ssh.keygen**: called after a new SSH key pair has been generated for
the user, generally used to upload the pubkey to the cloud provider
and store the key in user's `sshKey.cloudProviderId` field.

* v0.1.0: `callback({ name: name, user: user, pubkey: pubkey })`.
Return value is not used.

### user/user.js

## Available Plugins

e.g. ext.registerPlugin('addApp', 'github', '0.1.0', callback);

### apps/apps.js

**addApp**: called when adding an app for this service

* v0.1.0: `callback({repo: repo, branch: branch, appData: appData})`.
Must return `true`.  appData may be modified to store in the app's
document on database insert, e.g. `{ github: { id: 234 } }`.
