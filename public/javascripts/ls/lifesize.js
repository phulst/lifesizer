
/*
 * init parameters: 
 *
 * screenDiam - screen diameter (in inches, but can be passed in in cm when specified as a String 
 *   ending in cm, like '30cm'
 * 
 * options hash: 
 *
 * autoRender - set to false if you don't want all images to immediately render to true size 
 *   upon pageload or upon calling setScreenSize() (default true)
 * useCoookies - set to false if you don't want this script to store screen settings in a user's
 *   cookie (default true)
 * maxScreenDiam - the maximum allowable screen diameter. May be set to prevent layout issues. Default
 *   is set to 60 inches
 * screenResolution - screen resolution in format {width: w, height: h}. This does typically not need
 *   to be specified because in most cases this can be determined by javascript. However this may 
 *   not work in a virtual machine, when the entire operating system is running within a window of another 
 *   operating system.  
 * minScreenDiam - the minimum allowable screen diameter. May be set to prevent layout issues. Default
 *   is 10 inches. 
 * cookieExpires - number of days after which cookie should expires. default 365
 * cookieDomain - domain for which to store cookie. Default is name of current host
 * cookiePath - path to use when storing cookie, default '/'
 * cookieSecure - set to true if secured cookies required (when using https)
 */
var lifeSize = {
  options : {},
  screenDiam : 0,
  screenPixDimensions : { width: 0, height: 0},
  screenDimensions : { width: 0, height: 0 },
  images : [],
  dimensions : [],
  renderListeners : [],
  COOKIE_NAME : "screenSize",
 
  // initialize this object
  init : function(screenDiam, options) {
    this.screenDiam = screenDiam;
    if (options) {
      this.options = options;
    }
    // set default options
    if (this.options.autoRender == undefined) { this.options.autoRender = true }
    if (this.options.useCookies == undefined) { this.options.useCookies = true }
    if (this.options.maxScreenDiam == undefined) { this.options.maxScreenDiam = 60 }
    if (this.options.minScreenDiam == undefined) { this.options.minScreenDiam = 10 }
    if (this.options.cookieExpires == undefined) { this.options.cookieExpires = 365 }
    
    // store the screen resolution
    if (this.options.screenResolution) {    
      this.screenPixDimensions = this.options.screenResolution;
    } else {
      this.screenPixDimensions.height = screen.height;
      this.screenPixDimensions.width = screen.width;
    }

    // get screen diameter from cookies if necessary
    if (this.options.useCookies) {
      var diam = 0;
      val = this.getCookieValue();
      if (val != null) {
        diam = this.getScreenSizeForResolutionFromCookie(val)
      }
      if (diam > 0) {
        this.screenDiam = diam;
      }
    }
    
    // set screen size if specified and render all images: don't store in cookie right now because 
    // it's either a default or it already came from a cookie
    this.setScreenSize(this.screenDiam, false);
  },
  
  saveDiam : function() {
    this.setScreenSize(this.screenDiam, true);
  },
  
  // called to set the screen size in inches diameter. The storeInCookie parameter is 
  // optional. You may set it to false to disable storing the diameter in a browser cookie. 
  // If not set, or set to true, it will follow the useCookies option.
  setScreenSize : function(diam, storeInCookie) {
    this.screenDiam = this.round(diam);
    if (this.screenDiam > this.options.maxScreenDiam ) { this.screenDiam = this.options.maxScreenDiam }
    if (this.screenDiam < this.options.minScreenDiam ) { this.screenDiam = this.options.minScreenDiam }
    
    // update any span with a class of screenDiameter
    if ($('span.screenDiameter').length > 0) {
      $('span.screenDiameter').html(this.screenDiam);
    }
    // update any input element with a div of screenDiamInput
    if ($('input#screenDiamInput').length > 0) {
      $('input#screenDiamInput').val(this.screenDiam);
    }
    
    this.calcScreenDimensions();
    if (this.options.autoRender) { 
      this.renderAll();
    }
    // also set size in cookie if option enabled
    if (this.options.useCookies && storeInCookie != false) {
      this._storeCurrentScreenSizeInCookie();
      //value = this.screenPixDimensions.width + "x" + this.screenPixDimensions.height + "_" + diam;
      //alert('setting cookie: ' + value);
      //$.cookie(this.COOKIE_NAME, value, {expires: 365, path: '/' });
      //alert ("storing screen size " + value + " in cookie");
    }
  },

  addRenderListener : function(func) {
    this.renderListeners.push(func);
  },
  
  // renders all images, specify a list of elements to render, or specify nothing to render all. 
  renderAll : function(elements, scale) {
    for (var i=0; i<this.renderListeners.length; i++) {
      this.renderListeners[i].call();
    }
  
    if (scale == undefined)
      scale = 100;
    if (elements == undefined)
      elements = $("img.lifeSize").get()
    for (var i=0; i<elements.length; i++) {
      this.render(elements[i], scale);
    }
  },

  // renders an image to life size, using the trueHeight or trueWidth property, and the scale
  // property set in the <image> element itself
  render : function(image, scale) {
    if (scale == undefined)
      scale = 100;
    absHeight = image.getAttribute('absHeight');
    absWidth = image.getAttribute('absWidth');
    scale = image.getAttribute('scale');
    
    if (this.screenDiam == 0 || (!absHeight && !absWidth))
      return;  // can't render if diameter isn't set or if neither absHeight nor absWidth were specified
    
    origDim = this.getOriginalDimensions(image);
    if (absHeight)
      this.renderImageToHeight(image, origDim.width, origDim.height, absHeight, scale);  
    else
      this.renderImageToWidth(image, origDim.width, origDim.height, absWidth, scale);
    
    // set the position of this image if it is a centered image  
    if (this.isCenteredImage(image)) {
      this.centerAtAbsolutePosition(image);
    }  
  },
  
  // returns absolute width and height in inches of the specified image
  getAbsoluteDimensions : function(image) {
    absHeight = image.getAttribute('absHeight');
    absWidth = image.getAttribute('absWidth');
    origDim = this.getOriginalDimensions(image);
    if (absHeight) {
      height = this.toInches(absHeight);
      width = origDim.width * height / origDim.height;
    } else {
      width =  this.toInches(absWidth);
      height = origDim.height * width / origDim.width;
    }
    return {width: this.round(width), height: this.round(height)};
  },
  
  renderImageToWidth : function (image, origPixWidth, origPixHeight, absWidth, scale) {
    dim = this.getDimensionsToWidth(origPixWidth, origPixHeight, absWidth, scale);
    this.renderNewSize(image, dim);
  },
  
  renderImageToHeight : function (image, origPixWidth, origPixHeight, absHeight, scale) {
    dim = this.getDimensionsToHeight(origPixWidth, origPixHeight, absHeight, scale);
    this.renderNewSize(image, dim);    
  },

  // renders a given image element to given dimensions 
  renderNewSize : function (image, dimensions) {
    image.setAttribute("width", dimensions.width);
    image.setAttribute("height", dimensions.height);
  },
  
  // returns the pixel dimensions that an image should get to scale it to a absolute width. 
  // The absolute height should be specified in inches. Scale is optional, if left out, it will assume value 100. 
  // A scale of 150 will return dimensions for the image that would actually render it at 150% of the real life size. 
  getDimensionsToWidth : function (origPixWidth, origPixHeight, absWidth, scale) {
    absWidth = this.toInches(absWidth);
    scaleFactor = (absWidth * this.screenPixDimensions.width) / (this.screenDimensions.width * origPixWidth);
    if (scale)
      scaleFactor *= scale / 100;
    return { width : Math.round(scaleFactor * origPixWidth),
      height : Math.round(scaleFactor * origPixHeight) };
  },

  // returns the pixel dimensions that an image should get to scale it to an absolute height.
  // The absolute height should be specified in inches. Scale is optional, if left out, it will assume value 100. 
  // A scale of 150 will return dimensions for the image that would actually render it at 150% of the real life size. 
  getDimensionsToHeight : function (origPixWidth, origPixHeight, absHeight, scale) {
    absHeight = this.toInches(absHeight);
    scaleFactor = (absHeight * this.screenPixDimensions.height) / (this.screenDimensions.height * origPixHeight);
    if (scale)
      scaleFactor *= scale / 100;
    return { width : Math.round(scaleFactor * origPixWidth),
      height : Math.round(scaleFactor * origPixHeight) };
  },
  
  // returns the original image dimensions that should have been set with 'width' and 'height' properties
  getOriginalDimensions : function (image) {
    for (var i=0; i<this.images.length; i++){
      img = this.images[i];
      if (image == img) 
        return this.dimensions[i];
    }
    // didn't find it: the current dimensions are the original dimensions. 
    dim = { width : image.width, height : image.height };
    // Also store the top and left position, we'll need those later if this is a centered image
    if (this.isCenteredImage(image)) {
      dim.top = $(image.parentNode).css('top');
      dim.left = $(image.parentNode).css('left');
    }
    this.images.push(image);
    this.dimensions.push(dim);
    //alert("storing original dimensions: " + dim.width + "x" + dim.height);
    return dim;
  },
  
  // calculates the actual height and width of the screen based on screen diameter 
  calcScreenDimensions : function() {
  
    if (this.options.screenResolution == undefined) {    
      this.screenPixDimensions.height = screen.height;
      this.screenPixDimensions.width = screen.width;
    }
    y = this.screenPixDimensions.height;
    x = this.screenPixDimensions.width;
    d = this.screenDiam;
    this.screenDimensions.width = Math.sqrt((Math.pow(d,2) * Math.pow(x,2)) / (Math.pow(x,2) + Math.pow(y,2)));
    this.screenDimensions.height = this.screenDimensions.width * y / x;
    //alert("screen is " + x + "x" + y);
    
  },
  
  // returns the dots per inch of the user's monitor
  getDpi : function() {
    return this.round(this.screenPixDimensions.width / this.screenDimensions.width);
  },
  
  // may be used as an alternative to setScreenSize, if the screen diameter is not available 
  // but the DPI is. (with the dpi and the current screen resolution, the screen diameter 
  // can be derived)
  setDpi : function(dpi, storeInCookie) {
    var width = this.screenPixDimensions.width / dpi; 
    var height = this.screenPixDimensions.height / dpi; 
    var screenDiam = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
    this.setScreenSize(screenDiam, storeInCookie);
  },
  
  // changes the position of an image so the centerpoint will stay the same after 
  // changing the screen diameter or the image scale. This will only work for images that 
  // are wrapped in a div with class 'centered_image'
  centerAtAbsolutePosition : function(image) {
    dim = this.getOriginalDimensions(image);
    if (dim.top == undefined) {
      dim.top = "200px"; // this should never happen
      dim.left = "200px"; 
    }
    xc = image.getAttribute("width");
    yc = image.getAttribute("height");
    // set position on parent (which should be a div)
    $(image).parent().css('left', Math.round(parseInt(dim.left) - parseInt(xc)/2) + "px");
    $(image).parent().css('top', Math.round(parseInt(dim.top) - parseInt(yc)/2) + "px");
  },
  
  // sets a new center position for a centered image. Will not render it at that position, unless
  // you call centerAtAbsolutePosition() afterwards
  setCenterPosition : function(image, top, left) {
    dim = this.getOriginalDimensions(image);
    if (dim != null) {
      dim.top = top + "px";
      dim.left = left + "px";
    }
  },
  
  // converts any size to inches. A size can be in format 10.0, 10.0in, 10.0cm or 10.0mm
  toInches : function(size) {
    n = size.toLowerCase();
    if ((idx = n.indexOf('mm')) > 0) {
      num = n.substring(0, idx);
      size = num / 25.4;
    } else if ((idx = n.indexOf('cm')) > 0) {
      num = n.substring(0, idx);
      size = num / 2.54;
    } 
    return size;
  }, 
  
  // rounds a number to two digits (past decimal point) precision
  round : function(num) {
    return Math.round(num*100) / 100;
  },
  
  // rounds a number to one digit precision
  round1digit : function(num) {
    return Math.round(num*10) / 10;
  },
  
  // returns whether a given image is a centered image. If true, the 'top' and 'left' 
  // style attributes will actually refer to the center point of the image, and the 
  // image will be resized (when screen size is adjusted) while keeping the same center point.
  isCenteredImage : function(image) {
    return ($(image).parent().attr('class') == "centered_image");
  },
  
  // returns the raw cookie value containing any screens and sizes that were stored for this computer
  getCookieValue : function() {
    var val = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      var name = this.COOKIE_NAME;
      $.each(cookies, function(i,cookie){
        c = $.trim(cookie);
        if (c.substring(0, name.length + 1) == (name + '=')) {
          val = decodeURIComponent(c.substring(name.length + 1));
        }  
      });
    }
    return val;
  }, 
  
  // returns the screen size that was stored in a local cookie for the current screen resolution, or -1 if nothing was set
  getScreenSizeForResolutionFromCookie : function(cookieValue) {
    storedVals = cookieValue.split('|');
    for (var i=0; i<storedVals.length; i++) {
      var re = /(\d+)x(\d+)_(.*)/
      var result = storedVals[i].match(re);
      if (result != null) {
        var width = result[1];
        var height = result[2];
        var size = result[3];
        // if this screen matches with the current screen, return its size
        if (width == this.screenPixDimensions.width && height == this.screenPixDimensions.height) {
          return size;
        }
      }
    }
    return -1; // nothing found
  },
  
  _storeCurrentScreenSizeInCookie : function() {
    newValue = this.screenPixDimensions.width + "x" + this.screenPixDimensions.height + "_" + this.screenDiam;
    val = this.getCookieValue();
    if (val == null) {
      // cookie didn't exist yet
      newCookie = newValue;  
    } else if (this.getScreenSizeForResolutionFromCookie(val) < 0) {
      // cookie already existed, but no size stored yet for current screen dimensions
      newCookie = val + "|" + newValue;
    } else {
      // cookie already existed with an old size... update this
      repl = "(" + this.screenPixDimensions.width + "x" + this.screenPixDimensions.height + "_)";
      replaceRegExp = new RegExp(repl + "[.\\d]+");
      newCookie = val.replace(replaceRegExp, "$1" + this.screenDiam);
    }
    this._storeCookie(newCookie);
  }, 
  
  _storeCookie : function(value) {
    var date = new Date();
    date.setTime(date.getTime() + (this.options.cookieExpires * 24 * 60 * 60 * 1000));
    var expires = '; expires=' + date.toGMTString();
    var path = this.options.cookiePath ? '; path=' + this.options.cookiePath : '';
    var domain = this.options.cookieDomain ? '; domain=' + this.options.cookieDomain : '';
    var secure = this.options.cookieSecure ? '; secure' : '';
    cookie = [this.COOKIE_NAME, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    //alert("setting cookie: " + cookie);
    document.cookie = cookie;
  }
}

