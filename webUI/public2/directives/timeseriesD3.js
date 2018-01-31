hashtagApp.directive('timeseriesD3', ['$document', '$q', 'cubeFactory', 'd3Factory', 
  function($document, $q, cubeFactory, d3Factory) {
    return {
      scope: {
        data: '='
      },
      link: function(scope, element, attr) {

            $q.all([cubeFactory.cube(),d3Factory.d3()])
              .then(function(objs){

                var cubism = objs[0];
                var d3 = objs[1];
              
                scope.sim = true;

                function source(key) {
                  var value = 0,
                      values = [],
                      i = 0,
                      last;
                  return context.metric(function(start, stop, step, callback) {
                    start = +start, stop = +stop;
                    if (isNaN(last)) last = start;
                    while (last < stop) {
                      last += step;
                      i += 0.2;
                      var ii = Math.ceil(i /5);
                      value = Math.max(-5, Math.min(5, value - 2*Math.sin(Math.pow(i+0.2,3)/20) + 4 * Math.cos( -Math.pow(ii, 5) + 0.71)));                     
                      values.push((scope.sim ? value : 0) + scope.data[key]);
                    }
                    callback(null, values = values.slice((start - stop) / step));
                  }, key);
                }

                var context = cubism.context()
                  .serverDelay(0)
                  .clientDelay(0)
                  .step(1000)
                  .size($document[0].body.clientWidth-100);

                scope.$watch('data',function(newvalue){scope.sim=false;},true);

                var sources = [];
                for(key in scope.data) sources.push(source(key));

                d3.select(element[0]).call(function(div) {

                   div.append("div")
                   .attr("class", "axis")
                   .call(context.axis().orient("top"));
                  // See view-source:https://square.github.io/cubism/ #example2a

                  div.selectAll(".horizon")
                      .data(sources)
                    .enter().append("div")
                      .attr("class", "horizon")
                      .call(context.horizon().height(60).extent([0, 180]));

                });

          });

      }
    };
  }]);
