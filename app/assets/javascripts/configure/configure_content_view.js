/*
 * Copyright (c) 2012 LifeSizer, Inc.
 * All Rights Reserved.
 *
 * renders the content of the modal dialog (everything underneath the toolbar)
 * Manages the image and canvas display and delegates to the input dialog
 */
var ConfigureContentView = Backbone.View.extend({
    el: '#ls-modal-content',
    _template: '<div id="ls-configure">\
                    <div id="ls-loading-img"></div>\
                    <img class="lifesize"/>\
                    <div id="ls-arr-msg"><div id="ls-size-label"></div></div>\
                    <div id="ls-input-dialog"></div>\
                </div>',

    initialize: function() {
        var me = this;
        // listen for cancel event from input dialog
        this.model.on('cancelSave', function() {
            jQuery('#ls-modal-content #ls-configure').drawArrow('clear');
        });
        // listen for label update events from input dialog
        this.model.on('updateArrowLabel', function(length, unit) {
            // there are 3 ways to call this:
            // 1. pass in 'hide' to hide label
            // 2. pass in length and unit to display that in arrow label
            // 3. don't pass in anything to use values from model
            var arrLabel = jQuery('#ls-arr-msg');
            if (length == 'hide') {
                arrLabel.hide();
            } else {
                var l,u;
                if (length) {
                    l = length;
                    u = unit;
                } else {
                    l = me.model.get('calibrateLength');
                    u = me.model.get('calibrateUnit');
                }
                jQuery('#ls-size-label').html(l + me.model.UNITS[u]);
                arrLabel.drawArrow('showMidLabel');
                arrLabel.show();
            }
        });
    },

    // render the view
    render: function() {
        var me = this;
        var template = _.template(this._template, {});
        this.$el.append(template);

        var minInnerWidth =  500;
        var minInnerHeight = 400;

        var maxInnerDim = me.options.outerView.maxInnerDimensions();
        var maxInnerWidth = maxInnerDim.width;
        var maxInnerHeight = maxInnerDim.height;

        // now load containing image
        image = jQuery('#ls-configure .lifesize');
        image.bind('load', function() {
            originalWidth = this.width; // save original dimensions
            originalHeight = this.height;
            me.model.set('width', originalWidth);
            me.model.set('height', originalHeight);

            var newDim = me.fitInBox([this.width, this.height], [maxInnerWidth, maxInnerHeight]);
            var innerWidth =  Math.max(newDim[0], minInnerWidth);
            var innerHeight = Math.max(newDim[1], minInnerHeight);
            image.attr('width',  newDim[0]).attr('height', newDim[1]);
            me.model.renderDimensions(newDim[0], newDim[1]);
            image.css({ left: (innerWidth - newDim[0])/2 + 'px',
                        top: (innerHeight - newDim[1])/2 + 'px'});

            // tell the modal (ConfigureView) to update its dimensions
            me.options.outerView.resize(innerWidth, innerHeight, function() {
                //console.log("resized to " +innerWidth +"," + innerHeight);
                // resize is complete
                jQuery('#ls-loading-img').hide();
                image.show();
                $arrowCanvas = jQuery('#ls-configure');

                // initialize drawArrow plugin
                $arrowCanvas.drawArrow({lineWidth: 4, color: '#84a800', straightAngleColor: '#a4c820', midElement: jQuery('#ls-arr-msg')});
                // set up for mouse draw
                $arrowCanvas.drawArrow('mouseDraw',
                    function(s, e, l) { me.arrowComplete.call(me, s, e, l); },
                    function() { me.arrowStart.call(me); }
                );
                // if we have arrow data available, draw the arrow now
                var pts = me.model.getRenderArrowPoints();
                if (pts) {
                    $arrowCanvas.drawArrow('draw', pts.start, pts.end);
                    me.model.trigger('updateArrowLabel');
                }
            });
        });
        image.attr('src', me.model.get('url'));

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

        //_initDialog();
    },

    /**
     * this handler is called upon arrow draw complete
     * @param start start coordinate of arrow (relative to imageBox)
     * @param end end coordinate of arrow
     * @param length length of arrow in screen pixels
     */
    arrowComplete: function(start, end, length) {
        this.model.setCalibrateData(start, end, length);

        if (!this.inputDialog) {
            // create input dialog if doesn't exist yet
            this.inputDialog = new ConfigureInputDialogView({
                inputOptions:   this.model.inputOptions,
                model:          this.model,
                dialogType:     this.options.dialogType
            });
        }
        this.inputDialog.open();
    },

    /**
     * callback for draw arrow start
     */
    arrowStart: function() {
        if (this.inputDialog) {
            this.inputDialog.close();
        }
    },

    /**
     * resize an image so it fits within the dimensions passed in, while preserving the original proportions
     * @param img image dimensions [x, y]
     * @param maxDim box dimensions to fit into [width, height]
     * @return render image dimensions [width, height]
     */
    fitInBox: function(img, maxDim) {
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
});