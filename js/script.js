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
    

    drawMap();
});





function drawMap() {

    //Load the Missouri County GeoJson
    d3.json("data/mo-zip-codes.json", function(collection) {

        //This positions each county on it's the map.
        var transform = d3.geo.transform({
                point: projectPoint
            }),
            path = d3.geo.path().projection(transform);

        console.log(collection);

        
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

        feature.style("fill", function(d) {
            return "#CCC";

            
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















