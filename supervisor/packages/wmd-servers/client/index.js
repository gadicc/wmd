import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import ServerList from './containers/serverList.jsx';

var wmd = new Extension({
  name: 'wmd-iaas'
});

wmd.addTab('servers', "Servers", ServerList);


