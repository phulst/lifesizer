var LsImage = Backbone.Model.extend({
    MAX_ZOOM_FACTOR : 2,
    MIN_DISPLAY_SIZE : 0.5, // minimum display size in actual inches

    /**
     * returns the lower and upper zoom limit for the current image, based on its resolution and the
     * screen pixel density.
     */
    getZoomLimits: function() {
        var minZoom, maxZoom;
        // do not allow zoom beyong MAX_ZOOM_FACTOR * actual resolution of image.
        var max = this.MAX_ZOOM_FACTOR * this.get('ppi') / lsScreen.get('ppi');
        LsLog.debug("max zoom scale based on current image: " + (Math.round(max*100)));
        // round to nearest 50%, if max zoom > 100%
        maxZoom = (max > 1) ? (Math.round(max*2) * 50) : (Math.round(max*100));

        //minimum scale is whatever size the image has when it can fit in the window completely
        var renWidth = this.get('w') * lsScreen.get('ppi') / this.get('ppi');
        var renHeight = this.get('h') * lsScreen.get('ppi') / this.get('ppi');
        // TODO: will $(window).width() and height work properly on other devices and if browser zoom != 100 ?
        var winWidth = $(window).width();
        var winHeight = $(window).height() - 45; // substract size of toolbar
        if (renWidth <= winWidth && renHeight <= winHeight) {
            // image fits in current window completely at 100% zoom. Set minimum zoom to 100
            minZoom = 100;
            LsLog.debug('image fits in current window: min zoom = 100%');
        } else {
            // figure out if we should base the
            var wF = renWidth / winWidth;
            var wH = renHeight / winHeight;
            var adj = (wF > wH) ? wF : wH;
            LsLog.debug("min zoom scale based on current image: " + (Math.floor(10/adj)*10));
            // round down to nearest 10%, but no smaller than 10%
            minZoom = Math.min(10, Math.floor(10/adj)*10);
        }
        if (minZoom > maxZoom) minZoom = maxZoom; // TODO: disable zoom in this case

        // TODO:if minScale > 100 or maxScale < 100, need to notify that lifesize display isn't possible
        return [minZoom, maxZoom];
    }
});
