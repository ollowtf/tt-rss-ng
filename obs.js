//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

// observer
var obs = (function() {

    // for multi subs
    var msubs={};

    return {
        sub: function(key, handler) {
            $("body").on(key, handler);
        },
        unsub: function(key,handler) {
        	$("body").off(key,handler);
        },
        msub: function(id,struct) {
            msubs[id]=struct;
            _.each(struct,function(handler,key){
                $("body").on(key, handler);
            });
        },
        munsub: function(id) {
            _.each(msubs[id],function(handler,key){
                $("body").off(key,handler);
            });
        },
        pub: function(key,params) {
            $("body").trigger(key,params);
        }
    }

}());