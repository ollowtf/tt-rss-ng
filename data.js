//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

// модуль для модели - назовём её dataManager
var dataManager = (function() {

    // private:
    var _module = 'DataManager';
    // ---
    var apiURL = '';
    var user = '';
    var password = '';
    // ---
    var seq = 10;
    // ---
    var serverVersion;
    var apiLevel;
    var sid;
    // ---
    var isCategoriesLoaded = false;
    var isFeedsLoaded = false;
    // ---
    var Feeds = {};
    var Categories = {};
    // ---
    var feedCache = {};

    // ---------------------------------------------
    
    var tmplGroup = Backbone.Model.extend({
        sid: function() {
            return("g"+this.id);
        },
        isGroup: function() {
            return(true);
        }
    });
    var tmplGroups = Backbone.Collection.extend({
        model: tmplGroup
    });
    var groups = new tmplGroups();
    groups.on("add", function(group) {
        console.log("%s: added group: %s", _module,group.get("title"));
    })
    // ---
    var tmplChannel = Backbone.Model.extend({
        sid: function() {
            return("c"+this.id);
        },
        isGroup: function() {
            return(false);
        }
    });
    var tmplChannels = Backbone.Collection.extend({
        model: tmplChannel
    });
    var channels = new tmplChannels();
    // ---
    var tmplItem = Backbone.Model.extend({});
    var tmplItems = Backbone.Collection.extend({
        model: tmplChannel
    });
    var items = new tmplItems();

    // ---------------------------------------------
    
    var currentSource = '';
    var currentViewMode = '';
    var params = {};

    // ------------------------------------------------

    function apiCall(apiParams, success) {
        apiParams.sid = sid;
        console.info("%s: API call", _module);
        console.log(apiParams);
        $.post(apiURL, $.toJSON(apiParams), success);
    }

    function updateFeeds() {

        apiCall({
            "op": "getCategories"
        }, function(data) {
            console.info(_module + ": successful categories request.");
            _.each(data.content, function(value) {
                groups.add(value);
            });
            isCategoriesLoaded = true;
            if (isCategoriesLoaded == true & isFeedsLoaded == true) {
                feedsUpdated();
            }
        });

        apiCall({
            "op": "getFeeds",
            "cat_id": -3
        }, function(data) {
            console.info(_module + ": successful feeds request.");
            _.each(data.content, function(value) {
                channels.add(value);
            });
            isFeedsLoaded = true;
            if (isCategoriesLoaded == true & isFeedsLoaded == true) {
                feedsUpdated();
            }
        });
    }

    function feedsUpdated() {
        channels.each(function(channel){
            channel.set("group",groups.get(channel.get("cat_id")));
            channel.set("delta",0);
        });
       /* groups.each(function(group) {
            group.set("delta",0);
        });*/
        console.log(_module + ": feeds loaded");
        obs.pub("/feedsUpdated");
    }

    function _getHeaders() {
        apiCall({
            "op": "getHeadlines",
            "seq": seq++,
            "feed_id": params.id,
            "is_cat": params.isCategory,
            "skip": _.size(feedCache),
            "limit": 50,
            "view_mode": currentViewMode,
            "show_excerpt": true,
            "show_content": params.show_content,
            "include_attachments": false
        }, _getHeadersSuccess);
    }

    function _getHeadersSuccess(jdata) {
        console.log("%s: headers response seq=%d, count=%d",_module, jdata.seq ,_.size(jdata.content));
        // ------------------------------------------------
        _.each(jdata.content, function(value) {
            var newItem = new tmplItem(value);
            newItem.set("channel",channels.get(value.feed_id));
            newItem.set("visible",false);
            items.add(newItem);
        });
        // ------------------------------------------------
        obs.pub('/displayHeaders');
    };

    function _getArticle(id) {
        // ajax request
        apiCall({
            "op": "getArticle",
            "seq": seq++,
            "article_id": id
        },onArticleResponse);
    }

    function onArticleResponse(jdata) {
        article = jdata.content;
        feedCache[article.id] = article;
        obs.pub('/displayArticle', article.id);
    };

    function _markFeedAsRead(event, feed) {
        var isCategory = utils.isCategory(feed);
        var id = utils.id(feed);
        /*// определяем параметры фида
       
        // для каждой статьи из кеша устанавливаем флаг прочитанного
        _.each(feedCache, function(element) {
            element.unread = false;
        });
        // обновляем счётчики
        if (isCategory) {
            currentCategory = Categories[id];
            currentCategory.unread = 0;
            obs.pub('/setUnreadCount', ['c' + id, currentCategory.unread]);
            // обнуляем непрочитанные у подчинённых фидов
            feeds = _.filter(Feeds, function(element) {
                return element.cat_id == id;
            });
            _.each(feeds, function(element) {
                element.unread = 0;
                obs.pub('/setUnreadCount', ['f' + element.id, element.unread]);
            });
        } else {
            currentFeed = Feeds[id];
            unread = currentFeed.unread;
            currentFeed.unread = 0;
            obs.pub('/setUnreadCount', ['f' + id, currentFeed.unread]);
            // ---
            currentCategory = Categories[currentFeed.cat_id];
            currentCategory.unread = currentCategory.unread - unread;
            obs.pub('/setUnreadCount', ['c' + currentCategory.id, currentCategory.unread]);
        };*/
        // ------------------------------------------------
        apiCall({
            "op": "catchupFeed",
            "seq": seq,
            "feed_id": id,
            "is_cat": isCategory
        }, function(data) {
            // ...
        });
    };

    function _updateCounters() {
        console.log("%s: updating counters...",_module);
        apiCall({
            "op": "getCounters",
            "seq": seq,
            "output_mode": "fc"
        },_onCountersUpdate);
    };

    function _onCountersUpdate(jdata) {
        /*var content = jdata.content;
        _.each(content, function(element) {
            if (element.kind == 'cat') {
                if (Categories[element.id] != undefined) {
                    if (Categories[element.id].unread != element.counter) {
                        Categories[element.id].unread = element.counter;
                        if (element.id > 0) {
                            obs.pub('/setUnreadCount', ['c' + element.id, element.counter]);
                        };
                    };
                };

            } else {
                if (Feeds[element.id] != undefined) {
                    if (Feeds[element.id].unread != element.counter) {
                        Feeds[element.id].unread = element.counter;
                        obs.pub('/setUnreadCount', ['f' + element.id, element.counter]);
                    };
                };
            };
        });*/
    };

    function _toggleItemsState(field,ids) {
        var groupTrue = [];
        var groupFalse = [];
        var requestTemplates = [];
        _.each(ids,function(id) {
            var item = items.get(id);
            if (item.get(field)==true) {
                groupFalse.push(id);
            }else{
                groupTrue.push(id);
            };
        });
        // ------------------------------------------------
        if (_.size(groupTrue) != 0) {
            requestTemplates.push({
                "ids": groupTrue,
                "value": true
            });
        };
        if (_.size(groupFalse) != 0) {
            requestTemplates.push({
                "ids": groupFalse,
                "value": false
            });
        };
        // ------------------------------------------------
        _.each(requestTemplates,function(request) {
            var dbfield=-1;
            if (field=="unread") {
                dbfield=2;
            }else if (field=="star") {
                dbfield=0;
            }else if (field=="share") {
                dbfield=1;
            };
            var dbops={
                "op": "updateArticle",
                "seq": seq++,
                "article_ids": request.ids.join(),
                "mode": request.value ? 1 : 0,
                "field": dbfield
            };
            // ---
            apiCall(dbops, function() {_changeItemsState(field,request.ids,request.value)});
        });
    };

    function _changeItemsState(field, ids, value) {
        console.info("%s: changing %s status for ids %s to %s",_module, field, ids.join(),value);
        var changedChannels = {};
        _.each(ids,function(id) {
            var item = items.get(id);
            item.set(field,value);
            // ---
            if (field=="unread") {
                var channel = item.get("channel");
                changedChannels[channel.id]=channel;
                var delta = value ? 1: -1;
                channel.set("unread",channel.get("unread")+ delta);
                channel.set("delta", channel.get("delta")+delta);
            };
        });
        // ---
        if (field=="unread") {
            _refreshCounters(changedChannels);
        };
    };

    function _refreshCounters(changedChannels) {
        var deltasum=0;
        var changedGroups = {};
        // ------------------------------------------------
        _.each(changedChannels,function(channel) {
            obs.pub('/setUnreadCount', [channel]);
            var delta = channel.get("delta");
            channel.set("delta",0);
            var group = channel.get("group");
            changedGroups[group.id]=group;
            group.set("unread",group.get("unread")+ delta);
            //group.set("delta", group.get("delta")+delta);
            deltasum=+delta;
        });
        // ------------------------------------------------
        _.each(changedGroups,function(group) {
            obs.pub('/setUnreadCount', [group]);
            //group.set("delta",0);
        });
    };

    function _toggleReadState(event, ids) {
        _toggleItemsState("unread",ids);
    };

    function _toggleStarState(event, ids) {
        _toggleItemsState("star",ids);
    };

    function _toggleShareState(event, articles) {
        _toggleItemsState("share",ids);
    };

    // clear model's cache
    function _clearCache() {
        items.reset();
    };

    function _setSource(source, ViewMode) {
        if (source != currentSource) {
            items.reset();
            currentSource = source;
        };
        if (ViewMode != currentViewMode) {
            currentViewMode = ViewMode;
        };
        // ---
        // запрашиваем заголовки
        params = {
            skip: 0,
            id: utils.id(currentSource),
            isCategory: utils.isCategory(currentSource),
            view_mode: currentViewMode,
            show_content: true,
        };

    };

    function _onModeChange(event, mode) {
        currentViewMode = mode;
        _clearCache();
    }

    // public:
    return {

        // инициализация
        init: function(settings) {

            apiURL = settings.api;
            user = settings.user;
            password = settings.password;
            sid = settings.session;

            // subs
            obs.msub(_module, {
                '/getHeaders': this.onGetHeaders,
                '/markFeedAsRead': this.markFeedAsRead,
                '/updateCounters': this.updateCounters,
                '/viewModeChange': this.onModeChange,
                '/toggleReadState': this.toggleReadState,
                '/toggleStarState': this.toggleStarState,
                '/toggleShareState': this.toggleShareState
            });

            // init
            console.log("%s: initializing ...", _module);
            updateFeeds();

        },
        // version request
        getServerVerion: function() {
            return (serverVersion);
        },
        // session request
        getSid: function() {
            return (sid);
        },
        getGroups: function() {
            return(groups);
        },
        // obsoleted
        getCategories: function() {
            return (Categories);
        },
        getChannels: function() {
            return(channels);
        },
        getItems: function() {
            return(items);
        },
        // obsoleted
        getFeeds: function() {
            return (Feeds);
        },
        onGetHeaders: function(event, data) {
            _getHeaders(data);
        },
        getHeaders: function() {
            return (items.where({"visible": false}));
        },
        // rename to "getItem"
        getItem: function(id) {
            article = items.get(id);
            if (article.content == '') {
                _getArticle(id);
                return (false);
            } else {
                return (article);
            };
        },
        setSource: _setSource,
        markFeedAsRead: _markFeedAsRead,
        updateCounters: _updateCounters,
        // ---
        onModeChange: _onModeChange,
        // ---
        toggleReadState: _toggleReadState,
        toggleStarState: _toggleStarState,
        toggleShareState: _toggleShareState
    }

}());