'use strict';

angular.module('mgcrea.ngStrap.tooltip', ['mgcrea.ngStrap.jqlite.dimensions'])

  .run(function($templateCache) {
    $templateCache.put('$tooltip', '<div class="tooltip" ng-show="title"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind-html="title"></div></div>');
  })

  .provider('$tooltip', function() {

    var defaults = this.defaults = {
      animation: 'animation-fade',
      prefixClass: 'tooltip',
      container: false,
      placement: 'top',
      template: '$tooltip',
      trigger: 'hover focus',
      type: '',
      // html: false,
      title: '',
      delay: 0
    };

    this.$get = function($window, $rootScope, $compile, $q, $templateCache, $http, $animate, $timeout, dimensions) {

      var trim = String.prototype.trim;
      var forEach = angular.forEach;
      var isDefined = angular.isDefined;
      var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
      var findElement = function(query, element) {
        return angular.element((element || document).querySelectorAll(query));
      };

      function TooltipFactory(element, config) {

        var $tooltip = {};

        // Common vars
        var options = angular.extend({}, defaults, config);
        $tooltip.promise = $q.when($templateCache.get(options.template) || $http.get(options.template/*, {cache: true}*/));
        var scope = options.scope.$new() || $rootScope.$new();
        if(options.delay && angular.isString(options.delay)) {
          options.delay = parseFloat(options.delay);
        }

        // Provide scope helpers
        scope.$hide = function() {
          scope.$$postDigest(function() {
            $tooltip.hide();
          });
        };
        scope.$show = function() {
          scope.$$postDigest(function() {
            $tooltip.show();
          });
        };
        scope.$toggle = function() {
          scope.$$postDigest(function() {
            $tooltip.toggle();
          });
        };

        // Initial private vars
        var timeout, hoverState, isShown;

        // Fetch, compile then initialize tooltip
        var tipLinker, tipElement, tipTemplate;
        $tooltip.promise.then(function(template) {
          if(angular.isObject(template)) template = template.data;
          template = trim.apply(template);
          tipTemplate = template;
          tipLinker = $compile(template);
          // tipElement = tipLinker(scope);
          $tooltip.init();
        });

        $tooltip.init = function() {

          // Options: delay
          if (options.delay && angular.isNumber(options.delay)) {
            options.delay = {
              show: options.delay,
              hide: options.delay
            };
          }

          // Options: trigger
          var triggers = options.trigger.split(' ');
          for (var i = triggers.length; i--;) {
            var trigger = triggers[i];
            if(trigger === 'click') {
              element.on('click', this.toggle);
            } else if(trigger !== 'manual') {
              element.on(trigger === 'hover' ? 'mouseenter' : 'focus', this.enter);
              element.on(trigger === 'hover' ? 'mouseleave' : 'blur', this.leave);
            }
          }

        };

        $tooltip.destroy = function() {

          // Unbind events
          var triggers = options.trigger.split(' ');
          for (var i = triggers.length; i--;) {
            var trigger = triggers[i];
            if(trigger === 'click') {
              element.off('click', this.toggle);
            } else if(trigger !== 'manual') {
              element.off(trigger === 'hover' ? 'mouseenter' : 'focus', this.enter);
              element.off(trigger === 'hover' ? 'mouseleave' : 'blur', this.leave);
            }
          }

          // Remove element
          if(tipElement) {
            tipElement.remove();
            tipElement = null;
          }

          // Destroy scope
          scope.$destroy();

        };

        $tooltip.enter = function() {

          clearTimeout(timeout);
          hoverState = 'in';
          if (!options.delay || !options.delay.show) {
            return $tooltip.show();
          }

          timeout = setTimeout(function() {
            if (hoverState ==='in') $tooltip.show();
          }, options.delay.show);

        };

        $tooltip.show = function() {

          var parent = options.container ? findElement(options.container) : null;
          var after = options.container ? null : element;

          // Fetch a cloned element linked from template
          tipElement = tipLinker(scope, function(clonedElement, scope) {});

          // Set the initial positioning.
          tipElement.css({top: '0px', left: '0px', display: 'block'}).addClass(options.placement);

          // Options: animation
          if(options.animation) tipElement.addClass(options.animation);
          // Options: type
          if(options.type) tipElement.addClass(options.prefixClass + '-' + options.type);

          $animate.enter(tipElement, parent, after, function() {});
          isShown = true;
          scope.$digest();
          requestAnimationFrame($tooltip.$applyPlacement);

        };

        $tooltip.leave = function() {

          clearTimeout(timeout);
          hoverState = 'out';
          if (!options.delay || !options.delay.hide) {
            return $tooltip.hide();
          }
          timeout = setTimeout(function () {
            if (hoverState === 'out') {
              $tooltip.hide();
            }
          }, options.delay.hide);

        };

        $tooltip.hide = function() {

          $animate.leave(tipElement, function() {});
          scope.$digest();
          isShown = false;

        };

        $tooltip.toggle = function() {

          isShown ? $tooltip.leave() : $tooltip.enter();

        };

        // Protected methods

        $tooltip.$applyPlacement = function() {
          if(!tipElement) return;

          // Get the position of the tooltip element.
          var elementPosition = getPosition();

          // Get the height and width of the tooltip so we can center it.
          var tipWidth = tipElement.prop('offsetWidth'),
              tipHeight = tipElement.prop('offsetHeight');

          // Get the tooltip's top and left coordinates to center it with this directive.
          var tipPosition = getCalculatedOffset(options.placement, elementPosition, tipWidth, tipHeight);

          // Now set the calculated positioning.
          tipPosition.top += 'px';
          tipPosition.left += 'px';
          tipElement.css(tipPosition);

        };

        // Private methods

        function getPosition() {
          if(options.container === 'body') {
            return dimensions.offset(element[0]);
          }  else {
            return dimensions.position(element[0]);
          }
        }

        function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
          var offset;
          var split = placement.split('-');

          switch (split[0]) {
          case 'right':
            offset = {
              top: position.top + position.height / 2 - actualHeight / 2,
              left: position.left + position.width
            };
            break;
          case 'bottom':
            offset = {
              top: position.top + position.height,
              left: position.left + position.width / 2 - actualWidth / 2
            };
            break;
          case 'left':
            offset = {
              top: position.top + position.height / 2 - actualHeight / 2,
              left: position.left - actualWidth
            };
            break;
          default:
            offset = {
              top: position.top - actualHeight,
              left: position.left + position.width / 2 - actualWidth / 2
            };
            break;
          }

          if(!split[1]) {
            return offset;
          }

          // Add support for corners @todo css
          if(split[0] === 'top' || split[0] === 'bottom') {
            switch (split[1]) {
            case 'left':
              offset.left = position.left;
              break;
            case 'right':
              offset.left =  position.left + position.width - actualWidth;
            }
          } else if(split[0] === 'left' || split[0] === 'right') {
            switch (split[1]) {
            case 'top':
              offset.top = position.top - actualHeight;
              break;
            case 'bottom':
              offset.top = position.top + position.height;
            }
          }

          return offset;
        }

        return $tooltip;

      }

      return TooltipFactory;

    };

  })

  .directive('bsTooltip', function($window, $location, $sce, $tooltip) {

    var forEach = angular.forEach;
    var isDefined = angular.isDefined;
    var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;

    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {

        // Directive options
        var options = {scope: scope};
        forEach(['placement', 'container', 'delay', 'trigger', 'animation', 'type', 'template'], function(key) {
          if(isDefined(attr[key])) options[key] = attr[key];
        });

        // Support scope as data-attrs
        forEach(['title'], function(key) {
          attr[key] && attr.$observe(key, function(newValue, oldValue) {
            scope[key] = newValue;
            isDefined(oldValue) && requestAnimationFrame(function() {
              tooltip && tooltip.$applyPlacement();
            });
          });
        });

        // Support scope as an object
        attr.bsTooltip && scope.$watch(attr.bsTooltip, function(newValue, oldValue) {
          if(angular.isObject(newValue)) {
            angular.extend(scope, newValue);
          } else {
            scope.content = newValue;
          }
          isDefined(oldValue) && requestAnimationFrame(function() {
            tooltip && tooltip.$applyPlacement();
          });
        }, true);

        // Initialize popover
        var tooltip = $tooltip(element, options);

        // Garbage collection
        scope.$on('$destroy', function() {
          tooltip.destroy();
          options = null;
          tooltip = null;
        });

      }
    };

  });
