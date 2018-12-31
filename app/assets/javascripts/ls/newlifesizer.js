

(function($) {

  // initializes the lifesizer image. Nothing much to do other then positioning the image.
  $.fn.lifesizeInit = function() {
    return this.each(function() {
      img = $(this);
      img.centerInParent();
    });
  };

  $.fn.lifeSizeUpdate = function(width, height, scale) {
    if (typeof(scale) != undefined) scale = 100;
    var img = $(this[0]);
    var data = img.data('lifesizer');
    data.lsw = width;
    data.lsh = height;
    img.scale(scale);
  };

  /**
   * sets the scale for all matching elements
   * @param scale the scale (100 = lifesize)
   */
  $.fn.scale = function(scale, centerInScreen) {
    // set the scale for all matching elements
    return this.each(function() {
      var img = $(this);
      var lsData = img.data('lifesizer'); // get lifesizer metadata
      var newHeight = Math.round(lsData.lsh * (scale/100));
      var newWidth =  Math.round(lsData.lsw * (scale/100));
      lsData.scale = scale;

      var width = img.width();
      var height = img.height();
      var position = img.position();
      img.attr('height', newHeight);
      img.attr('width', newWidth);

      if (centerInScreen) {
        img.centerInParent();
      } else {
        // zoom around current center point
          img.css('top',  position.top - (newHeight-height)/2);
          img.css('left', position.left - (newWidth-width)/2);
      }
    });
  };

  $.fn.intDataProp = function(name) {
      return parseInt($(this[0]).data('lifesizer')[name]);
  };

  /**
   * returns scale of first matching element
   */
  $.fn.getScale = function() {
    return this.intDataProp('scale');
  };

  $.fn.originalHeight = function() {
    return this.intDataProp('oh');
  };

  $.fn.originalWidth = function() {
    return this.intDataProp('ow');
  };


  // convenience method that sets all matching elements to 100% lifesize
  $.fn.lifesize = function() {
    return this.scale(100);
  };

})(jQuery);
