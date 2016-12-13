define(['backbone'], function(Backbone) {

	var Item = Backbone.Model.extend({
		idAttribute: "id",
		sid: function() {
			return ("i" + this.id);
		}
	});

	return Item;

});
