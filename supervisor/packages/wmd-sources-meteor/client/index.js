import Extension from 'meteor/wmd-sources';
import Info from './components/info.jsx';

var ext = new Extension({
  name: 'wmd-sources-meteor'
});

ext.addSource({
  id: 'meteor',
  name: "Meteor Deploy",
  Content: Info
});
