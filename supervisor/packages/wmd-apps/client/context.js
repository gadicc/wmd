import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

const Apps = new Mongo.Collection('apps');
window.Apps = Apps;

Meteor.subscribe('apps');

export { Apps };

export default {
  Apps
}
