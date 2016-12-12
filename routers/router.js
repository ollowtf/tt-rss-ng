define(['require', 'backbone', 'jquery', 'underscore', 'models/tree',
	'collections/items'
], function(require, Backbone, $, _, FeedTree, Items) {

	function parseQueryString(queryString) {
		var params = {};
		if (queryString) {
			_.each(_.map(decodeURI(queryString).split(/&/g), function(el, i) {
				var aux = el.split('='),
					o = {};
				if (aux.length >= 1) {
					var val = undefined;
					if (aux.length == 2)
						val = aux[1];
					o[aux[0]] = val;
				}
				return o;
			}), function(o) {
				_.extend(params, o);
			});
		}
		return params;
	}

	var AppRouterClass = Backbone.Router.extend({
		initialize: function(options) {
			console.info("App/Router: init");
			this.App = options;
		},
		execute: function(callback, args, name) {

			var isLogged = (this.App.User.get('status') == 0);
			// check user status
			if (!isLogged) {

				if (name != 'login') {
					this.App.InitialRoute = Backbone.history.location.hash;
					/*this.navigate("login", {
						trigger : true
					});*/
					return false;
				}

			}

			// check App state
			if (isLogged) {

				if (!this.App.FeedTree) {
					this.App.InitialRoute = Backbone.history.location.hash;
					this.init();
					return false;
				}

				if (!this.App.Views.FeedTree || !this.App.Views.Control) {
					// do nothing until both views ready
					return false;
				}
			}

			console.log('App/Router: /' + name);
			// ---
			args.push(parseQueryString(args.pop()));
			if (callback) {
				callback.apply(this, args);
			}
		},

		routes: {
			'': 'init',
			'login': 'login',
			'logout': 'logout',
			'home': 'home',
			'view/:sid': 'view',
			'about': 'about'
		},

		restore: function() {

			if (this.App.InitialRoute) {

				this.navigate(this.App.InitialRoute, {
					trigger: true
				});
				this.App.InitialRoute = undefined;

			}

		},

		init: function(param) {

			// init FeedTree &
			if (!this.App.FeedTree) {

				this.App.FeedTree = new FeedTree({
					name: "FeedTree",
					session: this.App.User.get('session')
				}, {
					url: this.App.Settings.api
				});

				// ---

				this.App.Items = new Items({
					name: "FeedTree",
					url: this.App.Settings.api,
					session: this.App.User.get('session'),
					tree: this.App.FeedTree
				});

			}

			// ---

			if (!this.App.Views.FeedTree || !this.App.Views.Control) {

				// init sidebar
				if (!this.App.Views.FeedTree) {
					require(['views/feedtree'], (FeedTreeClass) => {

						// show sidebar
						this.App.Layout.show('west');
						// init sidebar
						this.App.Views.FeedTree = new FeedTreeClass({
							model: this.App.FeedTree,
							id: "FeedTreeView"
						});
						this.listenTo(this.App.Views.FeedTree, 'ready', this.restore);
						// ---
						this.App.left.show(this.App.Views.FeedTree, {
							preventDestroy: true
						});
						this.App.Layout.initContent("west");
						// ---
						this.App.FeedTree.fetch();

					});
				}

				if (!this.App.Views.Control) {
					require(['views/control'], (ControlClass) => {

						this.App.Views.Control = new ControlClass({
							app: this.App,
							tree: this.App.FeedTree,
							items: this.App.Items,
							id: "ControlView"
						});
						this.listenTo(this.App.Views.Control, 'ready', this.restore);
						// ---
						this.App.center.show(this.App.Views.Control, {
							preventDestroy: true
						});
						this.App.Layout.initContent("center");

					});
				}
			} else {
				// clear current node
				this.App.FeedTree.set('current', undefined);
			}

		},

		view: function(sid) {

			console.log("App/Router: activating " + sid);
			this.App.FeedTree.set('current', sid);

		},

		login: function() {

			require(['views/login'], function(LoginViewClass) {

				// hide sidebar
				this.App.Layout.hide('west');
				this.App.Layout.hide('east');
				// ---
				var LoginView = new LoginViewClass();
				this.App.center.show(LoginView, {
					preventDestroy: true
				});
				LoginView.start();

			});

		},

		logout: function() {
			this.App.User.set('status', 1);
			//$.post('/users/logout');
			this.navigate("login", {
				trigger: true
			});
		},

		home: function() {



		},

		/*statistics : function() {

			require(['views/statistics'], function (StatisticsViewClass) {

				if (!App.Views.StatisticsView) {
					App.Views.StatisticsView = new StatisticsViewClass();
				}
				// ---
				App.viewport.show(App.Views.StatisticsView, { preventDestroy: true });
				App.Views.StatisticsView.start();

			});

		},*/

		about: function() {

			this.App.center.empty({
				preventDestroy: true
			});
			// ...

		}
	});

	return AppRouterClass;

});
