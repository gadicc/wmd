ext = new Extension({
    name: "digitalocean",
    version: "0.1.0",
    author: "Gadi Cohen <dragon@wastelands.net>",
    description: "Digital Ocean support for WMD"
});

DigitalOceanAPI = Npm.require('digitalocean-api');
