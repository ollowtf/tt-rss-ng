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

	function nodeName(name, unread) {
		var unreadString = '';
		if (unread != 0) {
			unreadString = ' (' + unread + ')';
		};
		return (name + unreadString);
	};

	function nodeFont(unread) {
		if (unread == 0) {
			return ('normal');
		} else {
			return ('bold');
		};
	};

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

	function treeNode(model) {
		var title = model.get("title");
		var unread = model.get("unread");
		var parent = 0;
		if (model.has("group")) {
			parent=model.get("group").sid();
		};
		// --- 
		var node = {
			"id": model.sid(),
			"pId": parent,
			"title": title,
			"open": false,
			"name": nodeName(title, unread),
			"font": {
				"font-weight": nodeFont(unread)
			},
			"iconSkin": nodeSkin(model),
			"unread": unread
		};
		return(node);
	};

	// ------------------------------------------------

	function createTree() {

		// creating json tree
		channels = dataManager.getChannels();
		dataManager.getGroups().each(function(group) {
			// ------------------------------------------------
			var gNode = treeNode(group);
			feedTree.push(gNode);
			if (gNode.unread != 0) {
				boldList.push(gNode.id);
			};
			// ---
			childChannels = channels.where({
				"cat_id": parseInt(group.id)
			});
			_.each(childChannels, function(channel) {
				var cNode = treeNode(channel);
				feedTree.push(cNode);
				if (cNode.unread != 0) {
					boldList.push(cNode.id);
				};
			});
			// ------------------------------------------------
		});
		
		// tree settings
		var treeSettings = {
			treeId: "feedTree",
			view: {
				dblClickExpand: false,
				showLine: true,
				showTitle: false,
				selectedMulti: false,
				fontCss: getFont,
				nameIsHTML: false
			},
			data: {
				simpleData: {
					enable: true,
					idKey: "id",
					pIdKey: "pId",
					rootPId: ""
				}
			},
			callback: {
				beforeClick: onNodeSelect
			}
		};

		// init tree
		t = $.fn.zTree.init($('#feedTree'), treeSettings, feedTree);

	};

	function onNodeSelect(treeId, treeNode) {
		// делаем запрос непрочитанных
		var currentNodeId = treeNode.id;
		console.log("%s: activated node %s", _module, currentNodeId);
		obs.pub('/selectSource', [currentNodeId]);
	}

	function _setUnreadCount(event, feedId, unread) {
		var ztree = $.fn.zTree.getZTreeObj("feedTree");
		var node = ztree.getNodeByParam('id', feedId);
		if (node != undefined) {
			node.name = nodeName(node.title, unread);
			node.unread = unread;
			node.font = {
				'font-weight': nodeFont(unread)
			}
			ztree.updateNode(node);
		};
	};

	function _setFeedViewMode(event, mode) {
		// alert(mode);
		var ztree = $.fn.zTree.getZTreeObj("feedTree");
		var nodes = ztree.getNodesByParam('unread', 0);
		if (mode == 'showAll') {
			ztree.showNodes(nodes);
		} else {
			ztree.hideNodes(nodes);
		};
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