import Extension from 'meteor/wmd-services';

var ext = new Extension({
  name: 'wmd-services-app-meteor'
});

ext.registerService({
  id: 'meteor',
  name: "Meteor",
  category: 'app',
  icon: "/packages/wmd-services-app-meteor/images/meteor-logo.svg"
//  Content: Info
});
