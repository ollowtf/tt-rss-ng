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
			this.ItemsToMarkRead = [];
			this.ItemsToMarkUnread = [];
			this.ItemsToMarkStar = [];
			this.ItemsToMarkUnstar = [];
			// ---
			this.listenTo(this.tree, 'change:current', this.eChangeCurrent);
			// ---
			this.listenTo(this, 'change:unread', this.eStateUnread);
			// ---
			// init regular check of state changes every 2 seconds
			setInterval(this.checkState.bind(this), 5 * 1000);

		},
		fetch: function() {
			this.fetchItems();
		},
		fetchItems: function() {

			this.seq_gh++;
			// ---
			var viewMode = this.settings.mode;
			if (this.settings.mode == 'all') {
				viewMode = 'all_articles';
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
				"view_mode": viewMode,
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
			//read Settings
			this.settings = {
				mode: 'adaptive',
				order: 'reversed', // reversed = new first/ direct = old first
			};
			// ---
			//this.trigger('clear'); // ?
			this.trigger('change:current', this.current);
			// ---
			// this.fetch();

		},
		eStateUnread: function(item) {

			console.log(this.title + ": unread state changed for item " + item.sid());
			if (item.get('unread')) {
				this.ItemsToMarkUnread.push(item.id);
			} else {
				this.ItemsToMarkRead.push(item.id);
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
					sq.push({
						state: 'unread',
						value: false,
						ids: _.difference(this.ItemsToMarkRead, this.ItemsToMarkUnread).join()
					});
					// ---
					sq.push({
						state: 'unread',
						value: true,
						ids: _.difference(this.ItemsToMarkUnread, this.ItemsToMarkRead).join()
					});
					// ---
					this.ItemsToMarkRead.length = 0;
					this.ItemsToMarkUnread.length = 0;

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
