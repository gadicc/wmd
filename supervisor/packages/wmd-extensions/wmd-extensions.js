import ExtensionHost from 'extensions';

var eh = new ExtensionHost('wmd');

eh.registerHook('tabs');

var ee = eh.export();

var tabs = [];
ee.prototype.addTab = function(key, name, content) {
  tabs.push({ key, name, content });
}

export { tabs };
export default ee;
