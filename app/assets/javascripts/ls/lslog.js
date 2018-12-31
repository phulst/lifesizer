/** Logger class */
LsLog = {
    debug: function(msg, obj) {
        this._msg('DEBUG', msg, obj);
    },

    info: function(msg, obj) {
        this._msg('INFO ', msg, obj);
    },

    warn: function(msg, obj) {
        this._msg('WARN ', msg, obj);
    },

    error: function(msg, obj) {
        this._msg('ERROR', msg, obj);
    },

    fatal: function(msg, obj) {
        this._msg('FATAL', msg, obj);
    },

    _msg: function(level, msg, obj) {
        // enable debugging only outside of beta.lifesizer.com
        if (window.console && (location.search.indexOf('lsdebug=true') >= 0 ||
            location.host.indexOf('localhost') == 0 ||
            location.host.indexOf('192.168.0') == 0)) {
            window.console.log(level + " " + msg);
            if (obj && window.console.dir) {
                window.console.dir(obj);
            }
        }
    }
};