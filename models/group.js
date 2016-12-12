define(['backbone'], function (Backbone) {
	
	var Group = Backbone.Model.extend({
		idAttribute: "bare_id",
        sid: function() {
            return("g"+this.id);
        },
        isGroup: function() {
            return(true);
        }  
	});
	
	return Group;
	
});