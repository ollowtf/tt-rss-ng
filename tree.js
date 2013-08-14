//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

var treeView = (function() {

	// private
	// ------------------------------------------------

	var _module = 'TreeView';

	var feedTree = [];
	var feedTreeObject = {};
	var boldList = [];


	function nodeSkin(model) {
		if (model.has("group")) {
			return("feed");
		}else{
			return("category");
		};
	};

	function getFont(treeId, node) {
		// ---
		return (node.font ? node.font : {});
	}

	function tnElement(model) {
		var title = model.get("title");
		var unread = model.get("unread");
		// ---
		var tn_li = $('<li/>');
		var tn_a = $('<a/>').addClass("tnlink");
		var tn_header = $('<div/>').addClass("tnheader").attr("id","tnh_"+model.sid());
		var tn_title=$('<div/>').addClass("tntitle").html(title);
		if (unread != 0) {
			tn_title.addClass("tnunread");
			var tn_counter = $('<div/>').addClass("tncounter").html(unread);
			tn_header.append(tn_counter);
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
		tn_li.append(tn_a);
		// ---
		tn_header.click(onNodeSelect);
		// ---
		return(tn_li);
	};

	// ------------------------------------------------

	function createTree() {

		var channelTree = $('#channelTree');
		// ---
		// creating json tree
		channels = dataManager.getChannels();
		dataManager.getGroups().each(function(group) {
			// ------------------------------------------------
			
			var tn_li = tnElement(group);
			// ---
			if (group.get('unread') != 0) {
				boldList.push(group.sid());
			};
			// ---
			childChannels = channels.where({
				"cat_id": parseInt(group.id)
			});
			tn_ul = $('<ul/>');
			_.each(childChannels, function(channel) {
				
				var tn_li = tnElement(channel);
				// ---
				tn_ul.append(tn_li);
				if (channel.get('unread') != 0) {
				 	boldList.push(channel.sid());
				};
			});
			tn_li.append(tn_ul);
			// ---
			channelTree.append(tn_li);
			// ------------------------------------------------
		});
		


		// // tree settings
		// var treeSettings = {
		// 	treeId: "feedTree",
		// 	view: {
		// 		dblClickExpand: false,
		// 		showLine: true,
		// 		showTitle: false,
		// 		selectedMulti: false,
		// 		//fontCss: getFont,
		// 		nameIsHTML: true
		// 	},
		// 	data: {
		// 		simpleData: {
		// 			enable: true,
		// 			idKey: "id",
		// 			pIdKey: "pId",
		// 			rootPId: ""
		// 		}
		// 	},
		// 	callback: {
		// 		beforeClick: onNodeSelect
		// 	}
		// };

		// // init tree
		// t = $.fn.zTree.init($('#feedTree'), treeSettings, feedTree);

	};

	function onNodeSelect(event) {
		
		$('div.tnheader').removeClass("tncurrent");
		var tn_header = $(event.currentTarget);
		tn_header.addClass("tncurrent");
		var sid = tn_header.attr("id").slice(4);
		console.log("%s: activated node %s", _module, sid);
		obs.pub('/selectSource', [sid]);
	}

	function _setUnreadCount(event, feedId, unread) {
		// var ztree = $.fn.zTree.getZTreeObj("feedTree");
		// var node = ztree.getNodeByParam('id', feedId);
		// if (node != undefined) {
		// 	node.name = nodeName(node.title, unread);
		// 	node.unread = unread;
		// 	node.font = {
		// 		'font-weight': nodeFont(unread)
		// 	}
		// 	ztree.updateNode(node);
		// };
	};

	function _setFeedViewMode(event, mode) {
	// 	// alert(mode);
	// 	var ztree = $.fn.zTree.getZTreeObj("feedTree");
	// 	var nodes = ztree.getNodesByParam('unread', 0);
	// 	if (mode == 'showAll') {
	// 		ztree.showNodes(nodes);
	// 	} else {
	// 		ztree.hideNodes(nodes);
	// 	};
	};

	// public
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

		// обновление дерева
		createFeedTree: function() {
			console.log("%s: feed update event. Creating tree.", _module);
			createTree();
		},
		setUnreadCount: _setUnreadCount,
		setFeedViewMode: _setFeedViewMode
	}

}());