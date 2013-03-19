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