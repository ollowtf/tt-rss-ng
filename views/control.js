define(['backbone', 'jquery', 'text!templates/control.html', 'views/items-list',
		'views/items-pics', 'views/item-view'
	],
	function(Backbone, $, ControlTemplate, ItemsListClass, ItemsPicsClass,
		ItemViewClass) {

		// ---

		var ControlClass = Backbone.View.extend({

			template: ControlTemplate,
			initialize: function(options) {

				this.title = "Views/Control";
				console.info(this.title + ": ok");
				// ---
				this.views = {};
				this.currentView = undefined;
				this.registeredViews = [];
				// ---
				this.App = options.app;
				this.tree = options.tree; // ???
				this.items = options.items; // ???
				// ---
				this.listenTo(this.items, 'change:current', this.eCurrentNodeChanged);
				this.listenTo(this.items, 'reset', this.clear);
				// ---
				this.registerHotkeys();

			},
			events: {
				'click .btn[data-action="markFeed"]': 'markAsRead',
				'change [name="modeFilter"]': 'changeFilter',
				'change [name="modeView"]': 'changeView',
				'change [name="modeOrder"]': 'changeOrder'
			},
			render: function() {

				var compiledTemplate = _.template(this.template);
				this.$el.html(compiledTemplate({})).localize();
				return (this);

			},
			clear: function() {

				this.trigger('unfocus');

			},
			eCurrentNodeChanged: function(mNode) {

				console.log(this.title + ": node=" + mNode.sid());
				// ---
				this.current = mNode;
				this.currentItem = undefined;
				// ---
				this.trigger('unfocus'); // to clear ItemView
				// ---
				this.options = this.items.settings;
				// ---
				// set active view
				$("input[name=modeView]").removeAttr('checked').parent().removeClass(
					'active');
				$("input[name=modeView][data-view=" + this.options.view + "]").attr(
					'checked',
					'checked').parent().addClass('active');
				// ---
				// set active filter
				$("input[name=modeFilter]").removeAttr('checked').parent().removeClass(
					'active');
				$("input[name=modeFilter][data-filter=" + this.options.filter + "]").attr(
					'checked',
					'checked').parent().addClass('active');
				// ---
				// set active order
				$("input[name=modeOrder]").removeAttr('checked').parent().removeClass(
					'active');
				$("input[name=modeOrder][data-order=" + this.options.order + "]").attr(
					'checked',
					'checked').parent().addClass('active');
				// -------------------------
				this.setupDetailedView(true);

			},
			setupDetailedView: function(externalEvent) {

				var opts = this.options;
				var activeView = '';
				// -------------------------

				// init always
				if (!this.views.ItemView) {
					this.views.ItemView = new ItemViewClass({
						id: 'ItemView',
						app: this.App,
						items: this.items,
						control: this,
						mode: opts.view
					});
				} else {
					this.views.ItemView.setMode(opts.view);
				}
				// ---

				// check panes status
				this.checkWideMode(opts);

				// -------------------------

				if (opts.view == 'list' || opts.view == 'list-wide') {

					activeView = 'ItemsList';
					// -------------------------

					if (!this.views[activeView]) {

						this.views[activeView] = new ItemsListClass({
							id: 'ItemsList',
							items: this.items,
							control: this,
							mode: opts.view,
							itemView: this.views.ItemView
						});
						// ---
						this.listenTo(this.views[activeView], 'ready', this.eDetailedViewReady);
						this.listenTo(this.views[activeView], 'focus', this.eItemFocused);
						this.listenTo(this.views[activeView], 'unfocus', this.eItemUnfocused);
						// ---
						this.registeredViews.push(activeView);

					} else {
						this.views.ItemsList.setMode(opts.view);
					}
					// -------------------------

					// set $el for ItemView in wide mode
					if (opts.view == 'list-wide') {
						this.views.ItemView.setElement($(".ui-layout-content", $(
							"#layoutRight")));
					}

				}
				// ---
				if (opts.view == 'pics') {

					activeView = 'ItemsPics';
					// -------------------------

					if (!this.views[activeView]) {
						this.views[activeView] = new ItemsPicsClass({
							id: 'ItemsPics',
							items: this.items,
							control: this,
							itemView: this.views.ItemView
								// mode: opts.view,
								//itemView: this.views.ItemView
						});
						// ---
						this.listenTo(this.views[activeView], 'ready', this.eDetailedViewReady);
						this.listenTo(this.views[activeView], 'focus', this.eItemFocused);
						this.listenTo(this.views[activeView], 'unfocus', this.eItemUnfocused);
					}

				}

				// -------------------------

				if (this.currentView != activeView) {

					// pause view if exist
					if (this.currentView != undefined) {
						this.views[this.currentView].pause();
					}
					// ---
					this.currentView = activeView;
					// ---
					if (!this.views[this.currentView].active) {
						this.views[this.currentView].resume();
					}
					// ---
					this.views[this.currentView].setElement($(".ui-layout-content", this.$el));
					this.views[this.currentView].render();

				} else {

					if (externalEvent) {
						this.startFetching();
					}

				}

			},
			checkWideMode: function() {

				var opts = this.options;
				// -------------------------
				var wideMode = (opts.view == "list-wide");
				if (wideMode == true) {

					// set east-pane size as half of list-wide
					var fullWidth = this.App.Layout.state.container.innerWidth;
					//var centerWidth = this.App.Layout.state.center.innerWidth;
					if (this.App.Layout.state.east.isHidden) {
						this.App.Layout.sizePane('east', fullWidth / 2);
						this.App.Layout.show('east');
					}

				} else {
					this.App.Layout.hide('east');
				}

			},
			eDetailedViewReady: function() {

				console.debug(this.title + ": detailed view ready");
				this.trigger('clear');
				this.startFetching();

			},
			startFetching: function() {
				// -------------------------
				this.items.fetch();
				// -------------------------
			},
			markAsRead: function() {

				this.items.eMarkFeedAsRead();

			},
			changeFilter: function(e) {
				console.log(this.title + ":  filter changed to " + e.target.dataset.filter);
				this.items.eChangeFilter(e.target.dataset.filter);
			},
			changeView: function(e) {

				console.log(this.title + ":  view changed to " + e.target.dataset.view);
				// ---
				this.items.eChangeView(e.target.dataset.view);
				// ---
				this.trigger('unfocus');
				this.options.view = e.target.dataset.view;
				this.setupDetailedView(false);
				// ---
				if (this.currentItem != undefined) {
					this.trigger('display');
				}

			},
			changeOrder: function(e) {

				console.log(this.title + ":  order changed to " + e.target.dataset.order);
				// ---
				this.items.eChangeOrder(e.target.dataset.order);

			},
			eItemFocused: function(item) {

				this.currentItem = item;
				this.trigger('focus', item);

			},
			eItemUnfocused: function(item) {

				this.currentItem = undefined;

			},
			registerHotkeys: function() {

				$(document).bind("keypress", (e) => {
					this.hotkeyEvent(e);
				});

			},
			hotkeyEvent: function(e) {

				switch (e.key) {
					case 'j':
						this.trigger('/nextItem');
						break;
					case 'k':
						this.trigger('/prevItem');
						break;
					default:
						return;
				}

			}
		});

		return ControlClass;

	});
