var listView = (function() {

	// private
	//  ----------------------------------------------------------------
	var currentFeed = '';
	var contentBlock = '';

	var currentFeed = '';

	var params = {};

	var multiSelect = false;

	var rowTemplate = '<a class="article-link" href="<%=link%>"/>'+
			'<div class="header">	'+
			'<div class="iconscolumn checkbox <%=multi%>"><input id="chk-<%=id%>" type="checkbox"></div>'+
			'<div class="iconscolumn"><div id="str-<%=id%>" class="<%=star%>"></div></div>'+
			'<div class="iconscolumn"><div id="shr-<%=id%>" class="<%=publish%>"></div></div>'+
			'<div class="updatecolumn"><%=updated%></div>'+
			'<div class="titlecolumn"><span id="hdr-<%=id%>" class="title"><%=title%></span>'+
			'<span class="excerpt"><%=excerpt%></span></div>'+
			'</div>';

	var _module = 'ListView';

	function _clearHeaders() {
		contentBlock.html('');
	}

	function articleDate(cd, ad) {
		updateTime = new Date(ad * 1000);
		if(cd.isBefore(updateTime)) {
			return(updateTime.toString("HH:mm"));
		} else {
			return(updateTime.toString("dd-MM-yyyy"));
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
				'id'		:element.id,
				'link'		: element.link,
				'updated'	: updateString,
				'title'		: element.title,
				'excerpt'	: ' - ' + element.excerpt,
				'star'		: element.marked?'stared':'unstared',
				'publish'	: element.published?'shared':'unshared',
				'multi'		: 'hidden'
			}));
			var rowHeader = $('.title', newRow);
			rowHeader.on("click", onHeaderClick);
			// ---
			var checkbox = $('.checkbox input',newRow);
			checkbox.on('change',onCheckBoxChange);
			// ---
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
		row = $(event.currentTarget.parentElement.parentElement.parentElement);
		artId = utils.articleId(row);
		if(row.hasClass('current')) {
			console.log(_module + ': click on current article %d. Hiding.', artId);
			_hideArticle(row);
		} else {
			// ищем другие current и схлопываем
			$('.content', $('.current').removeClass('current')).remove();
			// ---
			row.addClass("current");
			console.log(_module + ': click on article %d. Loading.', artId);
			if (!multiSelect) {
				obs.pub('/newSelection',artId);	
			};
			
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

	function onCheckBoxChange() {
		var checked = this.checked;
		var chk_id = utils.articleId($(this));
		obs.pub(checked?'/addSelection':'/removeSelection',chk_id);
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
		href = $('a.article-link', row).first().attr('href');
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

	function _markCurrentFeedAsRead() {
		// тут можно задать вопрос
		// ...
		// отмечаем все текущие непрочитанные как прочитанные
		$('.unread',contentBlock).removeClass('unread').addClass('read');
		obs.pub('/markFeedAsRead',[currentFeed]);
	};

	function _onModeChange(event,mode) {
		// устанавливаем режим в params
		_clearHeaders();
		params.skip = 0;
		params.view_mode = mode;
		console.log(_module + ': headers request to dataManager');
		obs.pub('/getHeaders', params);

	};

	function _enableMultiSelect() {
		$('.checkbox').removeClass('hidden');
		multiSelect = true;
		obs.pub('/stateMultiSelect',true);
	};

	function _disableMultiSelect() {
		$('.checkbox').addClass('hidden');
		multiSelect = false;
		obs.pub('/stateMultiSelect',false);
	};

	function _toggleReadState(event,articles) {
		_.each(articles,function(artId) {
			var row = $('#row-'+artId,contentBlock);
			if (row.hasClass('read')) {
				row.removeClass('read').addClass('unread');
			}else{
				row.removeClass('unread').addClass('read');
			};
		});
	};

	function _toggleStarState(event,articles) {
		_.each(articles,function(artId) {
			var star = $('#str-'+artId,contentBlock);
			if (star.hasClass('stared')) {
				star.removeClass('stared').addClass('unstared');
			}else{
				star.removeClass('unstared').addClass('stared');
			};
		});
	};

	function _toggleShareState(event,articles) {
		_.each(articles,function(artId) {
			var share = $('#shr-'+artId,contentBlock);
			if (share.hasClass('shared')) {
				share.removeClass('shared').addClass('unshared');
			}else{
				share.removeClass('unshared').addClass('shared');
			};
		});
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
			obs.sub('/markCurrentFeedAsRead',this.markCurrentFeedAsRead);
			// ---
			obs.sub('/viewModeChange', this.onModeChange);
			// ---
			obs.sub('/enableMultiSelect',this.enableMultiSelect);
			obs.sub('/disableMultiSelect',this.disableMultiSelect);
			// ---
			obs.sub('/toggleReadState',this.toggleReadState);
			obs.sub('/toggleStarState',this.toggleStarState);
			obs.sub('/toggleShareState',this.toggleShareState);
			// ---
			console.log(_module + ': connected.');
			// ---
			contentBlock = $('#view');
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