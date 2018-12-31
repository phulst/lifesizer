/* Copyright (c) 2008 LifeSizer.com (peter@hollice.com)
 *
 * Requires: $ 1.2.3+
 */

(function($) {

// sets the attributes on the image to remember the actual image dimensions and the dpi
// for this image. This is done so it can be resized on the client side later on
$.fn.lifesizeInitImage = function(scale) {
  if (!scale)
    scale = 100;
  return this.each(function() {
    img = $(this);
    $.lifesizeInitImage(img, img.attr('width'), img.attr('height'));

//    img = $(this);
//   w = img.attr('width')  * (scale/100);
//    h = img.attr('height') * (scale/100);
//    $(this).attr({'lsWidth': w, 'lsHeight': h, 'scale':scale});
//    img.centerInParent();
//    console.log("init: lifesize dimensions are " + w + "x" + h + " pix");
  });
};

// initializes a lifesizer image
// @param img jquery wrapper for image
// @param width
// @param height
// @param scale scale on which image is rendered (default 100)
$.lifesizeInitImage = function(img, width, height, scale) {
    if (!scale)
      scale = 100;
    f = scale/100;
    img.attr({'lsWidth': (width*f), 'lsHeight': (height*f), 'scale':scale});
    //if (console.log()) {
    //    console.log("init: lifesize dimensions are " + (width*f) + "x" + (height*f) + " pix");
    //}
    img.centerInParent();
}

// fetches new lifesize render data for the current image, and re-renders the image with
// the new data. This may be required after calibration or after screen resolution changes
$.updateRender = function() {
  img = $('.lifesize:first')
  //console.log("getting render info");

    $.getJSON("/show/render_info.json", { ref: img.attr('ref'), acc: acc }, function(resp){
      width = resp.width;
      height = resp.height;
	  guessed = resp.guessed;
	  sizeGuessed(guessed);
	  // init and render image again
      $.lifesizeInitImage(img, width, height);
      img.lifesize();
    });
};

$.lifesize = function() {
};

// initializes the plugin
$.lifesize.init = function() {
  $('.lifesize').lifesizeInitImage();
};

// When a scale parameter is passed in, this function will set that
// scale for all matching elements.
// When no parameter specified, this method will return the scale
// for the first matching element.
$.fn.scale = function(scale) {
  if (scale) {
    // set the scale for all matching elements
    return this.each(function() {
      img = $(this);
      img.attr('scale', scale); // update the scale property
      //if (console.log) {
        //console.log("new scale = " + scale);
      //}
      newHeight = Math.round(img.attr('lsHeight') * (scale/100));
      newWidth = Math.round(img.attr('lsWidth') * (scale/100));
      img.attr('height', newHeight);
      img.attr('width', newWidth);
      img.centerInParent();
    });
  } else {
    // return the scale for the first matching element
    return parseInt($(this).attr('scale'));
  }
};

// convenience method that sets all matching elements to 100% lifesize
$.fn.lifesize = function() {
  return this.scale(100);
};


$.openCalibrate = function() {
  url = "/calibrate/start";
  width = 900;
  height = 700;

  // set up attributes for popup window
  var left   = (screen.width  - width)/2;
  var top    = (screen.height - height)/2;
  var params = 'width='+width+', height='+height;
  params += ', top='+top+', left='+left;
  params += ', directories=no';
  params += ', location=no';
  params += ', menubar=no';
  params += ', resizable=yes';
  params += ', scrollbars=no';
  params += ', status=no';
  params += ', toolbar=no';
  newwin=window.open(url,'calibrate', params);
  if (window.focus) {newwin.focus()}
    return false;
}




})(jQuery);

