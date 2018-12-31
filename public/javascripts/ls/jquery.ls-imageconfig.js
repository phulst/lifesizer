/*
* Copyright (c) 2011 LifeSizer, Inc.
* All Rights Reserved.
*/
//
// Plugin for embedding LifeSizer image configuration with external sites.
//
(function($) {
    var opts;

    /**
     * dynamically loads a set of javascript files
     * @param urls to load
     */
    function loadJavascripts(names) {
        for (var i=0; i<names.length; i++) {
            $.getScript(opts.host + names[i], function(data, textStatus){
                debug('Loaded javascript');
            });
        }
    }

    /**
     * dynamically loads a set of stylesheets
     * @param urls to load
     */
    function loadStylesheets(names) {
        for (var i=0; i<names.length; i++) {
            $("head").append("<link>");
            css = $("head").children(":last");
            css.attr({ rel: "stylesheet", type: "text/css", href: opts.host + names[i] });
            debug('loaded stylesheet: ' + names[i]);
        }
    }

    /**
     * loads all javascript and stylesheet dependencies
     */
    function loadAllDependencies() {

        var css = ['/assets/plugin_config_includes.css'];
        /*
        var css = ["/stylesheets/colorbox/colorbox.css",
                   "/stylesheets/plugins/configure/configure.css"]; */
        loadStylesheets(css);

        var IE_LT_9 = false;
        /*@cc_on
            IE_LT_9 = (@_jscript_version < 9);
        @*/
        var scripts = ['/assets/plugin_config_includes.js'];
        /* unpacked version
        var scripts = ['/javascripts/ls/jquery.drawarrow.js',
                       '/javascripts/ls/jquery.ls-configure.js',
                       '/javascripts/jq/jquery.colorbox-min.js']; */
        if (IE_LT_9) {
            // load raphael on IE < 9 because canvas isn't supported there
            scripts.push(opts.host + "/javascripts/ext/raphael-min.js");
        }
        loadJavascripts(scripts);
    }

    /**
     * disable bubbling up of event to other elements
     * @param event
     */
    function cancelEventBubble(event) {
        if ('cancelable' in event) {
            // in Firefox, the cancelable property always returns true,
            // so the cancelable state of the event cannot be determined
            if (event.cancelable) {
                event.preventDefault ();
            }
        } else {
            event.returnValue = false;
        }
        if ('bubbles' in event) {   // all browsers except IE before version 9
            if (event.bubbles) {
                event.stopPropagation ();
            }
        } else {  // Internet Explorer before version 9
            // always cancel bubbling
            event.cancelBubble = true;
        }
        return false;
    }

    /**
     * main plugin method. Adds button to all matching elements that will open the LifeSizer
     * configuration lightbox.
     * @param options
     * @param callback optional callback function that will notify of completed configuration
     * (and will pass in the reference)
     */
    $.fn.lifeSizerImageConfigure = function(options, callback) {
        // merge options with default options
        opts = $.extend({}, $.fn.lifeSizerImageConfigure.defaults, options);

        loadAllDependencies();

        return this.each(function() {
            // wrap the element with a div
            var lsImage = $(this);
            lsImage.wrap('<div class="ls-image-container" style="position:relative;padding:0;margin:0;"/>');
            // add a button to the element
            lsImage.after('<div style="position:absolute;bottom:0;left:20px;"><button>Calibrate for LifeSize display</button></div>');
            lsImage.next().children('button').click(function(event) {

                // set the full size url from the data-ls-image-url attribute, fall back on 'src' attribute
                var fullSizeUrl = lsImage.attr('data-ls-image-url');
                if (!fullSizeUrl) {
                    // data-ls-image-url attribute not set, use the same as the image src
                    fullSizeUrl = lsImage.attr('src');
                }
                if (!fullSizeUrl) {
                    fullSizeUrl = opts.fullSizeUrl; // fall back on plugin options
                }
                if (fullSizeUrl.indexOf('http') != 0) {
                    // prefix relative urls with protocol and hostname
                    var protocol = (document.location.protocol.indexOf('https') == 0) ? 'https://' : 'http://';
                    fullSizeUrl = protocol + document.location.host + fullSizeUrl;
                }
                // set the image name from the title attribute
                var name = lsImage.attr('title');
                if (!name) {
                    name = opts.name;
                }
                // set the reference from the data-ls-ref attribute
                var ref = lsImage.attr('data-ls-setref');
                if (!ref) {
                    ref = lsImage.attr('src');
                }

                // configure and open popup
                $.lifeSizerLightboxConfigure( {
                    imageUrl: fullSizeUrl,
                    name: name,
                    reference: ref,

                    host: opts.host,
                    appKey: opts.appKey
                }, function(ref) {
                    lsImage.attr('data-ls-ref', ref);
                    // reinitialize lifesizer if set on page
                    if (window.Ls) {
                        window.Ls.init();
                    }
                    if (callback) {
                        // call callback handler if defined
                        callback.call(this, ref);
                    }
                });

                return cancelEventBubble(event);
            });
        });
    };

    /**
     * default plugin options
     */
    $.fn.lifeSizerImageConfigure.defaults = {
        host: 'http://beta.lifesizer.com'
    };

    /**
     * log a message to the console
     * @param msg message string
     * @param obj object to log with console.dir
     */
    function info(msg, obj) {
        if (window.console && window.console.log) {
            console.log(msg);
            if (obj && window.console.dir) {
                console.dir(obj);
            }
        }
    }
    function debug(msg, obj) {
        if (window.lifesizer_debug) {
            info(msg, obj);
        }
    }
})(jQuery);
