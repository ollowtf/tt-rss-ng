/*
 */

(function($) {
  $.fn.fitImage = function(options) {

    var defaults = {
      parentSteps: 0
    };
    var opts = $.extend(defaults, options);

    // Get total number of items.
    var len = this.length - 1;

    return this.each(function(i) {
      var current = i;

      // Declare the current Image as a variable.
      var image = $(this);

      image.hide();

      // Move up Parents until the spcified limit has been met.
      var theParent = image;
      for (var i = 0; i <= opts.parentSteps; i++) {
        theParent = theParent.parent();
      }

      var cw = parseInt(theParent.width());
      var ch = parseInt(theParent.height());


      if (image[0].complete) {
        _fitImage(image);
      } else {
        var loadWatch = setInterval(watch, 500);
      }

      function watch() {
        if (image[0].complete) {
          clearInterval(loadWatch);
          _fitImage(image);
        }
      }

      function _fitImage(image) {
        // Get image properties.
        var iw = parseInt(image.width());
        var ih = parseInt(image.height());
        // ---

        var niw = cw;
        var nih = ih * niw / iw;
        if (nih > ch) {
          nih = ch;
          niw = iw * nih / ih;
        };

        // attach negative and pixel for CSS rule
        var dw = '-' + parseInt(niw / 2) + 'px';
        var dh = '-' + parseInt(nih / 2) + 'px';

        image.css({
          "width": niw,
          "height": nih,
          "margin-left": dw,
          "margin-top": dh
        });

        image.show();
      }

    });
  }
})(jQuery);
