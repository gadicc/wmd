// modules/user/user.js
Extensions.registerHookType('ssh.keygen', '0.1.0');

// TODO, add to Extensions package
Extensions.addInternalHook = function(hookName, api, func, options) {
	this.addHook(hookName, 'internal', {
		func: func,
		api: api,
		priority: options.priority
	});
}
