/*
* Copyright (c) 2011 LifeSizer, Inc.
* All Rights Reserved.
*/
//
// Draw arrows with mouse using either Canvas or Raphael javascript API.
//
(function($) {
    var opts;
    var startPos;
    var endPos;
    var lastPos;
    var offset;
    // for Canvas, this is the Canvas context. For Raphael, this is the Paper object.
    var context;
    var draw;

    /**
     * main method, delegates to all other methods
     * @param method
     */
    $.fn.drawArrow = function( method ) {
        if ( typeof method === 'object' || ! method ) {
            return init.apply( this, arguments );
        } else if (method == 'mouseDraw') {
            mouseDraw.apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if (method == 'draw') {
            drawArrow.apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if (method == 'showMidLabel') {
            showMidLabel.apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if (method == 'clear') {
            clear.apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else {
            info('Method ' +  method + ' does not exist on jQuery.drawArrow');
        }
    };

    /**
     * initialize drawArrow plugin
     * Call this on the div element that the user should be able to draw in.
     * If the Raphael js is loaded, this plugin will use the Raphael drawing API.
     * Otherwise, it will use Canvas. If Canvas API is used, this plugin will create the Canvas element as necessary.
     * Available options:
     *
     * impl : force draw implementation to either 'raphael' or 'canvas'
     *
     * @param options
     */
    function init(options) {
        // build main options before element iteration
        opts = $.extend({}, $.fn.drawArrow.defaults, options);

        var impl;
        if (opts.impl) {
            impl = opts.impl;
        } else {
            impl = (typeof(Raphael) == 'undefined') ? 'canvas' : 'raphael';
        }
        draw = drawingDelegates[impl];
        debug('drawing with ' + impl );
        var em = $(this[0]);
        em.css('cursor', 'crosshair');
        this[0].onselectstart = function(){ return false; } // prevent text select cursor in Chrome on drag
        context = draw.getContext(em);
        if (context == null) {
            // no canvas or Raphael support
            info("no context could be loaded");
            return;
        }

        offset = em.offset();
        return this;
    }

    /**
     * positions and shows the middle label element
     */
    function showMidLabel() {
        if (!startPos || !endPos) {
            return; // can't set if no arrow is currently drawn
        }
        // adjust with the image offset (image element is sibling of arrow mid elem)
        var imgOffset = opts.midElement.siblings('img.lifesize').position();
        var xPos = ((Math.round(startPos.x + endPos.x) / 2) - opts.midElement.width() / 2) + (imgOffset.left);
        var yPos = ((Math.round(startPos.y + endPos.y) / 2) - opts.midElement.height() / 2) + (imgOffset.top);
        opts.midElement.css({top: yPos, left: xPos});
    }

    /**
     * initializes draw arrow mode.
     *
     * @param options additional options. (see $.fn.drawArrow.defaults)
     * @param endDraw callback handler for end of draw
     * @param startDraw callback handler for start of draw
     */
    function mouseDraw(endDraw, startDraw) {

        var em = $(this[0]);
        var imgElem = $(em.children('img.lifesize')[0]);

        // set the canvas size dynamically, and update it if window is resized
        $(window).resize(function() {
            draw.updateCanvasSize(em);
            opts.midElement.hide();
        });
        draw.updateCanvasSize(em);

        var moving = false;
        var length = 0;

        // handle mouse click (start drag arrow)
        em.bind('mousedown', function(e) {
            var pos = getMousePosOnImage(e, imgElem);
            if (pos) {
                if (opts.midElement) {
                    opts.midElement.hide();
                }
                if (!moving) { // may still be in moving mode if mouse left the canvas
                    draw.clearCanvas();
                    startPos = pos;
                    moving = true;
                    length = 0;
                    if (startDraw) {
                        // start callback
                        startDraw(startPos);
                    }
                }
            }
            //console.log("mouse down: [" + startPos.x + "," + startPos.y + "]");
        });

        // handle mouse up (end create arrow)
        em.bind('mouseup', function(e) {
            moving = false;
            var pos = getMousePosOnImage(e, imgElem);
            if (!pos) {
                // user released mouse outside of image area. remove arrow and ignore
                draw.clearCanvas();
                return;
            }
            endPos = pos;

            // draw for last time in case the mousemove event didn't fire
            draw.clearCanvas();
            length = drawArrow.apply(em, [startPos, endPos]);

            debug("draw complete: from [" + startPos.x + "," + startPos.y + "] to [" + endPos.x + "," + endPos.y + "], length = " + length);
            if (length > opts.minLength) {
                if (endDraw) {
                    // end callback
                    endDraw(startPos, endPos, length);
                }
            } else if (length > 0) {
                // not long enough.
                draw.clearCanvas();
            }
        });

        // mousemove event: continually updates and redraws the arrow
        em.bind('mousemove', function(e) {
            var pos = getMousePosOnImage(e, imgElem);
            if (pos) {
                em.css('cursor', 'crosshair');
                lastPos = pos; // remember last position
                // TODO: might want to measure the time it takes to draw the arrow, and limit
                // the number of redraws per second here, for slower systems
                if (moving) {
                    draw.clearCanvas();
                    length = drawArrow.apply(em, [startPos, pos]);
                }
                return false; // return false to disable selection in IE
            } else {
                // mouse is not over image
                em.css('cursor', 'default');
            }
        });
    };

    /**
     * plugin defaults. Additional defaults that can be specified:
     * impl: either 'canvas' or 'raphael' to force use of corresponding APIs
     * straightAngleColor: color that arrow should have only if it's perfectly horizontal or vertical
     */
    $.fn.drawArrow.defaults = {
        color: '#B0B0B0',
        lineWidth: 4,
        arrowAngle: 22,
        minLength: 30
    };

    /**
     * clears the canvas and hides the arrow label
     */
    function clear() {
        draw.clearCanvas();
        if (opts.midElement) {
            opts.midElement.hide();
        }
    };

    /**
     * returns current mouse position with offset adjusted
     * @param e
     */
    function getMousePos(e) {
        return { x: e.pageX - offset.left, y: e.pageY - offset.top };
    }

    /**
     * returns position of mouse on image. If mouse position is outside of image, return false
     * @param e moouse event
     * @param imgElem the jquery element for the image inside div
     */
    function getMousePosOnImage(e, imgElem) {
        var offset = imgElem.offset();
        var pos = { x: e.pageX - offset.left, y: e.pageY - offset.top };
        if (pos.x < 0 || pos.y < 0 || pos.x > imgElem.width() || pos.y > imgElem.height()) {
            return false;
        }
        return pos;
    }

    /**
     * performs the calculations for all the arrow points, and uses the
     * draw delegate to actually draw the arrow.
     * @param pntFrom start point of line drawn
     * @param pntTo end point of line drawn
     */
    function drawArrow(pntFrom, pntTo) {
        var elem = $(this[0]);
        startPos = pntFrom;
        endPos = pntTo;

        // adjust points to be relative to parent div instead
        var imgElem = elem.children('img.lifesize');
        var offset = imgElem.position();

        //console.log('in draw, offset = ' + offset.left + "," + offset.top);

        pntFrom = { x: pntFrom.x + offset.left, y: pntFrom.y + offset.top };
        pntTo = { x: pntTo.x + offset.left, y: pntTo.y + offset.top };

        // calculate line angle and length
        var a = pntTo.x - pntFrom.x;
        var b = pntFrom.y - pntTo.y;
        var alpha = Math.atan(b/a);
        var length = (alpha == 0) ? a : (b / Math.sin(alpha));
        var absLen = Math.round(Math.abs(length));
        //debug("drawing from [" + pntFrom.x + "," + pntFrom.y + "] to [" + pntTo.x + "," + pntTo.y + "], length = " + length);

        pntFrom = roundPoint(pntFrom);
        pntTo = roundPoint(pntTo);

        // figure out an appropriate arrow size based on the line length
        var arrowLen = 0;
        if (absLen < 20) {
            arrowLen = 0;
        } else if (absLen < 105) {
            arrowLen = Math.round(absLen / 3);
        } else {
            arrowLen = 35;
        }
        // convert arrow angle to radians
        var arrowAngle = opts.arrowAngle * 2*Math.PI/360;
    
        // get the points to draw for the arrows
        var start = getArrowPoints(alpha, (length > 0), pntFrom, arrowAngle, arrowLen);
        var end =   getArrowPoints(alpha, (length < 0), pntTo, arrowAngle, arrowLen);
    
        // draw the arrows
        draw.drawArrow(pntFrom, start, pntTo, end);

        // return arrow length
        return absLen;
    };

    /**
     * rounds coordinates of a given point to the nearest integers
     * @param p coordinate (with x and y property)
     */
    function roundPoint(p) {
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
        return p;
    }

    /**
     * returns both the points for the arrow, as well as a third point
     * (directly in between) that should act as the endpoint of the line
     * @param alpha degree of arrow
     * @param goLeft true if arrow is pointing into left quadrant
     * @param endPoint endpoint of arrow
     * @param angle angle that arrow tip should have
     * @param al length of arrow head
     */
    function getArrowPoints(alpha, goLeft, endPoint, angle, al) {
        var l = Math.cos(angle) * al;
        var arr1, arr2, conn;
        if (goLeft) {
            arr1 = { x: endPoint.x + Math.round(Math.cos(angle + alpha) * al),
                     y: endPoint.y - Math.round(Math.sin(angle + alpha) * al) };
            arr2 = { x: endPoint.x + Math.round(Math.cos(angle - alpha) * al),
                     y: endPoint.y + Math.round(Math.sin(angle - alpha) * al) };
            conn = { x: endPoint.x + Math.round(Math.cos(alpha) * l),
                     y: endPoint.y - Math.round(Math.sin(alpha) * l) };
        } else {
            alpha = 2*Math.PI - alpha;
            arr1 = { x: endPoint.x - Math.round(Math.cos(angle + alpha) * al),
                     y: endPoint.y - Math.round(Math.sin(angle + alpha) * al) };
            arr2 = { x: endPoint.x - Math.round(Math.cos(angle - alpha) * al),
                     y: endPoint.y + Math.round(Math.sin(angle - alpha) * al) };
            conn = { x: endPoint.x - Math.round(Math.cos(alpha) * l),
                     y: endPoint.y - Math.round(Math.sin(alpha) * l) };
        }
        //console.log("arr1: [" + arr1.x + "," + arr1.y + "] - arr2: [" + arr2.x + "," + arr2.y + "] - conn: [" + conn.x + "," + conn.y + "]");
        return { arr1: roundPoint(arr1), arr2: roundPoint(arr2), conn: roundPoint(conn)};
    }

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
        if (opts.debug) {
            info(msg, obj);
        }
    }

    /**
     * Drawing delegates
     * contains implementation specific functions for Canvas or Raphael
     */
    var drawingDelegates = {
        canvas: {
            // returns canvas context
            getContext: function(em) {
                var cnvs = em.children('canvas');
                if (cnvs.length > 0) return cnvs.first().getContext("2d");

                // canvas doesn't exist yet, create it
                var c = document.createElement("canvas");
                c.setAttribute('width', em.width());
                c.setAttribute('height', em.height());
                em.append(c);
                var ctx = c.getContext("2d");
                ctx.strokeStyle = opts.color;
                ctx.fillStyle = opts.color;
                ctx.lineWidth = opts.lineWidth;
                return ctx;
            },

            // dynamically updates the size of the canvas to fit snugly within parent container
            updateCanvasSize: function(em) {
                var cnvs = em.children('canvas');
                if (cnvs.length > 0) {
                    cnvs.first().height = em.height();
                    cnvs.first().width = em.width();
                }
            },

            // removes previous arrow
            clearCanvas: function() {
                if (opts.midElement) {
                    opts.midElement.hide();
                }
                context.clearRect(0,0,context.canvas.width,context.canvas.height);
            },

            // draws the arrow
            drawArrow: function(pntFrom, start, pntTo, end) {
                var color = opts.color;
                if (opts.straightAngleColor && (pntFrom.x == pntTo.x || pntFrom.y == pntTo.y)) {
                    color = opts.straightAngleColor;
                }
                context.strokeStyle = color;
                context.fillStyle = color;

                context.beginPath();
                context.moveTo(pntFrom.x,pntFrom.y);
                context.lineTo(start.arr1.x, start.arr1.y);
                context.lineTo(start.arr2.x, start.arr2.y);
                context.fill();
                context.moveTo(pntTo.x,pntTo.y);
                context.lineTo(end.arr1.x, end.arr1.y);
                context.lineTo(end.arr2.x, end.arr2.y);
                context.fill();
                // draw the line between the arrows
                context.beginPath();
                context.moveTo(start.conn.x, start.conn.y);
                context.lineTo(end.conn.x, end.conn.y);
                context.stroke();
                context.closePath();
            }
        },
        raphael: {
            // returns Raphael paper
            getContext: function(em) {
                return new Raphael(em.attr('id'), em.width(), em.height());
            },

            // dynamically updates the size of the canvas to fit snugly within parent container
            updateCanvasSize: function(em) {
                context.setSize(em.width(), em.height());
            },

            // removes previous arrow
            clearCanvas: function() {
                if (opts.midElement) {
                    opts.midElement.hide();
                }
                // paper.clear() seems to break mousemove and mouseup events in firefox.
                // avoid using it. Instead, find all elements on the paper and remove them
                // one by one.
                var elem = [];
                context.forEach(function(e){
                    // removing them in this callback doesn't appear to work either, so
                    // collect them in an array first.
                    elem.push(e);
                });
                for (var i=0; i<elem.length; i++) {
                  elem[i].remove();
                }
            },

            // draws the arrow
            drawArrow: function(pntFrom, start, pntTo, end) {
                function pathPoint(pnt, instruction) {
                    return instruction + " " + pnt.x + " " + pnt.y + " ";
                }
                function arrowHeadPath(tip, pt1, pt2) {
                    return pathPoint(tip, "M") + pathPoint(pt1, "L") + pathPoint(pt2, "L") + "Z";
                }

                var color = opts.color;
                if (opts.straightAngleColor && (pntFrom.x == pntTo.x || pntFrom.y == pntTo.y)) {
                    color = opts.straightAngleColor;
                }
                var set = context.set();
                set.push(
                  context.path(arrowHeadPath(pntFrom, start.arr1, start.arr2)),
                  context.path(arrowHeadPath(pntTo, end.arr1, end.arr2))
                );
                set.attr({fill: color, stroke: color});
                // draw the line between the arrows
                var p = context.path(pathPoint(start.conn, "M") + pathPoint(end.conn, "L"));
                p.attr({stroke: color, "stroke-width": opts.lineWidth});
            }
        }
    };
})(jQuery);

