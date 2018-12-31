/**
 * copyright 2011, LifeSizer, inc.
 *
 * This plugin can be used for displaying horizontal / vertical rulers, as follows:
 *
 * Show a horizontal ruler only:
 *
 * var r = $('#rulerCanvas');
 * r.rulergrid('init', ppi, zoom);  //zoom is optional, default is 100
 * r.rulergrid('horizontalRuler');
 * // or
 * r.rulergrid('verticalRuler');
 *
 * to create both horizontal and vertical rulers in the same canvas object:
 * r.rulergrid('rulers')
 *
 * to draw a grid
 * r.rulergrid('grid')
 *
 * to change the unit
 * r.rulergrid('metric', true)  // true for cm, false for inches
 *
 * to update the ppi and redraw rulers (currently only when using both hor and ver rulers)
 * zoom is optional, default is 100
 * r.rulergrid('update', ppi, zoom)
 *
 * other methods: clear, toggleGrid, toggleRulers
 * or call gridOn or rulersOn to determine if grid/ruler is currently displayed
 */
(function($) {

    // pixels per inch for ruler
    var pixperinch = 0;
    var zoomValue = 100;
    var metric = false;
    var gridOn = false;
    var rulersOn = false;
    // for Canvas, this is the Canvas context. For Raphael, this is the Paper object.
    var context;
    var draw;

    // all configuration options for grid and rulers
    var opts = {
        canvasExtraMargin:              300,
        grid:   {
            lineColor:                  '#000',
            altLineColor:               '#aaa', // Used for odd alternating rows for metric
            lineWidth:                  0.5
        },
        ruler:  {
            lineColor:                  '#000',
            us: {
                baseLineWidth:              4,
                maxMarkerLength:            50,
                markerLength:               0.9, // whole unit marker length, percentage of maxMarkerLength
                markerWidth:                3,
                halfInchMarkerLength:       0.6, // as percentage of canvas height
                halfInchMarkerWidth:        2,
                halfInchMarkerThreshold:    40,
                quarterInchMarkerLength:    0.4, // as percentage of canvas height
                quarterInchMarkerWidth:     2,
                quarterInchMarkerThreshold: 50,
                eighthInchMarkerLength:     0.3, // as percentage of canvas height
                eighthInchMarkerWidth:      1,
                eighthInchMarkerThreshold:  80,
                fontSize:                   14,
                numberMarkerDistance:       6
            },
            metric: {
                baseLineWidth:              4,
                maxMarkerLength:            30,
                markerLength:               0.9, // whole unit marker length, percentage of maxMarkerLength
                markerWidth:                2,
                mm5MarkerLength:            0.5,
                mm5MarkerThreshold:         60,
                mmMarkerLength:             0.4,
                mmMarkerThreshold:          85,
                mmMarkerWidth:              1,
                fontSize:                   11,
                numberMarkerDistance:       2
            }
        }
    };

    // private methods
    var methods = {
        // initializes the plugin
        init: function(ppi, zoom) {
            pixperinch = ppi;
            if (zoom) zoomValue = zoom;

            var impl = (typeof(Raphael) == 'undefined') ? 'canvas' : 'raphael';
            if (window.console) console.log("drawing rulers/grid with " + impl);

            draw = drawingDelegates[impl];
            var em = $(this[0]);
            context = draw.getContext(em);
        },

        _drawRuler: function(ctx, em, markerLength, horiz, skipFirstMarker) {

          /** draws the (rounded) horizontal or vertical marker line */
          function drawMarker(lineWidth, lineHeightPerc, offset, markerLength, horiz) {
              var start, end;
              var height = em.height();
              if (horiz) {
                  start = { x: offset, y: height};
                  end   = { x: offset, y: height - (markerLength*lineHeightPerc)};
              } else {
                  start = { x: 0, y: height-offset};
                  end   = { x: markerLength*lineHeightPerc, y: height-offset};
              }
              //console.log('drawing marker from ' + start.x +"," + start.y +" to "+ end.x + "," + end.y);
              draw.drawLine(start, end, { lineWidth: lineWidth, lineColor: opts.ruler.lineColor, lineCap: 'round'});
          }

          var margin = 2;
          var width = em.width();
          var height = em.height();
          var rulerCfg = metric ? opts.ruler.metric : opts.ruler.us;

          // draw baseline that all markers sit on
          var baseLineStart, baseLineEnd;
          var blw = rulerCfg.baseLineWidth;
          if (horiz) {
              baseLineStart = { x: margin, y: height-(blw/2) };
              baseLineEnd   = { x: width,  y: height-(blw/2) };
          } else {
              baseLineStart = { x: (blw/2), y: height-margin };
              baseLineEnd   = { x: (blw/2), y: 0};
          }
          draw.drawLine(baseLineStart, baseLineEnd, { lineWidth: blw, lineColor: opts.ruler.lineColor });

          var length = horiz ? width : height;
          var i = margin;

          // draw inch/cm markers
          if (!skipFirstMarker) {
              drawMarker(blw, rulerCfg.markerLength, margin, markerLength, horiz); // first marker is thinner
          }

          // determine the major inch markers that are displayed on the screen
          var ppi = (pixperinch * zoomValue) / 100;

          var f = 1;
          if (metric) {
              // draw metric markers
              if (zoomValue <= 15) f = 10;
              else if (zoomValue <= 30) f = 5;
              else if (zoomValue <= 60) f = 2;
              var ppcm = ppi / 2.54;

              // draw cm markers
              for (i=margin+(ppcm*f); i<length; i=i+(ppcm*f)) {
                  drawMarker(rulerCfg.markerWidth, rulerCfg.markerLength, i, markerLength, horiz);
              }
              // draw 5mmm markers
              if (zoomValue >= rulerCfg.mm5MarkerThreshold) {
                  for (i=margin + ppcm/2; i<length; i=i+ppcm) {
                    drawMarker(rulerCfg.mmMarkerWidth, rulerCfg.mm5MarkerLength, i, markerLength, horiz);
                  }
              }
              // draw mmm markers
              if (zoomValue >= rulerCfg.mmMarkerThreshold) {
                  for (i=margin + ppcm/10; i<length; i=i+ppcm/2) {
                    // paint 4 mm ticks between each cm and 5mm marker
                    for (j=0; j<4; j++) {
                        drawMarker(rulerCfg.mmMarkerWidth, rulerCfg.mmMarkerLength, i + (j*ppcm/10), markerLength, horiz);
                    }
                  }
              }

          } else {
              // draw inch markers
              if (zoomValue <= 15) f = 6;
              else if (zoomValue <= 25) f = 4;
              else if (zoomValue <= 40) f = 2;

              for (i=margin+(ppi*f); i<length; i=i+(ppi*f)) {
                  drawMarker(rulerCfg.markerWidth, rulerCfg.markerLength, i, markerLength, horiz);
              }
              if (zoomValue > rulerCfg.halfInchMarkerThreshold) {
                  // draw half inch markers
                  for (i=margin + ppi/2; i<length; i=i+ppi) {
                    drawMarker(rulerCfg.halfInchMarkerWidth, rulerCfg.halfInchMarkerLength, i, markerLength, horiz);
                  }
              }
              if (zoomValue > rulerCfg.quarterInchMarkerThreshold) {
                  // draw quarter inch markers
                  for (i=margin + ppi/4; i<length; i=i+ppi/2) {
                    drawMarker(rulerCfg.quarterInchMarkerWidth, rulerCfg.quarterInchMarkerLength, i, markerLength, horiz);
                  }
              }
              if (zoomValue > rulerCfg.eighthInchMarkerThreshold) {
                  // draw eighth inch markers
                  for (i=margin + ppi/8; i<length; i=i+ppi/4) {
                    drawMarker(rulerCfg.eighthInchMarkerWidth, rulerCfg.eighthInchMarkerLength, i, markerLength, horiz);
                  }
              }
          }

          // draw the numbers
          var c = f;
          var spacing = (metric ? ppcm : ppi) * f;
          if (horiz) {
              for (i=margin+(spacing)-rulerCfg.numberMarkerDistance; i<length-(rulerCfg.fontSize/2); i=i+(spacing)) {
                  draw.text(""+c, i, height-markerLength+rulerCfg.fontSize, rulerCfg.fontSize);
                  c = c + f;
              }
          } else {
              for (i=margin+(spacing)-rulerCfg.fontSize; i<length-rulerCfg.fontSize; i=i+(spacing)) {
                  draw.text(""+c, markerLength*rulerCfg.markerLength, height-i, rulerCfg.fontSize);
                  c = c + f;
              }
          }
        },

        /**
         * draws both horizontal and vertical rulers
         * @param canvas canvas element
         */
        _drawXYRulers: function(em) {
            var rulerCfg = metric ? opts.ruler.metric : opts.ruler.us;
            methods._drawRuler(context, em, rulerCfg.maxMarkerLength, false, true);
            methods._drawRuler(context, em, rulerCfg.maxMarkerLength, true, true);
            rulersOn = true;
        },

        /**
         * draw a horizontal ruler only
         */
        horizontalRuler: function() {
            return this.each(function() {
                var $this = $(this);
                methods._drawRuler(this.getContext('2d'), $this, true, false);
                rulersOn = true;
            });
        },

        /**
         * draw a vertical ruler only
         */
        verticalRuler: function() {
            return this.each(function() {
                var $this = $(this);
                methods._drawRuler(this.getContext('2d'), $this, false, false);
                rulersOn = true;
            });
        },


        /**
         * draws both a horizontal and vertical ruler in the canvas
         */
        rulers: function() {
            return this.each(function() {
                methods._drawXYRulers($(this));
            });
        },


        /**
         * draws the grid
         * @param em element to draw grid in
         */
        _drawGrid: function(em) {
            var margin = 2;
            var gridSize = (pixperinch * zoomValue) / 100;
            if (metric) {
                gridSize = gridSize / 2.54
            }

            var width = em.width();
            var height = em.height();
            var startX = rulersOn ? (margin+gridSize) : margin; // if rulers are visible, skip first line
            var startY = rulersOn ? (height-margin-gridSize) : (height-margin); // if rulers are visible, skip first line

            // draw vertical lines
            var start, end;
            var odd = rulersOn; // if rulers on, we're starting with line for inch/cm 1, otherwise start at 0.
            for (var i=startX; i<width; i=i+gridSize) {
                start = { x: i, y: 0 };
                end   = { x: i, y: height };
                draw.drawLine(start, end, { lineWidth: opts.grid.lineWidth, lineColor: methods._lineColor(odd)} );
                odd = !odd;
            }
            // draw horizontal lines
            odd = rulersOn
            for (i=startY; i>0; i=i-gridSize) {
                start = { x: 0, y: i };
                end   = { x: width, y: i};
                draw.drawLine(start, end, { lineWidth: opts.grid.lineWidth, lineColor: methods._lineColor(odd)} );
                odd = !odd;
            }
            gridOn = true;
        },

        _lineColor: function(odd) {
            return (odd && metric) ? opts.grid.altLineColor : opts.grid.lineColor;
        },

        /**
         * draws the grid
         */
        grid: function() {
            return this.each(function() {
                methods._drawGrid($(this));
            });
        },

        _clearCanvas: function(em) {
            draw.clearCanvas();
            //canvas.width = canvas.width;
            gridOn = false;
            rulersOn = false;
        },

        // clears both grid and ruler
        clear: function() {
            return this.each(function() {
                methods._clearCanvas($(this));
            });
        },

        /**
         * toggles the grid view, while leaving rulers view in current state
         */
        toggleGrid: function() {
            showGrid(!gridOn);
        },

        /**
         * turns on/off the grid
         * @param show set to true if grid must be shown
         */
        showGrid: function(show) {
            if (gridOn == show) return; // no change
            var em = $(this[0]);
            if (show) {
                // turn on grid
                methods._drawGrid(em);
            } else if (rulersOn) {
                // turn off grid, but rulers were visible
                methods._clearCanvas(em);
                methods._drawXYRulers(em);
            } else {
                // both now off
                methods._clearCanvas(em);
            }
        },

        /**
         * toggles the rulers view while leaving grid in current state
         */
        toggleRulers: function() {
            showRulers(!rulersOn);
        },

        /**
         * turns on/off the rulers
         * @param show set to true if rulers must be shown
         */
        showRulers: function(show) {
            if (rulersOn == show) return; // no change
            var em = $(this[0]);
            if (show) {
                // turn on ruler
                methods._drawXYRulers(em);
            } else if (gridOn) {
                // both rulers and grid are visible
                methods._clearCanvas(em);
                methods._drawGrid(em);
            } else {
                // only rulers were visible, turn them off
                methods._clearCanvas(em);
            }
        },

        /**
         * updates the current ppi and zoom settings and redraws everything
         * @param ppi
         * @param zoom
         */
        update: function(ppi, zoom) {
            var em = $(this[0]);
            if (ppi) pixperinch = ppi;
            if (zoom) zoomValue = zoom;
            
            var r = rulersOn;
            var g = gridOn;
            methods._clearCanvas(em);
            if (r) methods._drawXYRulers(em);
            if (g) methods._drawGrid(em);
        },

        /**
         * Pass true to set unit to metric, false to set to US inches
         * @param val
         */
        metric: function(val) {
            console.log("metric called with value: " + val);
            if (metric != val) {
                metric = val;
                methods.update.call($(this[0]));
            }
        },

        /**
         * updates the size of the canvas. This should be called on window.resize
         */
        updateSize: function(ppi, zoom) {
            var em = $(this[0]);
            draw.updateCanvasSize(em);
            methods.update.call(this, ppi, zoom);
        },

        /**
         * returns true if grid is currently on (visible)
         */
        gridOn: function() {
            return gridOn;
        },

        /**
         * returns true if rulers are currently on (visible)
         */
        rulersOn: function() {
            return rulersOn;
        }
    };

    $.fn.rulergrid = function( method ) {
        if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.rulergrid' );
        }
    };

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
                // set the canvas size a bit larger than the size necessary
                c.setAttribute('width', $(document).width() + opts.canvasExtraMargin);
                c.setAttribute('height', $(document).height() + opts.canvasExtraMargin);
                em.append(c);
                return c.getContext("2d");
            },

            // dynamically updates the size of the canvas
            updateCanvasSize: function(em) {
                // don't use em for determining new size, but use document size + 300px to make
                // window resizing smoother.
                var w = $(document).width() + opts.canvasExtraMargin;
                var h = $(document).height() + opts.canvasExtraMargin;
                if (context.canvas.width < w || context.canvas.height < h) {
                    // only change canvas size if window is growing
                    context.canvas.width = $(document).width() + opts.canvasExtraMargin;
                    context.canvas.height = $(document).height() + opts.canvasExtraMargin;
                }
            },

            // removes previous arrow
            clearCanvas: function() {
                context.clearRect(0,0,context.canvas.width,context.canvas.height);
            },

            drawLine: function(startPoint, endPoint, lineOpts) {
                context.beginPath();
                if ("lineColor" in lineOpts) {
                  context.strokeStyle = lineOpts.lineColor;
                }
                if ("lineWidth" in lineOpts) {
                  context.lineWidth = lineOpts.lineWidth;
                }
                if ("lineCap" in lineOpts && lineOpts.lineCap == 'round') {
                    context.lineCap = 'round';
                }
                context.moveTo(startPoint.x, startPoint.y);
                context.lineTo(endPoint.x, endPoint.y);
                context.stroke();
            },

            text: function(txt, x, y, fontSize) {
                context.font = "bold " + fontSize + "px verdana";
                context.textAlign = "right";
                context.fillStyle = opts.ruler.lineColor;
                context.fillText(txt, x, y);
            }
        },
        raphael: {
            // returns Raphael paper
            getContext: function(em) {
                var w = $(document).width() + opts.canvasExtraMargin;
                var h = $(document).height() + opts.canvasExtraMargin;
                return new Raphael(em.attr('id'), w, h);
            },

            // dynamically updates the size of the canvas to fit snugly within parent container
            updateCanvasSize: function(em) {
                // don't use em for determining new size, but use document size + 300px to make
                // window resizing smoother.
                var w = $(document).width() + opts.canvasExtraMargin;
                var h = $(document).height() + opts.canvasExtraMargin;
                if (context.width < w || context.height < h) {
                    context.setSize(w, h); // only change paper size if window is growing
                }
            },

            // removes previous arrow
            clearCanvas: function() {
                context.clear();
                /*
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
                } */
            },

            drawLine: function(startPoint, endPoint, lineOpts) {
                function pathPoint(pnt, instruction) {
                    return instruction + " " + pnt.x + " " + pnt.y + " ";
                }
                var p = context.path(pathPoint(startPoint, "M") + pathPoint(endPoint, "L"));
                var attr = {};
                if ("lineColor" in lineOpts) {
                  attr['stroke'] = lineOpts.lineColor;
                }
                if ("lineWidth" in lineOpts) {
                  attr['stroke-width'] = lineOpts.lineWidth;
                }
                if ("lineCap" in lineOpts && lineOpts.lineCap == 'round') {
                  attr['stroke-linecap'] = 'round';
                }
                p.attr(attr);
            },

            text: function(txt, x, y, fontSize) {
                // for some reason text falls 5px lower than in canvas impl, so adjust here
                context.text(x, y-5, txt).attr({ 'font-size': fontSize, 'text-anchor': 'end', 'font-family': 'Verdana', 'font-weight': 'bold'});
            }
        }
    };
})($);
