ext = new Extension({
    name: "wmd-github",
    version: "0.1.0",
    author: "Gadi Cohen <dragon@wastelands.net>",
    description: "Github support for WMD"
});

ghRepos = new Meteor.Collection('github_repos');
