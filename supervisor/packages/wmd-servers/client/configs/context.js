import { Mongo } from 'meteor/mongo';

const Servers = new Mongo.Collection('servers');
const ServersSub = Meteor.subscribe('servers');

export { Servers, ServersSub };
export default { Servers, ServersSub };
