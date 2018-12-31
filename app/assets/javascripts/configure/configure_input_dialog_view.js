/*
* Copyright (c) 2012 LifeSizer, Inc.
* All Rights Reserved.
*
 * renders the input dialog asking for the physical dimensions of arrow drawn
 */
var ConfigureInputDialogView = Backbone.View.extend({
    el:             '#ls-input-dialog',
    _fullTemplate : '<form><p><label for="ls-size-input">life-size length of drawn arrow</label><br/><input id="ls-size-input" type="text"/>\
            <select id="ls-size-unit"><option value="1">inch</option><option value="2">cm</option><option value="3">mm</option></select></p>\
            <p><label for="ls-name-field">name</label><br/><input id="ls-name-field" type="text"/></p>\
            <p><label for="ls-reference-field">reference</label><br/><input id="ls-reference-field" type="text"/></p>\
            <div id="ls-form-button"><input id="ls-save-button" class="ls-blue-button" type="button" name="save" value="save"/><input id="ls-cancel-button" class="ls-blue-button" type="button" name="cancel" value="cancel"/></div>\
        </form>',

    _minimalTemplate: '<form><p><label for="ls-size-input">life-size length of drawn arrow</label><br/><input id="ls-size-input" type="text"/>\
        <select id="ls-size-unit"><option value="1">inch</option><option value="2">cm</option><option value="3">mm</option></select></p>\
        <div id="ls-form-button"><input id="ls-save-button" class="ls-blue-button" type="button" name="save" value="save"/><input id="ls-cancel-button" class="ls-blue-button" type="button" name="cancel" value="cancel"/></div>\
        </form>',

    // initialize view
    initialize: function() {
        this.render();
    },

    // define user events
    events: {
        'click #ls-cancel-button'   : 'cancel',
        'click #ls-save-button'     : 'save',
        'keyup #ls-size-input'      : 'lengthInputChange',
        'change #ls-size-unit'      : 'lengthInputChange'
    },

    inputLength: function(val) {
        if (typeof(val) == 'undefined') {
            return this.$('#ls-size-input').val();
        } else {
            this.$('#ls-size-input').val(val);
        }
    },

    // returns true if full dialog should be displayed
    fullDialog: function() {
        return (this.options.dialogType == 'full');
    },

    // returns the value of a specified cookie
    getCookiePref: function(name) {
        return(document.cookie.match('(^|; )'+name+'=([^;]*)')||0)[2];
    },

    // sets a cookie with expiration date 1 year
    setCookiePref: function(name, value) {
        var d = new Date();
        d.setFullYear(d.getFullYear()+1); // expires in 1 year
        document.cookie = name + '=' + value + '; expires=' + d.toGMTString( ) + ';';
    },

    render: function() {
        var template = _.template(this.fullDialog() ? this._fullTemplate : this._minimalTemplate, {});
        this.$el.html(template);
        this.$('#ls-name-field').val(this.model.get('name'));
        this.$('#ls-reference-field').val(this.model.get('ref'));
        // get the unit from the model, or from cookie pref
        var unit = this.model.get('calibrateUnit') || this.getCookiePref('ls-calibrateUnit');
        if (unit) this.$('#ls-size-unit').val(unit);

        this.enableSaveButton(false);
        this.$el.mousedown(function(e) { e.stopPropagation();}).mouseup(function(e){e.stopPropagation();});
        return this;
    },

    // opens the modal dialog
    open: function() {
        this.$el.show();

        //$('#ls-name-field').val(opts.name);
        //$('#ls-reference-field').val(opts.ref);
    },

    // closes the modal view
    close: function() {
        this.$el.hide();
    },

    // event handler for click 'cancel' button
    cancel: function() {
        this.model.trigger('cancelSave'); // trigger event on model. (this will result in arrow being cleared)
        this.inputLength(null); // clear input length
        // TODO clear other fields as well?
        this.close();
    },

    // event handler for click 'save' button
    save: function() {
        var length = this.inputLength();
        if (this._methods.isValidLength(length)) {
            // set properties on model
            var img = this.model;
            var attr = {  calibrateLength:  parseFloat(this.inputLength()),
                          calibrateUnit:    parseInt(this.$('#ls-size-unit').val()) };
            if (this.fullDialog()) {
                // full dialog adds name and reference fields
                attr.name = this.$('#ls-name-field').val();
                attr.ref  = this.$('#ls-reference-field').val();
            }
            img.set(attr);
            // store the calibrateUnit in a preference cookie
            this.setCookiePref('ls-calibrateUnit', attr.calibrateUnit);

            // update ppi
            var ppi = this.model.calculatePpi(); // calculate and set new ppi
            img.set('ppi', ppi);

            var resTooLow = this.model.resolutionTooLow();
            var tooBig = this.model.actualSizeTooBig();
            // TODO: refuse input if tooBig or resTooLow
            if (resTooLow) {
                LsLog.warn("resolution too low: " + this.model.calculatePpi());
            }
            if (tooBig) {
                var ppi = this.model.calculatePpi();
                LsLog.warn("image too big: " + (this.model.get('width') / ppi) + "x" + (this.model.get('width') / ppi) + " inches");
            }
            this.model.trigger('okToSave');
        }
        this.close();
    },

    // triggered when anything changes in length input field
    lengthInputChange: function() {
        var inputLength = this.inputLength();
        if (this._methods.isValidLength(inputLength)) {
            // valid input
            this.enableSaveButton(true);
            // trigger event on model (used by ConfigureContentView to update arrow label)
            this.model.trigger('updateArrowLabel', inputLength, parseInt(this.$('#ls-size-unit').val()));
        } else {
            // input not valid
            this.enableSaveButton(false);
            this.model.trigger('updateArrowLabel', 'hide');
        }
    },

    // enables/disables the save button
    enableSaveButton: function(enabled) {
        var saveButton = this.$('#ls-save-button');
        if (enabled) {
            saveButton.removeAttr('disabled');
        } else {
            saveButton.attr('disabled','disabled')
        }
    },

    // 'private' methods
    _methods: {
        isValidLength: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n) && (parseFloat(n) > 0);
        }
    }
});