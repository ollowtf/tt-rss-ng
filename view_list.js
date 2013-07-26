//     tt-rss-ng
//     https://github.com/ollowtf/tt-rss-ng
//     (c) 2012-2013 Pavel Grechishkin (pavel.gretchishkin@gmail.com)
//     Distributed under the AGPL-3.0 (http://opensource.org/licenses/AGPL-3.0)

var listView = (function() {

	// private
	//  ----------------------------------------------------------------
	var currentFeed = '';
	var contentBlock = '';

	var currentFeed = '';

	var params = {};

	var multiSelect = false;

	var rowTemplate = '<a class="article-link" href="<%=link%>"/>' +
		'<div class="header">	' +
		'<div class="iconscolumn checkbox <%=multi%>"><input id="chk-<%=id%>" type="checkbox"></div>' +
		'<div class="iconscolumn star"><div id="str-<%=id%>" class="<%=star%>"></div></div>' +
		'<div class="iconscolumn share"><div id="shr-<%=id%>" class="<%=publish%>"></div></div>' +
		'<div class="updatecolumn"><%=updated%></div>' +
		'<div class="titlecolumn"><span id="hdr-<%=id%>" class="title"><%=title%></span>' +
		'<span class="excerpt"><%=excerpt%></span></div>' +
		'</div>';

	var _module = 'ListView';

	function _clearHeaders() {
		contentBlock.html('');
	}

	function articleDate(cd, ad) {
		updateTime = new Date(ad * 1000);
		if (cd.isBefore(updateTime)) {
			return (updateTime.toString("HH:mm"));
		} else {
			return (updateTime.toString("dd-MM-yyyy"));
		}
	}

	function _displayHeaders(event) {
		console.log("%s: displaying headers", _module);
		// удаляем кнопку получения новых
		$("#nextButton").remove();
		// ---
		today = Date.today();
		// ---
		headers = dataManager.getHeaders();
		// ---
		// компилируем шаблон
		template = _.template(rowTemplate);
		// выводим заголовки
		_.each(headers, function(item) {
			var element=item.attributes;
			rowId = 'row-' + element.id;
			updateString = articleDate(today, element.updated);
			// ---
			newRow = $('<div/>').addClass('row').addClass((element.unread) ? "unread" : "read").attr('id', rowId);
			newRow.html(template({
				'id': element.id,
				'link': element.link,
				'updated': updateString,
				'title': element.title,
				'excerpt': ' - ' + element.excerpt,
				'star': element.marked ? 'stared' : 'unstared',
				'publish': element.published ? 'shared' : 'unshared',
				'multi': multiSelect?'':'hidden'
			}));
			var rowHeader = $('.title', newRow);
			rowHeader.on("click", onHeaderClick);
			// ---
			var checkbox = $('.checkbox input', newRow);
			checkbox.on('change', onCheckBoxChange);
			// ---
			contentBlock.append(newRow);
			// ---
			var starbutton = $('.star div', newRow);
			starbutton.click(clickStarButton);
			// ---
			var sharebutton = $('.share div', newRow);
			sharebutton.click(clickShareButton);
			// ---
		});
		// ----------------------------------
		// выводим кнопку "показать дальше"
		newRow = $('<div/>').addClass('row').addClass('nav').attr('id', "nextButton");
		header = $('<div/>').addClass('header').appendTo(newRow);
		title = $('<div/>').addClass('titlerow');
		titleContent = $('<span/>').addClass('title').html("load more...");
		title.append(titleContent);
		header.append(title);
		// ---
		header.click(getMoreHeaders);
		// ---
		contentBlock.append(newRow);
	};

	function clickStarButton() {
		obs.pub('/toggleStarState', [
			[utils.articleId($(this))]
		]);
	};

	function clickShareButton() {
		obs.pub('/toggleShareState', [
			[utils.articleId($(this))]
		]);
	};

	function getMoreHeaders() {
		console.log(_module + ': request for headers');
		obs.pub('/getHeaders');
	};

	function onHeaderClick(event) {
		row = $(event.currentTarget.parentElement.parentElement.parentElement);
		artId = utils.articleId(row);
		if (row.hasClass('current')) {
			console.log("%s: click on current article %d. Hiding.", _module, artId);
			_hideItem(row);
		} else {
			// ищем другие current и схлопываем
			$('.content', $('.current').removeClass('current')).remove();
			// ---
			row.addClass("current");
			console.log("%s: click on article %d. Loading.", _module, artId);
			_displayItem(artId);
		}
	};

	function _displayItem(id) {
		if (!multiSelect) {
				obs.pub('/newSelection', id);
			};
		// ---
		item = dataManager.getItem(id);
		if (item == false) {
			// включаем индикатор
			// ...
		} else {
			if (id == _currentId()) {
				_showItem(item);
			} else {
				// выключаем индикатор
				// ...
			};

		};
	};

	function _showItem(item) {
		item.set("visible",true);
		var article = item.attributes;
		rowSelector = "#row-" + article.id;
		row = $(rowSelector);
		content = $('<div/>').addClass('content').html(article.content).appendTo(row);
		// scroll 2 top
		_scrollToTop(row);
		// mark as read
		if (article.unread) {
			obs.pub('/toggleReadState', [
				[item.id]
			]);
		};
	};

	function onCheckBoxChange() {
		var checked = this.checked;
		var chk_id = utils.articleId($(this));
		obs.pub(checked ? '/addSelection' : '/removeSelection', chk_id);
	};

	

	function _hideItem(row) {
		// удаляем контент
		$('.content', row).remove();
		row.removeClass('current');
	};

	function _scrollToTop(row) {
		contentBlock.scrollTo(row);
	}

	function _openCurrentLink() {
		row = _currentRow();
		href = $('a.article-link', row).first().attr('href');
		window.open(href, '_blank');
	}

	function _currentId() {
		currentRow = _currentRow();
		if (currentRow == 0) {
			return (0);
		} else {
			return (utils.articleId(currentRow));
		};
	};

	function _currentRow() {

		currentRow = $(".current", contentBlock);
		if (currentRow.length == 0) {
			return (0);
		} else {
			return (currentRow);
		}

	}

	function _loadNextArticle() {
		currentRow = _currentRow();
		if (currentRow != 0) {
			_hideItem(currentRow);
			newRow = currentRow.next();
			if (newRow.hasClass('nav')) {
				// это кнопка "далее"
				// ..
			} else {
				newRow.addClass('current');
				id = utils.articleId(newRow);
				_displayItem(id);
			}
		};
	};

	function _loadPrevArticle() {
		currentRow = _currentRow();
		if (currentRow != 0) {
			_hideItem(currentRow);
			newRow = currentRow.prev();
			if (newRow.hasClass('nav')) {
				// это кнопка "далее"
				// ..
			} else {
				newRow.addClass('current');
				id = utils.articleId(newRow);
				_displayItem(id);
			}
		};
	};

	function _markCurrentFeedAsRead() {
		// тут можно задать вопрос
		// ...
		// отмечаем все текущие непрочитанные как прочитанные
		$('.unread', contentBlock).removeClass('unread').addClass('read');
		obs.pub('/markFeedAsRead', [currentFeed]);
	};

	function _onModeChange(event, mode) {
		// устанавливаем режим в params
		_clearHeaders();
		console.log(_module + ': headers request to dataManager');
		obs.pub('/getHeaders');
	};

	function _enableMultiSelect() {
		$('.checkbox').removeClass('hidden');
		multiSelect = true;
		obs.pub('/stateMultiSelect', true);
	};

	function _disableMultiSelect() {
		$('.checkbox').addClass('hidden');
		multiSelect = false;
		obs.pub('/stateMultiSelect', false);
	};

	function _toggleReadState(event, articles) {
		_.each(articles, function(artId) {
			var row = $('#row-' + artId, contentBlock);
			if (row.hasClass('read')) {
				row.removeClass('read').addClass('unread');
			} else {
				row.removeClass('unread').addClass('read');
			};
		});
	};

	function _toggleStarState(event, articles) {
		_.each(articles, function(artId) {
			var star = $('#str-' + artId, contentBlock);
			if (star.hasClass('stared')) {
				star.removeClass('stared').addClass('unstared');
			} else {
				star.removeClass('unstared').addClass('stared');
			};
		});
	};

	function _toggleShareState(event, articles) {
		_.each(articles, function(artId) {
			var share = $('#shr-' + artId, contentBlock);
			if (share.hasClass('shared')) {
				share.removeClass('shared').addClass('unshared');
			} else {
				share.removeClass('unshared').addClass('shared');
			};
		});
	};

	// public
	// ------------------------------------------------------------
	return {
		connect: function() {
			// ---

			obs.msub(_module,{
				'/displayHeaders': this.displayHeaders,
				'/displayArticle': this.displayArticle,
				'/loadNextArticle': this.loadNextArticle,
				'/loadPrevArticle': this.loadPrevArticle,
				'/openCurrentLink': this.openCurrentLink,
				'/markCurrentFeedAsRead': this.markCurrentFeedAsRead,
				'/viewModeChange': this.onModeChange,
				'/enableMultiSelect': this.enableMultiSelect,
				'/disableMultiSelect': this.disableMultiSelect,
				'/toggleReadState': this.toggleReadState,
				'/toggleStarState': this.toggleStarState,
				'/toggleShareState': this.toggleShareState
			});
			
			// ---
			contentBlock = $('#view');
			console.log(_module + ': connected.');
		},
		disconnect: function() {
			obs.munsub(_module);
		},
		setSource: function(feedId) {
			console.log(_module + ': activating feed %s', feedId);
			currentFeed = feedId;
			// clear view
			_clearHeaders();
			// progress indicator
			// ...
			console.log(_module + ': request for headers');
			obs.pub('/getHeaders');
		},
		displayHeaders: _displayHeaders,
		displayArticle: function(event, id) {
			_displayItem(id);
		},
		loadNextArticle: _loadNextArticle,
		loadPrevArticle: _loadPrevArticle,
		openCurrentLink: _openCurrentLink,
		markCurrentFeedAsRead: _markCurrentFeedAsRead,
		onModeChange: _onModeChange,
		enableMultiSelect: _enableMultiSelect,
		disableMultiSelect: _disableMultiSelect,
		// ---
		toggleReadState: _toggleReadState,
		toggleStarState: _toggleStarState,
		toggleShareState: _toggleShareState
	}

}());