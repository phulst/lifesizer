/**
 * copyright 2012, LifeSizer, inc.
 *
 * This plugin contains a function to open a window based on inner dimension requirements.
 * The Javascript openwindow call will only open a window based on the outer requirements,
 * which will give you different inner size for every OS and browser version.
 *
 * This plugin will ensure a window is opened with predictable inner dimensions regardless
 * of browser/OS.
 *
 * This jquery plugin requires jquery.browserInfo.js
 */
var LsWindow = {

    defaults : function(){
        this.name         = '_blank';
        // window open specs
        this.fullscreen   = false;
        this.directories  = false;
        this.location     = false;
        this.menubar      = false;
        this.resizable    = true;
        this.scrollbars   = false;
        this.status       = false;
        this.titlebar     = false;
        this.toolbar      = false;
    },

    /**
     * returns the differences in width and height between inner dimensions and outer dimensions
     * of a javascript window in the current browser and for current OS.
     * @return two element array for width and height difference
     */
    _dimensionDiff: function() {
        var w, h;
        var i = LsBrowserInfo;
        if (i.macOS) {
            w = 0; // width is always the same
            if (i.firefox) {
                h = 53;
            } else if (i.safari) {
                h = 24;
            } else {
                // other browsers, use what chrome needs
                h = 50;
            }
        } else {
            // assume windows if not mac OS
            if (i.firefox) {
                w = 16;
                h = 87;
            } else if (i.internetExplorer) {
                if (i.browserVersion < 9) {
                    w = 37;
                    h = 111;
                } else {
                    w = 16;
                    h = 67;
                }
            } else {
                // other browsers, assume what chrome needs
                w = 10;
                h = 58;
            }
        }
        return [w, h];
    },

    /**
     * opens a javascript popup window with requested inner dimensions.
     * This doesn't need to adjust width and height, as a window opens up with the requested
     * inner dimensions. (this does mean that the outer dimensions of the window will differ
     * from browser to browser).
     * The following options may be passed in (all values should be boolean)
     *   name   - window name (default '_blank')
     *   directories
     *   location
     *   menubar
     *   resizable
     *   scrollbars
     *   status
     *   titlebar
     *   toolbar
     *
     * @param url url to open
     * @param width requested inner width of browser window
     * @param height request inner height
     * @param options open window opens (see above)
     * @eturn window handle
     */
    open : function(url, width, height, options) {
        var specStr = ""
        function addSpec(name, value) {
            if (specStr.length > 0) {
                specStr += ',';
            }
            var val = value;
            if (typeof value === 'boolean') {
                val = value ? 1 : 0;
            }
            specStr += name + "=" + val;
        }
        var opts = new this.defaults();
        // override any options passed in
        if (typeof options === 'object') {
            for (var o in options) {
                opts[o] = options[o];
            }
        }
        var specNames = ['fullscreen', 'directories', 'location', 'menubar', 'resizable', 'scrollbars', 'status', 'titlebar', 'toolbar'];
        // add all properties to spec
        for (var i=0; i<specNames.length; i++) {
            addSpec(specNames[i], opts[specNames[i]]);
        }
        if (LsBrowserInfo.internetExplorer && LsBrowserInfo.browserVersion >= 9) {
            // IE9 for some reason opens up a browser window with innerdimensions 4px bigger than
            // requested.
            width -= 4;
            height -= 4;
        }
        addSpec('width', width);
        addSpec('height', height);
        LsLog.debug("open window spec = " + specStr);
        return window.open(url, opts.name, specStr);
    },

    /**
     * resizes the current javascript window to get the current inner dimensions. Because the resizeTo function
     * in javascript typically resizes windows to the outer dimensions of the window, we adjust the width and
     * height passed in, based on the current browser and OS.
     * @param width requested inner width
     * @param height requested inner height
     * @param allowSmaller set to false
     */
    resizeTo : function(width, height, allowSmaller) {
        if (typeof allowSmaller === 'undefined') allowSmaller = true;
        // now add width and height
        var diffs = this._dimensionDiff();
        var x = width + diffs[0];
        var y = height + diffs[1];

        var current_x = $(window).width();
        var current_y = $(window).height();
        if (!allowSmaller && (x < current_x || y < current_y)) {
            LsLog.debug("window would become smaller but not allowed");
            return;
        }
        LsLog.debug("resized to outer dimensions " + x + "x" + y);
        window.resizeTo(x,y);
    },

    /**
     * returns true if the page is loaded in a popup.
     * @return {Boolean}
     */
    inPopup : function() {
        return !!window.opener;
        //return LsImages.img[0].ref == window.name
    }
};