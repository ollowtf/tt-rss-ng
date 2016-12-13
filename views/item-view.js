define(['backbone', 'underscore', 'jquery',
    'text!templates/item-view.html'
  ],
  function(Backbone, _, $, ItemTemplate) {

    var ItemView = Backbone.View.extend({

      template: _.template(ItemTemplate),
      initialize: function(options) {

        this.App = options.app;
        this.mode = options.mode;
        this.items = options.items;
        this.control = options.control;
        // ---
        this.listenTo(this.control, 'focus', this.eFocus);
        this.listenTo(this.control, 'unfocus', this.eUnfocus);

      },
      render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        // ---
        this.prepare();
      },
      prepare: function() {

        // set max-width for images
        if (this.mode == "list-wide") {
          var maxWidth = this.App.Layout.east.state.innerWidth - 35;
        } else if (this.mode == 'list') {
          var maxWidth = this.App.Layout.center.state.innerWidth - 35;
        }
        // ---
        $("img", this.$el).attr('style', 'max-width:' + maxWidth +
          'px;').removeAttr('height');

        //set all links to _blank
        $("a", this.$el).attr('target', '_blank');

      },
      setMode: function(mode) {
        this.mode = mode;
      },
      setModel: function(model) {
        this.model = model;
      },
      eFocus: function(model) {
        this.setModel(model);
        this.render();
      },
      eUnfocus: function() {
        this.$el.html("");
      }

    });

    return (ItemView);

  });
