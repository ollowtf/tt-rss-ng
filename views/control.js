define(['backbone', 'jquery', 'text!templates/control.html', 'views/items-list',
		'views/item-view'
	],
	function(Backbone, $, ControlTemplate, ItemsListClass, ItemViewClass) {

		// ---

		var ControlClass = Backbone.View.extend({

			template: ControlTemplate,
			initialize: function(options) {

				this.title = "Views/Control";
				console.info(this.title + ": ok");
				// ---
				this.views = {};
				this.currentView = undefined;
				// ---
				this.App = options.app;
				this.tree = options.tree; // ???
				this.items = options.items; // ???
				// ---
				this.listenTo(this.items, 'change:current', this.eCurrentNodeChanged);
				this.listenTo(this.items, 'reset', this.clear);
				// ---
				// this.listenTo(this.items, 'focus', this.eItemFocused);
				// this.listenTo(this.items, 'unfocus', this.eItemUnfocused);

			},
			events: {
				'click .btn[data-action="markFeed"]': 'markAsRead',
				'click [data-action="test"]': 'test',
				'change [name="modeFilter"]': 'changeFilter',
				'change [name="modeView"]': 'changeView'
			},
			render: function() {

				var compiledTemplate = _.template(this.template);
				this.$el.html(compiledTemplate({})).localize();
				return (this);

			},
			clear: function() {

				//this.$("#items").html('');
				//this.trigger('clear');

			},
			eCurrentNodeChanged: function(mNode) {

				this.current = mNode;
				this.currentItem = undefined;
				// ---
				console.log(this.title + ": node=" + mNode.sid());
				this.trigger('unfocus'); // to clear ItemView
				// ---
				// read settings for current
				this.options = {
					view: "list",
					filter: "unread"
				};
				// ---
				$("input[name=modeView]").removeAttr('checked').parent().removeClass(
					'active');
				$("input[name=modeView][data-view=" + this.options.view + "]").attr(
					'checked',
					'checked').parent().addClass('active');
				// ---
				this.setupDetailedView(true);

			},
			setupDetailedView: function(externalEvent) {

				var opts = this.options;
				// -------------------------

				if (opts.view == "list" || opts.view == "list-wide") {

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
					if (!this.views.ItemsList) {
						this.views.ItemsList = new ItemsListClass({
							id: 'ItemsList',
							items: this.items,
							control: this,
							mode: opts.view,
							itemView: this.views.ItemView
						});
						// ---
						this.listenTo(this.views.ItemsList, 'ready', this.eDetailedViewReady);
						this.listenTo(this.views.ItemsList, 'focus', this.eItemFocused);
						this.listenTo(this.views.ItemsList, 'unfocus', this.eItemUnfocused);
					} else {
						this.views.ItemsList.setMode(opts.view);
					}
					// ---
					this.checkWideMode(opts);
					// ---
					if (this.currentView != this.views.ItemsList) {
						this.views.ItemsList.setElement($(".ui-layout-content", this.$el));
						this.views.ItemsList.render();
						this.currentView = this.views.ItemsList;
					} else {
						if (externalEvent) {
							this.startFetching();
						}
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
					// ---
					this.views.ItemView.setElement($(".ui-layout-content", $(
						"#layoutRight")));

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
				//console.log("View/Content: Mark as read");
			},
			changeFilter: function(e) {
				console.log(this.title + ":  filter changed to " + e.target.dataset.filter);
			},
			changeView: function(e) {

				console.log(this.title + ":  view changed to " + e.target.dataset.view);
				this.trigger('unfocus');
				this.options.view = e.target.dataset.view;
				this.setupDetailedView(false);
				// ---
				if (this.currentItem != undefined) {
					this.trigger('display');
				}

			},
			eItemFocused: function(item) {

				this.trigger('focus', item);

			},
			eItemUnfocused: function(item) {

				//this.trigger('unfocus');

			}
		});

		return ControlClass;

	});
