import ExtensionHost from 'extensions';

var eh = new ExtensionHost('wmd');

eh.registerHook('tabs');

var ee = eh.export();

var tabs = [];
ee.prototype.addTab = function(key, name, content) {
  tabs.push({ key, name, content });
}

var modules = [];
ee.prototype.loadModule = function(module) {
  modules.push(module);
};

ee.prototype.getWorkDir = function() {
  return '/tmp';
};

ee.prototype.getStorageDir = function() {
  return '/tmp';
};

ee.prototype.appContext = function() {
  return require('/client/configs/context.js').default();
};

export { tabs, modules };
export default ee;
