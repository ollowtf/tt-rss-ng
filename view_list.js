var listView = (function() {

	// private
	//  ----------------------------------------------------------------
	var currentFeed = '';
	var contentBlock = '';

	var currentFeed = '';

	var params = {};

	var rowTemplate = '<div class="header">' + '<div class="main-link-box">' + '<a class="main-link" target="_blank" href="<%=link%>"></a></div>' + '<div class="updated"><%=updated%></div>' + '<div class="titlerow">' + '<span class="title"><%=title%></span>' + '<span class="excerpt"><%=excerpt%></span>' + '</div></div>';

	var _module = 'ListView';

	function _clearHeaders() {
		contentBlock.html('');
	}

	function articleDate(cd, ad) {
		updateTime = new Date(ad * 1000);
		if(cd.isBefore(updateTime)) {
			return(updateTime.toString("HH:mm"));
		} else {
			return(updateTime.toString("dd-MM-yyyy"))sЗ;
		}
	}

	function _displayHeaders(event, seq) {
		console.log(_module + ': displaying headers for seq %d', seq);
		// удаляем кнопку получения новых
		$("#nextButton").remove();
		// ---
		today = Date.today();
		// ---
		headers = dataManager.getHeaders(seq);
		// ---
		// компилируем шаблон
		template = _.template(rowTemplate);
		// выводим заголовки
		_.each(headers, function(element) {
			rowId = 'row-' + element.id;
			updateString = articleDate(today, element.updated);
			// ---
			newRow = $('<div/>').addClass('row').addClass((element.unread) ? "unread" : "read").attr('id', rowId);
			newRow.html(template({
				'updated': updateString,
				'link': element.link,
				'title': element.title,
				'excerpt': ' - ' + element.excerpt
			}));
			rowHeader = $('.header', newRow);
			rowHeader.on("click", onHeaderClick);
			contentBlock.append(newRow);
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

	function getMoreHeaders() {
		params.skip = $(".row",contentBlock).length-1;
        console.log(_module + ': headers request to dataManager');
		obs.pub('/getHeaders', params);
	};

	function onHeaderClick(event) {
		row = $(event.currentTarget.parentElement);
		artId = utils.articleId(row);
		if(row.hasClass('current')) {
			console.log(_module + ': click on current article %d. Hiding.', artId);
			hideArticle(row);
		} else {
			// ищем другие current и схлопываем
			$('.content', $('.current').removeClass('current')).remove();
			// ---
			row.addClass("current");
			console.log(_module + ': click on article %d. Loading.', artId);
			_displayArticle(artId);
		}
	};

	function _displayArticle(artId) {
		article = dataManager.getArticle(artId);
		if(article == false) {
			// включаем индикатор
			// ...
		} else {
			if(artId == _currentId()) {
				_showArticle(article);
			} else {
				// выключаем индикатор
				// ...
			};

		};
	};

	function _showArticle(article) {
		rowSelector = "#row-" + article.id;
		row = $(rowSelector);
		content = $('<div/>').addClass('content').html(article.content).appendTo(row);
		// scroll 2 top
		_scrollToTop(row);
		// mark as read
		if(article.unread) {
			_markAsRead(row);
		};

	};

	function _hideArticle(row) {
		// удаляем контент
		$('.content', row).remove();
		row.removeClass('current');
	};

	function _markAsRead(row) {
		row.filter('.unread').removeClass('unread').addClass('read');
		//  на сообщение должны среагировать treeView (уменьшить счётчик)
		// и dataManager (послать запрос на пометку)
		obs.pub('/setArticleRead',[utils.articleId(row)]);
	};

	function _markCurrentUnread() {
		row = _currentRow();
		row.filter('.read').removeClass('read').addClass('unread');
		obs.pub('/setArticleUnread',[utils.articleId(row)]);
	};

	function _scrollToTop(row) {
		contentBlock.scrollTo(row);
	}

	function _openCurrentLink() {
		row = _currentRow();
		href = $('a.main-link', row).first().attr('href');
		window.open(href, '_blank');
	}

	function _currentId() {
		currentRow = _currentRow();
		if(currentRow == 0) {
			return(0);
		} else {
			return(utils.articleId(currentRow));
		};
	};

	function _currentRow() {

		currentRow = $(".current", contentBlock);
		if(currentRow.length == 0) {
			return(0);
		} else {
			return(currentRow);
		}

	}

	function _loadNextArticle() {
		currentRow = _currentRow();
		if(currentRow != 0) {
			_hideArticle(currentRow);
			newRow = currentRow.next();
			if(newRow.hasClass('nav')) {
				// это кнопка "далее"
				// ..
			} else {
				newRow.addClass('current');
				id = utils.articleId(newRow);
				_displayArticle(id);
			}
		};
	};

	function _loadPrevArticle() {
		currentRow = _currentRow();
		if(currentRow != 0) {
			_hideArticle(currentRow);
			newRow = currentRow.prev();
			if(newRow.hasClass('nav')) {
				// это кнопка "далее"
				// ..
			} else {
				newRow.addClass('current');
				id = utils.articleId(newRow);
				_displayArticle(id);
			}
		};
	};

	// public
	// ------------------------------------------------------------
	return {
		connect: function(feedId) {
			obs.sub('/displayHeaders', this.displayHeaders);
			obs.sub('/displayArticle', this.displayArticle);
			// ---
			obs.sub('/loadNextArticle', this.loadNextArticle);
			obs.sub('/loadPrevArticle', this.loadPrevArticle);
			// ---
			obs.sub('/setCurrentUnread',this.setCurrentUnread);
			// ---
			obs.sub('/openCurrentLink', this.openCurrentLink);
			// ---
			console.log(_module + ': connected.');
			// ---
			contentBlock = $('#content');
			// ---
			this.activateFeed(feedId);
		},
		disconnect: function() {

		},
		activateFeed: function(feedId) {
			console.log(_module + ': activating feed %s', feedId);
			currentFeed = feedId;
			// очищаем всё что есть
			_clearHeaders();
			// индикатор загрузки
			// ...
			// запрашиваем заголовки
			params = {
				skip: 0,
				id: utils.id(currentFeed),
				isCategory: utils.isCategory(currentFeed),
				view_mode: 'adaptive',
				show_content: 1,
			};
			console.log(_module + ': headers request to dataManager');
			obs.pub('/getHeaders', params);
		},
		displayHeaders: function(event, seq) {
			_displayHeaders(event, seq);
		},
		displayArticle: function(event, artId) {
			_displayArticle(artId);
		},
		loadNextArticle: _loadNextArticle,
		loadPrevArticle: _loadPrevArticle,
		setCurrentUnread: _markCurrentUnread,
		openCurrentLink: _openCurrentLink
	}

}());