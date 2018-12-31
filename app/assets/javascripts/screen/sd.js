// Copyright 2011-2012, LifeSizer, inc.
/**
 * this class can use various (browser dependent) methods to determine the true
 * screen resolution and the current zoom level of the browser.
 */
function ScreenDetection() {
    var COMMON_RES = [[1024,768],[1280,800],[1366,768],[1440,900], [1280,1024], [1680,1050],[1920,1080],[1600,900],[800,600],
		    	  [2560,1440],[320,480], [1152,864],[1280,768], [1920,1200], [1024,600], [1280,720], [768,1024],[1280,960],
			      [1360,768],[1024,640],[1152,720],[2560,1440],[1024,1024], [1600,1200],[1400,1050],[480,800], [640,480],
    		      [960,600], [2560,1600],[800,480], [1600,1000],[2048,1152]];

	// PRIVATE
	var initCalled = false;

    /**
     * adjusts for inconsistencies between zoom calculations and reported screen width and screen height by browsers.
     * For example, my 1440x900 screen reports as 2160x1350 with a reported zoom of 0.67. However, when you apply
     * the zoom factor to determine the true screen resolution, you end up with 1447x904. This function uses a list
     * of common screen resolutions and returns the first one that falls within a 15pix error margin.
     */
    function nearestScreenDimensions(width, height) {
	    // common screen resolutions from screenresolution.org

	    function almostSame(exp, val) {
		    var pix = 15; // threshold
		    return (val > exp-pix) && (val < exp+pix);
	    }
	    for (var i=0;i<COMMON_RES.length;i++) {
		    var r = COMMON_RES[i];
		    if (almostSame(r[0], width) && almostSame(r[1], height)) {
			    return r;
		    } else if (almostSame(r[0], width) && almostSame(r[1], height)) {
                // match, but with x/y flipped.
                return [r[1],r[0]];
            }
	    }
	    // nothing found that matches anything in this list.
	    return null;
    }

    /**
     * Zoom levels aren't accurately reported in Firefox, so this function replaces
     * these zoom levels with the more accurate value.
     */
    function fixZoomLevel(zoom) {
        var zoomAdj = zoom;
        if (LsBrowserInfo.firefox) {
            switch (zoom) {
                case 0.67:
                    zoomAdj = 0.6666;
                    break;
                case 0.9:
                    zoomAdj = 0.8955;
                    break;
                case 1.09:
                    zoomAdj = 1.0909;
                    break;
                case 1.33:
                    zoomAdj = 1.3333;
                    break;
                case 1.71:
                    zoomAdj = 1.71428;
                    break;
            }
        }
        // on firefox or in IE, we can further improve the zoom number accuracy by using commonly known
        // screen resolutions.
        if ((LsBrowserInfo.firefox || LsBrowserInfo.internetExplorer) && zoomAdj != 1.0) {
            var nearest = nearestScreenDimensions(screen.width*zoomAdj, screen.height*zoomAdj);
            if (nearest) {
                // assuming that we found the true screen resolution, we can now adjust the zoom to a more accurate value
                zoomAdj = nearest[0] / screen.width;
            }
        }
        return zoomAdj;
    }

	// PUBLIC

	// holds the current zoom level. Will return 1.0 if unknown.
	this.zoom = 1.0;

	// true if a usuable zoom detector was found (after calling init())
	this.canDetectZoom = false;

	/**
	 * watch the browser zoom value, and call the callback function if the zoom has changed.
     * The object passed to the callback function has properties:
     * zoom - the zoom value (1 = 100%)
	 * init - true upon first callback, false for every subsequent call
	 */
	this.watchZoom = function(callback) {
		if (initCalled) return false; // already initialized once
        initCalled = true;

        if (top !== self) {
            LsLog.debug("displaying in iframe, unable to detect browser zoom");
            return;
        }

		// initialize all detectors
		//var detectors = [ new IEZoomDetector(), new ChromeZoomDetector(), new FlashZoomDetector() ];
        var detectors = [ new IEZoomDetector(), new ChromeZoomDetector() ]; // not using Flash detector for now
		for (var i=0; i<detectors.length; i++) {
			if (detectors[i].canDetectZoom()) {
				// this one can be used
				this.canDetectZoom = true;
                var me = this;
				detectors[i].trackZoomLevel(function(obj){
                    //console.log("received zoom " + obj.zoom);
					me.zoom = fixZoomLevel(obj.zoom);
                    obj.zoom = me.zoom; // fix it in obj before passing back
                    LsLog.info("determined zoom " + obj.zoom + " using " + detectors[i].name + " detector");
                    if (callback) {
					    callback(obj);
                    }
				});
				return;
			}
		}
        LsLog.debug("no zoom detector available for browser with agent: " + navigator.userAgent);
	}

    /**
     * checks periodically if the screen resolution has changed. If so,
     * fires callback and passes width and height back. Callback will always be called at least once.
     * @param callback function to call if resolution has changed. Passes parameters width, height, and init (only true
     * during first callback)
     */
    this.watchScreenRes = function(callback) {
        var cb = callback;
        var w = 0;
        var h = 0;
        var onInit = true;
        var me = this;

        /** returns true if aspect ratio of previous and current screen res is the same */
        function sameAspectRatio(prev, now) {
            // ignore rounding errors
            return Math.round(prev[0]*100/now[0]) == Math.round(prev[1]*100/now[1]);
        }

        function checkScreenRes() {
            var screenRes = me.trueScreenRes();
            if (screenRes.w != w || screenRes.h != h) {
                LsLog.info("screen res change (from " + w + "x" + h + " to " + screenRes.w + "x" + screenRes.h + ")");
                // resolution has changed. But did it really?
                // It may be a Firefox browser that just zoomed in/out
                if (!me.canDetectZoom && sameAspectRatio([screenRes.w,screenRes.h],[w,h])) {
                    LsLog.warn("suspected Firefox zoom");
                }
                w = screenRes.w;
                h = screenRes.h;
                cb(w, h, onInit);
            }
            onInit = false;
        }
        checkScreenRes();
        setInterval(checkScreenRes, 2000);
    }

    /**
     * returns the current screen resolution as an object { w: 1900, h:1080 }
     * This is the same as { w: screen.width, h: screen.height } but some browsers
     * (such as IE and Firefox) will start returning adjusted values if the
     * zoom level isn't 100%. For example, Firefox will return 720x450 instead of
     * 1440x900 if zoomed in to 200%.
     */
    this.trueScreenRes = function() {
        var zoom = this.zoom;
        var screenWidth = screen.width;
        var screenHeight = screen.height;
        if ((LsBrowserInfo.firefox || LsBrowserInfo.internetExplorer) && zoom != 1.0) {
            var nearest = nearestScreenDimensions(screenWidth*zoom, screenHeight*zoom);
            if (nearest) {
                // assuming that we found the true screen resolution, we can now adjust the zoom to a more accurate value
                //console.log ("found nearest " + nearest[0] + "x" + nearest[1] +  "for dim " + screenWidth + "x" + screenHeight + ", zoom before " + zoomAdj);
                //this.zoom = nearest[0] / screenWidth;
                //console.log ("zoom adjusted to " + this.zoom);
                return { w: nearest[0], h: nearest[1] };
            } else {
                return { w: Math.round(screenWidth*zoom), h: Math.round(screenHeight*zoom) };
            }
        }
        return { w: screenWidth, h: screenHeight };
    }

    /**
     * uses the CSS media queries to get the PPI for the current screen. This currently only appears
     * to work on Firefox on some mac systems. Will return 0 in any browsers that don't support
     * media queries. Even if this method returns a value, it's still likely that it's incorrect,
     * as (windows) systems appear to have ppi values set that aren't actually correct.
     * Also (at least on my mac) the value returned by this function may need to be adjusted for
     * the current zoom level. At 100% zoom, I get 127ppi, but at 80% zoom it returns 101.
     */
    this.findPpi = function() {
        var a = 20; // lowest possible value
        var b = 1200; // highest possible value
        var x;

        if (!window.matchMedia || !window.matchMedia('(min-resolution: ' + a + 'dpi)').matches) {
            // min-resolution media query must not be supported
            return 0;
        }
        while (a < b - 1) {
            x = Math.round((a+b) / 2);
            var tst = window.matchMedia('(min-resolution: ' + x + 'dpi)').matches;
            //console.log("testing on " + x + ", result = " + tst);
            if (tst) {
                a = x;
            } else {
                b = x;
            }
        };
        return a;
    }

    /**
     * this Zoom detector will work for IE 7/8/9
     */
    function IEZoomDetector() {

        // PRIVATE
        var currentZoom = -1.0;
        var init = true;
        var callback;

        // returns zoom percentage with 2 decimals precision (ie 133.33)
        function getZoomLevel() {
            if (screen.systemXDPI) {
                // IE 8 or later
                return (screen.deviceXDPI / screen.logicalXDPI);
            }

            // IE7
            if (document.body.getBoundingClientRect) {
                // rect is only in physical pixel size in IE before version 8
                var rect = document.body.getBoundingClientRect();
                var physicalW = rect.right - rect.left;
                var logicalW = document.body.offsetWidth;
                // the zoom level is always an integer percent value
                return (physicalW / logicalW);
            }
            return 1.0;
        }

        this.intervalCheck = function() {
            var newZoom = getZoomLevel();
            if (newZoom != currentZoom) {
                // zoom has changed
                currentZoom = newZoom;
                callback({ zoom:newZoom, init:init});
            }
            init = false;
        };

        // PUBLIC

        // name for identification
        this.name = "ie";

        // returns true if the zoom level can be determined using this detector
        this.canDetectZoom = function() {
            // if we find the deviceXDPI property is found in screen, we must be on Windows
            // and can determine the zoom level this way
            return ('deviceXDPI' in window.screen);
        }

        // tracks the browser zoom level and calls the callback method with two
        // parameters zoom and init.
        // Zoom will have the zoom percentage, and init will be false except for the
        // first callback.
        this.trackZoomLevel = function(cb) {
            callback = cb;
            // there's no events that fire on zoom change, so simple check at 1 sec interval
            this.intervalCheck();
            setInterval(this.intervalCheck, 1000);
        }
    }

    /**
     * this Zoom detector will work in Chrome and Safari. This approach is based on the fact
     * that window.outerWidth will remain the same if the zoom is increased, while window.innerWidth
     * will get smaller
     */
    function ChromeZoomDetector() {

        // PRIVATE
        var currentZoom = -1.0;
        var init = true;
        var callback;

        // returns zoom percentage with 2 decimals precision (ie 133.33)
        function getZoomLevel() {
            // on Mac there's no horizontal border width in browsers
            var windowBorderWidth = 0;
            if (!LsBrowserInfo.macOS) {
                var widthDiff = window.outerWidth - window.innerWidth;
                if (widthDiff > 0 && widthDiff <= 16) {
                    // zoom must be 100%, outer and inner width almost the same
                    windowBorderWidth = widthDiff;
                } else {
                    // we're probably at a different zoom level. Assume borderwidth 16, except for Chrome it's 10
                    windowBorderWidth = LsBrowserInfo.chrome ? 10 : 16;
                }
            }

            return Math.round((window.outerWidth - windowBorderWidth) * 100 / window.innerWidth) / 100;
        }

        this.intervalCheck = function() {
            var newZoom = getZoomLevel();
            if (newZoom != currentZoom) {
                // zoom has changed
                currentZoom = newZoom;
                callback({ zoom:newZoom, init:init});
            }
            init = false;
        };

        // PUBLIC

        // name for identification
        this.name = "chrome";

        // returns true if the zoom level can be determined using this detector
        this.canDetectZoom = function() {
            // this can be used on Chrome or Safari
            return (LsBrowserInfo.chrome || LsBrowserInfo.safari);
        }

        // tracks the browser zoom level and calls the callback method with two
        // parameters zoom and init.
        // Zoom will have the zoom percentage, and init will be false except for the
        // first callback.
        this.trackZoomLevel = function(cb) {
            callback = cb;
            // there's no events that fire on zoom change, so simple check at 1 sec interval
            this.intervalCheck();
            setInterval(this.intervalCheck, 1000);
        }
    }

    /**
     * Zoom detector that uses a tiny Flash app to detect and track zoom level. This will require
     * swfZoomDetection.js and the swf file to be included as well
     */
    function FlashZoomDetector() {

        // PRIVATE
        var currentZoom = 100.0;

        // name for identification
        this.name = "flash";

        // returns true if the zoom level can be determined using this detector
        this.canDetectZoom = function() {
            return swfZoomDetection.hasPlayerVersion();
        }

        // tracks the browser zoom level and calls the callback method with two
        // parameters zoom and init.
        // Zoom will have the zoom percentage, and init will be false except for the
        // first callback.
        this.trackZoomLevel = function(cb) {
            swfZoomDetection.init({
                'onZoomChange': function(obj) {
                    cb({zoom: obj.scale, init: obj.init});
                 },
                'getInitIfOne': true,
                'initCallOnly': false,
                'frameRate': 5
            });
        }
    }
}





