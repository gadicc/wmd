import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

var ext = new Extension({
  name: 'wmd-services'
});

var eh = new ExtensionHost('wmd-services');
var ee = eh.export();

export { ext };
export default ee;
