// namespacing!
if (!com) {
    var com = { };
    if (!com.modestmaps) {
        com.modestmaps = { };
    }
}

// Ripped from underscore.js
// Internal function used to implement `_.throttle` and `_.debounce`.
var limit = function(func, wait, debounce) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var throttler = function() {
      timeout = null;
      func.apply(context, args);
    };
    if (debounce) clearTimeout(timeout);
    if (debounce || !timeout) timeout = setTimeout(throttler, wait);
  };
};

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time.
var throttle = function(func, wait) {
  return limit(func, wait, false);
};

var locationHash = {
  stateChange: function(callback) {
    window.addEventListener('hashchange', function() {
      callback(location.hash);
    }, false);
  },
  getState: function() {
    return location.hash;
  },
  pushState: function(state) {
    location.hash = state;
  }
};

com.modestmaps.Map.prototype.hash = function(options) {
  var s0, // cached location.hash
      lat = 90 - 1e-8, // allowable latitude range
      map;

  var hash = {
    map: this,
    parser: function(s) {
      var args = s.split('/').map(Number);
      if (args.length < 3 || args.some(isNaN)) {
        return true; // replace bogus hash
      } else if (args.length == 3) {
        this.map.setCenterZoom(new com.modestmaps.Location(args[1], args[2]), args[0]);
      }
    },
    formatter: function() {
      var center = this.map.getCenter(),
          zoom = this.map.getZoom(),
          precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
      return '#' + [zoom.toFixed(2),
        center.lat.toFixed(precision),
        center.lon.toFixed(precision)].join('/');
    },
    move: function() {
      var s1 = hash.formatter();
      if (s0 !== s1) {
        s0 = s1;
        options.manager.pushState(s0); // don't recenter the map!
      }
    },
    stateChange: function(state) {
      if (state === s0) return; // ignore spurious hashchange events
      if (hash.parser((s0 = state).substring(1))) {
        hash.move(); // replace bogus hash
      }
    },
    // If a state isn't present when you initially load the map, the map should
    // still get a center and zoom level.
    initialize: function() {
      if (options.defaultCenter) this.map.setCenter(options.defaultCenter);
      if (options.defaultZoom) this.map.setZoom(options.defaultZoom);
    }
  };

  options.manager.getState() ?
    hash.stateChange(options.manager.getState()) :
    hash.initialize() && hash.move();
  this.addCallback('drawn', throttle(hash.move, 500));
  options.manager.stateChange(hash.stateChange);

  return this;
};
