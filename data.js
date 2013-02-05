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
                if(isCategoriesLoaded == true & isFeedsLoaded == true) {
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
                if(isCategoriesLoaded == true & isFeedsLoaded == true) {
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
        if(article.unread) {
            article.unread = false;
            // ---
            // обновляем счетчики
            feed = Feeds[article.feed_id];
            feed.unread--;
            cat = Categories[feed.cat_id];
            cat.unread--;
            obs.pub('/setUnreadCount',['f'+feed.id,feed.unread]);
            obs.pub('/setUnreadCount',['c'+cat.id,cat.unread]);
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
        if(!article.unread) {
            article.unread = true;
            // ---
            // обновляем счетчики
            feed = Feeds[article.feed_id];
            feed.unread++;
            cat = Categories[feed.cat_id];
            cat.unread++;
            obs.pub('/setUnreadCount',['f'+feed.id,feed.unread]);
            obs.pub('/setUnreadCount',['c'+cat.id,cat.unread]);
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

    // public:
    return {

        // инициализация
        init: function() {

            // подписываемся на интересующие нас события
            obs.sub("/getHeaders", this.onGetHeaders);
            obs.sub('/setArticleRead', this.setArticleRead);
            obs.sub('/setArticleUnread', this.setArticleUnread);

            // запускаем цепочку инициализации
            console.log(_module + ": initializing ...");
            version();

        },
        test: function() {
            console.log(_module + ": successful test call. Server version %s", serverVersion);
        },
        // служебное, получение версии
        getServerVerion: function() {
            return(serverVersion);
        },
        // служебное, получение версии
        getSid: function() {
            return(sid);
        },
        getCategories: function() {
            return(Categories);
        },
        getFeeds: function() {
            return(Feeds);
        },
        onGetHeaders: function(event, data) {
            _getHeaders(data);
        },
        getHeaders: function(sequence) {
            return(_.where(feedCache, {
                'seq': sequence
            }));
        },
        getArticle: function(artId) {
            article = feedCache[artId];
            if(article.content == '') {
                _getArticle(artId);
                return(false);
            } else {
                return(article);
            };
        },
        clearCache: function() {
            feedCache = {};
        },
        setArticleRead: _setArticleRead,
        setArticleUnread: _setArticleUnread
    }

}());