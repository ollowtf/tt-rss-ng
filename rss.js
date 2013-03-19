//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

function init(data) {

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
    dataManager.init(data);

}

// -----------------------------------------------------
$(document).ready(function() {

    $.getJSON('settings.json',function(json) {
        init(json);
    });

});