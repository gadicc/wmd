ext.plugin('appInstall', 'github', '0.1.0', function(data) {
		console.log('appInstall');
		console.log(data);
		var ghRepo = ghRepos.findOne(data.repo.serviceId);
		var user = Meteor.users.findOne(ghRepo.userId);
		var token = user.services.github.accessToken;
		var username = 'moo';

		// https://github.com/blog/1270-easier-builds-and-deployments-using-git-over-https-and-oauth
		var url = ghRepo.repo.clone_url.replace(/(^https?:\/\/)/,
			'$1' + token + ':x-oauth-basic@');

		data.env.REPO = data.repo.name;
		data.env.URL = url;
});