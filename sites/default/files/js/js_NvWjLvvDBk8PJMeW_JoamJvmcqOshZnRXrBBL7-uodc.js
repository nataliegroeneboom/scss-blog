/*!
 * jQuery Cycle Lite Plugin
 * http://malsup.com/jquery/cycle/lite/
 * Copyright (c) 2008-2012 M. Alsup
 * Version: 1.7 (20-FEB-2013)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Requires: jQuery v1.3.2 or later
 */
 
 jQuery(document).ready(function($) {
    $('.slideshow').cycle({
		fx: 'fade' , timeout: 8000, delay: 2000});
});

;(function($) {
"use strict";

var ver = 'Lite-1.7';
var msie = /MSIE/.test(navigator.userAgent);

$.fn.cycle = function(options) {
    return this.each(function() {
        options = options || {};
        
        if (this.cycleTimeout) 
            clearTimeout(this.cycleTimeout);

        this.cycleTimeout = 0;
        this.cyclePause = 0;
        
        var $cont = $(this);
        var $slides = options.slideExpr ? $(options.slideExpr, this) : $cont.children();
        var els = $slides.get();
        if (els.length < 2) {
            if (window.console)
                console.log('terminating; too few slides: ' + els.length);
            return; // don't bother
        }

        // support metadata plugin (v1.0 and v2.0)
        var opts = $.extend({}, $.fn.cycle.defaults, options || {}, $.metadata ? $cont.metadata() : $.meta ? $cont.data() : {});
        var meta = $.isFunction($cont.data) ? $cont.data(opts.metaAttr) : null;
        if (meta)
            opts = $.extend(opts, meta);
            
        opts.before = opts.before ? [opts.before] : [];
        opts.after = opts.after ? [opts.after] : [];
        opts.after.unshift(function(){ opts.busy=0; });
            
        // allow shorthand overrides of width, height and timeout
        var cls = this.className;
        opts.width = parseInt((cls.match(/w:(\d+)/)||[])[1], 10) || opts.width;
        opts.height = parseInt((cls.match(/h:(\d+)/)||[])[1], 10) || opts.height;
        opts.timeout = parseInt((cls.match(/t:(\d+)/)||[])[1], 10) || opts.timeout;

        if ($cont.css('position') == 'static') 
            $cont.css('position', 'relative');
        if (opts.width) 
            $cont.width(opts.width);
        if (opts.height && opts.height != 'auto') 
            $cont.height(opts.height);

        var first = 0;
        $slides.css({position: 'absolute', top:0}).each(function(i) {
            $(this).css('z-index', els.length-i);
        });
        
        $(els[first]).css('opacity',1).show(); // opacity bit needed to handle reinit case
        if (msie) 
            els[first].style.removeAttribute('filter');

        if (opts.fit && opts.width) 
            $slides.width(opts.width);
        if (opts.fit && opts.height && opts.height != 'auto') 
            $slides.height(opts.height);
        if (opts.pause) 
            $cont.hover(function(){this.cyclePause=1;}, function(){this.cyclePause=0;});

        var txFn = $.fn.cycle.transitions[opts.fx];
        if (txFn)
            txFn($cont, $slides, opts);
        
        $slides.each(function() {
            var $el = $(this);
            this.cycleH = (opts.fit && opts.height) ? opts.height : $el.height();
            this.cycleW = (opts.fit && opts.width) ? opts.width : $el.width();
        });

        if (opts.cssFirst)
            $($slides[first]).css(opts.cssFirst);

        if (opts.timeout) {
            // ensure that timeout and speed settings are sane
            if (opts.speed.constructor == String)
                opts.speed = {slow: 600, fast: 200}[opts.speed] || 400;
            if (!opts.sync)
                opts.speed = opts.speed / 2;
            while((opts.timeout - opts.speed) < 250)
                opts.timeout += opts.speed;
        }
        opts.speedIn = opts.speed;
        opts.speedOut = opts.speed;

        opts.slideCount = els.length;
        opts.currSlide = first;
        opts.nextSlide = 1;

        // fire artificial events
        var e0 = $slides[first];
        if (opts.before.length)
            opts.before[0].apply(e0, [e0, e0, opts, true]);
        if (opts.after.length > 1)
            opts.after[1].apply(e0, [e0, e0, opts, true]);
        
        if (opts.click && !opts.next)
            opts.next = opts.click;
        if (opts.next)
            $(opts.next).unbind('click.cycle').bind('click.cycle', function(){return advance(els,opts,opts.rev?-1:1);});
        if (opts.prev)
            $(opts.prev).unbind('click.cycle').bind('click.cycle', function(){return advance(els,opts,opts.rev?1:-1);});

        if (opts.timeout)
            this.cycleTimeout = setTimeout(function() {
                go(els,opts,0,!opts.rev);
            }, opts.timeout + (opts.delay||0));
    });
};

function go(els, opts, manual, fwd) {
    if (opts.busy) 
        return;
    var p = els[0].parentNode, curr = els[opts.currSlide], next = els[opts.nextSlide];
    if (p.cycleTimeout === 0 && !manual) 
        return;

    if (manual || !p.cyclePause) {
        if (opts.before.length)
            $.each(opts.before, function(i,o) { o.apply(next, [curr, next, opts, fwd]); });
        var after = function() {
            if (msie)
                this.style.removeAttribute('filter');
            $.each(opts.after, function(i,o) { o.apply(next, [curr, next, opts, fwd]); });
            queueNext(opts);
        };

        if (opts.nextSlide != opts.currSlide) {
            opts.busy = 1;
            $.fn.cycle.custom(curr, next, opts, after);
        }
        var roll = (opts.nextSlide + 1) == els.length;
        opts.nextSlide = roll ? 0 : opts.nextSlide+1;
        opts.currSlide = roll ? els.length-1 : opts.nextSlide-1;
    } else {
      queueNext(opts);
    }

    function queueNext(opts) {
        if (opts.timeout)
            p.cycleTimeout = setTimeout(function() { go(els,opts,0,!opts.rev); }, opts.timeout);
    }
}

// advance slide forward or back
function advance(els, opts, val) {
    var p = els[0].parentNode, timeout = p.cycleTimeout;
    if (timeout) {
        clearTimeout(timeout);
        p.cycleTimeout = 0;
    }
    opts.nextSlide = opts.currSlide + val;
    if (opts.nextSlide < 0) {
        opts.nextSlide = els.length - 1;
    }
    else if (opts.nextSlide >= els.length) {
        opts.nextSlide = 0;
    }
    go(els, opts, 1, val>=0);
    return false;
}

$.fn.cycle.custom = function(curr, next, opts, cb) {
    var $l = $(curr), $n = $(next);
    $n.css(opts.cssBefore);
    var fn = function() {$n.animate(opts.animIn, opts.speedIn, opts.easeIn, cb);};
    $l.animate(opts.animOut, opts.speedOut, opts.easeOut, function() {
        $l.css(opts.cssAfter);
        if (!opts.sync)
            fn();
    });
    if (opts.sync)
        fn();
};

$.fn.cycle.transitions = {
    fade: function($cont, $slides, opts) {
        $slides.not(':eq(0)').hide();
        opts.cssBefore = { opacity: 0, display: 'block' };
        opts.cssAfter  = { display: 'none' };
        opts.animOut = { opacity: 0 };
        opts.animIn = { opacity: 1 };
    },
    fadeout: function($cont, $slides, opts) {
        opts.before.push(function(curr,next,opts,fwd) {
            $(curr).css('zIndex',opts.slideCount + (fwd === true ? 1 : 0));
            $(next).css('zIndex',opts.slideCount + (fwd === true ? 0 : 1));
        });
        $slides.not(':eq(0)').hide();
        opts.cssBefore = { opacity: 1, display: 'block', zIndex: 1 };
        opts.cssAfter  = { display: 'none', zIndex: 0 };
        opts.animOut = { opacity: 0 };
        opts.animIn = { opacity: 1 };
    }
};

$.fn.cycle.ver = function() { return ver; };

// @see: http://malsup.com/jquery/cycle/lite/
$.fn.cycle.defaults = {
    animIn:        {},
    animOut:       {},
    fx:           'fade',
    after:         null,
    before:        null,
    cssBefore:     {},
    cssAfter:      {},
    delay:         0,
    fit:           0,
    height:       'auto',
    metaAttr:     'cycle',
    next:          null,
    pause:         false,
    prev:          null,
    speed:         1000,
    slideExpr:     null,
    sync:          true,
    timeout:       4000
};

})(jQuery);
;
/*
 * jQuery Superfish Menu Plugin
 * Copyright (c) 2013 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 *	http://www.opensource.org/licenses/mit-license.php
 *	http://www.gnu.org/licenses/gpl.html
 */
 
 jQuery(document).ready(function($) {
    $("#nav ul.menu-parent").superfish({ 
            delay:       100,                           
            animation:   {opacity:'show',height:'show'},  
            speed:       'fast',                          
            autoArrows:  true,                           
            dropShadows: true                   
        });
  });

(function ($, w) {
	"use strict";

	var methods = (function () {
		// private properties and methods go here
		var c = {
				bcClass: 'sf-breadcrumb',
				menuClass: 'sf-js-enabled',
				anchorClass: 'sf-with-ul',
				menuArrowClass: 'sf-arrows'
			},
			ios = (function () {
				var ios = /^(?![\w\W]*Windows Phone)[\w\W]*(iPhone|iPad|iPod)/i.test(navigator.userAgent);
				if (ios) {
					// tap anywhere on iOS to unfocus a submenu
					$('html').css('cursor', 'pointer').on('click', $.noop);
				}
				return ios;
			})(),
			wp7 = (function () {
				var style = document.documentElement.style;
				return ('behavior' in style && 'fill' in style && /iemobile/i.test(navigator.userAgent));
			})(),
			unprefixedPointerEvents = (function () {
				return (!!w.PointerEvent);
			})(),
			toggleMenuClasses = function ($menu, o) {
				var classes = c.menuClass;
				if (o.cssArrows) {
					classes += ' ' + c.menuArrowClass;
				}
				$menu.toggleClass(classes);
			},
			setPathToCurrent = function ($menu, o) {
				return $menu.find('li.' + o.pathClass).slice(0, o.pathLevels)
					.addClass(o.hoverClass + ' ' + c.bcClass)
						.filter(function () {
							return ($(this).children(o.popUpSelector).hide().show().length);
						}).removeClass(o.pathClass);
			},
			toggleAnchorClass = function ($li) {
				$li.children('a').toggleClass(c.anchorClass);
			},
			toggleTouchAction = function ($menu) {
				var msTouchAction = $menu.css('ms-touch-action');
				var touchAction = $menu.css('touch-action');
				touchAction = touchAction || msTouchAction;
				touchAction = (touchAction === 'pan-y') ? 'auto' : 'pan-y';
				$menu.css({
					'ms-touch-action': touchAction,
					'touch-action': touchAction
				});
			},
			applyHandlers = function ($menu, o) {
				var targets = 'li:has(' + o.popUpSelector + ')';
				if ($.fn.hoverIntent && !o.disableHI) {
					$menu.hoverIntent(over, out, targets);
				}
				else {
					$menu
						.on('mouseenter.superfish', targets, over)
						.on('mouseleave.superfish', targets, out);
				}
				var touchevent = 'MSPointerDown.superfish';
				if (unprefixedPointerEvents) {
					touchevent = 'pointerdown.superfish';
				}
				if (!ios) {
					touchevent += ' touchend.superfish';
				}
				if (wp7) {
					touchevent += ' mousedown.superfish';
				}
				$menu
					.on('focusin.superfish', 'li', over)
					.on('focusout.superfish', 'li', out)
					.on(touchevent, 'a', o, touchHandler);
			},
			touchHandler = function (e) {
				var $this = $(this),
					o = getOptions($this),
					$ul = $this.siblings(e.data.popUpSelector);

				if (o.onHandleTouch.call($ul) === false) {
					return this;
				}

				if ($ul.length > 0 && $ul.is(':hidden')) {
					$this.one('click.superfish', false);
					if (e.type === 'MSPointerDown' || e.type === 'pointerdown') {
						$this.trigger('focus');
					} else {
						$.proxy(over, $this.parent('li'))();
					}
				}
			},
			over = function () {
				var $this = $(this),
					o = getOptions($this);
				clearTimeout(o.sfTimer);
				$this.siblings().superfish('hide').end().superfish('show');
			},
			out = function () {
				var $this = $(this),
					o = getOptions($this);
				if (ios) {
					$.proxy(close, $this, o)();
				}
				else {
					clearTimeout(o.sfTimer);
					o.sfTimer = setTimeout($.proxy(close, $this, o), o.delay);
				}
			},
			close = function (o) {
				o.retainPath = ($.inArray(this[0], o.$path) > -1);
				this.superfish('hide');

				if (!this.parents('.' + o.hoverClass).length) {
					o.onIdle.call(getMenu(this));
					if (o.$path.length) {
						$.proxy(over, o.$path)();
					}
				}
			},
			getMenu = function ($el) {
				return $el.closest('.' + c.menuClass);
			},
			getOptions = function ($el) {
				return getMenu($el).data('sf-options');
			};

		return {
			// public methods
			hide: function (instant) {
				if (this.length) {
					var $this = this,
						o = getOptions($this);
					if (!o) {
						return this;
					}
					var not = (o.retainPath === true) ? o.$path : '',
						$ul = $this.find('li.' + o.hoverClass).add(this).not(not).removeClass(o.hoverClass).children(o.popUpSelector),
						speed = o.speedOut;

					if (instant) {
						$ul.show();
						speed = 0;
					}
					o.retainPath = false;

					if (o.onBeforeHide.call($ul) === false) {
						return this;
					}

					$ul.stop(true, true).animate(o.animationOut, speed, function () {
						var $this = $(this);
						o.onHide.call($this);
					});
				}
				return this;
			},
			show: function () {
				var o = getOptions(this);
				if (!o) {
					return this;
				}
				var $this = this.addClass(o.hoverClass),
					$ul = $this.children(o.popUpSelector);

				if (o.onBeforeShow.call($ul) === false) {
					return this;
				}

				$ul.stop(true, true).animate(o.animation, o.speed, function () {
					o.onShow.call($ul);
				});
				return this;
			},
			destroy: function () {
				return this.each(function () {
					var $this = $(this),
						o = $this.data('sf-options'),
						$hasPopUp;
					if (!o) {
						return false;
					}
					$hasPopUp = $this.find(o.popUpSelector).parent('li');
					clearTimeout(o.sfTimer);
					toggleMenuClasses($this, o);
					toggleAnchorClass($hasPopUp);
					toggleTouchAction($this);
					// remove event handlers
					$this.off('.superfish').off('.hoverIntent');
					// clear animation's inline display style
					$hasPopUp.children(o.popUpSelector).attr('style', function (i, style) {
						return style.replace(/display[^;]+;?/g, '');
					});
					// reset 'current' path classes
					o.$path.removeClass(o.hoverClass + ' ' + c.bcClass).addClass(o.pathClass);
					$this.find('.' + o.hoverClass).removeClass(o.hoverClass);
					o.onDestroy.call($this);
					$this.removeData('sf-options');
				});
			},
			init: function (op) {
				return this.each(function () {
					var $this = $(this);
					if ($this.data('sf-options')) {
						return false;
					}
					var o = $.extend({}, $.fn.superfish.defaults, op),
						$hasPopUp = $this.find(o.popUpSelector).parent('li');
					o.$path = setPathToCurrent($this, o);

					$this.data('sf-options', o);

					toggleMenuClasses($this, o);
					toggleAnchorClass($hasPopUp);
					toggleTouchAction($this);
					applyHandlers($this, o);

					$hasPopUp.not('.' + c.bcClass).superfish('hide', true);

					o.onInit.call(this);
				});
			}
		};
	})();

	$.fn.superfish = function (method, args) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof method === 'object' || ! method) {
			return methods.init.apply(this, arguments);
		}
		else {
			return $.error('Method ' +  method + ' does not exist on jQuery.fn.superfish');
		}
	};

	$.fn.superfish.defaults = {
		popUpSelector: 'ul,.sf-mega', // within menu context
		hoverClass: 'sfHover',
		pathClass: 'overrideThisToUse',
		pathLevels: 1,
		delay: 800,
		animation: {opacity: 'show'},
		animationOut: {opacity: 'hide'},
		speed: 'normal',
		speedOut: 'fast',
		cssArrows: true,
		disableHI: false,
		onInit: $.noop,
		onBeforeShow: $.noop,
		onShow: $.noop,
		onBeforeHide: $.noop,
		onHide: $.noop,
		onIdle: $.noop,
		onDestroy: $.noop,
		onHandleTouch: $.noop
	};

})(jQuery, window);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

Drupal.debounce = function (func, wait, immediate) {
  var timeout = void 0;
  var result = void 0;
  return function () {
    var context = this;
    var args = arguments;
    var later = function later() {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
    }
    return result;
  };
};;
/*! jquery.cookie v1.4.1 | MIT */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?a(require("jquery")):a(jQuery)}(function(a){function b(a){return h.raw?a:encodeURIComponent(a)}function c(a){return h.raw?a:decodeURIComponent(a)}function d(a){return b(h.json?JSON.stringify(a):String(a))}function e(a){0===a.indexOf('"')&&(a=a.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\"));try{return a=decodeURIComponent(a.replace(g," ")),h.json?JSON.parse(a):a}catch(b){}}function f(b,c){var d=h.raw?b:e(b);return a.isFunction(c)?c(d):d}var g=/\+/g,h=a.cookie=function(e,g,i){if(void 0!==g&&!a.isFunction(g)){if(i=a.extend({},h.defaults,i),"number"==typeof i.expires){var j=i.expires,k=i.expires=new Date;k.setTime(+k+864e5*j)}return document.cookie=[b(e),"=",d(g),i.expires?"; expires="+i.expires.toUTCString():"",i.path?"; path="+i.path:"",i.domain?"; domain="+i.domain:"",i.secure?"; secure":""].join("")}for(var l=e?void 0:{},m=document.cookie?document.cookie.split("; "):[],n=0,o=m.length;o>n;n++){var p=m[n].split("="),q=c(p.shift()),r=p.join("=");if(e&&e===q){l=f(r,g);break}e||void 0===(r=f(r))||(l[q]=r)}return l};h.defaults={},a.removeCookie=function(b,c){return void 0===a.cookie(b)?!1:(a.cookie(b,"",a.extend({},c,{expires:-1})),!a.cookie(b))}});;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, debounce) {
  $.fn.drupalGetSummary = function () {
    var callback = this.data('summaryCallback');
    return this[0] && callback ? $.trim(callback(this[0])) : '';
  };

  $.fn.drupalSetSummary = function (callback) {
    var self = this;

    if (typeof callback !== 'function') {
      var val = callback;
      callback = function callback() {
        return val;
      };
    }

    return this.data('summaryCallback', callback).off('formUpdated.summary').on('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    }).trigger('summaryUpdated');
  };

  Drupal.behaviors.formSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        var formValues = $form.serialize();
        var previousValues = $form.attr('data-drupal-form-submit-last');
        if (previousValues === formValues) {
          e.preventDefault();
        } else {
          $form.attr('data-drupal-form-submit-last', formValues);
        }
      }

      $('body').once('form-single-submit').on('submit.singleSubmit', 'form:not([method~="GET"])', onFormSubmit);
    }
  };

  function triggerFormUpdated(element) {
    $(element).trigger('formUpdated');
  }

  function fieldsList(form) {
    var $fieldList = $(form).find('[name]').map(function (index, element) {
      return element.getAttribute('id');
    });

    return $.makeArray($fieldList);
  }

  Drupal.behaviors.formUpdated = {
    attach: function attach(context) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      var $forms = (contextIsForm ? $context : $context.find('form')).once('form-updated');
      var formFields = void 0;

      if ($forms.length) {
        $.makeArray($forms).forEach(function (form) {
          var events = 'change.formUpdated input.formUpdated ';
          var eventHandler = debounce(function (event) {
            triggerFormUpdated(event.target);
          }, 300);
          formFields = fieldsList(form).join(',');

          form.setAttribute('data-drupal-form-fields', formFields);
          $(form).on(events, eventHandler);
        });
      }

      if (contextIsForm) {
        formFields = fieldsList(context).join(',');

        var currentFields = $(context).attr('data-drupal-form-fields');

        if (formFields !== currentFields) {
          triggerFormUpdated(context);
        }
      }
    },
    detach: function detach(context, settings, trigger) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      if (trigger === 'unload') {
        var $forms = (contextIsForm ? $context : $context.find('form')).removeOnce('form-updated');
        if ($forms.length) {
          $.makeArray($forms).forEach(function (form) {
            form.removeAttribute('data-drupal-form-fields');
            $(form).off('.formUpdated');
          });
        }
      }
    }
  };

  Drupal.behaviors.fillUserInfoFromBrowser = {
    attach: function attach(context, settings) {
      var userInfo = ['name', 'mail', 'homepage'];
      var $forms = $('[data-user-info-from-browser]').once('user-info-from-browser');
      if ($forms.length) {
        userInfo.map(function (info) {
          var $element = $forms.find('[name=' + info + ']');
          var browserData = localStorage.getItem('Drupal.visitor.' + info);
          var emptyOrDefault = $element.val() === '' || $element.attr('data-drupal-default-value') === $element.val();
          if ($element.length && emptyOrDefault && browserData) {
            $element.val(browserData);
          }
        });
      }
      $forms.on('submit', function () {
        userInfo.map(function (info) {
          var $element = $forms.find('[name=' + info + ']');
          if ($element.length) {
            localStorage.setItem('Drupal.visitor.' + info, $element.val());
          }
        });
      });
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e) {
    var url = void 0;
    if (e.type === 'click') {
      url = e.currentTarget.location ? e.currentTarget.location : e.currentTarget;
    } else {
      url = location;
    }
    var hash = url.hash.substr(1);
    if (hash) {
      var $target = $('#' + hash);
      $('body').trigger('formFragmentLinkClickOrHashChange', [$target]);

      setTimeout(function () {
        return $target.trigger('focus');
      }, 300);
    }
  };

  var debouncedHandleFragmentLinkClickOrHashChange = debounce(handleFragmentLinkClickOrHashChange, 300, true);

  $(window).on('hashchange.form-fragment', debouncedHandleFragmentLinkClickOrHashChange);

  $(document).on('click.form-fragment', 'a[href*="#"]', debouncedHandleFragmentLinkClickOrHashChange);
})(jQuery, Drupal, Drupal.debounce);;
