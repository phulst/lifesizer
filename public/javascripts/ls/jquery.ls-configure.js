/*
* Copyright (c) 2011 LifeSizer, Inc.
* All Rights Reserved.
*/
//
// Plugin for embedding LifeSizer image configuration with external sites.
//
(function($) {

    var dataModel = {};
    var opts;
    var isSaving = false;

    // original dimensions of image
    var originalWidth, originalHeight;
    // jquery image object
    var image;

    /**
     * populates the data model. A framework with bindings like knockout.js would make this unnecessary.
     */
    function populateDataModel() {
        dataModel.name =        $('#ls-name-field').val();
        dataModel.ref  =        $('#ls-reference-field').val();
        dataModel.image_url =   opts.imageUrl;
        dataModel.input_length= $('#ls-size-input').val();
        dataModel.unit =        $('#ls-size-unit').val();
        dataModel.render_width= image.width();
        // we don't need the render height
    }

    /**
     * resize an image so it fits within the dimensions passed in, while preserving the original proportions
     * @param img image dimensions [x, y]
     * @param maxDim box dimensions to fit into [width, height]
     * @return render image dimensions [width, height]
     */
    function fitInBox(img, maxDim) {
        var width = img[0]; var height = img[1];
        var maxWidth = maxDim[0]; var maxHeight = maxDim[1];
        if (width <= maxWidth && height <= maxHeight) {
            return img; // no need to resize
        } else if (width > maxWidth && height > maxHeight) {
            // both width and height are too large
            var f1 = width / maxWidth;
            var f2 = height / maxHeight;
            var f = (f1 > f2) ? f1 : f2;
        } else if (width > maxWidth) {
            var f = width / maxWidth; // only width is too large
        } else {
            var f = height / maxHeight; // height is too large
        }
        return [Math.round(width/f), Math.round(height/f)];
    }

    /**
     * calculates the actual x and y positions in the actual image that would
     * correspond to an arrow start or end position as drawn
     * @param position start or end position of arrow (on rendered image)
     * @return x and y coordinates (from left top) in actual lifesize image that this
     * arrow position would correspond with
     */
    function calcPositionInImage(position) {
      var top  = position.y * originalHeight / image.height();
      var left = position.x * originalWidth / image.width();
      return { y: Math.round(top), x: Math.round(left) };
    }
    /**
     * does the opposite of calcPositionInImage
     */
    function adjustForRenderedSize(position) {
        //console.log('image dimensions = ' + image.width() + "x" + image.height());
        //console.log('image position = ' + image.position().left + "," + image.position().top);
        var top  = position.y * image.height() / originalHeight;
        var left = position.x * image.width() / originalWidth;
        return { y: Math.round(top), x: Math.round(left) };
    }

    /**
     * this handler is called upon arrow draw complete
     * @param start start coordinate of arrow (relative to imageBox)
     * @param end end coordinate of arrow
     * @param length length of arrow in screen pixels
     */
    function arrowComplete(start, end, length) {
        var imgArrowStart = calcPositionInImage(start);
        dataModel.arrow_start = imgArrowStart.x + "," + imgArrowStart.y;
        var imgArrowEnd = calcPositionInImage(end);
        dataModel.arrow_end = imgArrowEnd.x + "," + imgArrowEnd.y;
        dataModel.arrow_length = length;

        //if (window.console) console.log("arrow drawn from " + imgArrowStart.x + "," + imgArrowStart.y + " to " +
        //    imgArrowEnd.x + "," + imgArrowEnd.y + " on original.");
        _showDialog();
    }

    /**
     * callback for draw arrow start
     */
    function arrowStart() {
        _hideDialog()
    }

    /**
     * returns html for lightbox content
     */
    function lightboxHtml() {
        var h = "<div id='ls-configure'>" +
            "<div id='ls-loading-img'/>" +
            "<img class='lifesize'/>" +
            "<div id='ls-arr-msg'><div id='ls-size-label'></div></div>" +
            "<div id='ls-info-dialog'>" +
                "<form><p><label for='ls-size-input'>life-size length of drawn arrow</label><br/><input id='ls-size-input' type='text'/>" +
                "<select id='ls-size-unit'><option value='in'>inch</option><option value='cm'>cm</option><option value='mm'>mm</option></select></p>" +
                "<p><label for='ls-name-field'>name</label><br/><input id='ls-name-field'/></p>" +
                "<p><label for='ls-reference-field'>reference</label><br/><input id='ls-reference-field'/></p>" +
                "<input type='hidden' name='imageUrl'/>" +
                "<div id='ls-form-button'><input id='ls-save-button' type='button' name='save' value='save'/><input id='ls-cancel-button' type='button' name='cancel' value='cancel'/></div>"
                "</form>"
            "</div></div>";
        return h;
    }

    /**
     * updates the arrow label if relevant inputs change
     */
    function _updateArrowLabel() {
        $('#ls-size-label').html($('#ls-size-input').val() + ' ' + $('#ls-size-unit').val());
        $('#ls-arr-msg').drawArrow('showMidLabel');
        $('#ls-arr-msg').show();
    }

    function _initDialog() {
        // prevent arrow draw under dialog
        $('#ls-info-dialog').mousedown(function(e) { e.stopPropagation();}).mouseup(function(e){e.stopPropagation();});

        // set up button click handlers
        $('#ls-cancel-button').click(_hideDialog);
        $('#ls-save-button').click(_saveLifeSize);
        $('#ls-size-input').keyup(_updateArrowLabel);
        $('#ls-size-unit').change(_updateArrowLabel);
    }

    function _hideDialog() {
        $('#ls-size-input').val('');
        $('#ls-info-dialog').hide();
        // also hide the arrow and label
        $('#ls-configure').drawArrow('clear');
    }

    function _showDialog() {
        $('#ls-info-dialog').show();
        $('#ls-name-field').val(opts.name);
        $('#ls-reference-field').val(opts.reference);
    }

    /**
     * saves lifesize calibration data by sending to server
     */
    function _saveLifeSize() {
        if (isSaving) {
            return;
        }
        isSaving = true;

        debug("saving lifesize data");
        populateDataModel();

        showSavingProgress();
        var params = {
            key : opts.appKey
        };
        $.extend(params, dataModel);
        $.getJSON(opts.host + '/images/remote_save?callback=?', params, function(data) {
            debug("returned data", data);
            if (!data.error) {
                if (opts.callback) {
                    // call callback handler if defined
                    opts.callback.call(data, data.ref);
                }
            } else {
                _handleCommError(data);
            }
            $.colorbox.close();
            isSaving = false;
        });
    }

    /**
     * loads image data from server and, if available, draws arrow on image
     */
    function loadImageData() {
        // query lifesizer to see if the image is already known
        var reqParams = { ref: opts.reference, key : opts.appKey, cal: 't'}
        $.getJSON(opts.host + '/images/remote_get?callback=?', reqParams, function(data) {
            if (!data.error) {
                var img = data[0];
                debug('received image data', img);
                var arrow_start;
                var arrow_end;
                var as = img['arrow_start'].split(',');
                if (as.length == 2) {
                    arrow_start = adjustForRenderedSize({ x: parseInt(as[0]), y: parseInt(as[1])});
                }
                var ae = img['arrow_end'].split(',');
                if (ae.length == 2) {
                    arrow_end = adjustForRenderedSize({ x: parseInt(ae[0]), y: parseInt(ae[1])});
                }

                // now draw midpoint
                $('#ls-configure').drawArrow('draw', arrow_start, arrow_end);
                $('#ls-size-input').val(img.input_length);
                $('#ls-size-unit').val(img.unit);
                _updateArrowLabel();

            } else if (data.error.status != 404) {
                _handleCommError(data);
            }
        });
    }

    /**
     * shows the progress indicator that is displayed immediately after the LS image is saved
     */
    function showSavingProgress() {
        _hideDialog();
        $('#ls-loading-img').css('z-index', 1200).show();
    }

    function _handleCommError(resp) {
        if (resp.error.status == 401) {
            alert("Invalid LifeSizer application key");
        } else {
            alert("An error occurred, please try again later.");
        }
    }

    /**
     * required attributes of options object:
     *   appKey      - the application key
     *   imageUrl    - the image url
     *   reference   - unique reference
     *
     * optional:
     *   name        - name/title for image
     *
     * @param options see above
     * @param callback function to call when object is configured (passed in reference)
     */
    $.lifeSizerLightboxConfigure = function(options, callback) {
        // merge options with default options
        opts = $.extend({}, $.lifeSizerLightboxConfigure.defaults, options);
        if (callback) {
            opts.callback = callback;
        }

        // these numbers should match values in configure.scss stylesheet #ls-configure
        var initialWidth = 370;
        var initialHeight = 300;

        // remove content from previous popup if it's there
        $('#ls-configure').remove();

        $.colorbox( {
            html:           lightboxHtml(),
            opacity:        0.7,
            initialWidth:   initialWidth,
            initialHeight:  initialHeight,
            title:         'Click and drag to draw arrow'
        });

        var maxWidth = (window.innerWidth > initialWidth) ? window.innerWidth : initialWidth ;
        var maxHeight = (window.innerHeight > initialHeight) ? window.innerHeight : initialHeight;

        var maxInnerWidth = maxWidth-70;
        var maxInnerHeight = maxHeight-80;


        // now load containing image
        image = $('#ls-configure .lifesize');
        image.attr('src', opts.imageUrl);
        image.bind('load', function() {
            originalWidth = this.width; // save original dimensions
            originalHeight = this.height;
            var dim = fitInBox([this.width, this.height], [maxInnerWidth, maxInnerHeight]);
            var innerWidth = dim[0];
            var innerHeight = dim[1];
            image.attr('height', innerHeight);
            image.attr('width',  innerWidth);

            // size up if necessary, but don't size down
            if (innerHeight > initialHeight - 8 || innerWidth > initialWidth) {
                var content = $('#ls-configure');
                if (innerWidth < initialWidth)
                    innerWidth = initialWidth;
                if (innerHeight < initialHeight - 8)
                    innerHeight = initialHeight;
                content.height(innerHeight);
                content.width(innerWidth);
                $.colorbox.resize({innerWidth: innerWidth, innerHeight: innerHeight + 8});
            }
            $('#ls-loading-img').hide();
            image.css('top', (image.parent().height() - image.height()) / 2 );
            image.css('left', (image.parent().width() - image.width()) / 2 );
            image.show();

            // initialize drawArrow plugin
            $('#ls-configure').drawArrow({lineWidth: 4, color: '#84a800', straightAngleColor: '#a4c820', midElement: $('#ls-arr-msg')});
            // set up for mouse draw
            $('#ls-configure').drawArrow('mouseDraw', arrowComplete, arrowStart);
            loadImageData();
        });

        /*  doesn't look like we need this functionality here
        var i = img.get();
        // cached images don't fire load sometimes, so we reset src.
        if (i.complete || typeof i.complete === "undefined") {
            var src = i.src;
            // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
            // data uri bypasses webkit log warning (thx doug jones)
            i.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
            i.src = src;
        } */

        _initDialog();
    };

    /**
     * default plugin options
     */
    $.lifeSizerLightboxConfigure.defaults = {
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
