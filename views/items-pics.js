define(['backbone', 'underscore', 'jquery', 'jqueryFitImage', 'jqueryScrollTo',
    'jqueryWaypoints', 'text!templates/items-pics-footer.html'
  ],
  function(Backbone, _, $, jqueryFitImage, jqueryScrollTo, jqueryWaypoints,
    FooterTemplate) {

    var ItemsPics = Backbone.View.extend({

      className: "ItemsPics",
      initialize: function(options) {

        this.title = "Views/Pics";
        // ---
        this.active = true;
        // ---
        this.control = options.control;
        this.submode = options.submode;
        this.itemView = options.itemView;
        // ---
        this.items = options.items;
        // ---
        this.templateFooter = _.template(FooterTemplate);
        // ---
        this.stateLoading = false;
        // ---
        this.subscribe();
        // ---
        console.info(this.title + ": ok");

      },
      subscribe: function() {

        this.listenTo(this.items, 'reset', this.eClear);
        this.listenTo(this.items, 'fetched', this.eFetched);
        this.listenTo(this.control, 'fetched', this.eFetched);
        this.listenTo(this.items, 'catchup', this.eFeedMarkedAsRead);
        // ---
        this.listenTo(this.control, 'clear', this.eClear);
        this.listenTo(this.control, 'display', this.eDisplay);
        this.listenTo(this.control, 'restore', this.eExternalFocus);
        this.listenTo(this.control, '/nextItem', this.eNextItem);
        this.listenTo(this.control, '/prevItem', this.ePrevItem);

      },
      pause: function() {

        this.active = false;
        this.stopListening();
        console.log(this.title + ": paused.");

      },
      resume: function() {

        if (!this.active) {

          this.active = true;
          this.subscribe();
          console.log(this.title + ": active.");

        }

      },
      events: {
        'click div[data-action="state_read"]': 'eChangeStateUnread',
        'click div[data-action="state_star"]': 'eChangeStateStar',
        'click div.imagebox': 'eItemHeaderClick'
      },
      setSubMode: function(submode) {
        this.submode = submode;
      },
      render: function() {

        console.debug(this.title + ": rendering");
        // ---
        this.$el.html("ok");
        this.trigger('ready');
        // ---
        return (this);

      },
      eClear: function() {

        // clear list
        this.$el.html("");
        this.currentItem = undefined;

      },
      eFetched: function() {

        console.log(this.title + ": rendering fetched items");
        // ---
        this.renderItems(this.items.where({
          visible: false
        }));

      },
      renderItems: function(newItems) {

        var viewPortWidth = this.$el.width();
        var imageboxWidth = (150 + 6);
        var thumbsPerRow = Math.floor(viewPortWidth / imageboxWidth);
        var delta = viewPortWidth - (thumbsPerRow * imageboxWidth);
        console.log(delta);
        // -------------------------

        var lastRow = $('.imagerow:last', this.$el);
        if (lastRow.size() == 0) {
          lastRow = $('<div/>').addClass('imagerow').appendTo(this.$el);
        };
        var currentRowThumbsCount = lastRow.children('.imagebox').size();

        // -------------------------

        _.each(newItems, (item) => {

          var element = item.attributes;
          // ---
          rowId = 'row-' + element.id;
          // ---
          cd = $("<div/>").html(element.content);
          images = $("img", cd);
          if (images.size() == 0) {
            content = '-';
          } else {
            content = images[0].outerHTML;
          };
          // ---
          var newThumb = $('<div/>').addClass('imagebox').addClass(
            'new').attr('data-id', item.id).attr('id', rowId).html(
            content);
          // remove loading="lazy" attribute
          $(newThumb).children('img').removeAttr("loading");
          // ---
          var rowData = {
            'id': element.id,
            'link': element.link,
            'title': element.title,
            'excerpt': ' - ' + element.excerpt,
            'status': element.unread ? 'unread' : 'read',
            'unread': element.unread ? 'unreaded' : 'readed',
            'star': element.marked ? 'stared' : 'unstared',
            'publish': element.published ? 'shared' : 'unshared'
          };
          // ---
          newThumb.append(this.templateFooter(rowData));
          currentRowThumbsCount++;
          if (currentRowThumbsCount <= thumbsPerRow) {
            lastRow.append(newThumb);
          } else {
            lastRow = $('<div/>').addClass('imagerow');
            lastRow.append(newThumb);
            currentRowThumbsCount = 1;
            lastRow.appendTo(this.$el);
          };
          // ---
          item.set('visible', true);

        });
        // ---
        $("div.imagebox.new img").fitImage().parent().removeClass(
          'new');
        // ---
        $(".scrollHelper").remove();
        var scrollHelper = $("<div/>").addClass('scrollHelper');
        this
          .$el.append(scrollHelper);
        // ---
        if (!this.items.EndOfList) {
          var self = this;
          scrollHelper.waypoint({
            handler: function(direction) {
              if (direction == "down") {
                self.eLoadMore();
              }
              //console.log("hit");
            },
            offset: '100%',
            context: this.$el.get()
          });
        }
        // ---
        this.stateLoading = false;
      },
      eLoadMore: function() {

        if (!this.items.EndOfList) {

          if (!this.stateLoading) {

            this.stateLoading = true;
            this.control.fetchMore();

          }

        }

      },
      eChangeStateStar: function(e) {

        e.stopPropagation();
        var id = e.target.dataset.id;
        console.log(this.title + ":  star item " + id);
        var item = this.items.get(id);
        item.set('marked', !item.get('marked'));
        // ---
        $(e.target).toggleClass('stared').toggleClass('unstared');

      },
      eChangeStateUnread: function(e) {

        e.stopPropagation();
        var id = e.target.dataset.id;
        console.log(this.title + ":  read item " + e.target.dataset.id);
        var item = this.items.get(id);
        item.set('unread', !item.get('unread'));
        // ---
        $(e.target).toggleClass('readed').toggleClass('unreaded');
        $("div.itemrow#i-" + id).toggleClass('unread').toggleClass(
          'read');

      },
      eItemHeaderClick: function(e) {

        // find header id
        var id = e.currentTarget.dataset.id;
        console.log(this.title + ": item " + id);
        // ---
        this.focusItem(id);

      },
      eExternalFocus: function(id) {
        this.focusItem(id);
      },
      focusItem: function(id) {

        this.currentItem = this.items.get(id);

        this.currentRow = $("#row-" + this.currentItem.id, this.$el);

        if (!this.currentRow.hasClass('current')) {

          // set current
          $(".imagebox").removeClass('current');
          this.currentRow.addClass('current');
          // ---
          if (this.currentItem.get('unread')) {
            this.currentItem.set('unread', false);
            // ---
            // temporary - will be on confirmation event
            $(".unreaded", this.currentRow).removeClass('unreaded')
              .addClass(
                'readed');
            // ---
            this.currentRow.removeClass('unread').addClass('read');
            // ---
          }
          // ---
          this.displayItem();

        } else {

          this.currentRow.removeClass('current');
          this.hideItem();

        }

      },
      displayItem: function() {

        var row = undefined;
        // ---
        if (this.submode != 'sidebar') {

          // check if next sibling of current row is viewContainer
          var moveViewContainer = false;
          var row = this.currentRow.parent();
          if (!row.next().hasClass('viewContainer')) {
            moveViewContainer = true;
          }
          // ---
          if (moveViewContainer) {

            // remove any exsiting containers
            $(".viewContainer", this.$el).remove();

            // create new
            var viewContainer = $("<div/>").addClass('viewContainer').addClass(
              'dotted');
            row.after(viewContainer);

            // set as element for itemView
            this.itemView.setElement(viewContainer);

          }

        }
        // ---
        this.trigger('focus', this.currentItem);

        if (row != undefined) {
          row.ScrollTo();
        }

      },
      hideItem: function() {

        $(".viewContainer", this.$el).remove();

      },
      eDisplay: function() {

        this.displayItem();

      },
      eNextItem: function() {
        if (this.currentItem != undefined) {
          var index = this.items.indexOf(this.currentItem) + 1;
        } else {
          var index = 0;
        }
        // ---
        if (index < this.items.length && index >= 0) {
          var nextItem = this.items.at(index);
          // ---
          this.focusItem(nextItem.id);
        }
      },
      ePrevItem: function() {
        if (this.currentItem != undefined) {
          var index = this.items.indexOf(this.currentItem) - 1;
        } else {
          return;
        }
        // ---
        if (index < this.items.length && index >= 0) {
          var prevItem = this.items.at(index);
          this.focusItem(prevItem.id);
        }
      },
      eFeedMarkedAsRead: function() {

        $(".itemrow.unread", this.$el).removeClass('unread').addClass(
          'read');
        $(".unreaded").removeClass('unreaded').addClass('readed');

      }

    });

    return ItemsPics;

  });
