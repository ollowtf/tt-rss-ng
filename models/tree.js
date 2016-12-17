define(['backbone', 'underscore', 'collections/channels', 'models/channel',
	'collections/groups', 'models/group'
], function(Backbone, _, Channels, Channel, Groups, Group) {

	function parseTreeData(tree, treeNode, parentGroup) {
		if (treeNode.items == undefined) {
			return;
		}
		// ---
		_(treeNode.items).each((item) => {
			if (item.type == "category") {

				if (item.bare_id < 0) {
					return;
				}

				// category
				var newGroup = new Group(item);
				newGroup.set('sid', newGroup.sid());
				newGroup.set("parent", parentGroup);
				tree.attributes.groups.add(newGroup);
				parseTreeData(tree, item, newGroup);

			} else {

				// feed
				var newChannel = new Channel(item);
				newChannel.set('sid', newChannel.sid());
				newChannel.set("parent", parentGroup);
				newChannel.set("delta", 0);
				tree.attributes.channels.add(newChannel);

			}
		});
	}

	function parseCounters(tree, data) {

		var countersChanged = false;
		_(data).each((item) => {
			if (item.kind == 'cat') {
				model = tree.get('groups').get(item.id);
			} else {
				model = tree.get('channels').get(item.id);
			};
			if (model != undefined) {

				var updateCounter = false;
				// ---
				var lastUnreadUpdate = model.get('lastUnreadUpdate');
				if (lastUnreadUpdate != undefined) {
					if (lastUnreadUpdate < tree.lastCountersUpdate) {
						updateCounter = true;
					}
				} else {
					updateCounter = true;
				}
				// -------------------------
				if (updateCounter) {
					if (model.get("unread") != item.counter) {

						countersChanged = true;
						model.set("unread", item.counter);

					};
				}

			};
		});
		return (countersChanged);

	};

	function isCategory(feedId) {
		if (feedId[0] == "c") {
			return (false);
		} else if (feedId[0] == "g") {
			return (true);
		}
	};

	// -------------------------------------

	var FeedTree = Backbone.Model.extend({
		url: '/url',
		initialize: function(atrributes, options) {

			this.title = "App/FeedTree";
			options || (options = {});
			this.url = options.url;
			// ---
			atrributes || (atrributes = {});
			// ---
			this.set({
				session: atrributes.session,
				groups: new Groups(),
				channels: new Channels(),
				raw: {},
				seq_uc: 0
			});
			// ---
			this.countersFetched = false;
			// ---
			this.listenTo(this.get('channels'), 'change:counter', this.onCounterChange);
			this.listenTo(this.get('groups'), 'change:counter', this.onCounterChange);

		},
		fetch: function() {

			$.post(this.url, JSON.stringify({
					"op": "getFeedTree",
					"include_empty": false,
					"sid": this.get('session')
				}))
				.done((answer) => {

					if (answer.status == 0) {

						this.attributes.raw = answer.content.categories;
						this.parse(this.attributes.raw);
						// ---
						this.trigger('reset');

					};

				});
		},
		parse: function(data) {

			parseTreeData(this, data);
			// ---
			console.debug(this.title + ": ready");
			// ---
			this.startPolling();
			this.updateCounters();

		},
		startPolling: function() {

			console.debug(this.title + ": counters polling enabled.");
			var ucTimer = setInterval(this.updateCounters.bind(this), 5 * 60000);
			this.set('ucTimer', ucTimer, {
				silent: true
			});

		},
		stopPolling: function() {

			console.info(this.title + ": Counter polling disabled.");
			clearInterval(this.get('ucTimer'));
			this.set('ucTimer', undefined, {
				silent: true
			});

		},
		updateCounters: function() {

			var seq = this.get('seq_uc');
			seq++;
			this.set('seq_uc', seq, {
				silent: true
			});
			// ---
			this.lastCountersUpdate = Date.now();
			// ---
			$.post(this.url, JSON.stringify({
					"op": "getCounters",
					"seq": seq,
					"output_mode": "fc",
					"sid": this.get('session')
				}))
				.done((answer) => {

					if (answer.status == 0) {

						if (answer.seq == this.get('seq_uc')) {

							console.debug(this.title + ': counters fetched.');
							this.parseCounters(answer.content);

						}

					};

				});


		},
		parseCounters: function(data) {

			parseCounters(this, data)
				// ---
			this.countersFetched = true;

		},
		onCounterChange: function(model) {

			console.debug(this.title + ": 'change:counter' " + model.sid());
			this.trigger('change:counter', model);

		},
		getCurrentNodeBySid: function(sid) {
			var collection = "";
			if (isCategory(sid)) {
				collection = 'groups';
			} else {
				collection = 'channels';
			}
			return (this.get(collection).findWhere({
				sid: sid
			}));
		}
	});

	// isLoggedIn

	return FeedTree;

});
