/* Copyright (c) 2011-2013 LifeSizer, Inc.
 *
 * Monitors screen resolution and updates cookie and notifies listeners of
 * screen resolution changes.
 */
var screenRes = {

    // time between polls in ms
    pollInterval : 2000,

    // days until expiration of screen cookie
    screenCookieExpire : 365,

    _lastWidth : null,
    _lastHeight : null,

    // sets the screen cookie
    _setCookie : function(value) {
        var today = new Date();
        today.setTime( today.getTime() );
        var expiresDate = new Date( today.getTime() + (this.screenCookieExpire * 1000 * 3600 * 24) );
        var c_value = value + "; expires=" + expiresDate.toUTCString() + "; path=/";
        document.cookie = "screen=" + c_value;
    },

    // checks if screen resolution has changed and returns something like "1600x1200" if it did.
    _doCheck : function(callback) {
        // TODO: screen.width isn't reliable because it changes in some browsers when zoomed in/out
        // use zoomdetection.trueScreenRes instead.
        var w = screen.width;
        var h = screen.height;
        if (w != this._lastWidth || h != this._lastHeight) {
            // screen resolution is different, screen must have changed
            this._lastWidth = w;
            this._lastHeight = h;
            this._setCookie(w + "x" + h);
            LsLog.info("screen resolution: " + w + "x" + h);
            if (callback)
                callback(w, h);
        }
    },


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
    pollScreen : function(expectedWidth, expectedHeight, onResUpdate) {
        if (!expectedWidth || !expectedHeight)
            expectedWidth = expectedHeight = 0;

        this._lastWidth = expectedWidth;
        this._lastHeight = expectedHeight;
        if (expectedWidth > 0 && expectedHeight > 0) {
            this.setCookie(expectedwidth + "x" + height);
        }

        // check right now
        this._doCheck(onResUpdate);
        var me = this;
        // and check back regularly
        window.setInterval(function() {
            me._doCheck(onResUpdate);
        }, this.pollInterval);
    }
};

screenRes.pollScreen();