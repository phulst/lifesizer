/* Copyright (c) 2008-2011 LifeSizer.com (peter@hollice.com)
 *
 * Requires: $ 1.2.3+
 */

(function($) {

// centers any element in the center of it's parent element
$.fn.centerInParent = function() {
  return this.each(function(){
    var obj = $(this);
    height = obj.parent().height();
    width = obj.parent().width();
    obj.css('top', height/2-obj.height()/2);
    obj.css('left', width/2-obj.width()/2);
  });
};

// scales the matching element with given original width and height to 
// a specified scale (100 being original scale)
$.fn.scaleImg = function(scale, origWidth, origHeight) {
  return this.each(function(){
    var img = $(this);
    img.attr('height', Math.round(origHeight * (scale/100)));
    img.attr('width', Math.round(origWidth * (scale/100)));
    img.centerInParent();
  });
}

// resize an image so it fits within the dimensions passed in, while preserving the original proportions    
$.resizeToMaxDimensions = function(img, maxWidth, maxHeight) {
  width = img.width;
  height = img.height;    
  if (width <= maxWidth && height <= maxHeight) {
    return { width: width, height: height}; // no need to resize
  } else if (width > maxWidth && height > maxHeight) {
    // both width and height are too large
    var f1 = width / maxWidth;
    var f2 = height / maxHeight;
    var f = (f1 > f2) ? f1 : f2; 
  } else if (width > maxWidth) {
    var f = width / maxWidth;
  } else {
    var f = height / maxHeight;
  }
  return { width: Math.round(width/f), height: Math.round(height/f)};
};

/**
 * registers key up/down listeners with the window, and also
 * registers mousewheel listener on current element
 * @param zoomFunc function to call on zoom, passes in boolean (true for zoom in, false for zoom out)
 * and the delta (multiple of 0.333, at least on mac)
 */
$.fn.listenControls = function(zoomFunc) {
  $(window).keypress(function(event){
    // see here for details: http://unixpapa.com/js/key.html    
    switch (event.keyCode) {
      case 37:
      case 40:
      case 63233:
      case 63234:
        zoomFunc(-0.33);
        break;
      case 38:
      case 39:
      case 63232:
      case 63235:
        zoomFunc(0.33);
        break;
      default: 
        //console.log('received: ' + event.which);
    }
  });
  $(this[0]).mousewheel(function(event, delta) {
    zoomFunc(delta);
    return false;
  });
};

// rounds a number to two digits (past decimal point) precision
$.round = function(num) {
  return Math.round(num*100) / 100;
},


// rounds a number to one digit precision
$.round1digit = function(num) {
  return Math.round(num*10) / 10;
}
    
})(jQuery);

