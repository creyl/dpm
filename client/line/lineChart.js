
Template.lineChart.rendered = function () {
    //Width and height
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .x(function (d) {
            return x(d.index);
        })
        .y(function (d) {
            return y(d.lastPrice);
        });

    var color = d3.scale.ordinal()
        .range(["#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2"]);

    var svg = d3.select("#lineChart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .append("text")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Last 100 transactions");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price");

    var stateCursor = States.find(); // Not expected to change throughout life of market
    function getLast100History() {
        return stateCursor.map(function (state) {
            return {
                name: state.name,
                values: PriceAndOpenInterestHistory.find(
                    {stateId: state._id},
                    {fields: {index: 1, lastPrice: 1}, sort: {index: -1}, limit: 100}
                ).fetch()
            }
        });
    }

    y.domain([0, 1]);

    Deps.autorun(function () {
        var stateNames = States.find({}, {fields: {name: 1}}).map(function (s) {
            return s.name;
        });
        console.log("stateNames ", stateNames);
        color.domain(stateNames);

        var dataset = getLast100History();
        console.log("dataset", dataset);

        var paths = svg.selectAll("path.line")
            .data(dataset);

        x.domain([
            d3.min(dataset, function (c) {
                return d3.min(c.values, function (d) {
                    return d.index;
                });
            }),
            d3.max(dataset, function (c) {
                return d3.max(c.values, function (d) {
                    return d.index;
                });
            })
        ]);

        //Update X axis
        svg.select(".x.axis")
            .transition()
            .duration(500)
            .call(xAxis);

        paths
            .enter()
            .append("g")
            .append("path")
            .attr("class", "line")
            .attr('d', function (d) {
                return line(d.values);
            })
            .style("stroke", function (d) {
                return color(d.name);
            });

        paths
            .attr('d', function (d) {
                return line(d.values);
            });

        paths
            .exit()
            .remove();

        var legend = svg.selectAll(".legend")
            .data(stateNames.slice())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) {
                return "translate(15," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", width - 10)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", color);

        legend.append("text")
            .attr("x", width - 12)
            .attr("y", 6)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) {
                return d;
            });

    });

};