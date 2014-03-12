if (Meteor.isClient) {
	Router.map(function() {
		this.route('db', {
			layoutTemplate: 'sidebar-layout',
			action: function() {
				this.render();
				this.render('dbSidebar', { to: 'sidebar' });
			}
		});
		this.route('dbNew', {
			path: '/db/new',
			layoutTemplate: 'sidebar-layout',
			action: function() {
				this.render('dbNew');
				this.render('dbSidebar', { to: 'sidebar' });
			}
		});
		this.route('dbInfo', {
			path: 'db/:db',
			layoutTemplate: 'sidebar-layout',
			waitOn: subAll,
			data: function() {
				return {
					db: Databases.findOne({
						$or: [
							{_id: this.params.db},
							{name: this.params.db}
						]
					})
				}
			},
			action: function() {
				this.render('dbSidebar', { to: 'sidebar' });
				this.render();
			}
		});
	});


	Template.db.dbs = function() {
		return Databases.find();
	}
	Template.dbSidebar.dbs = Template.db.dbs;
	Template.dbSidebar.rendered = activeLinks;


}