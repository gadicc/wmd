import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import DockerList from './containers/dockerList.jsx';

var wmd = new Extension({
  name: 'wmd-docker'
});

wmd.addTab('docker', "Docker", DockerList);
