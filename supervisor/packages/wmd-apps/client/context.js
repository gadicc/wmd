import { Meteor } from 'meteor/meteor'; 
import { Mongo } from 'meteor/mongo';

Apps = new Mongo.Collection('apps');
Meteor.subscribe('apps');

export { Apps };

export default {
  Apps
}
