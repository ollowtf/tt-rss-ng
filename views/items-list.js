define(['backbone', 'underscore', 'jquery',
    'text!templates/items-list-row.html'
  ],
  function(Backbone, _, $, RowTemplate) {

    var ItemsList = Backbone.View.extend({

      className: "ItemsList",
      initialize: function(options) {

        this.title = "Views/ItemsList";
        // ---
        this.mode = options.mode;
        this.itemView = options.itemView;
        // ---
        this.items = options.items;
        this.listenTo(this.items, 'reset', this.eClear);
        this.listenTo(this.items, 'fetched', this.eFetched);
        this.listenTo(options.control, 'clear', this.eClear);
        this.listenTo(options.control, 'display', this.eDisplay);
        // ---
        this.templateRow = _.template(RowTemplate);
        // ---
        console.info(this.title + ": ok");

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
        //this.$("#items").html('');
        this.$el.html("");

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

      }

    });

    return ItemsList;

  });
