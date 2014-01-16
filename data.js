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
    var FeedTree={};
    var Feeds = {};
    var Categories = {};
    // ---
    var utime = new Date();
    // ---
    var feedCache = {};

    // ---------------------------------------------
    
    var tmplGroup = Backbone.Model.extend({
        idAttribute: "bare_id",
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
        console.log("%s: added group: %s", _module,group.get("name"));
    })
    // ---
    var tmplChannel = Backbone.Model.extend({
        idAttribute: "bare_id",
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

    function getFeedTree() {
        apiCall({
            "op": "getFeedTree"
        }, function(data){
            console.info(_module + ": successful tree request.");
            FeedTree = data.content.categories;
            processFeedTree();
        });
    }

    function processFeedTree() {

        // recursive
        parseTreeData(FeedTree);
        // ---
        console.log(_module + ": feeds loaded");
        obs.pub("/feedsUpdated");
        obs.pub("/updateCounters");
    }

    function parseTreeData(treeNode,parentGroup) {
        if (treeNode.items == undefined) {
            return;
        }
        // ---
        _.each(treeNode.items, function(item){
            if (item.type != undefined) {
                // category
                var newGroup = new tmplGroup(item);
                newGroup.set("parent",parentGroup);
                groups.add(newGroup);
                parseTreeData(item, newGroup);
                // ---
            }else{
                // feed
                var newChannel = new tmplChannel(item);
                newChannel.set("parent",parentGroup);
                newChannel.set("delta",0);
                channels.add(newChannel);
            }
        });
    }

    // ---

    function _getHeaders() {
        
        var skip=0;
        if ((currentViewMode == "adaptive") || (currentViewMode == "unread")) {
            skip = _.size(items.where({"unread": true}));
        }else{
            skip = _.size(items);
        }

        apiCall({
            "op": "getHeadlines",
            "seq": seq++,
            "feed_id": params.id,
            "is_cat": params.isCategory,
            "skip": skip,
            "limit": 50,
            "view_mode": currentViewMode,
            "show_excerpt": true,
            "show_content": params.show_content,
            "include_attachments": false,
            "include_nested": true
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
        utime = new Date();
        apiCall({
            "op": "getCounters",
            "seq": seq,
            "output_mode": "fc"
        }, function(data) {
            _onCountersUpdate(data.content, utime);
        });
    };

    function _onCountersUpdate(content, rtime) {
        if (rtime != utime) {
            return;
        }
        var model = {};
        _.each(content, function(item) {
            if (item.kind == 'cat') {
                model = groups.get(item.id);
            } else {
                model = channels.get(item.id);
            };
            if (model != undefined) {
                if (model.get("unread") != item.counter) {
                    model.set("unread", item.counter);
                    model.set("utime", utime);
                    obs.pub('/setUnreadCount', [model]);
                };
            };
        });
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
                utime = new Date();
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
            apiCall(dbops, 
                function() {
                    _changeItemsState(utime,field,request.ids,request.value)
                });
        });
    };

    function _changeItemsState(rtime,field, ids, value) {
        console.info("%s: changing %s status for ids %s to %s",_module, field, ids.join(),value);
        var updateUnread = true;
        if (rtime != utime) {
            updateUnread = false;
        }
        var changedChannels = {};
        _.each(ids,function(id) {
            var item = items.get(id);
            item.set(field,value);
            // ---
            if (field=="unread" && updateUnread) {
                var channel = item.get("channel");
                changedChannels[channel.id]=channel;
                var delta = value ? 1: -1;
                channel.set("unread",channel.get("unread")+ delta);
                channel.set("delta", channel.get("delta")+delta);
            };
        });
        // ---
        if (field=="unread" && updateUnread) {
            _refreshCounters(changedChannels);
        };
    };

    function _refreshCounters(changedChannels) {
        var changedGroups = {};
        _.each(changedChannels,function(channel) {
            
            //channel.set("useq",rseq);
            obs.pub('/setUnreadCount', [channel]);
            var delta = channel.get("delta");
            channel.set("delta",0);
            if (channel.get("parent") != undefined) {
                var cg = channel.get("parent");
                while (cg != undefined) {
                    changedGroups[cg.id]=cg;
                    cg.set("unread",cg.get("unread")+ delta);
                    // ---
                    cg = cg.get("parent");
                }
            }
        });
        // ------------------------------------------------
        _.each(changedGroups,function(group) {
            obs.pub('/setUnreadCount', [group]);
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
        items.reset();
        if (source != currentSource) {
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
                '/start': this.start,
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
        },
        start: function() {
            getFeedTree();
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
        getFeedTree: function() {
            return (FeedTree);
        },
        onGetHeaders: function(event, data) {
            _getHeaders(data);
        },
        getHeaders: function() {
            return (items.where({"visible": false}));
        },
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