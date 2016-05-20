Package.describe({
  name: 'wmd-apps',
  version: '0.0.1',
  summary: '',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3-beta.12');
  //api.use('ecmascript');
  api.use('gadicc:ecmascript-hot@2.0.0-beta.3');
  api.use('wmd-extensions');
  api.use('wmd-services');
  api.use('gadicc:async-composable-tasks@0.0.1');
  api.mainModule('client/index.js', 'client');
  api.addFiles('client/components/appList.css', 'client');
  api.mainModule('server/index.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wmd-iaas');
  api.mainModule('wmd-iaas-tests.js');
});
