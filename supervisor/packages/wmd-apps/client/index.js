import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import ServerList from './containers/appList.jsx';

var ext = new Extension({
  name: 'wmd-apps'
});

ext.addTab('apps', "Apps", ServerList);

export default ext;
