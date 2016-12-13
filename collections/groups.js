define(['backbone', 'models/group'], function(Backbone, Group) {

	var Groups = Backbone.Collection.extend({
		model: Group,
		initialize: function(models, options) {
			this.url = "/groups",
				this.on('change:unread', this.onChangeUnread);
		},
		onChangeUnread: function(model) {
			//console.debug("FeedTree/Groups: 'change:counter' " + model.sid());
			this.trigger('change:counter', model);
		}
	});

	return Groups;

});
