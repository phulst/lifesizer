/*
 * Copyright (c) 2012 LifeSizer, Inc. - All Rights Reserved.
 * Author: Peter Hulst
 *
 * Small and Lightweight modal jquery plugin, with nothing more, nothing less than
 * what's needed for LifeSizer.
 */
(function($) {
	var options;
    var overlay;
    var modal;
    var content;

    // methods exposed to external interface
    var methods = {

        /**
         * initializes plugin. This should be done after DOM has initialized
         */
        init: function() {
            if (overlay) {
                return; // already initialized
            }

	        // Generate the HTML and add it to the document
            $('#ls-overlay').remove();
            $('#ls-modal').remove();

            $('body').append('<div id="ls-overlay"></div><div id="ls-modal"><div id="ls-modal-content"></div></div>');
            overlay = $('#ls-overlay').hide();
            modal = $('#ls-modal').hide();
            content = $('#ls-modal-content');
            /*

	        overlay = $('<div id="ls-overlay"></div>');
	        modal = $('<div id="ls-modal"></div>');
	        content = $('<div id="ls-modal-content"></div>');
	        modal.append(content);

	        modal.hide();
	        overlay.hide();

            $('body').append(overlay, modal); */
        },

        /**
       	 * Center the modal in the viewport.
       	 */
       	center: function () {
       		var top, left;

       		top = Math.max($(window).height() - modal.outerHeight(), 0) / 2;
       		left = Math.max($(window).width() - modal.outerWidth(), 0) / 2;

       	    modal.css({
       			top:top + $(window).scrollTop(),
       			left:left + $(window).scrollLeft()
       		});
       	},

        /**
       	 * resize modal to requested (outer) width and height
       	 * @param width
       	 * @param height
         * @param callback to call when resize is complete
       	 */
       	resize: function(width, height, complete) {
       		// calculate new left and top positions
       		var top = Math.max($(window).height() - height, 0) / 2;
       		var left = Math.max($(window).width() - width, 0) / 2;

       		var curHeight = modal.height;
       		modal.animate({
                   width: width,
                   height: height,
       			   top: top + $(window).scrollTop(),
                   left: left + $(window).scrollLeft()
            }, complete);
       	},

        /**
       	 * Open the modal
       	 *
       	 * content: html content to use
       	 * close: selector for close button. (click handler will be attached)
       	 */
       	open: function (opts) {
       		options = opts;
       		content.append(options.content);
       		modal.css({
       			width: options.width || 'auto',
       			height: options.height || 'auto'
       		});

       		methods.center();

       		// attach resize handler
       		$(window).bind('resize.modal', methods.center);
       		// attach close click handler
       		if (options.close) {
       		    $(options.close).bind('click.modal', function(e) {
       				e.preventDefault();
       				methods.close();
       			});
       		}
       		// attach ESC key handler
            $(document).bind('keyup.modal', function(e) {
                if (e.keyCode == 27) { methods.close(); }
            });

            $('html').css({overflow:'hidden'});
       		modal.fadeIn();
       		overlay.fadeIn();
       	},

        isOpen: function() {
            return content.is(':visible');
        },

        // Close the modal
    	close: function () {
		    //modal.hide();
		    //overlay.hide();
            modal.fadeOut();
            overlay.fadeOut();
            $('html').css({overflow:'visible'});
		    content.empty();
		    // remove resize handler
		    $(window).unbind('resize.modal');
		    // remove close click handler
		    if (options.close) {
			    $(options.close).unbind('click.modal');
		    }
            // remove ESC key handler
            $(document).unbind('keyup.modal');
	    }
    };

    $.lifesizerModal = function( method ) {

        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
        }
    };
})(jQuery);