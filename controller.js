//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

var controller = (function() {

	// private
	var _module = 'Controller';
	// ---
	var views = {};
	// ---
	var currentSource = '';
	var currentView = '';
	var newView = '';
	// ---
	var multiSelect = false;
	// ---
	var selectedItems = {};

	function registerHotkeys() {
		var keyMap = {
			"j": "/loadNextArticle",
			"k": "/loadPrevArticle",
			"b": "/scrollToTop",
			"o": "/openCurrentLink",
			"f": "/toggleSideBar",
			"c": "/markCurrentFeedAsRead"
		};
		_.each(keyMap, function(value, key) {
			$(document).bind("keypress", key, function() {
				obs.pub(value);
			});
		});
		// ---
		$(document).bind("keypress", 'r', function() {
			obs.pub('/toggleReadState', [getSelectedItems()]);
		});
		// ---
		$(document).bind("keypress", 's', function() {
			obs.pub('/toggleStarState', [getSelectedItems()]);
		});
		// ---
		$(document).bind("keypress", 'p', function() {
			obs.pub('/toggleShareState', [getSelectedItems()]);
		});

	};

	function disconnectView(viewName) {

	};

	// ---

	function _toggleMultiSelect() {
		var btn = $('#multi');
		if (btn.hasClass('selected')) {
			obs.pub('/disableMultiSelect');
		} else {
			obs.pub('/enableMultiSelect');
		};
	};

	function _multiSelectState(event, value) {
		var btn = $('#multi');
		multiSelect = value;
		if (multiSelect) {
			btn.addClass('selected');
		} else {
			btn.removeClass('selected');
		};
	}

	function _addSelection(event, id) {
		selectedItems[id] = true;
	};

	function _removeSelection(event, id) {
		selectedItems[id] = false;
	};

	function _newSelection(event, id) {
		selectedItems = {};
		selectedItems[id] = true;
	};

	function getSelectedItems() {
		var selected = [];
		_.each(selectedItems, function(element, key) {
			if (element == true) {
				selected.push(key);
			};
		});
		return (selected);
	};

	// public
	return {
		init: function() {
			console.log(_module + ": initializing ...");
			// ---
			views['listView'] = listView;
			views['imagesView'] = imagesView;
			// ---
			console.log(_module + ": registering hotkeys ...");
			registerHotkeys();
			// ---
			console.log(_module + ": waiting for events ...");
			obs.sub('/selectSource', this.activateFeed);
			// ---
			obs.sub('/toggleSideBar', this.toggleSideBar);
			// ---
			obs.sub('/stateMultiSelect', this.multiSelectState);
			obs.sub('/addSelection', this.addSelection);
			obs.sub('/removeSelection', this.removeSelection);
			obs.sub('/newSelection', this.newSelection);
			// ---
			setInterval(function() {
				obs.pub('/updateCounters')
			}, 60000);

			// buttons
			$('#multi').button().click(function() {
				_toggleMultiSelect();
			});
			$('#actions').button().click();
			// context menu for settings
			$.contextMenu({
				selector: '#actions',
				trigger: 'left',
				zIndex: 3,
				items: {
					"open": {
						name: "open"
					},
					"sep1": "---------",
					"toggleRead": {
						name: "toggle read",
						callback: function(key, opt) {
							obs.pub('/toggleReadState', [getSelectedItems()]);
						}
					},
					"toggleStar": {
						name: "toggle star",
						callback: function(key, opt) {
							obs.pub('/toggleStarState', [getSelectedItems()]);
						}
					},
					"togglePublish": {
						name: "toggle publish",
						callback: function(key, opt) {
							obs.pub('/toggleShareState', [getSelectedItems()]);
						}
					}
				}
			});
			// ---
			$('#next').button().click(function() {
				obs.pub('/loadNextArticle');
			});
			$('#prev').button().click(function() {
				obs.pub('/loadPrevArticle');
			});
			$('#open').button().click(function() {
				obs.pub('/openCurrentLink');
			});
			// read mode
			$('#modeSelector').on('change', function() {
				var mode = $('#modeSelector').val();
				console.log(_module + ": read_mode=%s", mode);
				obs.pub('/viewModeChange', mode);
			});
			// view
			$('#viewSelector').on('change', function() {
				newView = $('#viewSelector').val(); // не надо
				console.log(_module + ": view=%s", newView);
				// reactivate feed ... 
				if (currentSource != '') {
					obs.pub('/selectSource', [currentSource]);
				};
				
			});
		},
		activateFeed: function(event, feedId) {
			console.log(_module + ": activating feed %s", feedId);
			// ---
			currentSource = feedId;
			// ---
			var mode = $('#modeSelector').val();
			dataManager.setSource(currentSource,mode);
			// ---
			newView = $('#viewSelector').val();
			if (newView != currentView) {
				// disconnect old view if exists
				if (currentView != '') {
					console.log(_module + ': disconnecting view %', currentView);
					views[currentView].disconnect();
				};
				// ---
				console.log(_module + ': connecting view %s', newView);
				currentView = newView;
				views[currentView].connect();
			};
			console.log(_module + ': loading source %s', feedId);
			views[currentView].setSource(feedId);

		},
		toggleSideBar: function() {
			console.log(_module + ": toggle sidebar state.");
			appLayout.toggle('west');
		},
		multiSelectState: _multiSelectState,
		addSelection: _addSelection,
		removeSelection: _removeSelection,
		newSelection: _newSelection
	}

}());