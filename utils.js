//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

var utils = (function() {

	return {

		id: function(feedId) {
			return(Number(feedId.slice(1)));
		},
		isCategory: function(feedId) {
			if(feedId[0] == "c") {
				return(false);
			} else if(feedId[0] == "g") {
				return(true);
			}
		},
		articleId: function(row) {
			return(Number(row.attr("id").slice(4)));
		},
		integerDivision: function(x, y){
    		return x/y>>0
		}
	}
}());