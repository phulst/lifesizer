/*
 * Copyright (c) 2012 LifeSizer, Inc. - All Rights Reserved.
 * Author: Peter Hulst
 *
 * Bookmarklet for adding/modifying LifeSizer images.
 */
LsBookmarklet = new function() {
    var delegate;
    var me = this;

    function GenericMatcher() {
        /**
         * private: returns proposed title for LifeSizer image
         */
        this.getTitle = function(elem) {
            return document.title;
        }

        /**
         * private: returns suggested reference to use. Checks to see if an <a> element with data-ls-ref property is
         * present on the page.
         */
        this.getReference = function(elem) {
            // first, check if the element passed in has a data-ls-ref attribute set
            elem = jQuery(elem);

            var m = elem.attr('data-ls-ref');
            if (m) { return m; }

            // check if the element has a direct parent with a data-ls-ref tag
            m = elem.parent().attr('data-ls-ref');
            if (m) { return m; }

            // check for a data-ls-ref link anywhere else on page
            m = jQuery('[data-ls-ref]');
            if (m.length > 0) { return m.attr('data-ls-ref'); } // return the first data-ls-ref element found

            function pathFromUrl(url) {
                if (m = url.match(/http(s)?:\/\/[^\/]+(.*)/ )) {
                    return m[2];
                } else {
                    return url;
                }
            }

            // if the element is wrapped in a link, use the path from the href attribute
            var p = elem.parent('a[href]');
            if (p.length > 0) { return pathFromUrl(p.attr('href')); } // return url for large image

            // if the element itself has a src link, use that
            var p = elem.filter('[src]');
            if (p.length > 0) { return pathFromUrl(p.attr('src')); }

            var p = elem.filter('[href]');
            if (p.length > 0) { return pathFromUrl(p.attr('href')); }

            return null; // nothing worked
        }

        /**
         * returns the product id extracted from the page. The product ID can be used when there are
         * multiple lifesize images associated to a single product.
         * @param elem
         */
        this.getProduct = function(elem) {
            // by default, look for a data-ls-prod attribute
            elem = jQuery(elem);
            return elem.attr('data-ls-prod') || elem.parent().attr('data-ls-prod');
        }

        /**
         * returns thumbnail image data, or null if no image found for element provided
         * @param elem matched element
         * @return object containing properties 'url', 'width' and 'height', the latter 2 optional
         */
        this.getThumbnailImgData = function(elem) {
            return {
                url: elem.src,
                width: elem.width,
                height: elem.height
            };
        }

        /**
         * returns high res image data, or null if none found with provided element
         * @param elem matched element
         * @return object containing properties 'url', 'width' and 'height', the latter 2 optional
         */
        this.getLargeImgData = function(elem) {
            // check if the image element is wrapped by an <a> tag with an image. If so, assume
            // that that's a high res version.
            if (this.isWrappedByImageLink(elem)) {
                LsLog.debug('found parent element for ' + elem.src + ' with large image: ' + elem.parentNode.href);
                return {
                    url: elem.parentNode.href
                };
            }
            return null;
        }

        /**
         * returns the page url for the images represented by elem. Typically this is the
         * document url
         * @param elem matched element
         * @return page url
         */
        this.getPageUrl = function(elem) {
            return document.location.href;
        }

        /**
         * returns array of image elements that are candidates for lifesizing
         */
        this.getImages = function() {
            var MAX_RATIO = 6;

            var images = document.images;
            var imgArr = [];
            for (var i=0;i<images.length;i++) {
                var img = images[i];
                // image must be greater than MIN_PIXELS, OR must be wrapped in an <a> tag to
                // be accepted
                if (this.hasAcceptableResolution(img) || this.isWrappedByImageLink(img)) {
                    imgArr.push(img);
                }
            }
            return imgArr;
        }

        /**
         * returns true is the element is wrapped by a link tag with a href to a jpg or
         * png image.
         * @param elem the element to test for
         * @true true if this element is wrapped by a link to an image
         */
        this.isWrappedByImageLink = function(elem) {
            var parent = elem.parentNode;
            if (parent.tagName.toLowerCase() == 'a') {
                return (parent.href && parent.href.match(/(jpg|png)$/i));
            }
            return false;
        }

        /**
         * returns true if image has acceptable resolution for lifesizing.
         * @param img
         * @return {Boolean}
         */
        this.hasAcceptableResolution = function(img) {
            var MIN_PIXELS = 15000;
            var dims = this.getDimensions(img);
            var ratio = dims[0] / dims[1];
            return (dims[0]*dims[1] >= MIN_PIXELS);
        }

        /**
         * returns array with all image data and suggested titles/refs collected from page
         * Every element in this array is an object that looks like this:
         * { thumb: { url, width, height }, large: { url, width, height }, title, ref, pageUrl }
         * (note that width, height, title and ref are all optional). The large hash is optional as well,
         * if not specified, thumb will be used.
         */
        this.collectData = function() {
            var me = this;
            var images = [];
            jQuery.each(me.getImages(), function(i, val) {
                // create thumb image
                var thumb = me.getThumbnailImgData(val);
                if (thumb) {
                    thumb.url = me.getAbsoluteUrl(thumb.url); // make sure thumb URL is absolute
                    var large = me.getLargeImgData(val);
                    if (large != null && large['url'] != null) {
                        large.url = me.getAbsoluteUrl(large.url); // make sure large URL is absolute
                    }
                    var data = {
                        thumb:    thumb,
                        title:    me.getTitle(val),
                        ref:      me.getReference(val),
                        pageUrl:  me.getPageUrl(val),
                        product:  me.getProduct(val)
                    };
                    if (large) {
                        data.large = large;
                    }
                    images.push(data);
                }
            });
            //LsLog.info("images: ", images);
            return this.orderImages(images);
        }

        /**
         * order images so they'll be displayed in order of likely candidates
         * @param imgArr
         * @return {*}
         */
        this.orderImages = function(imgArr) {
            // for now, not doing a true sort, but rather moving all images that don't
            // have a large version to the end of the array.
            var withLarge = [];
            var withoutLarge = [];
            var img;
            for (var i=0;i<imgArr.length; i++) {
                img = imgArr[i];
                if (img['large']) {
                    withLarge.push(img);
                } else {
                    withoutLarge.push(img);
                }
            }
            return withLarge.concat(withoutLarge);
        }

        /**
         * ensures that the url passed in is absolute
         * @return absolute url
         */
        this.getAbsoluteUrl = function(url) {
            if (url && !/^http(s)?:\/\//.test(url)) {
                // url doesn't start with http(s):// yet
                return location.protocol + '//' + location.hostname + url;
            }
            return url;
        }

        /**
         * @return true if lifesizing images is allowed on the current page
         */
        this.urlMatch = function() {
            // generic implementation allows all domains
            var domains = this.enabledDomainsAsArray();
            if (domains == null) {
                return true; // by default, all domains allowed
            } else {
                // match full name or any host
                var re;
                for (var i=0; i<domains.length; i++) {
                    re = new RegExp("(.*\\.|^)" + domains[i] + "$", 'i');
                    if (re.test(location.hostname.toLowerCase())) {
                        return true; // match
                    }
                }
            }
            return false;
        }

        /**
         * accepts an image object, and returns the pixel dimensions as 2 element array [width, height]
         */
        this.getDimensions = function(img) {
            if (img.naturalWidth) {
                return [img.naturalWidth, img.naturalHeight];
            } else {
                // TODO: if image is rendered at different dimensions than the actual image dimensions,
                // and naturalWidth/naturalHeight properties aren't supported, this will return the
                // incorrect dimensions
                return [img.width, img.height];
            }
        }

        /**
         * returns error message to be displayed if there's no url match on the current page
         * @return {String}
         */
        this.noUrlMatchErrorMsg = function() {
            var str = "This bookmarklet can only be used on ";
            var domains = this.enabledDomainsAsArray();
            for (var i=0; i<domains.length; i++) {
                str += domains[i];
                if (i < domains.length-2) {
                    str += ", ";
                } else if (i < domains.length-1) {
                    str += ' or ';
                }
            }
            return str;
        }

        /**
         * set list of host or domain names that must match the current url for the bookmarklet to be enabled.
         * May return either a String or Array
         * @return domain or domains for which this bookmarklet is enabled
         */
        this.enabledDomains = function() {
            return null;
        }

        /**
         * returns the list of domains (set by enabledDomains) as an array
         * @return {*}
         */
        this.enabledDomainsAsArray = function() {
            var domains = this.enabledDomains();
            if (domains == null) {
                return null;
            } else if (typeof domains === "string") {
                // not an array but a string
                return [domains];
            } else {
                return domains; // assume it's already a string
            }
        }
    }

    /** translates a version string like '1.12.5' into number 11205, or '1.7.3' into 10703 */
    function versionAsInt(version) {
        function get2DigitNumber(v) {
            var version = parseInt(v);
            return (version < 10) ? ('0'+version) : (''+version);
        }
        var versionNumbers = version.split('.');
        var major    = get2DigitNumber(versionNumbers[0]);
        var minor    = (versionNumbers.length > 1) ? get2DigitNumber(versionNumbers[1]) : '00';
        var revision = (versionNumbers.length > 2) ? get2DigitNumber(versionNumbers[2]) : '00';
        //LsLog.debug("major: " + major + ", minor: " + minor + ", revision: " + revision);
        var v = parseInt(major + minor + revision, 10); // force decimal parsing if number starts with '0'
        return v;
    }

    /**
     * ensures that jQuery 1.2.6 or later is available, loads it if necessary. Calls callback after jquery is made
     * available
     * @param callback
     */
    function loadJQueryIfNecessary(callback) {
        if (typeof(jQuery) === 'undefined' || (versionAsInt(jQuery.fn.jquery) < versionAsInt("1.5.1"))) {
            LsLog.info('loading jquery');
            loadJavascript("http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js", function() {
                // initialize plugins
                var plugins = new LsPlugins(jQuery);
                callback();
            });
        } else {
            LsLog.info("jquery version " + jQuery.fn.jquery + " already present");
            var plugins = new LsPlugins(jQuery);
            callback();
        }
    }

    /**
     * dynamically loads a set of javascript files. Not used currently, but we'll need this to load
     * domain specific scripts.
     * @param urls to load
     */
    function loadJavascript(src, onLoad) {
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.src = src;
        document.getElementsByTagName('head')[0].appendChild(script);
        if (typeof onLoad !== 'undefined') {
            script.addEventListener('load', onLoad, false);
        }
    }

    /**
     * dynamically loads a set of stylesheets
     * @param urls to load (specify absolute urls)
     */
    function loadStylesheets(names) {
        for (var i=0; i<names.length; i++) {
            jQuery("head").append("<link>");
            css = jQuery("head").children(":last");
            css.attr({ rel: "stylesheet", type: "text/css", href: names[i] });
            //debug('loaded stylesheet: ' + names[i]);
        }
    }

    /**
     * creates the LifeSizer modal dialog and adds all images found
     * @param images
     */
    function createModalDialog(images) {
        var modalWidth = jQuery(window).width() - 20;
        var modalHeight = calculateModalHeight(modalWidth, images.length);

        var content = '<div id="ls-scrollable-content" class="ls-under-toolbar"><div id="ls-select-images"></div></div>';
        var title = 'Select the image you would like to set up for life-size display';

        var configureView = new ConfigureView({ dialogType: 'full' });
        configureView.openWith(content, title, modalWidth, modalHeight);

        LsLog.info("width : " + (jQuery(window).width() - 20));

        // now add images
        jQuery.each(images, function(i, val) {
            // container for image
            var imgDiv = jQuery('<div class="ls-select-image"></div>');
            // create image
            var img = jQuery('<img/>').attr('src', val.thumb.url).attr('ref', i);
            // center images vertically in container. Can only do this if thumb height is known
            imgDiv.append(img);
            jQuery('#ls-select-images').append(imgDiv);
            if (val.thumb['height']) {
                //console.log("thumbnail = " + val.thumb.height + "x" + val.thumb.width);
                var h;
                if (val.thumb.height < val.thumb.width) {
                    h = (val.thumb.width > 150) ? (val.thumb.height / (val.thumb.width / 150)) : val.thumb.height;
                } else {
                    h = (val.thumb.height < 150) ? val.thumb.height : 150;
                }
                var verOffset = (150 - h) / 2;
                img.css({ 'padding-top' : verOffset });
            } else {
                // don't know thumbnail height. Need to test following:
                //imgDiv.css({'display' : 'table-cell', 'vertical-align' : 'middle' });
            }
        });
        LsLog.info("total height = " + jQuery('#ls-scrollable-content').height() );

        // kick off lifeSizer configure on click
        jQuery('.ls-select-image').click(function() {

            var imageId = parseInt(jQuery(this).children('img').attr('ref'));
            var img = images[imageId];

            // configure and open popup
            var largeUrl = (img['large'] && img.large['url']) ? img.large.url : img.thumb.url;
            var lsImage = new ImageModel({ ref: img.ref, userId: opts.userId, host: opts.host });
            // check if the image already exists
            lsImage.fetchByRef({success: function(model, response){
                if (!response.error) {
                    // image data received
                    finishSetup(lsImage);
                }
            }, error: function(model, response) {
                //TODO this assumes that a 404 was received. Handle other error types
                LsLog.debug("image doesn't exist yet");
                finishSetup(lsImage);
            }});
            // attaches listeners and completes setup after image has been created or received from server
            function finishSetup(lsImage) {
                lsImage.set({
                    url:        largeUrl,
                    pageUrl:    img.pageUrl,
                    name:       img.title,
                    source:     'cust_bookmarklet',
                    product:    img.product
                });
                lsImage.on('okToSave', function() {
                    lsImage.save({key: opts.appKey}, { success: function() {
                        // callback after completion
                        // reinitialize lifesizer if set on page
                        if (window.Ls) {
                            Ls.addRef(lsImage.get('ref'));
                            Ls.init();
                        }
                    }});
                });
                configureView.model = lsImage;
                configureView.openCalibration();
            }
        });
    }

    function calculateModalHeight(width, numImages) {
        var blockLength = 175;
        var numPerRow = Math.floor((width-15)/blockLength); // scrollbar will be 15 pix
        var numRows = Math.ceil(numImages/numPerRow);
        LsLog.info(numRows + ' rows of ' + numPerRow + ' images');

        return Math.min((numRows * blockLength) + 50, jQuery(window).height() - 20);
    }

    // default options
    var opts = {
        host:       window.location.protocol + '//beta.lifesizer.com',
        loadCustom: false,     // 0x01 bit of c var: load a custom implementation
        localFiles: false      // 0x02 bit of c var: load the css/js from opts.host instead of CloudFiles
    };

    /**
     * parse bookmarklet options from script url
     * @param scriptUrl
     */
    function parseOptions(scriptUrl) {
        // grab the appKey and user id from the options
        opts.appKey = _lsv.appKey;
        opts.userId = _lsv.u;
        if (!opts.userId) {
            alert("This bookmarklet is outdated and has been disabled. Please install the new bookmarklet from beta.lifesizer.com");
            return false;
        }

        // api host can be overridden from url as well, ie. by setting host=localhost:3000
        if (_lsv.host) {
            opts.host = _lsv.host;
        }
        // set other boolean options
        var c = _lsv.c;
        if (c & 0x01) opts.loadCustom = true;
        if (c & 0x02) opts.localFiles = true;
        return true;
    }

    /**
     * initialized plugin and opens the overlay with images
     */
    function init() {
        // grab the current script url and it's parameters (passed by bookmarklet)
        if (typeof(_lsv) === 'undefined') {
            if (window.console) console.log("_lsv not defined!");
            return null; // can't do anything without the script url
        }

        // tell Backbone we're using jQuery
        Backbone.setDomLibrary(jQuery);

        // parse options from script url
        if (!parseOptions()) {
            return; // failure
        }

        if (opts.loadCustom) {
            // load custom Javascript implementation
            var isHttps = (window.location.protocol === 'https:');
            var hostName = isHttps ? "https://" : "http://";
            if (opts.localFiles) {
                hostName = hostName + opts.host;
            } else if (isHttps) {
                hostName = hostName + "cc71b64a43ffcd6ee05f-12a81c71f2d012be3f3f391fb63117dd.ssl.cf1.rackcdn.com";
            } else {
                hostName = hostName + "lscache.lifesizer.com";
            }

            loadJavascript(hostName + "/bmc/" + opts.appKey + ".js", init2);
        } else {
            init2();
        }
    }

    /**
     * second step of initialization, after custom bookmarklet has been loaded
     */
    function init2() {
        delegate = new GenericMatcher();
        if (typeof LifeSizerPageParser === 'function') {
            var impl = new LifeSizerPageParser();
            impl._super = delegate; // set reference to super class
            jQuery.extend(delegate, impl);
        }
        if (!delegate.urlMatch()) {
            alert(delegate.noUrlMatchErrorMsg());
            return;
        }

        // load stylesheet
        var isHttps = (window.location.protocol === 'https:');
        var cssFile =  isHttps ? "https://" : "http://";
        if (opts.localFiles) {
            cssFile = cssFile + opts.host + "/assets/bookmarklet.css";
        } else if (isHttps) {
            cssFile = cssFile + "8ca238c90e429da4286c-c6451223c7e588bc601f98f1acc5861a.ssl.cf1.rackcdn.com/css/bm/ls-bm-1.0-https.css";
        } else {
            cssFile = cssFile + "assets.lifesizer.com/css/bm/ls-bm-1.0.css";
        }
        loadStylesheets([cssFile]);
        // open dialog
        me.start();
    }

    /**
     * called after all initialization has been completed
     */
    this.start = function() {
        var images = delegate.collectData();
        if (images.length > 0) {
            createModalDialog(images);
        } else {
            alert("We're sorry, no images suitable for LifeSizer setup could be detected. Please try a different page");
        }
    }

    // load jQuery now if necessary, then init
    loadJQueryIfNecessary(init);
};