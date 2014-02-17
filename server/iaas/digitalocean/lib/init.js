// TODO, add to Extensions source
Extension = function(extData) {
    Extensions.add(extData);
    this.meta = Extensions.extensions[extData.name];
}
Extension.prototype.addHook = function(hookName, api, func, options) {
    Extensions.addHook(hookName, this.meta.name, {
        func: func,
        api: api,
        priority: options && options.priority || 0
    });
}

DOext = new Extension({
    name: "digitalocean",
    version: "0.1.0",
    author: "Gadi Cohen <dragon@wastelands.net>",
    description: "Digital Ocean support for WMD"
});
