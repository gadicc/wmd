import Extension from 'meteor/wmd-services-app';
import AddServiceForm, { AddServiceFormFields, AddServiceFormInitialValues } from './components/addServiceForm';

var ext = new Extension({
  name: 'wmd-services-app-meteor'
});

ext.registerService({
  id: 'meteor',
  name: "Meteor",
  icon: "/packages/wmd-services-app-meteor/images/meteor-logo.svg",
  AddServiceForm,
  AddServiceFormFields,
  AddServiceFormInitialValues
//  Content: Info
});
