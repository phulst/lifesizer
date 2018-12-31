/*
 * Copyright (c) 2012 LifeSizer, Inc.
 * All Rights Reserved.
 *
 * Backbone model for a LifeSizer image
 */
var ImageModel = Backbone.Model.extend({
    LOW_PPI_THRESHOLD:          35,     // reject stuff with ppi < 35
    WIDTH_WARNING_THRESHOLD:    20,     // in inches
    HEIGHT_WARNING_THRESHOLD:   12,     // in inches
    UNITS:                      [null, 'in', 'cm', 'mm'],

    initialize: function() {
        this.on('arrowComplete', function(start, end) {
            this.setCalibrateCoords(start, end);
        });
    },

    urlRoot: function() {
        var host = this.get('host') || window.location.protocol + '//beta.lifesizer.com';
        return host + '/user/' + this.get('userId') + '/image';
    },

    /**
     * fetches the image by reference
     */
    fetchByRef: function(options) {
        if (!this.id) {
            this.id = 0;
        }
        options || (options = {});
        options.data = { ref: this.get('ref')};
        return this.fetch(options);

    },

    save: function(attr, options) {
        // reset 0 value so that it will be treated as a create instead of update
        if (this.id == 0) {
            this.id = null;
        }
        return Backbone.Model.prototype.save.call(this, attr, options);
    },

    sync: function (method, model, options) {
        options.timeout = 20000; // required, or the application won't pick up on 404 responses
        //options.dataType = "jsonp";
        // this CORS header is required in Chrome
        //options.xhrFields = {
        //  withCredentials: true
        //};
        return Backbone.sync(method, model, options);
    },

    // sets the render dimensions of the lifesize image
    renderDimensions: function(width, height) {
        this.set({renderWidth: width, renderHeight: height});
    },

    // sets the calibrate coords from the arrow start and end points
    setCalibrateData: function(start, end, pixelLength) {
        console.log("start and end");
        console.dir(start);
        console.dir(end);
        var me = this;
        function calcPositionInImage(position) {
          var top  = position.y * me.get('height') / me.get('renderHeight');
          var left = position.x * me.get('width')  / me.get('renderWidth');
          return { y: Math.round(top), x: Math.round(left) };
        }
        var imgArrowStart = calcPositionInImage(start);
        var imgArrowEnd   = calcPositionInImage(end);
        var coords = imgArrowStart.x + "," + imgArrowStart.y + "-" + imgArrowEnd.x + "," + imgArrowEnd.y;
        this.set({ calibrateCoords: coords, arrowPixelLength: pixelLength });
        console.dir(coords);
        console.log("with pixel length " + this.get('arrowPixelLength'));
    },

    // returns arrow start and end positions on rendered image. Make sure that renderDimensions
    // are set first before calling this.
    getRenderArrowPoints: function() {
        var me = this;
        function adjustForRenderedSize(x, y) {
            var top  = y * me.get('renderHeight') / me.get('height');
            var left = x * me.get('renderWidth') / me.get('width');
            return { y: Math.round(top), x: Math.round(left) };
        }

        var coords = me.get('calibrateCoords');
        if (!coords) return null;
        var start = 0;
        var end = 0;
        if (m = coords.match(/([\d\.]+),([\d\.]+)-([\d\.]+),([\d\.]+)/)) {
            start = adjustForRenderedSize(m[1], m[2]);
            end   = adjustForRenderedSize(m[3], m[4]);
        }
        return { start: start, end: end };
    },

    // calculates the lifesize arrow length in inches
    lifeSizeArrowLength: function() {
        var unit = this.get('calibrateUnit');
        var fac = 1;
        if (unit == 2) { // cm
            fac = 2.54;
        } else if (unit == 3) { // mm
            fac = 25.4;
        }
        return this.get('calibrateLength') / fac;
    },

    // calculates and returns image ppi based on entered values
    //
    //               arrow len in pixels * width of image in pixels
    // image ppi =   ----------------------------------------------------
    //               arrow length in inches * width of image as rendered
    calculatePpi: function() {
        var ppi = (this.get('arrowPixelLength') * this.get('width')) /
            (this.lifeSizeArrowLength() * this.get('renderWidth'));
        this.set('ppi', ppi);
        return ppi;
    },

    setCalibrateInput: function(length, unit) {
        this.set({
            calibrateLength:   parseFloat(length),
            calibrateUnit:     parseInt(unit)
        });
    },

    // returns true if the ppi of the image will be too low based on info calculated from
    // calibration data
    resolutionTooLow: function() {
        return this.get('ppi') < this.LOW_PPI_THRESHOLD;
    },

    // returns true if the actual size of the image is much bigger than the typical screen
    actualSizeTooBig: function() {
        var ppi = this.get('ppi');
        var tooBig = (((this.get('width') / ppi) > this.WIDTH_WARNING_THRESHOLD) ||
            ((this.get('height') / ppi) > this.HEIGHT_WARNING_THRESHOLD));
        return tooBig;
    },

    saveModelBackup: function() {
        this.modelBackup = this.model.toJSON();
        console.log("saving backup");
        console.dir(this.modelBackup);
    }
});
