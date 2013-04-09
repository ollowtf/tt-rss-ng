//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

// модуль наблюдателя
var obs = (function() {

    return {
        sub: function(key, handler) {
            $("body").on(key, handler);
        },
        unsub: function(key,handler) {
        	$("body").off(key,handler);
        },
        pub: function(key,params) {
            $("body").trigger(key,params);
        }
    }

}());