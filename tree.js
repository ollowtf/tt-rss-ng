//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

var treeView = (function() {

	// private
	//  ...
	var _module = 'TreeView';

	var feedTree = [];
	var feedTreeObject = {};
	var boldList = [];

	function nodeName(name, unread) {
		var unreadString = '';
		if(unread != 0) {
			unreadString = ' (' + unread + ')';
		};
		return(name + unreadString);
	};

	function nodeFont(unread) {
		if(unread == 0) {
			return('normal');
		} else {
			return('bold');
		};
	};

	function getFont(treeId, node) {
		return node.font ? node.font : {};
	}

	function createTree() {

		// формируем json-структуру фидов
		// ---
		feeds = dataManager.getFeeds();
		_.each(dataManager.getCategories(), function(element, index, array) {

			var currentCategory = element.id;
			var cNode = {
				id: 'c' + currentCategory,
				pId: 0,
				title: element.title,
				open: false,
				name: nodeName(element.title, element.unread),
				font: {
					'font-weight': nodeFont(element.unread)
				},
				iconSkin: 'category',
				unread: element.unread
			};
			if(element.unread != 0) {
				boldList.push(cNode.id);
			};

			// добавляем фиды по текущей категории
			currentFeeds = _.filter(feeds, function(el) {
				return el.cat_id == currentCategory;
			});
			if(_.size(currentFeeds) != 0) {
				feedTree.push(cNode);
				_.each(currentFeeds, function(feed) {
					var fNode = {
						id: 'f' + feed.id,
						pId: cNode.id,
						title: feed.title,
						name: nodeName(feed.title, feed.unread),
						font: {
							'font-weight': nodeFont(feed.unread)
						},
						iconSkin: 'feed',
						unread: feed.unread
					};
					feedTree.push(fNode);
					if(feed.unread != 0) {
						boldList.push(fNode.id);
					};
				});
			};


		});

		// устанавливаем настройки
		// ---
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

		// инициализируем дерево
		// ---
		t = $.fn.zTree.init($('#feedTree'), treeSettings, feedTree);
	};

	function onNodeSelect(treeId, treeNode) {
		// делаем запрос непрочитанных
		var currentNodeId = treeNode.id;
		console.log(_module + ": activated node %s", currentNodeId);
		obs.pub('/feedActivated', [currentNodeId]);
	}

	function _setUnreadCount(event, feedId, unread) {
		var ztree = $.fn.zTree.getZTreeObj("feedTree");
		var node = ztree.getNodeByParam('id', feedId);
		if(node != undefined) {
			node.name = nodeName(node.title, unread);
			node.unread = unread;
			node.font = {
				'font-weight': nodeFont(unread)
			}
			// ztree.setting.view.fontCss['font-weight'] = nodeFont(unread);
			ztree.updateNode(node);
		};
	};

	function _setFeedViewMode(event, mode) {
		// alert(mode);
		var ztree = $.fn.zTree.getZTreeObj("feedTree");
		var nodes = ztree.getNodesByParam('unread', 0);
		if(mode == 'showAll') {
			ztree.showNodes(nodes);
		} else {
			ztree.hideNodes(nodes);
		};
	};

	// public
	return {

		// инициализация
		init: function() {
			console.log(_module + ": initializing...");
			obs.sub('/feedsUpdated', this.createFeedTree);
			obs.sub('/setUnreadCount', this.setUnreadCount);
			obs.sub('/setFeedViewMode', this.setFeedViewMode);
			// ---
			// создаём кнопку меню
			$('#settings').button({
				text: false,
				icons: {
					primary: "ui-icon-carat-1-n"
				}
			});
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

			/*$('#feedShowMode').buttonset();
			$('#feedShowMode input[type=radio]').click(function() {
				obs.pub('/setFeedViewMode', [$('input[name=feedShowMode]:checked').attr('id')]);
			});*/
		},

		// обновление дерева
		createFeedTree: function() {
			console.log(_module + ': feed update event. Creating tree.');
			createTree();
		},
		setUnreadCount: _setUnreadCount,
		setFeedViewMode: _setFeedViewMode
	}

}());