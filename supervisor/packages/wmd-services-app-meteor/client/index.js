import Extension from 'meteor/wmd-services-app';
import AddServiceForm from './containers/addServiceForm';

var ext = new Extension({
  name: 'wmd-services-app-meteor'
});

ext.registerService({
  id: 'meteor',
  name: "Meteor",
  icon: "/packages/wmd-services-app-meteor/images/meteor-logo.svg",
  AddServiceForm
//  Content: Info
});
