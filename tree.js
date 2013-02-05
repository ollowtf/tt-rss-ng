var treeView = (function() {

	// private
	//  ...
	var _module = 'TreeView';

	var feedTree = [];
	var treeObject = {};


	function nodeTemplate() {
		node = {};
		node.attr = {
			"id": "",
			"rel": ""
		};
		node.data = {
			"title": "",
			"attr": {
				"href": ""
			}
		};
		node.metadata = {
			'id': '',
			'name': ''
		};
		return(node);
	}

	function createTree() {
		
		// формируем дерево фидов
		tree = [];
		catMap = {};

		_.each(dataManager.getCategories(),function(element, index, array) {
			catNode = nodeTemplate();
			catNode.attr.id = 'c' + element.id;
			catNode.attr.rel = "category";
			catNode.data.title = element.title + " (" + element.unread + ")";
			catNode.metadata.name = element.title;
			catNode.children = [];
			// ---
			catMap[catNode.attr.id] = catNode;
		});

		_.each(dataManager.getFeeds(),function(element, index, array) {
			// определим категорию фида
			// получим структуру ноды категории
			feedCat = 'c' + element.cat_id;
			catNode = catMap[feedCat];

			feedNode = nodeTemplate();
			feedNode.attr.id = 'f' + element.id;
			feedNode.attr.rel = "feed";
			feedNode.data.title = element.title + " (" + element.unread + ")";
			feedNode.metadata.name = element.title;
			// ---
			catNode.children.push(feedNode);
		});

		// переносим элементы из карты в массив
		_.each(catMap,function(value,key) {
			if(value.children.length != 0) {
				feedTree.push(value);
			}
		})
		
		// инициализируем дерево
		navTree = $('#sidebar').jstree({
			"plugins": ["themes", "types", "json_data", "ui"],
			"types": {
				"valid_children": ["category"],
				"types": {
					"category": {
						"valid_children": ["feed"],
						"icon": {
							"image": "img/folder.png"
						}
					},
					"feed": {
						"icon": {
							"image": "img/feed.png",
							"valid_children": ["none"]
						}
					}
				}
			},
			"themes": {
				"theme": "default",
				"dots": false,
				"icons": true
			},
			"json_data": {
				"data": feedTree
			}
		}).bind("select_node.jstree", onNodeSelect);
		// ---
		treeObject = $.jstree._reference('#sidebar');
	};

	function onNodeSelect(e, data) {
		// делаем запрос непрочитанных
		currentNodeId = $(data.rslt.obj[0]).attr("id");
		console.log(_module+": activated node %s", currentNodeId);
		obs.pub('/feedActivated',[currentNodeId])
	}

	function _setUnreadCount(event,feedId,unread) {
		
		var cE = $("#"+feedId);
		if (unread==0) {
			unreadString = '';
		}else{
			unreadString = ' ('+unread+')';
		};
		treeObject.set_text(cE,cE.data('name')+unreadString);
	};

	// public
	return {

		// инициализация
		init: function() {
			console.log(_module+": initializing...");
			obs.sub('/feedsUpdated', this.createFeedTree);
			obs.sub('/setUnreadCount',this.setUnreadCount);
		},

		// обновление дерева
		createFeedTree: function() {
			console.log(_module+': feed update event. Creating tree.');
			createTree();
		},
		setUnreadCount: _setUnreadCount
	}

}());