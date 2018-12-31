/*
 * options: 
 * 
 * xRulerImg, yRulerImg: the ruler images to use. Defaults will be images/ruler_x.gif for horizontal 
 *          ruler and images/ruler_y.gif for vertical ruler
 * xRulerId, yRulerId : element ids of the horizontal and vertical rulers. Default ids are 
 * 'horizontalRuler' and 'verticalRuler'
 * showUnits : set to false to hide units on rulers
 *
 * unit: if not specified defaults to inches. Must have value 'in' or 'cm' 
 * 
 */
 
 
(function($){ 
  $.fn.horizontalRuler = function() {
    return this.each(function(){
      this.html("horizontal")
    });
  }

  $.fn.verticalRuler = function() {
    return this.each(function(){
      this.html("vertical");
    });
  }
  
})(jQuery);

 
 
var ruler = {
  options : { xRulerImg : '/images/ruler_x.gif', yRulerImg : '/images/ruler_y.gif', unit: '',
              xRulerId: 'horizontalRuler', yRulerId: 'verticalRuler', 
              showUnits: true 
   },
  
  // create a horizontal and vertical ruler with equal length
  createRulers : function(length, options) {
    this.createHorizontalRuler(length, options);
    this.createVerticalRuler(length, options);
  },
  
  // create a horizontal ruler with specified length and options
  createHorizontalRuler : function(length, options) {
     opt = this._mergeOptions(options);
     var rulerId = '#' + opt.xRulerId; 
     if (!this._checkRuler(rulerId)) {
       return;
     }
     this._addRulerImages(rulerId, length, opt.xRulerImg, opt.unit, true, true);
  },

  // create a vertical ruler with specified length and options
  createVerticalRuler : function(length, options) {
     opt = this._mergeOptions(options);
     var rulerId = '#' + opt.yRulerId; 
     if (!this._checkRuler(rulerId)) {
       return;
     }
     this._addRulerImages(rulerId, length, opt.yRulerImg, opt.unit, false, true);
  },
  
  show : function(rulerid) {
    if (rulerid) {
      $(rulerid).show();
    } else {
      $(xRulerId).show();
      $(yRulerId).show();
    }
  },

  hide : function(rulerid) {
    if (rulerid) {
      $(rulerid).hide();
    } else {
      $(xRulerId).hide();
      $(yRulerId).hide();
    }
  },
  
  // PROTECTED: 
  // creates all dom elements that reprepresent the ruler 
  _addRulerImages : function(divElem, numImages, rulerImage, unit, horizontal, showUnits) {
     elem = $(divElem);
     elem.css('visibility', 'hidden');
     if (horizontal) {
       elem.css('white-space', 'nowrap');
     }
     var dpi = lifeSize.getDpi();
     for (var i=1; i<=numImages; i++) {
       // create the image element
       var unitImg = new Image();
       unitImg.src = rulerImage;
       unitImg.setAttribute('height', unitImg.height);
       unitImg.setAttribute('width', unitImg.width);
       // create the unit element
       if (showUnits) {
         unitNum = document.createElement('span');
         unitNum.innerHTML = "" + i;
         unitNum.style.position = 'absolute';
       }
       
       if (horizontal) {
         unitNum.style.top = (dpi * 0.55) + 'px';
         unitNum.style.left = (dpi * i) - 5 + 'px';

         elem.append(unitImg);
         elem.append(unitNum);
       } else {
         unitNum.style.left = (dpi * 0.35) + 'px';
         unitNum.style.top = (dpi * i) - 8 + 'px';

         dv = document.createElement('div'); // vertical, wrap img in div
         dv.appendChild(unitImg);
         dv.appendChild(unitNum);
         elem.append(dv);
       }
     }
     imgEm = $(divElem + " img");
     imgEm.addClass('lifeSize');
     imgEm.attr('absWidth', "1" + unit);
     for (var i=0; i<imgEm.length; i++) {
       lifeSize.render(imgEm[i]); // tell lifesize script to render this image
     }
     elem.css('visibility', 'visible');
     //lifeSize.addRenderListener(function() { alert("render!")});
  },
  
  // PROTECTED
  // verifies that the ruler with given id exists in the page. Alerts user if it doesn't. 
  _checkRuler : function(rulerId) {
     rulerEm = $(rulerId);
     if (rulerEm.length == 0) {
       alert('could not find div with id "' + rulerId + '" in your page where ruler should be inserted');
       return false;
     }
     return true;
  },
  
  // PROTECTED 
  // merges option hash with defaults options hash
  _mergeOptions : function(options) {
    if (options) {
      $.each(options, function(i, n) {
         this.options[i] = n;
      });
    }
    return this.options;
  }
};
