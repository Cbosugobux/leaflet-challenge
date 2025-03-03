// Create the 'basemap' tile layer
let basemap = L.tileLayer(
  "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  {
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
      '<a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; ' +
      '<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }
);

// Grayscale layer
var grayscale = L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}',
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> ' +
      '&copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> ' +
      '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> ' +
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
  }
);

// Watercolor layer
var watercolor = L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', 
  {
    minZoom: 1,
    maxZoom: 16,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> ' +
      '&copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> ' +
      '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> ' +
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
  }
);

// Create basemaps object
let basemaps = {
  "Default": basemap,
  "GrayScale": grayscale,
  "Water Color": watercolor
};


// Initialize Map
let map = L.map("map", {
  center: [40.7, -94.5],
  zoom: 5,
  layers: [basemap] 
});


// Tectonic Plates Layer

let tectonicplates = new L.layerGroup();

d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
  .then(function(plateData) {
    L.geoJson(plateData, {
      color: "yellow",
      weight: 3
    }).addTo(tectonicplates);
  });

// Add tectonic plates layer to the map
tectonicplates.addTo(map);


// Earthquake Data Layer

let earthquakes = new L.layerGroup();

d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
  .then(function(earthquakeData) {

    // Function to choose the color based on depth.
    function dataColor(depth) {
      if (depth > 90) return "red";
      else if (depth > 70) return "#fc4903";
      else if (depth > 50) return "#fc8403";
      else if (depth > 30) return "#fcad03";
      else if (depth > 10) return "#cafc03";
      else return "green";
    }

    // Function to determine the radius size based on magnitude
    function radiusSize(mag) {
      return (mag === 0) ? 1 : mag * 5;
    }

    // Function to define style for each marker
    function dataStyle(feature) {
      return {
        opacity: 1,
        fillOpacity: 1,
        fillColor: dataColor(feature.geometry.coordinates[2]),
        color: "#000000",
        radius: radiusSize(feature.properties.mag),
        weight: 0.5
      };
    }

    // Add earthquake GeoJSON to the earthquakes layer
    L.geoJson(earthquakeData, {
      pointToLayer: function(feature, latLng) {
        return L.circleMarker(latLng);
      },
      style: dataStyle,
      onEachFeature: function(feature, layer) {
        layer.bindPopup(
          `Magnitude: <b>${feature.properties.mag}</b><br>
           Depth: <b>${feature.geometry.coordinates[2]}</b><br>
           Location: <b>${feature.properties.place}</b>`
        );
      }
    }).addTo(earthquakes);
  });

// Add earthquake layer to the map
earthquakes.addTo(map);

// Layer controls

let overlays = {
  "Tectonic Plates": tectonicplates,
  "Earthquake Data": earthquakes
};

L.control.layers(basemaps, overlays).addTo(map);

// Add Legend to bottom right

let legend = L.control({ position: "bottomright" });

legend.onAdd = function() {
  let div = L.DomUtil.create("div", "infoLegend");
  let intervals = [-10, 10, 30, 50, 70, 90];
  let colors = ["green", "#cafc03", "#fcad03", "#fc8403", "#fc4903", "red"];

  for (let i = 0; i < intervals.length; i++) {
    let rangeLabel = intervals[i] + (intervals[i + 1] ? "&ndash;" + intervals[i + 1] : "+");
    div.innerHTML += `<i style="background: ${colors[i]}; width: 18px; height: 18px; display: inline-block; margin-right: 6px;"></i> ${rangeLabel}<br>`;
  }
  return div;
};

legend.addTo(map);
