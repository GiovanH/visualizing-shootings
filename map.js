var map_json = "json/Stanford_MSA_Database.geojson";
var map_overlay_json = "json/stanford_overlay.json";

function onOverlayChange(e){
	console.log(e)
	populateMapWithData(window.map, window.mapdata, window.overlays[e.target.value])
}

function populateMenu(overlays){
	console.log("Populating menu")
	window.overlays = overlays;

	overlay_select = document.getElementById("overlay_select");
	for(var i = 0, size = overlays.length; i < size ; i++){
		overlay = overlays[i];
		option = document.createElement("option");
		option.value = i;
		option.innerText = overlay.name
		overlay_select.appendChild(option)

	}

	overlay_select.addEventListener("change", onOverlayChange);

	console.log("Populated menu")
}

function makePopupContent(overlay_type, feature){
	return `<p>${JSON.stringify(feature.properties)}</p>`
}


activelayer = null;
function populateMapWithData(map, mapdata, overlay){
	console.log("Populating map")
	window.mapdata = mapdata;

	if (activelayer){
		map.removeLayer(activelayer)
	}

	if (overlay.type == "raw") {
		activelayer = L.geoJSON(mapdata, {
			onEachFeature: function (feature, layer) {
				layer.bindPopup(makePopupContent(overlay.type, feature));
			}
		}).addTo(map);
	} else if (overlay.type == "autocolor") {
		activelayer = L.geoJSON(mapdata, {
			pointToLayer: function(feature, latlng) {
				return L.marker(latlng, {icon: greenIcon});
			}      
			onEachFeature: function (feature, layer) {
				layer.bindPopup(makePopupContent(overlay.type, feature));
			}
		}).addTo(map);
	}

	console.log("Populated map")
}

function load(){
	console.log("Loading")
	var mymap = L.map('mapid').setView([40, -100], 4);
	window.map = mymap

	L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(mymap);

	$.ajax({
	    url: map_overlay_json,
	    dataType: 'json',
	    // data: data,
	    success: function(overlayjson) {
			console.log("Loaded overlay json")
			populateMenu(overlayjson)
			var overlay = overlayjson[0]

			$.ajax({
			    url: map_json,
			    dataType: 'json',
			    // data: data,
			    success: function(mapjson) {
					console.log("Loaded map json")
					populateMapWithData(mymap, mapjson, overlay)
				},
			    error: function(e) {console.log(e)}
			});
		},
	    error: function(e) {console.log(e)}
	});
	console.log("Loaded")
}


$(document).ready(function() {
    load();
});