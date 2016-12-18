define(['backbone', 'models/item'], function(Backbone, Item) {

	var Items = Backbone.Collection.extend({
		model: Item,
		idAttribute: 'id',
		initialize: function(options) {

			this.title = "App/Items";
			// ---
			this.session = options.session;
			this.name = options.name;
			this.url = options.url;
			this.tree = options.tree;
			this.settings = {};
			this.seq_gh = 0; // getHeadlines seq
			this.seq_cs = 0; // change state seq
			// ---
			this.EndOfList = false;
			// ---
			this.ItemsToMarkRead = [];
			this.ItemsToMarkUnread = [];
			this.ItemsToMarkStar = [];
			this.ItemsToMarkUnstar = [];
			// ---
			this.listenTo(this.tree, 'change:current', this.eChangeCurrent);
			// ---
			this.listenTo(this, 'change:unread', this.eStateUnread);
			this.listenTo(this, 'change:marked', this.eStateStar);
			// ---
			// init regular check of state changes every 2 seconds
			setInterval(this.checkState.bind(this), 5 * 1000);

		},
		fetch: function() {
			this.fetchItems();
		},
		fetchItems: function() {

			if (!this.tree.countersFetched) {
				console.log(this.title + ": counters not fetched. waiting...");
				setTimeout(this.fetchItems.bind(this), 1 * 1000);
				return;
			}

			this.seq_gh++;
			// ---
			var filterMode = this.settings.filter;
			if (this.settings.filter == 'all') {
				filterMode = 'all_articles';
			}
			var orderMode = 'feed_dates';
			if (this.settings.order == 'direct') {
				orderMode = 'date_reverse';
			}
			// ---

			var opts = {
				"op": "getHeadlines",
				"sid": this.session,
				"seq": this.seq_gh,
				"feed_id": this.current.id,
				"limit": 50,
				"skip": this.length,
				"is_cat": this.current.isGroup(),
				"show_excerpt": true,
				"show_content": true,
				"view_mode": filterMode,
				"order_by": orderMode,
				"include_nested": true
			};

			$.post(this.url, JSON.stringify(opts))
				.done((result) => {
					this.parse(result);
				});

		},
		parse: function(result) {

			if (result.status == 0) {

				if (result.seq = this.seq_gh) {
					this.parseItems(result.content);
					console.log(this.title + ": items fetched");
					this.trigger('fetched');
				}

			} else {
				// do something
				// ...
			}

		},
		parseItems: function(items) {

			_.each(items, (item) => {

				var newItem = new Item(item);
				newItem.set({
					visible: false,
					focused: false
				});
				this.add(newItem);

			});

			// check if it is end of list
			// TODO: make constant for articles limit
			if (items.length == 0 || items.length < 50) {
				this.EndOfList = true;
			}

		},
		eChangeCurrent: function() {

			// event from FeedTree
			var sid = this.tree.get('current');
			console.log(this.title + ": node=" + sid);
			// ---
			// think: check if new node is child for current
			this.reset(null);
			// ---
			this.current = this.tree.getCurrentNodeBySid(sid);
			// ---
			this.EndOfList = false;
			// ---
			//read Settings
			var defaultSettings = {
				view: 'list',
				filter: 'adaptive',
				order: 'reversed', // reversed = new first/ direct = old first
			};
			var localSettings = localStorage.getItem(sid);
			if (localSettings == undefined) {
				localSettings = {};
			} else {
				try {
					localSettings = JSON.parse(localSettings);
				} catch (e) {
					localSettings = {};
				} finally {
					// ---
				}

			}
			this.settings = _.defaults(localSettings, defaultSettings);
			this.saveSettings();
			// ---
			this.trigger('change:current', this.current);

		},
		saveSettings: function() {

			localStorage.setItem(this.current.sid(), JSON.stringify(this.settings));

		},
		eChangeFilter: function(filter) {

			this.settings.filter = filter;
			this.saveSettings();
			// ---
			this.reset(null);
			this.EndOfList = false;
			// ---
			this.trigger('clear');
			this.fetch();

		},
		eChangeOrder: function(order) {

			this.settings.order = order;
			this.saveSettings();
			// ---
			this.reset(null);
			this.EndOfList = false;
			// ---
			this.trigger('clear');
			this.fetch();

		},
		eChangeView: function(view) {

			this.settings.view = view;
			this.saveSettings();

		},
		eStateUnread: function(item) {

			console.log(this.title + ": unread state changed for item " + item.sid());
			var step = 0;
			if (item.get('unread')) {
				this.ItemsToMarkUnread.push(item.id);
				step = +1;
			} else {
				this.ItemsToMarkRead.push(item.id);
				step = -1;
			}
			// ---

			// update counters
			var udate = Date.now() + (5 * 1000); // now() + 5 sec
			var channel = this.tree.get('channels').get(item.get('feed_id'));
			var branch = [channel];
			var initialElement = channel;
			while (initialElement.get('parent') != undefined) {
				initialElement = initialElement.get('parent');
				branch.push(initialElement);
			}
			// ---
			_(branch).each((element) => {
				element.set('unread', element.get('unread') + step);
				element.set('lastUnreadUpdate', udate);
			});

		},
		eStateStar: function(item) {

			console.log(this.title + ": star state changed for item " + item.sid());
			if (item.get('marked')) {
				this.ItemsToMarkStar.push(item.id);
			} else {
				this.ItemsToMarkUnstar.push(item.id);
			}

		},
		checkState: function() {

			var sq = []; // state queue
			// Unread state
			var qmRead = this.ItemsToMarkRead.length;
			var qmUnread = this.ItemsToMarkUnread.length;
			if (qmRead != 0 || qmUnread != 0) {

				if (qmRead != 0 && qmUnread == 0) {
					sq.push({
						state: 'unread',
						value: false,
						ids: this.ItemsToMarkRead.join()
					});
					this.ItemsToMarkRead.length = 0;
				}
				// ---
				if (qmRead == 0 && qmUnread != 0) {
					sq.push({
						state: 'unread',
						value: true,
						ids: this.ItemsToMarkUnread.join()
					});
					this.ItemsToMarkUnread.length = 0;
				}
				// ---
				if (qmRead != 0 && qmUnread != 0) {

					// use underscore's difference()
					var idsToPush = _.difference(this.ItemsToMarkRead, this.ItemsToMarkUnread);
					if (idsToPush.length != 0) {
						sq.push({
							state: 'unread',
							value: false,
							ids: idsToPush.join()
						});
					}
					// ---
					idsToPush = _.difference(this.ItemsToMarkUnread, this.ItemsToMarkRead);
					if (idsToPush.length != 0) {
						sq.push({
							state: 'unread',
							value: true,
							ids: idsToPush.join()
						});
					}
					// ---
					this.ItemsToMarkRead.length = 0;
					this.ItemsToMarkUnread.length = 0;

				}

			}
			// ---
			// Star state
			var qmStar = this.ItemsToMarkStar.length;
			var qmUnstar = this.ItemsToMarkUnstar.length;
			if (qmStar != 0 || qmUnstar != 0) {

				if (qmStar != 0 && qmUnstar == 0) {
					sq.push({
						state: 'star',
						value: true,
						ids: this.ItemsToMarkStar.join()
					});
					this.ItemsToMarkStar.length = 0;
				}
				// ---
				if (qmStar == 0 && qmUnstar != 0) {
					sq.push({
						state: 'star',
						value: false,
						ids: this.ItemsToMarkUnstar.join()
					});
					this.ItemsToMarkUnstar.length = 0;
				}
				// ---
				if (qmStar != 0 && qmUnstar != 0) {

					// use underscore's difference()
					var idsToPush = _.difference(this.ItemsToMarkStar, this.ItemsToMarkUnstar);
					if (idsToPush.length != 0) {
						sq.push({
							state: 'star',
							value: true,
							ids: idsToPush.join()
						});
					}
					// ---
					idsToPush = _.difference(this.ItemsToMarkUnstar, this.ItemsToMarkStar);
					if (idsToPush.length != 0) {
						sq.push({
							state: 'star',
							value: false,
							ids: idsToPush.join()
						});
					}
					// ---
					this.ItemsToMarkStar.length = 0;
					this.ItemsToMarkUnstar.length = 0;

				}

			}

			// -------------------------
			_(sq).each((element) => {

				this.seq_cs++;
				// ---
				var opts = {
					"op": "updateArticle",
					"sid": this.session,
					"seq": this.seq_cs,
				};
				// ---
				if (element.state == 'unread') {
					opts["field"] = 2;
					if (element.value) {
						opts["mode"] = 1;
					} else {
						opts["mode"] = 0;
					}
					opts["article_ids"] = element.ids;
				}
				if (element.state == 'star') {
					opts["field"] = 0;
					if (element.value) {
						opts["mode"] = 1;
					} else {
						opts["mode"] = 0;
					}
					opts["article_ids"] = element.ids;
				}
				// ---
				$.post(this.url, JSON.stringify(opts))
					.done((result) => {
						console.log(result);
					});

			});

		}


	});

	return Items;

});
