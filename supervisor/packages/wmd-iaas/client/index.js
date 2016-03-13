import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import iaasList, { addProvider } from './containers/iaasList.jsx';

var wmd = new Extension({
  name: 'wmd-iaas'
});

wmd.addTab('iaas', "IAAS", iaasList);




var eh = new ExtensionHost('wmd-iaas');
var ee = eh.export();

ee.prototype.addProvider = addProvider;

export default ee;
