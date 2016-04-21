//Roughly the center of Missouri (lat/long)
var center = [38.6321346, -92.4013551]

//Target the chart div as the container for our leaflet map
//Set the center point and zoom level.
var map = L.map('chart').setView(center, 7);

// add an OpenStreetMap tile layer
//OpenStreetMap is an open source map layers anyone can use free of charge.
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// //Add an svg element to the map.
var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");


//This will be a dictionary object we use to lookup the info for each county.
//It's empty for now. We add our data when we load or json.
var theData = {};


// Use Leaflet to implement a D3 geometric transformation.
function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}


// This is some logic to control whether elements appear in front of or behind other elements.
// We'll use this on mouseover to move county shapes to the front
// And then to the back when we mouseout. The effect is to get crisp borders all the way around.
// See it in action in the county mouseover below. It's called by adding `.moveToFront()` to a selection.
// I don't know why, but this functionality isn't included in the d3 code base.
// I almost always include this function with my d3 projects.
// It's just a piece of code I've copied from the web. Like here, for example:

//http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};






$(document).ready(function(d) {
    

    d3.csv("data/mo_poverty.csv", function(data) {


        // Each row in the data is a county.
        // So we append an object to theData with the county name
        // And put the whole row in that object
        // So each county's data is accessible with the construction, theData[county name here];
        

        // $.each is the same as a for loop:
        // for (i=0; i < data.length; i++) {
            //where item is the same as data[i];
            //and i would be index, just like in a for loop.
        // }


        $.each(data, function(i, item) {
            var fips = item["State FIPS Code"]+item["County FIPS Code"];
            theData[fips] = item;
        }) 

        drawMap();
    })
});





function drawMap() {

    //Load the Missouri County GeoJson
    d3.json("js/missouri-counties.json", function(collection) {

        //This positions each county on it's the map.
        var transform = d3.geo.transform({
                point: projectPoint
            }),
            path = d3.geo.path().projection(transform);

        
        //This draws the feature on the map and fills it with data
        //The data for each county is what's in the GeoJson.
        //The GeoJson contains county names...
        //...so whenever we want to look up our cancer data for a county...
        //We look it up by name using theData[county name here]
        var feature = g.selectAll("path")
            .data(collection.features)
            .enter()
            .append("path")
            .attr("class", "county");

        console.log(feature);

        feature.style("fill", function(d) {

            var fips = d.properties.geoid;
            var povertyLevel = theData[fips]["Poverty Percent, All Ages"];

            povertyLevel = Number(povertyLevel);

            // This is where we set our colors. There are many ways to do this.
            // This is probably the simplest.
            if (povertyLevel <= 10) {
                return "#ffffb2";
            } else if (povertyLevel > 10 && povertyLevel <= 20) {
                return "#fecc5c";
            } else if (povertyLevel > 20 && povertyLevel <= 30) {
                return "#fd8d3c";
            } else if (povertyLevel > 30) {
                return "#e31a1c";
            }

            
        })
        .on("mouseover", function(d) {
            var fips = d.properties.geoid;
            var countyName = theData[fips]["Name"];
            var povertyLevel = theData[fips]["Poverty Percent, All Ages"]+"%";

            // Select the county we're moused over.
            // Give it a black stroke and move it to the front.
            // (see moveToFront() explanation above)
            d3.select(this).style("stroke", "#333").moveToFront();

            // d3 method for getting mouse relative position
            // (relative to the parent container (the .chart div in this case))
            // var x = d3.mouse(this)[0];
            // var y = d3.mouse(this)[1];

            // d3 method for getting the mouse's page position
            // which is the position relative to the top left corner of the whole page.
            var pageX = d3.event.pageX;
            var pageY = d3.event.pageY;

            // jQuery method for getting position of an element
            // In this case the .chart div.
            var chartLeft = $(".chart").position().left;
            var chartTop = $(".chart").position().top;

            // Subtract the chart positon from the mouse's page position.
            // This gives us an x/y that will position our tooltip properly within the .chart div 
            var tt_x = pageX - chartLeft + 15;
            var tt_y = pageY - chartTop + 15;

            // Add our values to the tooltip as html.
            // and `show()` it (sets css to dislay: block)
            $(".tt").html(
                "<div class='name'>"+countyName+"</div>"+
                "<div class='val'>"+povertyLevel+"</div>"
            ).show();
            
            $(".tt").css({
                    "left" : tt_x+"px",
                    "top" : tt_y+"px"
                });

        })
        .on("mouseout", function() {

            d3.select(this).style("stroke", "#FFF").moveToBack();

            // `hide()` sets css to dislay: none
            $(".tt").hide();
        })





        //The next block of code repositions the geojson objects on the map
        //whenever you zoom or pan on the map.
        //You should be able to leave this as is.
        map.on("viewreset", function() {
            reset();
        });


        reset();



        // Reposition the SVG to cover the features.
        function reset() {

            var bounds = path.bounds(collection),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr("width", bottomRight[0] - topLeft[0])
                .attr("height", bottomRight[1] - topLeft[1])
                .style("left", topLeft[0] + "px")
                .style("top", topLeft[1] + "px");

            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

            feature.attr("d", path);

        }

        
    });

}















