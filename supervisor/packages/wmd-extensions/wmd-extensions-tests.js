// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by wmd-extensions.js.
import { name as packageName } from "meteor/wmd-extensions";

// Write your tests here!
// Here is an example.
Tinytest.add('wmd-extensions - example', function (test) {
  test.equal(packageName, "wmd-extensions");
});
