
// ---
var currentArticles = {};
var feedMap = {};

function createFeedTree() {

    
}



function getFeedLoadContentRule(catId) {
    if(catId == "130" || catId == "129") {
        return(1);
    } else {
        return(0);
    }

}



function displayHeaders(currentNodeId, headers) {

    if(catId == "130" || catId == "129") {
        displayHeaderImages(currentNodeId, headers);
        console.log("Image mode");
    } else {
        displayHeaderList(currentNodeId, headers);
    }

}

function setCurrentUnread() {
    markAsUnread(getCurrentRow());
}

function markAsRead(row) {
    row.filter('.unread').removeClass('unread').addClass('read');
    // make ajax call
    $.post(apiURL, {
        "op": "updateArticle",
        "seq": seq,
        "article_ids": getArticleId(row),
        "mode": 0,
        "field": 2
    }, function(data) {
        //alert("ok");
    });
}

function markAsUnread(row) {
    row.filter('.read').removeClass('read').addClass('unread');
    // make ajax call
    $.post(apiURL, {
        "op": "updateArticle",
        "seq": seq,
        "article_ids": getArticleId(row),
        "mode": 1,
        "field": 2
    }, function(data) {
        //alert("ok");
    });
}

function loadNextArticle() {
    cR = getCurrentRow();
    if(cR == 0) {
        // начинаем с первой
        firstRow = $('.row').first();
        firstRow.addClass("current");
        loadArticle(getArticleId(firstRow));

    } else {
        hideArticle(cR);
        nextRow = cR.next();
        nextRow.addClass("current");
        markAsRead(nextRow);
        if(nextRow.hasClass('nav')) {
            // это кнопка "далее"
            // ..
        } else {
            loadArticle(getArticleId(nextRow));
        }
    }
}

function loadPrevArticle() {
    cR = getCurrentRow();
    if(cR == 0) {
        // начинаем с первой
        lastRow = $('.row').last();
        if(lastRow.hasClass('nav')) {
            lastRow = lastRow.prev();
        }
        lastRow.addClass("current");
        loadArticle(getArticleId(lastRow));

    } else {
        hideArticle(cR);
        prevRow = cR.prev();
        prevRow.addClass("current");
        if(prevRow.hasClass('nav')) {
            // это кнопка "далее"
            // ..
        } else {
            loadArticle(getArticleId(prevRow));
        }
    }
}



function getCurrentNode() {

    var currentNodeId = $('#sidebar').jstree('get_selected').attr('id');
    var catId = Number(currentNodeId.slice(1));

    if(currentNodeId[0] == "f") {
        isCat = 0;
    } else if(currentNodeId[0] == "c") {
        isCat = 1;
    }
    return({
        'id': currentNodeId,
        'isCat': isCat
    });
}

function markCurrentFeedAsRead() {

    currentNodeStruct = getCurrentNode();
    isCat = currentNodeStruct.isCat;
    id = currentNodeStruct.id;

}

// -----------------------------------------------------

function init() {

    $.fx.off = true;

    // ---
    // инициализируем макет
    // --------------------------------------------
    appLayout = $('body').layout({
        defaults: {
            fxName: "none",
            spacing_closed: 14,
            initClosed: false,
            showDebugMessages: true,
            applyDefaultStyles: false
        },
        west: {
            paneSelector: '.ui-layout-west',
            resizable: true,
            slidable: true,
            closable: true,
            spacing_closed: 6,
            spacing_open: 6,
            togglerLength_closed: "20%",
            initClosed: false
        }
    });

    // инициализируем контроллер
    controller.init();
    // инициализируем представление дерева
    treeView.init();
    // инициализируем модель
    dataManager.init();



    // --------------------------------------------
    /*
    var msgMap = {
    "/getFeedTree":             function (event) {getFeedTree();},
    "/activateFeed":            function (event,currentFeedId) {activateFeed(currentFeedId);},
    "/loadFeed":                function (event,currentFeedId,sinceId) {loadFeed(currentFeedId,sinceId);},
    "/loadArticle":             function (event,articleId) {loadArticle(articleId);},
    "/loadNextArticle":         function (event) {loadNextArticle();},
    "/loadPrevArticle":         function (event) {loadPrevArticle();},
    "/scrollToTop":             function (event) {scrollToTop();},
    "/setCurrentUnread":        function (event) {setCurrentUnread();},
    "/openCurrentLink":         function (event) {openCurrentLink();},
    "/markCurrentFeedAsRead":   function (event) {markCurrentFeedAsRead();}
    }
    _.each(msgMap, function(value,key){
    $("body").on(key, value );
    });

    */

    //login();
    // --------------------------------------------
}

// -----------------------------------------------------
$(document).ready(function() {

    init();

});