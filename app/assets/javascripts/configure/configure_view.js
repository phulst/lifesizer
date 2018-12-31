/*
 * Copyright (c) 2012 LifeSizer, Inc.
 * All Rights Reserved.
 *
 * this view encapsulates the modal plugin for image calibration
 */

/**
 * change default template
 * @type {Object}
 */

_.templateSettings = {
  interpolate : /\{\{=(.+?)\}\}/g,
  evaluate :    /\{\{(.+?)\}\}/g
};

function getAssetHost() {
    return (window.location.protocol === 'http:') ? "http://assets.lifesizer.com" : "https://8ca238c90e429da4286c-c6451223c7e588bc601f98f1acc5861a.ssl.cf1.rackcdn.com";
}

var ConfigureView = Backbone.View.extend({
    el: '#ls-modal',
    horMargin:  16,
    verMargin:  56,
    dragMsg:    'Click and drag to draw an arrow',
    _template:  '<div id="ls-toolbar-left" class="ls-toolbar"></div>\
                <div id="ls-toolbar-main" class="ls-toolbar">\
                    <div id="ls-tb-logo" class="ls-tb-element">\
                        <a target="_blank" href="http://www.lifesizer.com"><img src="' + getAssetHost() + '/img/view/toolbar/logo.png"></a>\
                    </div>\
                    <div id="ls-toolbar-title" class="ls-tb-element">{{= toolbarTitle }}</div>\
                    <div class="ls-tb-element ls-tb-right">\
                        <div id="ls-close-button" class="ls-tb-button" title="close"></div>\
                    </div>\
                    <div class="ls-tb-divider ls-tb-right"></div>\
                </div>\
                <div id="ls-toolbar-right" class="ls-toolbar"></div>',

    // initialize view
    initialize: function() {
        jQuery.lifesizerModal('init');
    },

    // render: not currently used, use open() instead
    render: function() {},

    // opens the modal dialog
    open: function() {
        var template = _.template(this._template, { toolbarTitle: this.dragMsg });
        jQuery.lifesizerModal('open', {
            // open at 800x800 or smaller if window is smaller than that
            width:      Math.min(800, jQuery(window).width() - 20),
            height:     Math.min(800, jQuery(window).height() - 20),
            content:    template,
            close:      'div#ls-close-button'
        });
        var content = new ConfigureContentView({ outerView: this, model: this.model, dialogType: this.options.dialogType });
        content.render();
    },

    // open with custom content and dimensions
    openWith: function(content, title, width, height) {
        var template = _.template(this._template, { toolbarTitle: title });
        jQuery.lifesizerModal('open', {
            width:      width,
            height:     height,
            content:    template + content,
            close:      'div#ls-close-button'
        });
    },

    // removes current content from modal dialog and starts calibration
    openCalibration: function() {
        var me = this;
        this.model.on('okToSave', function() { // close the modal when ready to save
            me.close();
        });

        jQuery('.ls-under-toolbar').remove();
        var title = jQuery('div#ls-toolbar-title').html(this.dragMsg);
        var content = new ConfigureContentView({ outerView: this, model: this.model, dialogType: this.options.dialogType });
        content.render();
    },

    // closes the modal view
    close: function() {
        jQuery.lifesizerModal('close');
        this.model.off('okToSave');
    },

    // resize the modal dialog to requested inner dimensions
    resize: function(width, height, callback) {
        jQuery.lifesizerModal('resize', width + this.horMargin, height + this.verMargin, callback);
    },

    // return maximum allowable inner dimensions of modal.
    maxInnerDimensions: function() {
        return { width:  jQuery(window).width() - this.horMargin - 10,
                 height: jQuery(window).height() - this.verMargin - 10 };
    }
});