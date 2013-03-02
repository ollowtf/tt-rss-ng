var controller = (function() {

	// private
	var _module = 'Controller';
	// ---
	var views = {};
	// ---
	var currentView = '';

	var multiSelect = false;

	function registerHotkeys() {
		var keyMap = {
			"j": "/loadNextArticle",
			"k": "/loadPrevArticle",
			"b": "/scrollToTop",
			"u": "/setCurrentUnread",
			"o": "/openCurrentLink",
			"s": "/toggleSideBar",
			"c": "/getCounters",
			"Alt+r": "/markCurrentFeedAsRead"
		};
		_.each(keyMap, function(value, key) {
			$(document).bind("keypress", key, function() {
				obs.pub(value);
			});
		});
	};

	function disconnectView(viewName) {

	};

	// ---

	function _toggleMultiSelect() {
		var btn =$('#multi');
		if (btn.hasClass('selected')) {
			obs.pub('/disableMultiSelect');
		}else{
			obs.pub('/enableMultiSelect');
		};
	};

	function _multiSelectState(event,value) {
		var btn =$('#multi');
		multiSelect = value;
		if (multiSelect) {
			btn.addClass('selected');
		}else{
			btn.removeClass('selected');
		};
	}

	// public
	return {
		init: function() {
			console.log(_module + ": initializing ...");
			// ---
			views['listView']= listView;
			// ---
			console.log(_module + ": registering hotkeys ...");
			registerHotkeys();
			// ---
			console.log(_module + ": waiting for events ...");
			obs.sub('/feedActivated', this.activateFeed);
			// ---
			obs.sub('/toggleSideBar', this.toggleSideBar);
			// ---
			obs.sub('/stateMultiSelect',this.multiSelectState);
			// ---
			setInterval(function() {obs.pub('/getCounters')}, 60000);

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
							//obs.pub('/setFeedViewMode', [key]);
						}
					},
					"toggleStar": {
						name: "toggle star",
						callback: function(key, opt) {
							//obs.pub('/setFeedViewMode', [key]);
						}
					},
					"togglePublish": {
						name: "toggle publish",
						callback: function(key, opt) {
							//obs.pub('/setFeedViewMode', [key]);
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
			// mode select
			$('#modeSelector').on('change',function() {
				var mode = $('#modeSelector').val();
				obs.pub('/viewModeChange',mode);
			});
		},
		activateFeed: function(event, feedId) {
			console.log(_module + ": get request to activate feed %s", feedId);
			// ---
			// сбрасываем кэш модели
			dataManager.clearCache();
			// ---
			// необходимо определить представление для текущего фида
			newView = "listView"; // тут будет вызов функции определения
			if(newView != currentView) {
				// отключаем старый
				if (currentView != '') {
					console.log(_module+': disconnecting view %',currentView);
					views[currentView].disconnect();
				};
				// ---
				console.log(_module+': connecting view %s',newView);
				currentView = newView;
				views[currentView].connect(feedId);
			}else{
				console.log(_module+': activating feed %s',feedId);
				views[currentView].activateFeed(feedId);
			};

		},
		toggleSideBar: function() {
			console.log(_module + ": toggle sidebar state.");
			appLayout.toggle('west');
		},
		multiSelectState: _multiSelectState
	}

}());