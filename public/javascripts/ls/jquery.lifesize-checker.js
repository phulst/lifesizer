/*
* Copyright (c) 2011-2012 LifeSizer, Inc.
* All Rights Reserved.
*/
//
// Plugin for checking images to see if they've been LifeSized
//
(function($) {
    var opts;

    /**
     * handles response from LifeSizer on remote_get request
     * @param data response data
     */
    var handleResponse = function(data) {
        var elements = this;
        if (!data.error) {
            $.each(data, function(index, value) {
                // add a lifesize class to every image
                elements.each(function() {
                    var refAttr = $(this).attr(opts.refAttrName);
                    if (refAttr == value.ref) {
                        $(this).attr('data-ls-ref', refAttr);
                    }
                });
            });
        }
    };

    /**
     * query lifesizer remote_get using Cross Origin Resource Sharing. Result is the same
     * as the doWithJSONP implementation, except since this one can use POST, it doesn't
     * have a limit on the number of image references that can be queried with a single request.
     * @param imageRefs array of image references to query for
     */
    var doWithCors = function(imageRefs) {

    };

    /**
     * query lifesizer remote_get using Cross Origin Resource Sharing
     * @param imageRefs array of image references to query for
     */
    var doWithJSONP = function(imageRefs) {
        var elements = this;
        var refArr = [new Array];
        var idx = 0;
        $.each(imageRefs, function(index, value){
            refArr[idx].push(value);
            if (refArr[idx].length == 10) {
                refArr.push(new Array);
                idx = idx + 1;
            }
        });
        if (refArr[idx].length == 0) {
            refArr.pop(); // if the last element is an empty array, remove it again
        }

        // for all references, check if these are known to lifesizer, and if so, set the data-ls-ref
        var requests = refArr.length;
        $.each(refArr, function(index, value) {
            // now call ajax request to see which ones have lifesizer data
            $.getJSON(opts.host + '/images/remote_get?callback=?', { key: opts.appKey, ref: value }, function(data) {
                handleResponse.call(elements, data);
                requests -= 1;
                if (requests == 0 && window.Ls) {
                    // all responses received, initialize LifeSizer again
                    window.Ls.init();
                }
            });
        });
    };

    /**
     * checks
     */
    $.fn.checkLifeSize = function(options) {
        opts = $.extend({}, $.fn.checkLifeSize.defaults, options);
        var elements = $(this);

        var imageRefs = [];
        elements.each(function() {
            var ref = $(this).attr(opts.refAttrName);
            if (ref) {
                imageRefs.push(ref);
            }
        });

        if ($.support.cors) {
            // TODO implement doWithCors()
            doWithJSONP.call(elements, imageRefs);
        } else {
            doWithJSONP(elements, imageRefs);
        }
        return this;
    };

    /**
     * default plugin options
     */
    $.fn.checkLifeSize.defaults = {
        host: 'http://beta.lifesizer.com',
        refAttrName: 'data-ls-setref'
    };
})(jQuery);
