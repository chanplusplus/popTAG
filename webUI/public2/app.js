var hashtagApp=angular.module('hashtagApp', [])
.factory('d3Factory', ['$document', '$window', '$q', '$rootScope',
  function($document, $window, $q, $rootScope) {
    var d = $q.defer(),
        d3Factory = {
          d3: function() { return d.promise; }
        };
  function onScriptLoad() {
    // Load client in the browser
    $rootScope.$apply(function() { d.resolve($window.d3); });
  }
  var scriptTag = $document[0].createElement('script');
  scriptTag.type = 'text/javascript';
  scriptTag.async = true;
  scriptTag.src = 'https://d3js.org/d3.v3.min.js';
  scriptTag.onreadystatechange = function () {
    if (this.readyState == 'complete') onScriptLoad();
  }
  scriptTag.onload = onScriptLoad;

  var s = $document[0].getElementsByTagName('body')[0];
  s.appendChild(scriptTag);

  return d3Factory;
}]).factory('ioFactory', ['$document', '$window', '$q', '$rootScope', 
  function($document, $window, $q, $rootScope) {
    var d = $q.defer(),
        ioFactory = {
          io: function() { return d.promise; }
        };
  function onScriptLoad() {
    // Load client in the browser
    $rootScope.$apply(function() { d.resolve($window.io); });
  }
  var scriptTag = $document[0].createElement('script');
  scriptTag.type = 'text/javascript';
  scriptTag.async = true;
  scriptTag.src = 'https://cdn.socket.io/socket.io-1.4.5.js';
  scriptTag.onreadystatechange = function () {
    if (this.readyState == 'complete') onScriptLoad();
  }
  scriptTag.onload = onScriptLoad;

  var s = $document[0].getElementsByTagName('body')[0];
  s.appendChild(scriptTag);

  return ioFactory;
}]).factory('cubeFactory', ['$document', '$window', '$q', '$rootScope', 'd3Factory',
  function($document, $window, $q, $rootScope, d3Factory) {
    var d = $q.defer(),
        cubeFactory = {
          cube: function() { return d.promise; }
        };
  function onScriptLoad() {
    // Load client in the browser
    $rootScope.$apply(function() { d.resolve($window.cubism); });
  }

  var scriptTag = $document[0].createElement('script');
  scriptTag.type = 'text/javascript';
  scriptTag.async = true;
  scriptTag.src = 'https://cdnjs.cloudflare.com/ajax/libs/cubism/1.6.0/cubism.v1.js';
  scriptTag.onreadystatechange = function () {
    if (this.readyState == 'complete') onScriptLoad();
  }
  scriptTag.onload = onScriptLoad;

  d3Factory.d3().then(function(d3){
    var s = $document[0].getElementsByTagName('body')[0];
    s.appendChild(scriptTag);
  });

  return cubeFactory;
}]);