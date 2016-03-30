import ExtensionHost from 'extensions';

var eh = new ExtensionHost('wmd');

eh.registerHook('tabs');

var ee = eh.export();

var tabs = [];
ee.prototype.addTab = function(key, name, content) {
  tabs.push({ key, name, content });
}

ee.prototype.getWorkDir = function() {
  return '/tmp';
}

ee.prototype.getStorageDir = function() {
  return '/tmp';
}

ee.prototype.appContext = function() {
  return require('/client/configs/context.js').default();
};

export { tabs };
export default ee;
