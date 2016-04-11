import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

var ext = new Extension({
  name: 'wmd-services-app'
});

var eh = new ExtensionHost('wmd-services-app');
var ee = eh.export();

export { ext };
export default ee;
