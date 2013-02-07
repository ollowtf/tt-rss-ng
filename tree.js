var treeView = (function() {

	// private
	//  ...
	var _module = 'TreeView';

	var feedTree = [];
	var feedTreeObject = {};

	function nodeName(name, unread) {
		return(name + ' (' + unread + ')');
	};

	function createTree() {

		// формируем json-структуру фидов
		// ---
		feeds = dataManager.getFeeds();
		_.each(dataManager.getCategories(), function(element, index, array) {

			var currentCategory = element.id;
			var cNode = {
				id: 'c' + currentCategory,
				pId: 0,
				name: element.title,
				open: false,
				title: nodeName(element.title, element.unread)
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
						name: feed.title,
						title: nodeName(feed.title, feed.unread)
					};
					feedTree.push(fNode);
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
				showTitle: true,
				selectedMulti: false
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
		var t = $('<div/>').addClass('ztree');
		$("#sidebar").append(t);
		t = $.fn.zTree.init(t, treeSettings, feedTree);

		var feedTreeObject = $.fn.zTree.getZTreeObj("feedTree");
		// zTree.selectNode(zTree.getNodeByParam("id", 101));
	};

	function onNodeSelect(treeId,treeNode) {
		// делаем запрос непрочитанных
		var currentNodeId = treeNode.id;
		console.log(_module + ": activated node %s", currentNodeId);
		obs.pub('/feedActivated', [currentNodeId]);
	}

	function _setUnreadCount(event, feedId, unread) {

		var cE = $("#" + feedId);
		if(unread == 0) {
			unreadString = '';
		} else {
			unreadString = ' (' + unread + ')';
		};
		treeObject.set_text(cE, cE.data('name') + unreadString);
	};

	// public
	return {

		// инициализация
		init: function() {
			console.log(_module + ": initializing...");
			obs.sub('/feedsUpdated', this.createFeedTree);
			obs.sub('/setUnreadCount', this.setUnreadCount);
		},

		// обновление дерева
		createFeedTree: function() {
			console.log(_module + ': feed update event. Creating tree.');
			createTree();
		},
		setUnreadCount: _setUnreadCount
	}

}());