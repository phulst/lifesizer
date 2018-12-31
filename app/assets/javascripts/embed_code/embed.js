/**
 * (c) 2012  LifeSizer, Inc.
 */
if (!window.Ls) window.Ls = {

    // default plugin options
    options: {
        // application key, must be set in embed script
        appKey:             null,

        // user id, must be set in embed script
        user:               null,

        // use grid and ruler in inches by default
        metric:             false,
        
        // Hostname for lifesizer service. Default beta.lifesizer.com
        // This should only be changed for testing
        host:               'beta.lifesizer.com',

        // Hostname for ls cache checks.
        lsCacheHost:        'lscache.lifesizer.com',

        // Hostname for ls cache checks over HTTPS
        lsCacheHostHttps:    'cc71b64a43ffcd6ee05f-12a81c71f2d012be3f3f391fb63117dd.ssl.cf1.rackcdn.com',

        // asset host for images
        assetsHost:         'assets.lifesizer.com',

        // Width and height in pixels at which popup should be opened. If not specified, it will use values 600x400,
        // and then resize after loading the image if necessary (although dynamic resize doesn't work in Firefox).
        popupWidth:         600,
        popupHeight:        400,

        // logo number to display as overlay. Default 0 (no logo). Currently only supports value 1
        overlayButtonType:  0,

        // position to set for overlay logo. Use top,bottom,left,right properties only
        overlayButtonPos:   'left:5px; top:5px',

        // by default, no custom image for overlay
        overlayCustomImg:   null,

        // set to true if popup should open in lightbox. Default is false. This will require jquery to
        // be included in page
        lightbox:           false,

        // before adding lifesizer links, send request to server to check if available
        serverCheck:        false,

        // this callback will be called once, and will pass an array back of all image refs that
        // were found on the page. If no image refs were on the page (or if serverCheck is true and it's been
        // determined that none of the images have been lifesized) the callback will not be called
        notifyImages:       null,

        // this callback will be called each time a user clicks to view a lifesize image. The callback will
        // pass the reference of the image viewed.
        notifyView:         null,

        // if serverCheck = true, make links visible automatically if LS image available.
        changeVisibility:   true
    },

    mobile: (/(Android|webOS|iPhone|iPad|iPod|BlackBerry|kftt)/i).test(navigator.userAgent),

    /**
     * returns content of the data-<elem> attribute on a given element
     */
    dataAttr: function(elem, attrName) {
        return elem.getAttribute('data-' + attrName);
    },

    /**
     * returns all elements of the document that have a data-ls-ref
     * attribute set
     * @return array of elements that have a data-ls-ref property set
     */
    getLifeSizeElements: function() {
	    var elem = [];
        var els = document.getElementsByTagName('*');
	    //var pattern = new RegExp('(^|\\\\s)'+searchClass+'(\\\\s|$)');
	    for (i = 0; i < els.length; i++) {
	        if ( els[i].getAttribute('data-ls-ref') != null && els[i].getAttribute('data-ls-ref').length > 0) {
	            elem.push(els[i]);
	        }
	    }
	    return elem;
    },

    /**
     * returns the first element with matching class name, or false if none found. Note that
     * this only works if the element only has a single class... it doesn't do any parsing on class names
     * @param doc html element to start navigating on
     * @param elemType types of elements to navigate (ie 'img')
     */
    getElementWithClassName: function(doc, elemType, className) {
        if (!elemType) {
            elemType = '*';
        }
        var children = doc.getElementsByTagName(elemType);
        var elements = new Array();
        for (var i = 0; i < children.length; i++)
        {
            if (children[i].className == className) {
                return children[i];
            }
        }
        return false;
    },

    /**
     * adds an event listener in a cross browser compatible way
     * @param element element to add event listener to
     * @param eventName event type to add
     * @param handler the event handler function
     */
    addListener: function(element, eventName, handler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, handler);
        } else {
            element['on' + eventName] = handler;
        }
    },

    /**
     * ensures that the given element is wrapped in a DIV with position:relative.
     * If this is not already the case, it will actually wrap it in such a DIV.
     * @param elem the element to wrap
     * @return the DIV element. Typically, the parent container of elem, which either already
     * existed or that was just created. However, if elem itself was a DIV it will return that.
     */
    ensureWrappedInDiv: function(elem) {
        function validDiv(em) {
            return (em.tagName.toLowerCase() == 'div' && em.style.position == 'relative');
        }
        if (validDiv(elem)) {
            return elem; // the element itself is a matching div
        }
        var container = elem.parentNode;
        if (validDiv(container)) {
            return container; // the parent node was a matching div
        }
        // no matches, wrap the elem inside a new DIV
        var wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.height   = elem.height + "px";
        wrapper.style.width    = elem.width + "px";
        wrapper.style.margin   = 0;
        wrapper.style.padding  = 0;
        wrapper.appendChild(elem.cloneNode(true));
        container.replaceChild(wrapper, elem);
        return wrapper; // return the new div wrapper
    },

    /**
     * creates the logo to lay on top of the lifesize element, and set up hover effect
     * @param container the div element in which the overlay image should be placed
     * @return true if logo overlay was placed
     */
    createOverlayLogo: function(container) {
        var overlayButtonClass = 'ls-overlay-button';
        var self = this;

        if (self.getElementWithClassName(container, 'img', overlayButtonClass)) {
            return false;
        };

        var minOpacity = 6; // on scale of 1 to 10
        var maxOpacity = 10;
        function setOpacity(elem, value) {
            elem.style.opacity = value/10;
            elem.style.filter = 'alpha(opacity=' + value * 10 + ')';
        }
        function trim(str) {
            return str.replace(/^\s+|\s+$/g,"");
        }
        function splitStyles(styleProps) {
            var map = {};
            var props = styleProps.split(';');
            for (var i=0; i<props.length; i++) {
                if (trim(props[i]).length > 0) {
                    var p = props[i].split(':');
                    var par = trim(p[0]);
                    map[par] = trim(p[1]);
                }
            }
            return map;
        }

        var img = document.createElement("IMG");
        img.className = overlayButtonClass;
        if (self.options.overlayButtonType > 0) {
            img.src = 'http://' + self.options.host + "/img/embed/logo_overlay" + self.options.overlayButtonType + ".png";
        } else if (self.options.overlayCustomImg) {
            // use custom overlay
            img.src = self.options.overlayCustomImg;
        }
        img.style.position = 'absolute';
        img.style.border = '0px';
        img.style.padding = '0px';
        setOpacity(img, minOpacity);
        var styles = splitStyles(self.options.overlayButtonPos);
        for (var s in styles) {
            img.style[s] = styles[s]; // set position values (top/bottom/left/right)
        }
        img.style.cursor = 'pointer';
        container.onmouseover = function() { setOpacity(img, maxOpacity); };
        container.onmouseout  = function() { setOpacity(img, minOpacity); };
        container.appendChild(img);
        return true;
    },

    /**
     * disable bubbling up of event to other elements
     * @param event
     */
    cancelEventBubble: function(event) {
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
    },


    /**
     * initializes this class, sets up all click handlers
     * @param props configuration object
     */
    init: function(props) {
        var me = this;

        // override default options with properties passed in
        for (var key in props) {
            me.options[key] = props[key];
        }

        var lsElem = Ls.getLifeSizeElements();
        if (me.options.serverCheck) {
            // check with server first if LifeSize image(s) are available
            LsLog.debug('checking for ' + lsElem.length + ' LifeSize images');
            me.checkLifeSizeImages(lsElem);
        } else {
            // assume all data-ls-ref elements refer to valid LifeSizer images
            LsLog.debug('enabling ' + lsElem.length + ' LifeSize images');
            me.enableLifeSizeImages(lsElem);
        }
    },

    /**
     * add a reference to the internal reference cache
     * @param ref image reference
     */
    addRef: function(ref) {
        imageRefCache.addRef(ref);
    },

    arrayContains: function(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
               return true;
            }
        }
        return false;
    },

    /**
     * collects an array of image refs (duplicates removed) for all the elements
     * passed in
     * @param lsElem array of DOM elements with data-ls-ref property set
     * @return array of strings with all data-ls-ref values
     */
    collectRefs: function(lsElem) {
        var refs = [];
        for (var i=0; i<lsElem.length; i++) {
            var ref = this.dataAttr(lsElem[i], 'ls-ref');
            if (ref && ref.length > 0) {
                // add the ref if it isn't already in the array
                if (!this.arrayContains(refs, ref)) {
                    refs.push(ref);
                }
            }
        }
        return refs;
    },

    /**
     * checks with LifeSizer service to find out which one of the elements with
     * ls-data-ref properties are valid lifesize images, and enables links on those
     * @param lsElem array of all lifesizer elements
     * @param refs array of unique image refs found on page
     */
    checkLifeSizeImages: function(lsElem) {
        var me = this;

        imageRefCache.checkRefs(me.collectRefs(lsElem), me.options, function(imageRefs) {

            if (imageRefs && imageRefs.length > 0) {
                var availElem = [];
                for (var i=0; i<lsElem.length; i++) {
                    var ref = me.dataAttr(lsElem[i], 'ls-ref');
                    for (var j=0; j<imageRefs.length; j++) {
                        if (ref == imageRefs[j]) {
                            availElem.push(lsElem[i]);
                        }
                    }
                }
                if (availElem.length > 0) {
                    LsLog.info("enabling " + availElem.length + " images for " + imageRefs.length + " refs");
                    // one or more images are actually available in lifesize
                    me.enableLifeSizeImages(availElem);
                }
            }
        });
    },

    /**
     * enable lifesize links for all elements passed in.
     * @param elem LifeSizer elements (DOM elements that have the data-ls-ref property set)
     */
     enableLifeSizeImages: function(lsElem) {
        var me = this;
        for (var i=0; i<lsElem.length; i++) {
            // create LifeSizer image overlay
            var lsElement = lsElem[i];
            var container = lsElement;


            if (me.options.changeVisibility && container.style.display == 'none') {
                // if currently not visible, make it visible
                container.style.display = "";
            }

            if (me.options.overlayButtonType > 0 || me.options.overlayCustomImg) {
                container = me.ensureWrappedInDiv(lsElement);
                me.createOverlayLogo(container);
            }
            container.style.cursor = 'pointer';

            // now set the click handler
            me.addListener(container, 'click', function(evt) {
                var event = window.event || evt;
                var elem = (event.currentTarget) ? event.currentTarget : event.srcElement;
                if (!me.dataAttr(elem, 'ls-ref')) {
                    // look in children until we find the element
                    var len = elem.childNodes.length;
                    for (var i=0; i<len; i++) {
                        var childNode = elem.childNodes[i];
                        var lsRef = me.dataAttr(childNode, 'ls-ref');
                        if (lsRef) {
                            elem = childNode;
                            break;
                        }
                    }
                }
                elem.style.cursor = 'progress';
                var user = me.dataAttr(elem, 'ls-user');
                var ref = me.dataAttr(elem, 'ls-ref');
                var product = me.dataAttr(elem, 'ls-prod');
                var imgUrl = me.dataAttr(elem, 'ls-imgurl');
                var lsData = me.dataAttr(elem, 'lifesizer');

                me.openViewer(ref, product, user, imgUrl, lsData);

                elem.style.cursor = 'pointer';
                return me.cancelEventBubble(event);
            });
        }
        // call callback for all (enabled) lifesize images found on page
        if (me.options.notifyImages) {
            var refs = me.collectRefs(lsElem);
            me.options.notifyImages(refs);
        }
    },

    openViewer: function(ref, product, user, imgUrl, lsData) {
        var me = this;
        if (!user)
            user = me.options.user;

        var data = {
            a:      me.options.appKey,
            user:   user,
            ref:    ref,
            h:      screen.height, // pass current screen resolution as well
            w:      screen.width
        };
        if (me.options.metric == true)
            data['m'] = 1;
        if (product) data['p'] = product;
        if (imgUrl)  data['img']  = imgUrl;
        if (me.mobile) {
            // add device pixel ratio for mobile devices
            var pixRatio = me.findDevicePixelRatio();
            if (pixRatio) data['r'] = pixRatio;
        }
        if (data.user != null && data.ref != null) {
            if (!me.options.lightbox) {
                var url = "http://" + me.options.host + "/view";
                me.popup(url, data, me.options.popupWidth, me.options.popupHeight, lsData);
            } else {
                var url = "http://" + me.options.host + "/view";
                me.lightboxView(url, data, me.options.popupWidth, me.options.popupHeight, lsData);
            }
        }
        // call callback for view action
        if (me.options.notifyView) {
            me.options.notifyView(data.ref);
        }
    },

    /**
     * calculates the best possible window size and image render dimensions for the configure popup.
     * It will attempt to provide dimensions that will allow for display of the image in
     * its original resolution, but does use a minimum width/height, and a maximum
     * width/height based on the current screen resolution.
     * @param imgDim render dimensions of image
     * @param minDim minimum dimensions of popup dialog
     * @param popupMargins (optional) margins required around image within popup dialog
     */
    calculateBestWindowDim: function(imgDim, minDim, popupMargins) {
        if (!popupMargins) popupMargins = [60,150];
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
    },

    /**
     * constructs a url with query string from a url and number of parameters
     * @param url input url
     * @param params object representing parameters
     */
    constructUrl: function(url, params) {
        // this method assumes that the url doesn't already have any query parameters.
        var fullUrl = url + '?';
        for (var p in params) {
            fullUrl += p + "=" + params[p] + '&';
        }
        fullUrl = fullUrl.substring(0, fullUrl.length-1);
        return fullUrl;
    },

    /**
     * returns the device pixel ratio, or false if it could not be determined
     */
    findDevicePixelRatio: function() {
        if (window.devicePixelRatio) {
            return window.devicePixelRatio;
        } else if (screen.deviceXDPI) {
           return (screen.deviceXDPI / screen.logicalXDPI);
        }
        return false; // unable to determine
    },

    /**
     * opens popup for lifesizer window
     * @param url url to load in window (should not contain query string)
     * @param queryParams query parameters to add to url
     * @param width - minimum width of popup dialog (may be null or undefined)
     * @param height - minimum height of popup dialog (may be null or undefined)
     * @param lsData additional rendering data (may only be available when used on lifesizer.com)
     */
    popup: function(url, queryParams, width, height, lsData) {
        var self = this;
        url = self.constructUrl(url, queryParams);

        // set width and height from lsData if that property is set
        var dim = [width, height];
        if (lsData) {
            var data = eval('(' + lsData + ')'); // TODO: replace with JSON parser instead of using eval
            dim = self.calculateBestWindowDim([data.lsw, data.lsh], dim);
        }

        // set up attributes for popup window
        // var left   = (screen.width  - dim[0])/2;
        // var top    = (screen.height - dim[1])/2;
        var params = 'width='+dim[0]+', height='+dim[1];
        params += ', directories=no';
        params += ', location=no';
        params += ', menubar=no';
        params += ', resizable=yes';
        params += ', scrollbars=no';
        params += ', status=no';
        params += ', toolbar=no';

        var newwin;

        var iphone = (/iPhone/).test(navigator.userAgent);
        if (self.mobile) {
            newwin = window.open(url,'_blank');
        } else {
            newwin = window.open(url,'lifesize', params);
        }
        if (window.focus) newwin.focus();
    },

    lightboxView: function(url, params, width, height, lsData) {
        var self = this;
        url = self.constructUrl(url, params);

        // set width and height from lsData if that property is set
        var dim = [width, height];
        if (lsData) {
            var data = eval('(' + lsData + ')'); // TODO: replace with JSON parser instead of using eval
            //if (window.console) console.dir(data);
            dim = self.calculateBestWindowDim([data.lsw, data.lsh], dim);
        }
        $.colorbox({iframe: true, href:url, width: dim[0], height: dim[1], opacity: 0.5});
    }
};

/**
 * this class may be overkill. It may be enough to simply add a timestamp to the JSONP request
 * (as is currently already the case) and rely on browser caching of the imgcache.js file, instead of
 * trying to use localStorage to guarantee that the file is cached for a certain amount of time.
 */
var imageRefCache = {
    options:    {},             // env options
    callback:   null,           // callback method to call when data retrieved
    imageRefs:  [],             // image references to check for
    cacheTime:  60 * 60,        // cache for 1 hour (in seconds)

    /**
     *
     */
    checkRefs :function(imageRefs, options, callback) {
        var me = this;
        me.options = options;
        me.callback = callback;
        me.imageRefs = imageRefs;

        var doRefresh = false;
        if (this.localStorageSupported()) {
            // local storage is supported, check if we have a recent cache
            var refStr = localStorage[me._storageKey()];
            if (refStr == null) {
                // no cache available yet
                LsLog.debug("no refs available in localStorage for user " + options.appKey + ", fetching now");
                doRefresh = true;
            } else if (!me._currentCache()) {
                // cache is available but expired
                LsLog.debug("expired refs found in localStorage for user " + options.appKey + ", fetching again");
                doRefresh = true;
            } else if (location.search.indexOf('lsdebug=true') >= 0) {
                LsLog.debug("lsdebug=true used, refreshing cache");
                doRefresh = true;
            }
            if (doRefresh) {
                this._loadRemoteRefs();
            } else {
                // references are available and current
                LsLog.debug("using cached imageref data");
                var refs = refStr.split(',')
                this._testrefs(refs);
            }
        } else {
            // local storage not supported. Query LifeSizer for just the requested imagerefs
            LsLog.debug("no localStorage support, checking " + imageRefs.length + " image refs with server");
            this._loadRemoteRefs();
        }
    },

    /**
     * adds a single reference to the local storage, if supported. This is called from the image configuration
     * bookmarklet only, to ensure that the lifesizer link will show up immediately after saving an image.
     */
    addRef: function(ref) {
        var me = this;
        // see which refs are in local Storage
        var refStr = localStorage[me._storageKey()];
        var refs = (refStr) ? refStr.split(',') : [];
        var found = false;
        for (var i = 0; i < refs.length; i++) {
            if (refs[i] === ref) {
                found = true;
                break;
            }
        }
        if (!found) {
            // reference not cached yet
            refs.push(ref);
            me._storeRefs(refs);
        }
    },

    /**
     * returns the key name at which the list of image references are stored
     */
    _storageKey: function() {
        return "lifesizer.user." + this.options.appKey + ".refs";
    },

    /**
     * returns the key name at which the last
     */
    _storageTimestampKey: function() {
        return this._storageKey() + ".updated";
    },

    /**
     * Makes a jsonp call to LifeSizer to retrieve images that have been registered with the associated account.
     * @param loadAll
     */
    _loadRemoteRefs: function() {
        var baseUrl = 'http://' + this.options.lsCacheHost;
        if (location.protocol === 'https:') {
            baseUrl = 'https://' + this.options.lsCacheHostHttps;
        }
        var reqConfig = {
            // callback handler isn't set in request. The cache has hardcoded this to imageRefCache.notify
            url: baseUrl + "/lsc/" + this.options.appKey + ".js"
        };
        this.getJSONP(reqConfig);
    },

    /**
     * json callback method. Handles the server response
     * @param data
     */
    notify: function(data) {
        var me = this;
        LsLog.debug("jsonp response: ", data);
        if (data && data.refs) {
            // image references received
            if (this.localStorageSupported()) {
                // cache refs if local storage supported
                me._storeRefs(data.refs);
            }
            me._testrefs(data.refs, me.imageRefs)
        }
    },

    /**
     * store given array of references in the local storage. Also store a timestamp
     */
    _storeRefs: function(refs) {
        var me = this;
        localStorage[me._storageKey()] = refs.join(',');
        localStorage[me._storageTimestampKey()] = Math.round((new Date()).getTime()/1000);
        LsLog.debug("storing in localStorage: " + localStorage[me._storageKey()] +
            "\ntimestamp: " + localStorage[me._storageTimestampKey()]);
    },

    /**
     * checks the list of image references (from localStorage or as received from the server) against the requested
     * ones, and returns a subset of the requested ones that are available.
     * @param refs array of image references (received from server or from localStorage)
     */
    _testrefs: function(refs) {
        var me = this;
        var matches = [];
        for (var i=0; i<me.imageRefs.length; i++) {
            for (var j=0; j<refs.length; j++) {
                if (refs[j] == me.imageRefs[i]) {
                    matches.push(me.imageRefs[i]);
                    break;
                }
            }
        }
        me.callback.call(me, matches);
    },

    /**
     * returns true if the cache is still current
     * @param storageKey
     */
    _currentCache: function() {
        var me = this;
        var updated = localStorage[me._storageTimestampKey()];
        if (!updated) {
            return false; // .updated key not found somehow
        }
        updated = parseInt(updated);
        if (!updated) {
            return false; // unable to parse updated to int somehow
        }
        var cacheTimeRemaining = me.cacheTime - (Math.round((new Date()).getTime()/1000) - updated);
        if (cacheTimeRemaining > 0) {
            LsLog.debug("cache valid for another: " + cacheTimeRemaining + " seconds");
        } else {
            LsLog.debug("cache expired by " + (0 - cacheTimeRemaining) + " seconds!");
        }
        return (cacheTimeRemaining > 0);
    },

    /**
     * checks if localStorage is supported by the current browser, and returns true if so
     */
    localStorageSupported: function() {
        return ('localStorage' in window) && window['localStorage'] !== null;
    },

    /**
     * simple jsonp implementation
     * Config hash should/may contain the following parameters
     *
     * url:          the json url
     * data:         hash of query parameters to add
     * callback:     name of callback function
     * cacheMinutes: number of minutes browser may cache response for (default 10)
     */
    getJSONP: function(opts) {
        var cacheMinutes = opts.cacheMinutes || 10

        // constructs query string from a hash of query parameters
        function querystring(data) {
            var dataStr = '?';
            if (data) {
                for (var k in data) {
                    dataStr = dataStr + k + "=" + encodeURI(data[k]) + "&";
                }
            }
            dataStr.slice(0, -1);
            return dataStr;
        }

        var reqAttr = {};
        if (opts.data) {
            // copy the data hash first
            for (var key in opts.data) {
                reqAttr[key] = opts.data[key];
            }
        }
        if (opts.callback) {
            // add callback to parameters
            reqAttr.callback = opts.callback;
        }
        // add timestamp to parameters
        reqAttr.ts = Math.floor( (new Date()).getTime() / (60*1000*cacheMinutes));

        // create script tag and add to HEAD element
        var scriptTag = document.createElement('SCRIPT');
        var qs = querystring(reqAttr);
        scriptTag.src = (qs.length > 0) ? (opts.url + qs) : opts.url;
        document.getElementsByTagName('HEAD')[0].appendChild(scriptTag);
    }
};

/** debug msg class */
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

    _msg: function(level, msg, obj) {
        // enable debugging only outside of beta.lifesizer.com
        if (window.console && (location.search.indexOf('lsdebug=true') >= 0) || location.host.indexOf('localhost') == 0) {
            console.log(level + " " + msg);
            if (obj && window.console.dir) {
                console.dir(obj);
            }
        }
    }
};

// run initialization when DOM is ready
DomReady.ready(function() {
    lsAsyncInit();
});

/*
// kick off initialization
if (window.attachEvent)
  window.attachEvent('onload', lsAsyncInit);
else
  window.addEventListener('load', lsAsyncInit, false);
*/

/*
window.setTimeout(function() {
    // do other inits first
    if (window.lsAsyncInit && !window.lsAsyncInit.hasRun) {
        window.lsAsyncInit.hasRun = true;
        lsAsyncInit();
    }
}, 0); */