/*
* Copyright (c) 2012 LifeSizer, Inc.
* All Rights Reserved.
*
* LifeSizer image calibration functionality used in bookmarklet
*/
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
        dataModel.page_url =    opts.pageUrl;
        dataModel.input_length= $('#ls-size-input').val();
        dataModel.unit =        $('#ls-size-unit').val();
        dataModel.render_width= image.width();
        dataModel.source =      'cust_bookmarklet';
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
    function configureHtml() {
        var h = "<div id='ls-configure'><div id='ls-loading-img'/>" +
            "<img class='lifesize'/>" +
            "<div id='ls-arr-msg'><div id='ls-size-label'></div></div>" +
            "<div id='ls-input-dialog'>" +
                "<form><p><label for='ls-size-input'>life-size length of drawn arrow</label><br/><input id='ls-size-input' type='text'/>" +
                "<select id='ls-size-unit'><option value='in'>inch</option><option value='cm'>cm</option><option value='mm'>mm</option></select></p>" +
                "<p><label for='ls-name-field'>name</label><br/><input id='ls-name-field'/></p>" +
                "<p><label for='ls-reference-field'>reference</label><br/><input id='ls-reference-field'/></p>" +
                "<input type='hidden' name='imageUrl'/>" +
                "<div id='ls-form-button'><input id='ls-save-button' class='ls-blue-button' type='button' name='save' value='save'/><input id='ls-cancel-button' class='ls-blue-button' type='button' name='cancel' value='cancel'/></div>" +
                "</form>" +
            "</div></div>";
        return h;
    }

    /** tests if input is a number */
    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    /**
     * updates the arrow label if relevant inputs change
     */
    function updateArrowLabel() {
        var inputVal = $('#ls-size-input').val();
        var saveButton = $('#ls-save-button');
        var arrLabel = $('#ls-arr-msg');
        if (isNumber(inputVal)) {
            // valid input
            $('#ls-size-label').html(inputVal + ' ' + $('#ls-size-unit').val());
            arrLabel.drawArrow('showMidLabel');
            arrLabel.show();
            saveButton.removeAttr('disabled');
        } else {
            // input not valid
            arrLabel.hide();
            saveButton.attr('disabled','disabled')
        }
    }

    function _initDialog() {
        // prevent arrow draw under dialog
        $('#ls-input-dialog').mousedown(function(e) { e.stopPropagation();}).mouseup(function(e){e.stopPropagation();});

        // set up button click handlers
        $('#ls-cancel-button').click(_hideDialog);
        $('#ls-save-button').click(_saveLifeSize);
        $('#ls-size-input').keyup(updateArrowLabel);
        $('#ls-size-unit').change(updateArrowLabel);
        updateArrowLabel();
    }

    function _hideDialog() {
        $('#ls-size-input').val('');
        $('#ls-input-dialog').hide();
        // also hide the arrow and label
        $('#ls-configure').drawArrow('clear');
    }

    function _showDialog() {
        $('#ls-input-dialog').show();
        $('#ls-name-field').val(opts.name);
        $('#ls-reference-field').val(opts.ref);
    }

    /**
     * saves lifesize calibration data by sending to server
     */
    function _saveLifeSize() {
        if (isSaving) {
            return;
        }
        isSaving = true;

        LsLog.debug("saving lifesize data");
        populateDataModel();

        showSavingProgress();
        var params = {
            key : opts.appKey
        };
        $.extend(params, dataModel);
        $.getJSON(opts.host + '/images/remote_save?callback=?', params, function(data) {
            LsLog.debug("returned data", data);
            if (!data.error) {
                if (opts.callback) {
                    // call callback handler if defined
                    opts.callback.call(data, data.ref);
                }
            } else {
                _handleCommError(data);
            }
            $.lifesizerModal('close');
            isSaving = false;
        });
    }

    /**
     * loads image data from server and, if available, draws arrow on image
     */
    function loadImageData() {
        if (!opts.ref) return; // don't have an image ref yet

        // query lifesizer to see if the image is already known
        var reqParams = { ref: opts.ref, key : opts.appKey, cal: 't'}
        $.getJSON(opts.host + '/images/remote_get?callback=?', reqParams, function(data) {
            if (!data.error) {
                var img = data[0];
                LsLog.debug('received image data', img);
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
                updateArrowLabel();

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
     *   ref         - unique reference
     *
     * optional:
     *   name        - name/title for image
     *   pageUrl     - product/item URL
     *
     * @param options see above
     * @param callback function to call when object is configured (passed in reference)
     */
    $.lifeSizerModalConfigure = function(options, callback) {
        // merge options with default options
        opts = $.extend({}, $.lifeSizerModalConfigure.defaults, options);
        if (callback) {
            opts.callback = callback;
        }
        LsLog.info("img data: ", opts);
        $('#ls-modal-content').append(configureHtml);

        /*
        // these numbers should match values in configure.scss stylesheet #ls-configure
        var initialWidth = 370;
        var initialHeight = 300;

        // remove content from previous popup if it's there

        $.colorbox( {
            inline:         popup,
            innerWidth:          initialWidth,
            innerHeight:         initialHeight,
            //html:           lightboxHtml(),
            opacity:        0.7,
            //initialWidth:   initialWidth,
            //initialHeight:  initialHeight,
            title:         'Click and drag to draw arrow',
        });

        */

        var horMargin = 16;
        var verMargin = 56;

        var minInnerWidth =  500;
        var minInnerHeight = 400;

        //var maxWidth = (window.innerWidth > initialWidth) ? window.innerWidth : initialWidth ;
        //var maxHeight = (window.innerHeight > initialHeight) ? window.innerHeight : initialHeight;
        var maxInnerWidth = $(window).width() - horMargin - 15;
        var maxInnerHeight = $(window).height() - verMargin - 15;

        // now load containing image
        image = $('#ls-configure .lifesize');
        image.bind('load', function() {
            originalWidth = this.width; // save original dimensions
            originalHeight = this.height;

            var newDim = fitInBox([this.width, this.height], [maxInnerWidth, maxInnerHeight]);
            var innerWidth =  Math.max(newDim[0], minInnerWidth);
            var innerHeight = Math.max(newDim[1], minInnerHeight);
            image.attr('width',  newDim[0]).attr('height', newDim[1]);
            image.css({ left: (innerWidth - newDim[0])/2 + 'px',
                        top: (innerHeight - newDim[1])/2 + 'px'});

            // give the modal new (outside) dimensions
            $.lifesizerModal('resize', innerWidth + horMargin, innerHeight + verMargin, function() {
                // resize is complete
                $('#ls-loading-img').hide();

                $('#ls-toolbar-title').text('Click and drag to draw arrow');
                image.show();

                // initialize drawArrow plugin
                $('#ls-configure').drawArrow({lineWidth: 4, color: '#84a800', straightAngleColor: '#a4c820', midElement: $('#ls-arr-msg')});
                // set up for mouse draw
                $('#ls-configure').drawArrow('mouseDraw', arrowComplete, arrowStart);
                loadImageData();
            });
        });
        image.attr('src', opts.imageUrl);

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
    $.lifeSizerModalConfigure.defaults = {
        host: 'http://beta.lifesizer.com'
    };
})(jQuery);
