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
    
  /**
   * registers key up/down listeners with the window, and also
   * registers mousewheel listener on current element
   * @param zoomFunc function to call on zoom, passes in boolean (true for zoom in, false for zoom out)
   * and the delta (multiple of 0.333, at least on mac)
   */
  $.fn.listenControls = function(zoomFunc) {
    $(this[0]).keydown(function(event){
      // see here for details: http://unixpapa.com/js/key.html
      //console.log(event.keyCode);
      var handled = false;
      switch (event.keyCode) {
        case 37:
        case 40:
        case 63233:
        case 63234:
          zoomFunc(-0.33);
          handled = true;
          break;
        case 38:
        case 39:
        case 63232:
        case 63235:
          zoomFunc(0.33);
          handled = true;
          break;
        default:
          //console.log('received: ' + event.which);
      }
      return !handled;
    });
    $(this[0]).mousewheel(function(event, delta) {
      zoomFunc(delta);
      return false;
    });
  };

  /**
   * Opens the calibration window
   *
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
  }; */

// fetches new lifesize render data for the current image, and re-renders the image with
// the new data. This may be required after calibration or after screen resolution changes
    $.updateRender = function() {
      //#TODO:collect all lifesize images and fetch new ls resolutions for them, then apply
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

  // rounds a number to one digit precision
  $.round1digit = function(num) {
    return Math.round(num*10) / 10;
  };

  $.browserSize = function() {
      var myWidth = 0, myHeight = 0;
      if( typeof( window.innerWidth ) == 'number' ) {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
      } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
      } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
      }
      return {w: myWidth, h: myHeight};
  };

    /**
     * calculates the best possible window size and image render dimensions for the configure popup.
     * It will attempt to provide dimensions that will allow for display of the image in
     * its original resolution, but does use a minimum width/height, and a maximum
     * width/height based on the current screen resolution.
     * @param imgDim render dimensions of image
     * @param minDim minimum dimensions of popup dialog
     * @param popupMargins (optional) margins required around image within popup dialog
     */
    $.calculateBestWindowDim = function(imgDim, minDim, popupMargins) {
      if (!popupMargins) popupMargins = [60,150];
      //console.log("image dimensions");
      //console.dir(imgDim);
      var screenDim = [screen.availWidth, screen.availHeight];

      var dim = new Array();
      for (var i=0; i<2; i++) {
        dim[i] = imgDim[i] + popupMargins[i];
        // make sure it's at least size minDim
        if (imgDim[i] + popupMargins[i] < minDim[i]) dim[i] = minDim[i];
        // make smaller if it's bigger than available screen space
        if (dim[i] > screenDim[i]) dim[i] = screenDim[i];
      }
      return [dim[0], dim[1]];
    };

})(jQuery);
