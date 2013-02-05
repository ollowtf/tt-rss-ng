var utils = (function() {

	return {

		id: function(feedId) {
			return(Number(feedId.slice(1)));
		},
		isCategory: function(feedId) {
			if(feedId[0] == "f") {
				return(0);
			} else if(feedId[0] == "c") {
				return(1);
			}
		},
		articleId: function(row) {
			return(Number(row.attr("id").slice(4)));
		}
	}
}());