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
                Categories[value.id] = value;
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
                Feeds[value.id] = value;
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
        });
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
        console.log("%s: headers response for seq %d, %d",_module, jdata.seq ,_.size());
        console.log("%s: %d items", _module);
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

    function _setArticleRead(event, id) {
        /*// находим в кеше
        article = feedCache[id];
        if (article.unread) {
            article.unread = false;
            // ---
            // обновляем счетчики
            feed = Feeds[article.feed_id];
            feed.unread--;
            cat = Categories[feed.cat_id];
            cat.unread--;
            obs.pub('/setUnreadCount', ['f' + feed.id, feed.unread]);
            obs.pub('/setUnreadCount', ['c' + cat.id, cat.unread]);
            // ---
            apiCall({
                "op": "updateArticle",
                "seq": seq,
                "article_ids": id,
                "mode": 0,
                "field": 2
            }, function(data) {
                // ...
            });
        };*/
    };

    function _setArticleUnread(event, id) {
        /*// find article in cache
        article = feedCache[id];
        if (!article.unread) {
            article.unread = true;
            // ---
            // updating counters
            feed = Feeds[article.feed_id];
            feed.unread++;
            cat = Categories[feed.cat_id];
            cat.unread++;
            obs.pub('/setUnreadCount', ['f' + feed.id, feed.unread]);
            obs.pub('/setUnreadCount', ['c' + cat.id, cat.unread]);
            // ---
            apiCall({
                "op": "updateArticle",
                "seq": seq,
                "article_ids": id,
                "mode": 1,
                "field": 2
            }, function(data) {
                // ...
            });
        };*/
    };

    function _markFeedAsRead(event, feed) {
        /*// определяем параметры фида
        var isCategory = utils.isCategory(feed);
        var id = utils.id(feed);
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
        };
        // отправляем запрос
        apiCall({
            "op": "catchupFeed",
            "seq": seq,
            "feed_id": id,
            "is_cat": isCategory
        }, function(data) {
            // ...
        });*/
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

    function _toggleReadState(event, articles) {
        // находим в кэше, группируем по признаку
        var markAsRead = {};
        var markAsUnread = {};
        var mapCC = {};
        var mapCF = {};
        _.each(articles, function(id) {
            var article = feedCache[id];
            var feedId = article.feed_id;
            var catId = Feeds[article.feed_id].cat_id;
            // ---
            if (mapCF[feedId] == undefined) {
                mapCF[feedId] = 0;
            };
            if (mapCC[catId] == undefined) {
                mapCC[catId] = 0;
            };
            // ---
            if (article.unread) {
                article.unread = false;
                mapCF[feedId]--;
                mapCC[catId]--;
                markAsRead[id] = true;
            } else {
                article.unread = true;
                mapCF[feedId]++;
                mapCC[catId]++;
                markAsUnread[id] = true;
            };
        });
        // ---
        _.each(mapCF, function(value, key) {
            if (value != 0) {
                var currentFeed = Feeds[key];
                var unread = Number(currentFeed.unread) + value;
                currentFeed.unread = unread;
                obs.pub('/setUnreadCount', ['f' + key, unread]);
            };
        });
        // ---
        _.each(mapCC, function(value, key) {
            if (value != 0) {
                var currentCat = Categories[key];
                var unread = Number(currentCat.unread) + value;
                currentCat.unread = unread;
                obs.pub('/setUnreadCount', ['c' + key, unread]);
            };
        });

        // выполняем запросы на изменение
        if (_.size(markAsRead) != 0 || _.size(markAsUnread) != 0) {

            var ops = {
                'op': 'updateArticle',
                'seq': seq,
                'article_ids': '',
                'mode': 0,
                'field': 2
            };

            if (_.size(markAsRead) != 0) {
                ops.mode = 0;
                ops.article_ids = _.keys(markAsRead).join();
                apiCall(ops);
            };
            // ---
            if (_.size(markAsUnread) != 0) {
                ops.mode = 1;
                ops.article_ids = _.keys(markAsUnread).join();
                apiCall(ops);
            };

        };

    };

    function _toggleStarState(event, articles) {
        var markAsStar = {};
        var markAsUnstar = {};
        // ---
        _.each(articles, function(id) {
            var article = feedCache[id];
            // ---
            if (article.marked) {
                article.marked = false;
                markAsUnstar[id] = true;
            } else {
                article.marked = true;
                markAsStar[id] = true;
            };
        });

        // выполняем запросы на изменение
        if (_.size(markAsStar) != 0 || _.size(markAsUnstar) != 0) {

            var ops = {
                'op': 'updateArticle',
                'seq': seq,
                'article_ids': '',
                'mode': 0,
                'field': 0
            };

            if (_.size(markAsStar) != 0) {
                ops.mode = 1;
                ops.article_ids = _.keys(markAsStar).join();
                apiCall(ops);
            };
            // ---
            if (_.size(markAsUnstar) != 0) {
                ops.mode = 0;
                ops.article_ids = _.keys(markAsUnstar).join();
                apiCall(ops);
            };

        };
    };

    function _toggleShareState(event, articles) {
        var markAsShare = {};
        var markAsUnshare = {};
        // ---
        _.each(articles, function(id) {
            var article = feedCache[id];
            // ---
            if (article.published) {
                article.published = false;
                markAsUnshare[id] = true;
            } else {
                article.published = true;
                markAsShare[id] = true;
            };
        });

        // выполняем запросы на изменение
        if (_.size(markAsShare) != 0 || _.size(markAsUnshare) != 0) {

            var ops = {
                'op': 'updateArticle',
                'seq': seq,
                'article_ids': '',
                'mode': 0,
                'field': 1
            };

            if (_.size(markAsShare) != 0) {
                ops.mode = 1;
                ops.article_ids = _.keys(markAsShare).join();
                apiCall(ops);
            };
            // ---
            if (_.size(markAsUnshare) != 0) {
                ops.mode = 0;
                ops.article_ids = _.keys(markAsUnshare).join();
                apiCall(ops);
            };

        };
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
                '/setArticleRead': this.setArticleRead,
                '/setArticleUnread': this.setArticleUnread,
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
        getArticle: function(id) {
            article = items.get(id);
            if (article.content == '') {
                _getArticle(id);
                return (false);
            } else {
                return (article);
            };
        },
        setSource: _setSource,
        setArticleRead: _setArticleRead,
        setArticleUnread: _setArticleUnread,
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