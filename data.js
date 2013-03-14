// модуль для модели - назовём её dataManager
var dataManager = (function() {

    // private:
    var _module = 'DataManager';
    // ---
    var apiURL = 'proxy.php';
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
    var Categories = {};
    var Feeds = {};
    // ---
    var feedCache = {};

    function version() {

        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                'op': 'getVersion'
            },
            success: onVersion
        });
    }

    function onVersion(data) {
        serverVersion = $.parseJSON(data).content.version;
        console.log(_module + ": successful version request. Version=%s", serverVersion);
        // тут мы проверяем, что версия нам подходит
        login();
    }

    function login() {

        // пробуем получить sid
        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                'op': 'login',
                'user': 'admin',
                'password': ''
            },
            success: onLogin
        });

    }

    function onLogin(data) {
        sid = $.parseJSON(data).content.session_id;
        console.log(_module + ": successful login request. SID=%s", sid);
        // вызываем функцию получения категорий и фидов
        updateFeeds();
    }

    function updateFeeds() {

        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                'op': 'getCategories'
            },
            success: function(data) {
                rCategories = $.parseJSON(data).content;
                _.each(rCategories, function(value) {
                    Categories[value.id] = value;
                });
                isCategoriesLoaded = true;
                console.log(_module + ": successful categories request.");
                if (isCategoriesLoaded == true & isFeedsLoaded == true) {
                    feedsUpdated();
                }
            }
        });

        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                'op': 'getFeeds',
                'cat_id': -3
            },
            success: function(data) {
                rFeeds = $.parseJSON(data).content;
                _.each(rFeeds, function(value) {
                    Feeds[value.id] = value;
                });
                isFeedsLoaded = true;
                console.log(_module + ": successful feeds request.");
                if (isCategoriesLoaded == true & isFeedsLoaded == true) {
                    feedsUpdated();
                }
            }
        });
    }

    function feedsUpdated() {
        // на этот вызов должно среагировать представление
        console.log(_module + ": publish feeds update");
        // вызываем функцию получения
        obs.pub("/feedsUpdated");
    }

    function _getHeaders(params) {

        seq++;
        console.log(_module + ': headers request for seq %d', seq);
        console.log(params);
        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                "op": "getHeadlines",
                "seq": seq,
                "feed_id": params.id,
                "is_cat": params.isCategory,
                "skip": params.skip,
                "limit": 50,
                "view_mode": params.view_mode,
                "show_excerpt": 1,
                "show_content": params.show_content,
                "include_attachments": 0
            },
            success: onHeadersResponse
        });
    }

    function onHeadersResponse(data) {
        jdata = $.parseJSON(data);
        rseq = jdata.seq;
        headers = jdata.content;
        console.log(_module + ': headers response for seq %d', rseq);
        // записываем в кеш
        _.each(headers, function(value) {
            value['seq'] = rseq;
            feedCache[value.id] = value;
        });
        console.log(_module + ': cached %d headers', _.size(headers));
        console.log(_module + ': %d headers in cache', _.size(feedCache));
        // публикуем заголовки
        obs.pub('/displayHeaders', rseq);
    };

    function _getArticle(id) {
        // ajax request
        seq++;
        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                "op": "getArticle",
                "seq": seq,
                "article_id": id
            },
            success: onArticleResponse
        });
    }

    function onArticleResponse(data) {
        jdata = $.parseJSON(data);
        article = jdata.content;
        feedCache[article.id] = article;
        obs.pub('/displayArticle', article.id);
    };

    function _setArticleRead(event, id) {
        // находим в кеше
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
            $.post(apiURL, {
                "op": "updateArticle",
                "seq": seq,
                "article_ids": id,
                "mode": 0,
                "field": 2
            }, function(data) {
                // ...
            });
        };
    };

    function _setArticleUnread(event, id) {
        // находим в кеше
        article = feedCache[id];
        if (!article.unread) {
            article.unread = true;
            // ---
            // обновляем счетчики
            feed = Feeds[article.feed_id];
            feed.unread++;
            cat = Categories[feed.cat_id];
            cat.unread++;
            obs.pub('/setUnreadCount', ['f' + feed.id, feed.unread]);
            obs.pub('/setUnreadCount', ['c' + cat.id, cat.unread]);
            // ---
            $.post(apiURL, {
                "op": "updateArticle",
                "seq": seq,
                "article_ids": id,
                "mode": 1,
                "field": 2
            }, function(data) {
                // ...
            });
        };
    };

    function _markFeedAsRead(event, feed) {
        // определяем параметры фида
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
        $.post(apiURL, {
            "op": "catchupFeed",
            "seq": seq,
            "feed_id": id,
            "is_cat": isCategory
        }, function(data) {
            // ...
        });
    };

    function _getCounters() {
        $.ajax({
            type: 'POST',
            url: apiURL,
            data: {
                "op": "getCounters",
                "seq": seq,
                "output_mode": "fc"
            },
            success: _onCountersUpdate
        });
    };

    function _onCountersUpdate(data) {
        var jdata = $.parseJSON(data);
        var content = jdata.content;
        // ---
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
        });
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
        _.each(mapCF, function(value,key) {
            if (value != 0) {
                var currentFeed = Feeds[key];
                var unread = currentFeed.unread+value;
                currentFeed.unread = unread;
                obs.pub('/setUnreadCount', ['f' + key, unread]);
            };
        });
        // ---
        _.each(mapCC, function(value,key) {
            if (value != 0) {
                var currentCat = Categories[key];
                var unread = currentCat.unread+value;
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
                $.post(apiURL,ops);
            };
            // ---
            if (_.size(markAsUnread) != 0) {
                ops.mode = 1;
                ops.article_ids = _.keys(markAsUnread).join();
                $.post(apiURL,ops);
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
                $.post(apiURL,ops);
            };
            // ---
            if (_.size(markAsUnstar) != 0) {
                ops.mode = 0;
                ops.article_ids = _.keys(markAsUnstar).join();
                $.post(apiURL,ops);
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
                $.post(apiURL,ops);
            };
            // ---
            if (_.size(markAsUnshare) != 0) {
                ops.mode = 0;
                ops.article_ids = _.keys(markAsUnshare).join();
                $.post(apiURL,ops);
            };

        };
    };

    // public:
    return {

        // инициализация
        init: function() {

            // подписываемся на интересующие нас события
            obs.sub("/getHeaders", this.onGetHeaders);
            obs.sub('/setArticleRead', this.setArticleRead);
            obs.sub('/setArticleUnread', this.setArticleUnread);
            obs.sub('/markFeedAsRead', this.markFeedAsRead);
            obs.sub('/getCounters', this.getCounters);
            // ---
            obs.sub('/toggleReadState', this.toggleReadState);
            obs.sub('/toggleStarState', this.toggleStarState);
            obs.sub('/toggleShareState', this.toggleShareState);

            // запускаем цепочку инициализации
            console.log(_module + ": initializing ...");
            version();

        },
        test: function() {
            console.log(_module + ": successful test call. Server version %s", serverVersion);
        },
        // служебное, получение версии
        getServerVerion: function() {
            return (serverVersion);
        },
        // служебное, получение версии
        getSid: function() {
            return (sid);
        },
        getCategories: function() {
            return (Categories);
        },
        getFeeds: function() {
            return (Feeds);
        },
        onGetHeaders: function(event, data) {
            _getHeaders(data);
        },
        getHeaders: function(sequence) {
            return (_.where(feedCache, {
                'seq': sequence
            }));
        },
        getArticle: function(artId) {
            article = feedCache[artId];
            if (article.content == '') {
                _getArticle(artId);
                return (false);
            } else {
                return (article);
            };
        },
        clearCache: function() {
            feedCache = {};
        },
        setArticleRead: _setArticleRead,
        setArticleUnread: _setArticleUnread,
        markFeedAsRead: _markFeedAsRead,
        getCounters: _getCounters,
        // ---
        toggleReadState: _toggleReadState,
        toggleStarState: _toggleStarState,
        toggleShareState: _toggleShareState
    }

}());