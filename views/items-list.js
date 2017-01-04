define(['backbone', 'underscore', 'jquery', 'jqueryScrollTo', 'jqueryWaypoints',
    'text!templates/items-list-row.html'
  ],
  function(Backbone, _, $, jqueryScrollTo, jqueryWaypoints, RowTemplate) {

    var ItemsList = Backbone.View.extend({

      className: "ItemsList",
      initialize: function(options) {

        this.title = "Views/List";
        // ---
        this.active = true;
        // ---
        this.control = options.control;
        this.mode = options.mode;
        this.itemView = options.itemView;
        // ---
        this.items = options.items;
        // ---
        this.templateRow = _.template(RowTemplate);
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
        this.listenTo(this.items, 'catchup', this.eFeedMarkedAsRead);
        // this.listenTo(this.items, 'state:unread', this.eUpdateItemsUnreadState);
        // this.listenTo(this.items, 'state:star', this.eUpdateItemsStarState);
        // ---
        this.listenTo(this.control, 'clear', this.eClear);
        this.listenTo(this.control, 'display', this.eDisplay);
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
        'click div.header': 'eItemHeaderClick'
      },
      setMode: function(mode) {
        this.mode = mode;
      },
      render: function() {

        console.debug(this.title + ": rendering");
        // ---
        // var compiledTemplate = _.template(this.template);
        // this.$el.html(compiledTemplate({})).localize();
        this.$el.html("ok");
        this.trigger('ready');

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

        _.each(newItems, (item) => {

          var element = item.attributes;
          var updateString = "";
          var multiSelect = false;
          var rowData = {
              'id': element.id,
              'link': element.link,
              'updated': updateString,
              'title': element.title,
              'excerpt': ' - ' + element.excerpt,
              'status': element.unread ? 'unread' : 'read',
              'unread': element.unread ? 'unreaded' : 'readed',
              'star': element.marked ? 'stared' : 'unstared',
              'publish': element.published ? 'shared' : 'unshared',
              'multi': multiSelect ? '' : 'hidden'
            }
            // ---
          this.$el.append(this.templateRow(rowData));
          // ---
          item.set('visible', true);

        });
        // ---
        $(".scrollHelper").remove();
        var scrollHelper = $("<div/>").addClass('scrollHelper');
        this.$el.append(scrollHelper);
        // ---
        this.stateLoading = false;
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


      },
      eLoadMore: function() {

        if (!this.items.EndOfList) {

          if (!this.stateLoading) {

            this.stateLoading = true;
            this.control.startFetching();

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
      // eUpdateItemsUnreadState: function(ids) {
      //
      //   _.each(ids, (id) => {
      //     var
      //   });
      //
      // },
      eItemHeaderClick: function(e) {

        // find header id
        var id = e.currentTarget.dataset.id;
        console.log(this.title + ": item " + id);
        // ---
        this.focusItem(id);

      },
      focusItem: function(id) {

        this.currentItem = this.items.get(id);

        this.currentRow = $("#i-" + this.currentItem.id, this.$el);

        if (!this.currentRow.hasClass('current')) {

          // set current
          $(".itemrow").removeClass('current');
          this.currentRow.addClass('current');
          // ---
          if (this.currentItem.get('unread')) {
            this.currentItem.set('unread', false);
            // ---
            // temporary - will be on confirmation event
            $(".unreaded", this.currentRow).removeClass('unreaded').addClass(
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

        if (this.mode != 'list-wide') {
          // remove any exsiting containers
          $(".viewContainer", this.$el).remove();
          // create element for ItemView
          var viewContainer = $("<div/>").addClass('viewContainer');
          this.currentRow.append(viewContainer);
          // ---
          this.itemView.setElement(viewContainer);
        }
        // ---
        this.trigger('focus', this.currentItem);

      },
      hideItem: function() {

        if (this.mode == 'list-wide') {
          this.trigger('unfocus');
        } else {
          $(".viewContainer", this.currentRow).remove();
        }

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
          // scroll to item row
          $("#i-" + nextItem.id).ScrollTo();
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
          // scroll to item row
          $("#i-" + prevItem.id).ScrollTo();
        }
      },
      eFeedMarkedAsRead: function() {

        $(".itemrow.unread", this.$el).removeClass('unread').addClass(
          'read');
        $(".unreaded").removeClass('unreaded').addClass('readed');

      }

    });

    return ItemsList;

  });
