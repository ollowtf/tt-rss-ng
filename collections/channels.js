define(['backbone', 'models/channel'], function(Backbone, Channel) {

	var Channels = Backbone.Collection.extend({
		model: Channel,
		initialize: function(models, options) {
			this.url = "/channels";
			this.on('change:unread', this.onChangeUnread);
		},
		onChangeUnread: function(model) {
			//console.debug("FeedTree/Channels: 'change:counter' " + model.sid());
			this.trigger('change:counter', model);
		}
	});

	return Channels;

});
