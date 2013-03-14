
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

}

// -----------------------------------------------------
$(document).ready(function() {

    init();

});