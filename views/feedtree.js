define(['backbone', 'underscore', 'jquery', 'text!templates/sidebar.html',
		'text!templates/sidebar-item.html'
	],
	function(Backbone, _, $, SidebarTemplate, SidebarItemTemplate) {

		function createNodes(parentDiv, treeNode, data) {
			if (treeNode.items == undefined) {
				return;
			}
			// ---
			var model = {};
			_(treeNode.items).each((item) => {

				if (item.type == "category") {

					if (item.bare_id < 0) {
						return;
					}
					// category
					model = data.groups.get(item.bare_id);
					var tn_li = $('<li/>');
					var tn_ul = $('<ul/>');
					tn_li.append(tnLink(model, data.linkTemplate));
					// ---
					createNodes(tn_ul, item, data);
					// ---
					tn_li.append(tn_ul);
					// ---
					parentDiv.append(tn_li);

				} else {

					// feed
					model = data.channels.get(item.bare_id);
					var tn_li = $('<li/>');
					tn_li.append(tnLink(model, data.linkTemplate));
					// ---
					parentDiv.append(tn_li);

				}

			});
		}

		function tnLink(model, template) {

			var iconClass = model.isGroup() ? "tngroup" : "tnchannel";

			var tn_a = template({
				sid: model.sid(),
				href: "#/view/" + model.sid(),
				title: model.get("name"),
				icon: iconClass
			});
			// ---
			return (tn_a);

		};

		// -------------------------------------

		var FeedTreeViewClass = Backbone.View.extend({

			className: "FeedTreeView",
			template: SidebarTemplate,
			initialize: function(options) {

				this.title = "Views/FeedTree";
				console.info(this.title + ": ok");
				this.model = options.model;
				// ---
				this.listenTo(this.model, 'reset', this.renderTree);
				this.listenTo(this.model, 'change:current', this.changeCurrent);
				this.listenTo(this.model, 'change:counter', this.updateCounter);

			},
			events: {
				'click .tngroup': 'eToggleGroup',
				'click .tntitle': 'eFocus'
			},
			render: function() {

				console.debug(this.title + ": rendering");
				// ---
				var compiledTemplate = _.template(this.template);
				this.$el.html(compiledTemplate({})).localize();

			},
			start: function() {

				// ...

			},
			renderTree: function() {

				console.debug(this.title + ": rendering");
				// ---
				var channelTree = $('#channelTree').html('');
				var rawTree = this.model.get('raw');
				var data = {
					channels: this.model.get('channels'),
					groups: this.model.get('groups'),
					linkTemplate: _.template(SidebarItemTemplate)
				};
				// ---
				createNodes(channelTree, rawTree, data);
				// ---
				this.restoreTreeState();

				// ---
				this.trigger('ready');

			},
			restoreTreeState: function() {

				var collapsedGroups = localStorage.getItem('collapsedGroups');
				if (collapsedGroups != undefined) {

					collapsedGroups = JSON.parse(collapsedGroups);
					_(collapsedGroups).each((sid) => {

						$(".tnheader[data-sid=" + sid + "]").addClass('collapsed').next().hide();

					});

				}

			},
			saveTreeState: function() {

				var collapsedGroups = [];
				var headers = $(".tnheader.collapsed");
				_.each(headers, (header) => {
					collapsedGroups.push(header.dataset.sid);
				})
				localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups));

			},
			updateCounter: function(model) {

				console.debug(this.title + ": updating counters for " + model.sid());
				// ---
				var cd = $("#tnh_" + model.sid() + " > .tncounter");
				var unread = model.get('unread');
				if (unread == 0) {
					cd.addClass('invisible').html('');
					cd.parent().removeClass('tnunread').addClass('tnread');
				} else {
					cd.removeClass('invisible').html(unread);
					cd.parent().removeClass('tnread').addClass('tnunread');
				}

			},
			changeCurrent: function() {

				var sid = this.model.get('current');
				console.log(this.title + ": node=" + sid);
				$(".tnheader").parent().removeClass('tncurrent');
				var $row = $(".tnheader[data-sid=" + sid + "]");
				$row.parent().addClass('tncurrent');

			},
			eToggleGroup: function(e) {

				e.stopPropagation();
				var sid = e.target.dataset.sid;
				// ---
				var $row = $(".tnheader[data-sid=" + sid + "]");
				if ($row.hasClass('collapsed')) {
					$row.removeClass('collapsed').next().show();
				} else {
					$row.addClass('collapsed').next().hide();
				}
				// ---
				this.saveTreeState();

			},
			eFocus: function(e) {

				window.location.href = $("a", e.currentTarget).attr('href');

			}

		});

		return FeedTreeViewClass;

	});
