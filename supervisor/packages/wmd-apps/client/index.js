import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import ServerList from './containers/appList.jsx';

var wmd = new Extension({
  name: 'wmd-apps'
});

wmd.addTab('apps', "Apps", ServerList);
