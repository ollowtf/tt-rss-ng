// модуль наблюдателя
var obs = (function() {

    return {
        sub: function(key, handler) {
            $("body").on(key, handler);
        },
        unsub: function(key) {
        	$("body").off(key);
        },
        pub: function(key,params) {
            $("body").trigger(key,params);
        }
    }

}());