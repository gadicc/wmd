if (Meteor.isClient) {
	activeLinks = function() {
		var current = Router.current();
		if (!current)
			return;

		$('a.active')
			.removeClass('active')
			.parent().removeClass('active');
		$('a[href="'+current.path+'"]')
			.addClass('active')
			.parent().addClass('active');
	};
	Deps.autorun(activeLinks);
	Handlebars.registerHelper('activeLinks', function() {
		activeLinks();
	});
}