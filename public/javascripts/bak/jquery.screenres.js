/* Copyright (c) 2008-2011 LifeSizer.com (peter@lifesizer.com)
 *
 * Requires: $ 1.2.3+
 */
(function($) {

    // time between polls in ms
    var POLL_INTERVAL = 2000;
    // days until expiration of screen cookie
    var SCREEN_COOKIE_EXPIRE = 365;

    var methods = {
        lastWidth : null,
        lastHeight : null,

        // sets the screen cookie
        setCookie : function(value) {
            var today = new Date();
            today.setTime( today.getTime() );
            var expiresDate = new Date( today.getTime() + (SCREEN_COOKIE_EXPIRE * 1000 * 3600 * 24) );
            var c_value = value + "; expires=" + expiresDate.toUTCString() + "; path=/";
            //console.log("setting cookie: screen=" + c_value);
            document.cookie = "screen=" + c_value;
        },
        // initializes values for width and height, and sets screen cookie
        init : function(width, height) {
            lastWidth = width;
            lastHeight = height;
            if (width > 0 && height > 0) {
                this.setCookie(width + "x" + height);
            }
        },
        // checks if screen resolution has changed and returns something like "1600x1200" if it did.
        doCheck : function(callback) {
            // TODO: screen.width isn't reliable because it changes in some browsers when zoomed in/out
            // use zoomdetection.trueScreenRes instead. 
            var w = screen.width;
            var h = screen.height;
            if (w != lastWidth || h != lastHeight) {
                // screen resolution is different, screen must have changed
                lastWidth = w;
                lastHeight = h;
                this.setCookie(w + "x" + h);
                if (callback)
                    callback(w, h);
            }
        }
    };

    /**
     * checks occasionally if the current screen resolution has changed, and calls a callback function
     * with parameters width and height if this is detected. Also sets a screen cookie with value like
     * 'screen=1600x1200'.
     * All parameters are optional.
     * @param expectedWidth width that screen is expected to have on page load. If, on first check, the
     * screen resolution matches this width and height, the onResUpdate callback will not be called.
     * @param expectedHeight height that screen is expected to have on page load
     * @param onResUpdate callback function with 2 parameters width and height that will be called if
     * screen resolution is changed
     */
    $.pollScreen = function(expectedWidth, expectedHeight, onResUpdate) {
        if (!expectedWidth || !expectedHeight)
            expectedWidth = expectedHeight = 0;

        // register expected dimensions
        methods.init(expectedWidth, expectedHeight);
        // check right now
        methods.doCheck(onResUpdate);
        // and check back regularly
        window.setInterval(function() {
            methods.doCheck(onResUpdate);
        }, POLL_INTERVAL);
    };
     
})(jQuery);
