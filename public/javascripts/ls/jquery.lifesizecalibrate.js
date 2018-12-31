/* Copyright (c) 2008 LifeSizer.com (peter@hollice.com) 
 *
 * Requires: $ 1.2.3+
 */

(function($) {

// resize the calibration image based on the set screen diameter and calibration image properties
$.fn.resizeWithDiam = function(diam, cal) {
    img = $(this[0]);
    // calculate width in inches of screen
    w = screen.width;
    h = screen.height;
    // calculate dpi of screen
    dpi = w / Math.sqrt((Math.pow(diam,2) * Math.pow(w,2)) / (Math.pow(w,2) + Math.pow(h,2)));
    //console.log("dpi for diam of " + diam + " would be " + dpi);
	f = dpi / cal.d;
    img.attr('height', Math.round(cal.h * f));
    img.attr('width',  Math.round(cal.w * f));
    //img.centerInParent();
};
    
// sends the calibration settings back to the server
$.fn.save = function(cal) {
  img = $(this[0]);
  //console.log("image dimensions are now: " + img.width() + "x" + img.height() + ", scale = " + img.attr('scale') + ", attr width = " + img.attr('width'));
  location.href="/calibrate/save?ws=" + img.width() + "&wc=" + cal.w + "&wd=" + cal.d;
};
    
    
})(jQuery);

