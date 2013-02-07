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
				name: nodeName(element.title, element.unread),
				open: false,
				title: element.title
			};
			feedTree.push(cNode);

			// добавляем фиды по текущей категории
			currentFeeds = _.where(feeds, {
				'cat_id': currentCategory
			});
			_.each(currentFeeds, function(element, index, array) {
				var fNode = {
					id: 'f' + element.id,
					pId: cNode.id,
					name: nodeName(element.title, element.unread),
					title: element.title
				};
				feedTree.push(fNode);
			});

		});

		// устанавливаем настройки
		// ---
		var treeSettings = {
			treeId: "feedTree",
			view: {
				dblClickExpand: false,
				showLine: true,
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
				/*beforeClick: function(treeId, treeNode) {
					var zTree = $.fn.zTree.getZTreeObj("tree");
					if(treeNode.isParent) {
						zTree.expandNode(treeNode);
						return false;
					} else {
						demoIframe.attr("src", treeNode.file + ".html");
						return true;
					}
				}*/
			}
		};

		// инициализируем дерево
		// ---
		var t = $("#sidebar");
		t = $.fn.zTree.init(t, treeSettings, feedTree);

		var feedTreeObject = $.fn.zTree.getZTreeObj("feedTree");
		// zTree.selectNode(zTree.getNodeByParam("id", 101));
	};

	function onNodeSelect(e, data) {
		/*// делаем запрос непрочитанных
		currentNodeId = $(data.rslt.obj[0]).attr("id");
		console.log(_module + ": activated node %s", currentNodeId);
		obs.pub('/feedActivated', [currentNodeId])*/
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