hashtagApp.directive('barchartD3', ['$document','d3Factory', function($document, d3Factory) {
    return {
      scope: {
        data: '='
      },
      link: function(scope, element, attr) {

        d3Factory.d3().then(function(d3){

          var format = d3.format(",");
          var margin = {top: parseInt(attr.marginTop), right: parseInt(attr.marginRight), bottom: parseInt(attr.marginBottom), left: parseInt(attr.marginLeft)}, 
          width = parseInt(attr.canvasWidth);
          var height = 200 - margin.top - margin.bottom;

          var y = d3.scale.ordinal()
            .rangeRoundBands([0, height], .1);
            var x = d3.scale.linear().range([0, width]);
            var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickSize(-height - margin.bottom)
            .tickFormat(format);

          var svg = d3.select(element[0])
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            /*.style("margin-left", -margin.left + "px")*/
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          svg.append("g").attr("class", "x axis");
          svg.append("g")
            .attr("class", "y axis")
            .append("line")
            .attr("class", "domain")
            .attr("y2", height);


          scope.$watch('data', function(newData) {
            scope.render(newData);
          });

          scope.render = function(data) {
            d3.transition().duration(2000).each(function(){
                if(!data || data.length != 10) return;

                var maxValue = 0;
                data.forEach(function(d){
                  maxValue =  Math.max(parseInt(d.count), maxValue);
                });
                x.domain([0, (maxValue>5?maxValue:5)]);
                y.domain(data.map(function(d) { return d.tag; }));

                var bar = svg.selectAll(".bar")
                    .data(data, function(d) { return d.tag; });

                var barEnter = bar.enter().insert("g", ".axis")
                    .attr("class", "bar")
                    .attr("transform", function(d) { return "translate(0," + (y(d.tag) + height) + ")"; })
                    .style("fill-opacity", 0);
                
                barEnter.append("rect")
                    .attr("width", function(d) {return x(parseInt(d.count)); })
                    .attr("height", y.rangeBand());

                barEnter.append("text")
                    .attr("class", "label")
                    .attr("x", -10)
                    .attr("y", y.rangeBand() / 2)
                    .attr("dy", ".35em")
                    .attr("text-anchor", "end")
                    .text(function(d) { return d.tag; });

                barEnter.append("text")
                    .attr("class", "value")
                    .attr("x", function(d) { return x(parseInt(d.count)) - 3; })
                    .attr("y", y.rangeBand() / 2)
                    .attr("dy", ".35em")
                    .attr("text-anchor", "end");

              // ENTER + UPDATE
              // Appending to the enter selection expands the update selection to include
              // entering elements; so, operations on the update selection after appending to
              // the enter selection will apply to both entering and updating nodes.
                var barUpdate = d3.transition(bar)
                    .attr("transform", function(d) { return "translate(0," + (d.y0 = y(d.tag)) + ")"; })
                    .style("fill-opacity", 1);

                barUpdate.select("rect")
                    .attr("width", function(d) { return x(parseInt(d.count)); });

                barUpdate.select(".value")
                    .attr("x", function(d) { return x(parseInt(d.count)) - 3; })
                    .text(function(d) {return format(Math.round(parseInt(d.count))); });

                var barExit = d3.transition(bar.exit())
                    .attr("transform", function(d) { return "translate(0," + (d.y0 + height) + ")"; })
                    .style("fill-opacity", 0)
                    .remove();

                barExit.select("rect")
                    .attr("width", function(d) { return x(parseInt(d.count)); });

                barExit.select(".value")
                    .attr("x", function(d) { return x(parseInt(d.count)) - 3; })
                    .text(function(d) { return format(parseInt(d.count)); });

                d3.transition(svg).select(".x.axis")
                    .call(xAxis);    
              });  
          }

        });
      }
    };
  }]);
