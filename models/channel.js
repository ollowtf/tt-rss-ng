define(['backbone'], function (Backbone) {
	
	var Channel = Backbone.Model.extend({
		idAttribute: "bare_id",
		sid: function() {
            return("c"+this.id);
        },
        isGroup: function() {
            return(false);
        }    
	});
	
	return Channel;
	
});