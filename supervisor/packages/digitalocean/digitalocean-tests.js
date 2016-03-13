// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by digitalocean.js.
import { name as packageName } from "meteor/digitalocean";

// Write your tests here!
// Here is an example.
Tinytest.add('digitalocean - example', function (test) {
  test.equal(packageName, "digitalocean");
});
