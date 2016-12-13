define(['bootstrap', 'backbone', 'marionette', 'jquery', 'i18next',
		'i18nextXHRBackend', 'jqueryI18next', 'models/user', 'routers/router',
		'text!settings.json', 'jqUI', 'jqLayout', 'text!templates/layout.html'
	],
	function(Bootstrap, Backbone, Marionette, $, i18next, i18nextXHRBackend,
		jqueryI18next, User, AppRouter, AppSettings, jqUI, jqLayout, LayoutTemplate) {

		RSS = Marionette.Application.extend({

			initialize: function() {

				this.title = "App";
				console.info(this.title + ': start');
				// ---
				$.support.transition = false;
				// ---
				this.Views = {};
				// ---
				this.Settings = $.parseJSON(AppSettings);
				// ---
				this.User = new User({
					name: "User"
				}, {
					url: this.Settings.api
				});
				this.listenTo(this.User, 'change', this.loginStatus);
				this.listenTo(this.User, 'change:view', this.markCurrentView);

				this.AppRouter = new AppRouter(this);
				Backbone.history.start();

			}, // initialize

			loginStatus: function() {

				if (this.User.get('status') == 0) {

					// update user information
					// ---
					var userLang = this.User.get('lang');
					if (userLang != i18next.language) {
						i18next.changeLanguage(userLang, (err, t) => {
							if (err) {
								console.log(err);
							} else {
								this.init();
							}
						});
					} else {
						this.init();
					}

				} else {
					this.init();
				}


			}, // loginStatus
			init: function() {

				if (this.User.get('status') == 0) {

					// draw interface
					var initialRoute = this.InitialRoute;
					this.initialRoute = undefined;
					if (initialRoute != undefined) {
						if (initialRoute == "") {
							//this.AppRouter.navigate(Backbone.history.fragment, true);
							Backbone.history.loadUrl(Backbone.history.fragment);
						} else {
							this.AppRouter.navigate(initialRoute, true);
						}
					} else {
						this.AppRouter.navigate("", {
							trigger: true
						});
					}

				} else {

					this.AppRouter.navigate("login", {
						trigger: true
					});

				}
			},
			markCurrentView: function() {

					/*$("ul.nav > li").removeClass("active");
					var currentView = this.User.get('currentView');
					if (currentView != '') {
						$("#" + currentView).addClass("active");
					}*/

				} // markCurrentView
		});

		App = new RSS();
		// ---
		App.addRegions({
			// viewport: "#content",
			// sidebar: "#sidebar"
			center: "#layoutCenter",
			left: "#layoutLeft",
			right: "#layoutRight"
		});
		App.on('start', function() {

			var compiledTemplate = _.template(LayoutTemplate);
			$('body').html(compiledTemplate({}));
			// ---
			this.Layout = $('body').layout({
				defaults: {
					fxName: "none",
					spacing_closed: 14,
					initClosed: false,
					showDebugMessages: true,
					applyDefaultStyles: false
				},
				west: {
					paneSelector: '#layoutLeft',
					contentSelector: '.ui-layout-content',
					findNestedContent: true,
					resizable: true,
					slidable: true,
					closable: true,
					spacing_closed: 6,
					spacing_open: 6,
					togglerLength_closed: "20%",
					initClosed: false,
					initHidden: true
				},
				center: {
					paneSelector: '#layoutCenter',
					findNestedContent: true
				},
				east: {
					paneSelector: '#layoutRight',
					contentSelector: '.ui-layout-content',
					findNestedContent: true,
					resizable: true,
					slidable: true,
					closable: true,
					spacing_closed: 6,
					spacing_open: 6,
					togglerLength_closed: "40%",
					initClosed: false,
					initHidden: true
				}
			});
			console.info(this.title + '/layout: ok');

			// ---

			i18next
				.use(i18nextXHRBackend)
				.init({
					lng: "en",
					fallbackLng: "en",
					backend: {
						loadPath: 'i18n/{{lng}}.json'
					}
				}, () => {
					console.info(this.title + '/i18: ok');
					jqueryI18next.init(i18next, $, {
						tName: 't', // --> appends $.t = i18next.t
						i18nName: 'i18n', // --> appends $.i18n = i18next
						handleName: 'localize', // --> appends $(selector).localize(opts);
						selectorAttr: 'data-i18n', // selector for translating elements
					});
					// ---
					this.User.fetch();
				});

		});
		// ---
		App.start();

	});
