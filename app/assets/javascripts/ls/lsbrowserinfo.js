/**
 * copyright 2012-2013, LifeSizer, inc.
 *
 * Browser info class
 */
var LsBrowserInfo = {
    firefox:            false,
    internetExplorer:   false,
    chrome:             false,
    safari:             false,
    windowsOS:          false,
    macOS:              false,
    browserVersion:     0, // only set correctly for IE right now

    init: function() {
        var browser = "unknown browser";
        // set browser
        if (navigator.userAgent.indexOf("Firefox") != -1) {
            this.firefox = true;
            browser = 'Firefox';
        } else if (navigator.userAgent.indexOf("MSIE") != -1) {
            this.internetExplorer = true;
            browser = 'Internet Explorer';
        } else if (navigator.userAgent.indexOf("Chrome") != -1) {
            this.chrome = true;
            browser = 'Chrome';
        } else if (navigator.vendor && navigator.vendor.indexOf("Apple") != -1) {
            this.safari = true;
            browser = 'Safari';
        }
        // set OS
        var os = 'unknown';
        if (navigator.platform.indexOf("Win") != -1) {
            this.windowsOS = true;
            os = 'Windows';
        } else if (navigator.platform.indexOf("Mac") != -1) {
            this.macOS = true;
            os = 'Mac';
        }
        // set browser version for IE
        var srch = 'MSIE';
        var ds = navigator.userAgent;
        var index = ds.indexOf(srch);
        if (index != -1) {
            this.browserVersion = parseFloat(ds.substring(index+srch.length+1));
        }

        var msg = "Browser: " + browser;
        if (this.internetExplorer) {
            msg += " version " + this.browserVersion;
        }
        msg += " on " + os;
        LsLog.debug(msg);
    }
};
LsBrowserInfo.init();