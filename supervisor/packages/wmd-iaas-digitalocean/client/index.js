import Extension from 'meteor/wmd-iaas';

var ext = new Extension({
  name: 'wmd-iaas-digitalocean'
});

ext.addProvider({
  id: 'digitalocean',
  name: "Digital Ocean"
});
