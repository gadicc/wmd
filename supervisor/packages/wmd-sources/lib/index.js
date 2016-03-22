import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

var ext = new Extension({
  name: 'wmd-sources'
});

var eh = new ExtensionHost('wmd-sources');
var ee = eh.export();

ee.prototype.getStorageDir = Extension.prototype.getStorageDir;
ee.prototype.getWorkDir = Extension.prototype.getWorkDir;

export { ext };
export default ee;
