var map, featureList;

$(document).on("click", ".feature-row", function(e) {
  sidebarClick($(this).attr("id"));
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

function sidebarClick(id) {
  marker = zerotrack.markers[id];
  map.setView([marker.getLatLng().lat, marker.getLatLng().lng]);
  // marker.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

/* Basemap Layers */
var osm = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: 'Map &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
});
/* Overlay Layers */
var highlight = L.geoJson(null);

map = L.map("map", {
  zoom: 10,
  layers: [osm],
  zoomControl: false
});

map.locate({setView: true});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: false,
  drawMarker: false,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": osm
};
