angular.module('ui.bootstrap.collapse',[])
.constant('collapseConfig', {
  showClass: "",
  visibleClass: "in",
  hideClass: "",
  hiddenClass: "",
  transitionClass: "collapsing",
  collapseClass: "collapse",
})
// The collapsible directive indicates a block of html that will expand and collapse
.directive('collapse', ['$injector', function($injector) {
  var $interpolate = $injector.get('$interpolate'),
      $animate = $injector.get('$animate');

  // CSS transitions don't work with height: auto, so we have to manually change the height to a
  // specific value and then once the animation completes, we can reset the height to auto.
  // Unfortunately if you do this while the CSS transitions are specified (i.e. in the CSS class
  // "collapse") then you trigger a change to height 0 in between.
  // The fix is to remove the "collapse" CSS class while changing the height back to auto - phew!
  var fixUpHeight = function(scope, element, height) {
    var config = $injector.get('collapseConfig');
    // We remove the collapse CSS class to prevent a transition when we change to height: auto
    element.removeClass(config.collapseClass);
    element.css({ height: height });
    // It appears that  reading offsetWidth makes the browser realise that we have changed the
    // height already :-/
    var x = element[0].offsetWidth;
    element.addClass(config.collapseClass);
  };

  return {
    link: function(scope, element, attrs) {
      var config = $injector.get('collapseConfig');
      var isCollapsed;
      var initialAnimSkip = true;
      var transitionClass = $interpolate(attrs.collapseTransition || config.transitionClass)(scope);
      var showClass = (config.showClass || '');
      var hideClass = (config.hideClass || '');
      var visibleClass = (config.visibleClass || '');
      var hiddenClass = (config.hiddenClass || '');
      var transition = false;

      // Make sure we have strings and not arrays
      showClass = angular.isArray(showClass) ? showClass.join(" ") : showClass;
      hideClass = angular.isArray(hideClass) ? hideClass.join(" ") : hideClass;
      visibleClass = angular.isArray(visibleClass) ? visibleClass.join(" ") : visibleClass;
      hiddenClass = angular.isArray(hiddenClass) ? hiddenClass.join(" ") : hiddenClass;
      transitionClass = angular.isArray(transitionClass) ?
                        transitionClass.join(" ") :
                        transitionClass;      

      scope.$watch(attrs.collapse, function(value) {
        if (value) {
          collapse();
        } else {
          expand();
        }
      });
      

      var doTransition = function(isExpand, change, done) {
        if (!transition) {
          transition = true;
          var animClass = [transitionClass]
          if (isExpand && showClass.length) {
            animClass.push(showClass);
          } else if (hideClass.length) {
            animClass.push(hideClass);
          }
          animClass = animClass.join(" ");

          function finish() {
            console.log(arguments);
            transition = false;
            element.removeClass(animClass);
            done();
          }
          if ($animate && $animate.enabled() === true && transitionClass !== ["none"]) {
            $animate.addClass(element, animClass, finish);
          } else {
            finish();
          }
        }
      };

      var swapCss = function (callback) {
       var ret, prop, old = {}, css = {
         position: 'absolute',
         visibility: 'hidden',
         display: 'block'
       };
       for (prop in css) {
         old[prop] = element[0].style[prop];
         element[0].style[prop] = css[prop];
       }
       ret = callback();
       for (prop in css) {
         element[0].style[prop] = old[prop];
       }
       return ret;
      };

      var swapDisplay = /^(none|table(?!-c[ea]).+)/;
      var getDisplay = function() {
        var val;
        if (window.getComputedStyle) {
          val = window.getComputedStyle(element[0], null).display;
        }
        if (!val) {
          val = element.css('display');
        }
        return val;
      }
      var realHeight = function() {
        function getHeight() {
          return element[0].scrollHeight;
        }
        if (element[0].offsetWidth === 0 && swapDisplay.test(getDisplay())) {
          return swapCss(getHeight);
        }
        return getHeight();
      }

      var expand = function() {
        if (initialAnimSkip) {
          initialAnimSkip = false;
          if ( !isCollapsed ) {
            fixUpHeight(scope, element, 'auto');
            element.addClass(visibleClass);
          }
        } else {
          doTransition(true, { height : realHeight() + 'px' }, function() {
            transition = false;
            if ( !isCollapsed ) {
              fixUpHeight(scope, element, 'auto');
              element.addClass(visibleClass);
            }
          });
        }
        isCollapsed = false;
      };
      
      var collapse = function() {
        isCollapsed = true;
        if (initialAnimSkip) {
          initialAnimSkip = false;
          fixUpHeight(scope, element, 0);
        } else {
          fixUpHeight(scope, element, realHeight() + 'px');
          doTransition(false, {'height':'0px'}, function() {
            transition = false;
            element.removeClass(visibleClass);
          });
        }
      };
    }
  };
}]);
