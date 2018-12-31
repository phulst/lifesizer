/**
 * (c) 2011-2012  LifeSizer.com
 * Included on any internal page that links to LifeSizer images.
 * Associates click handlers and handles opening the lifesizer popup
 */
//initializes lifesizer upon pageload
function lifesizer(settings) {

    /**
     * set up defaults
     * additional defaults that may be set:
     * popupWidth / popupHeight - minimum dimensions of lifesizer dialog
     */
    settings = jQuery.extend({
        host: null,
        popupWidth: 600,
        popupHeight: 400,
        outerClickSelector: null,
        altText: null
    }, settings);

    /**
     * initializes all click handlers for LifeSize popup
     */
    $(function() {
        var clickElem;
        // if a selector for outerClickHandler is defined, use this
        if (settings.outerClickSelector) {
            clickElem = $(settings.outerClickSelector);
            clickElem.click(function(e) {
                var target = $(this);
                target.css('cursor', 'progress');
                // find the lifesize image within the clicked element
                handleLifeSizeClick(target.find('.lsview'));
            });
        } else {
            // set up lifesizer popup link for each image with class lslink
            var clickElem = $('.lsview');
            clickElem.click(function(e){
                var target = $(this);
                target.css('cursor', 'progress');
                handleLifeSizeClick(target);
            });
        }
        clickElem.hover(hoverOn, hoverOff);
        if (settings.altText) {
            clickElem.attr('alt', settings.altText).attr('title', settings.altText);
        }
    });

    $.fn.lifesizer = function() {
        return this.each(function() {
            var clickElem = $(this).find('.lsview')
            clickElem.click(function(e){
                var target = $(this);
                target.css('cursor', 'progress');
                handleLifeSizeClick(target);
            });
            clickElem.hover(hoverOn, hoverOff);
            if (settings.altText) {
                clickElem.attr('alt', settings.altText).attr('title', settings.altText);
            }
        });
    };

    function hoverOn() {
        $(this).siblings('img').css('opacity', '1.0');
        $(this).siblings('img').css('filter', 'alpha(opacity=100)');
        $(this).css('cursor', 'pointer');
    }
    function hoverOff() {
        $(this).siblings('img').css('opacity', '0.6');
        $(this).siblings('img').css('filter', 'alpha(opacity=60)');
        $(this).css('cursor', 'pointer');
    }

    function handleLifeSizeClick(lsElem) {
        var data = {
            user: lsElem.data('ls-user') || settings.user,
            ref:  lsElem.data('ls-ref'),
            h: screen.height,
            w: screen.width
        };
        if (lsElem.data('ls-prod')) {
           data['p'] = lsElem.data('ls-prod');
        }
        if (mobile) {
            // add device pixel ratio for mobile devices
            var pixRatio = findDevicePixelRatio();
            if (pixRatio) data['r'] = pixRatio;
        }
        var url = "/view";
        if (settings.host) {
            url = "http://" + settings.host + url;
        }
        popup(url, data, settings.popupWidth, settings.popupHeight, lsElem.data('lifesizer'));
    }

    /**
     * returns the device pixel ratio, or false if it could not be determined
     */
    function findDevicePixelRatio() {
        if (window.devicePixelRatio) {
            return window.devicePixelRatio;
        } else if (screen.deviceXDPI) {
           return (screen.deviceXDPI / screen.logicalXDPI);
        }
        return false; // unable to determine
    }

    var mobile = (/(Android|webOS|iPhone|iPad|iPod|BlackBerry|kftt)/i).test(navigator.userAgent);
    var iphone = (/iPhone/).test(navigator.userAgent);

  /**
   * opens popup for lifesizer window
   * @param url url to load in window (should not contain query string)
   * @param params query parameters to add to url
   * @param width - minimum width of popup dialog (may be null or undefined)
   * @param height - minimum height of popup dialog (may be null or undefined)
   * @param lsData additional rendering data (may only be available when used on lifesizer.com)
   */
  function popup(url, params, width, height, lsData) {
    //console.dir(lsData);
    // add parameters to url
    url += '?';
    for (var p in params) {
        url += p + "=" + params[p] + '&';
    }
    url = url.substring(0, url.length-1);

    //alert("render dims = " + lsData.lsw + "x" + lsData.lsh);

    // set width and height from lsData if that property is set
    var dim = [width, height];
    if (lsData) {
      dim = calculateBestWindowDim([lsData.lsw, lsData.lsh], dim);
      if (window.console) { console.log("optimal window dims: " + dim[0] + "x" + dim[1]); }
    }

    //alert("going to open window with dims " + dim[0] +'x' + dim[1]);

    // set up attributes for popup window
    // var left   = (screen.width  - dim[0])/2;
    // var top    = (screen.height - dim[1])/2;
    var params = 'width='+dim[0]+', height='+dim[1];
    //params += ', top='+top+', left='+left;
    params += ', directories=no';
    params += ', location=no';
    params += ', menubar=no';
    params += ', resizable=yes';
    params += ', scrollbars=no';
    params += ', status=no';
    params += ', toolbar=no';

    var newwin;
    if (mobile) {
        newwin = window.open(url,'_blank');
    } else {
        newwin = window.open(url,'lifesize', params);
    }
    if (window.focus) newwin.focus();
    return false;
  }

  /**
   * calculates the best possible window size and image render dimensions for the configure popup.
   * It will attempt to provide dimensions that will allow for display of the image in
   * its original resolution, but does use a minimum width/height, and a maximum
   * width/height based on the current screen resolution.
   * @param imgDim render dimensions of image
   * @param minDim minimum dimensions of popup dialog
   * @param popupMargins (optional) margins required around image within popup dialog
   */
  function calculateBestWindowDim(imgDim, minDim, popupMargins) {
    if (!popupMargins) popupMargins = [40,50];
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
  }

  /**
   * resize an image so it fits within the dimensions passed in, while preserving the original proportions
   * @param img image dimensions [x, y]
   * @param maxDim box dimensions to fit into [width, height]
   * @return render image dimensions [width, height]
   */
  function fitInBox(img, maxDim) {
    var width = img[0]; var height = img[1];
    var maxWidth = maxDim[0]; var maxHeight = maxDim[1];
    if (width <= maxWidth && height <= maxHeight) {
      return img; // no need to resize
    } else if (width > maxWidth && height > maxHeight) {
      // both width and height are too large
      var f1 = width / maxWidth;
      var f2 = height / maxHeight;
      var f = (f1 > f2) ? f1 : f2;
    } else if (width > maxWidth) {
      var f = width / maxWidth; // only width is too large
    } else {
      var f = height / maxHeight; // height is too large
    }
    return [Math.round(width/f), Math.round(height/f)];
  }
}
