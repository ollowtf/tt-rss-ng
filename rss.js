//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)



// -----------------------------------------------------
$(document).ready(function() {

    $.fx.off = true;
    // ---
    start();   

});

function start() {

    $.getJSON('settings.json').done(function(json) {
        if (json.user=="" || json.password=="") {
            loginbox(json,init,start);
        }else{
            login(json,init,start);    
        };
        
    }).fail(function() {
        // do something
    });
};

function loginbox(data,success,fail) {

    $.ajax({
        url: "login.html",
        success: function(answer,success,fail) {
            
            $("body").append(answer);
            $("#loginbox").dialog({
                dialogClass: "no-close",
                autoOpen: true,
                height: 100,
                width: 200,
                resizable: false,
                draggable: false,
                modal: true,
                position: {my: "left top",at: "left top"},
                create: function() {
                    $('#loginform').submit(function() {
                        data.user = $("#username").val();
                        data.password = $("#password").val();
                        login(data,init,start);
                        return(false);
                    });
                }
            });

        }
    });

};

function login(data, success, fail) {
    // пробуем получить sid
    $.post(data.api, $.toJSON({
            "op": "login",
            "user": data.user,
            "password": data.password,
            "sid": false
        })).done(function(answer) {
        // checking answer
        if (answer.status==0) {
            data.session = answer.content.session_id;
            (success)(data);
        }else{
            // show something
            (fail)();
        };
        
    }).fail(fail);
};

function init(data) {

    $('#loginbox').dialog('close');

    //
    // getting app html :)
    $.ajax({
        url: "app.html"
    }).done(function(answer) {
        $('body').html(answer);
        // ---
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

    });

}