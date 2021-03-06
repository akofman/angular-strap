'use strict';

var forEach = angular.forEach;
var isObject = angular.isObject;
var isDefined = angular.isDefined;
var jqLite = angular.element;

angular.module('mgcrea.ngStrap.affix', ['mgcrea.ngStrap.jqlite.dimensions'])

  .provider('$affix', function() {

    var defaults = this.defaults = {
      offsetTop: 'auto'
    };

    this.$get = function($window, dimensions) {

      var windowEl = jqLite($window);
      var bodyEl = jqLite($window.document.body);

      function AffixFactory(element, config) {

        var $affix = {};

        // Common vars
        var options = angular.extend({}, defaults, config);

        // Initial private vars
        var reset = 'affix affix-top affix-bottom',
            initialAffixTop = 0,
            initialOffsetTop = 0,
            affixed = null,
            unpin = null;

        var parent = element.parent();
        // Options: custom parent
        if (options.offsetParent) {
          if (options.offsetParent.match(/^\d+$/)) {
            for (var i = 0; i < (options.offsetParent * 1) - 1; i++) {
              parent = parent.parent();
            }
          }
          else {
            parent = jqLite(options.offsetParent);
          }
        }

        // Options: offsets
        var offsetTop = 0;
        if(options.offsetTop) {
          if(options.offsetTop === 'auto') {
            options.offsetTop = '+0';
          }
          if(options.offsetTop.match(/^[-+]\d+$/)) {
            initialAffixTop -= options.offsetTop * 1;
            if(options.offsetParent) {
              offsetTop = dimensions.offset(parent[0]).top + (options.offsetTop * 1);
            }
            else {
              offsetTop = dimensions.offset(element[0]).top - dimensions.css(element[0], 'marginTop', true) + (options.offsetTop * 1);
            }
          }
          else {
            offsetTop = options.offsetTop * 1;
          }
        }

        var offsetBottom = 0;
        if(options.offsetBottom) {
          if(options.offsetParent && options.offsetBottom.match(/^[-+]\d+$/)) {
            // add 1 pixel due to rounding problems...
            offsetBottom = $window.document.body.scrollHeight - (dimensions.offset(parent[0]).top + dimensions.height(parent[0])) + (options.offsetBottom * 1) + 1;
          }
          else {
            offsetBottom = options.offsetBottom * 1;
          }
        }

        $affix.init = function() {

          initialOffsetTop = dimensions.offset(element[0]).top + initialAffixTop;

          // Bind events
          windowEl.on('scroll', this.checkPosition);
          windowEl.on('click', this.checkPositionWithEventLoop);
          // Both of these checkPosition() calls are necessary for the case where
          // the user hits refresh after scrolling to the bottom of the page.
          this.checkPosition();
          this.checkPositionWithEventLoop();

        };

        $affix.destroy = function() {

          // Unbind events
          windowEl.off('scroll', this.checkPosition);
          windowEl.off('click', this.checkPositionWithEventLoop);

        };

        $affix.checkPositionWithEventLoop = function() {

          setTimeout(this.checkPosition, 1);

        };

        $affix.checkPosition = function() {
          // if (!this.$element.is(':visible')) return

          var scrollTop = $window.pageYOffset;
          var position = dimensions.offset(element[0]);
          var elementHeight = dimensions.height(element[0]);

          // Get required affix class according to position
          var affix = getRequiredAffixClass(unpin, position, elementHeight);

          // Did affix status changed this last check?
          if(affixed === affix) return;
          affixed = affix;

          // Add proper affix class
          element.removeClass(reset).addClass('affix' + ((affix !== 'middle') ? '-' + affix : ''));

          if(affix === 'top') {
            unpin = null;
            element.css('position', (options.offsetParent) ? '' : 'relative');
            element.css('top', '');
          } else if(affix === 'bottom') {
            if (options.offsetUnpin) {
              unpin = -(options.offsetUnpin * 1);
            }
            else {
              // Calculate unpin threshold when affixed to bottom.
              // Hopefully the browser scrolls pixel by pixel.
              unpin = position.top - scrollTop;
            }
            element.css('position', (options.offsetParent) ? '' : 'relative');
            element.css('top', (options.offsetParent) ? '' : ((bodyEl[0].offsetHeight - offsetBottom - elementHeight - initialOffsetTop) + 'px'));
          } else { // affix === 'middle'
            unpin = null;
            element.css('position', 'fixed');
            element.css('top', initialAffixTop + 'px');
          }

        };

        // Private methods

        function getRequiredAffixClass(unpin, position, elementHeight) {

          var scrollTop = $window.pageYOffset;
          var scrollHeight = $window.document.body.scrollHeight;

          if(scrollTop <= offsetTop) {
            return 'top';
          } else if(unpin !== null && (scrollTop + unpin <= position.top)) {
            return 'middle';
          } else if(offsetBottom !== null && (position.top + elementHeight + initialAffixTop >= scrollHeight - offsetBottom)) {
            return 'bottom';
          } else {
            return 'middle';
          }

        }

        $affix.init();
        return $affix;

      }

      return AffixFactory;

    };

  })

  .directive('bsAffix', function($affix, dimensions) {

    var forEach = angular.forEach;
    var isDefined = angular.isDefined;
    var jqLite = angular.element;

    return {
      restrict: 'EAC',
      link: function postLink(scope, element, attr) {

        var options = {scope: scope, offsetTop: 'auto'};
        forEach(['offsetTop', 'offsetBottom', 'offsetParent', 'offsetUnpin'], function(key) {
          if(isDefined(attr[key])) options[key] = attr[key];
        });

        var affix = $affix(element, options);
        scope.$on('$destroy', function() {
          options = null;
          affix = null;
        });

      }
    };

  });
