//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

var treeView = (function() {

	// private
	// ------------------------------------------------

	var _module = 'TreeView';

	function tnElement(model) {
		var title = model.get("title");
		var unread = model.get("unread");
		// ---
		var tn_a = $('<a/>').addClass("tnlink").attr("id","tnl_"+model.sid());
		var tn_header = $('<div/>').addClass("tnheader").attr("id","tnh_"+model.sid());
		var tn_title=$('<div/>').addClass("tntitle").html(title);
		if (unread != 0) {
			tn_title.addClass("tnunread");
			var tn_counter = $('<div/>').addClass("tncounter").html(unread);
			tn_header.append(tn_counter);
		}else{
			tn_a.addClass("tnread")
		};
		var tn_iconbox = $('<div/>').addClass("iconscolumn");
		var tn_icon = $('<div/>');
		if (model.isGroup()) {
			tn_icon.addClass("tngroup");
		}else{
			tn_icon.addClass("tnchannel");
		};
		tn_iconbox.append(tn_icon);
		// ---
		tn_header.append(tn_iconbox);
		tn_header.append(tn_title);
		tn_a.append(tn_header);
		// ---
		tn_header.click(nodeClick);
		// ---
		return(tn_a);
	};

	function createTree() {
		var channelTree = $('#channelTree');
		channels = dataManager.getChannels();
		groups = dataManager.getGroups();
		// ---
		createNodes(channelTree, dataManager.getFeedTree());

		/*_.each(function(group) {
			// ------------------------------------------------
			
			var tn_li = $('<li/>');
			tn_li.append(tnElement(group));
			// ---
			childChannels = channels.where({
				"cat_id": parseInt(group.id)
			});
			tn_ul = $('<ul/>');
			_.each(childChannels, function(channel) {
				var tn_li = $('<li/>');
				tn_li.append(tnElement(channel));
				// ---
				tn_ul.append(tn_li);
			});
			tn_li.append(tn_ul);
			// ---
			channelTree.append(tn_li);
			// ------------------------------------------------
		}); */
	};

	function createNodes(parentDiv,treeNode) {
		if (treeNode.items == undefined) {
            return;
        }
        // ---
		_.each(treeNode.items, function(item){
            if (item.type != undefined) {
                // category
                /*var tn_li = $('<li/>');
				tn_li.append(tnElement(group));
                createNodes(,item);*/
                // ---
            }else{
                // feed
                // ...
            }
        });
	}

	function nodeClick(event) {
		$('div.tnheader').parent().parent().removeClass("tncurrent");
		var tn_header = $(event.currentTarget);
		tn_header.parent().parent().addClass("tncurrent");
		var sid = tn_header.attr("id").slice(4);
		console.log("%s: activated node %s", _module, sid);
		obs.pub('/selectSource', [sid]);
	}

	function _setUnreadCount(event, model) {
		// ---
		var tn = $("#tnl_"+model.sid()).replaceWith(tnElement(model));
	};

	function _setFeedViewMode(event, mode) {
		var nodes = $('.tnread');
	 	if (mode == 'showAll') {
	 		nodes.show();
	 	} else {
	 		nodes.hide();
	 	};
	};

	// public
	// ------------------------------------------------
	return {

		// инициализация
		init: function() {
			console.log("%s: initializing...", _module);
			// ------------------------------------------------
			obs.sub('/feedsUpdated', this.createFeedTree);
			obs.sub('/setUnreadCount', this.setUnreadCount);
			obs.sub('/setFeedViewMode', this.setFeedViewMode);
			// ------------------------------------------------
			// menu button
			$('#settings').button({
				text: false,
				icons: {
					primary: "ui-icon-carat-1-n"
				}
			});
			// ------------------------------------------------
			// context menu for settings
			$.contextMenu({
				selector: '#settings',
				trigger: 'left',
				zIndex: 3,
				items: {
					"showAll": {
						name: "all feeds",
						callback: function(key, opt) {
							obs.pub('/setFeedViewMode', [key]);
						}
					},
					"showUnread": {
						name: "unread feeds",
						callback: function(key, opt) {
							obs.pub('/setFeedViewMode', [key]);
						}
					},
					"sep1": "---------",
					"settings": {
						name: "settings"
					}
				}
			});
		},

		createFeedTree: function() {
			console.log("%s: feed update event. Creating tree.", _module);
			createTree();
		},
		setUnreadCount: _setUnreadCount,
		setFeedViewMode: _setFeedViewMode
	}

}());