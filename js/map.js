var map_json = "json/Stanford_MSA_Database.geojson";
var map_overlay_json = "json/stanford_overlay.json";

var map;
var datatypes;
var mapdata;
var overlay_json

var datatype_to_overlays = {
	"number": ["scale (color)", "scale (size)", "scale (size + color)"],
	"boolean": ["autocolor"],
	"category": ["autocolor"]
}

function sortByFrequency(array) {
    var frequency = {};
    array.forEach(function(value) { frequency[value] = 0; });
    var uniques = array.filter(function(value) {
        return ++frequency[value] == 1;
    });
    return uniques.sort(function(a, b) {
        return frequency[b] - frequency[a];
    });
}

function contains(string, substr){
	return Boolean(string.indexOf(substr) + 1)
}

function randomChoice(choices) {
	var index = Math.floor(Math.random() * choices.length);
	return choices[index];
}

function onOverlayChange(e) {
	value = document.getElementById("overlay_select").value
	datatype = datatypes[document.getElementById("field_select").value]
	changeMapLayer(datatype, value)
}

function onFieldChange(){
	datatype = datatypes[document.getElementById("field_select").value]
	field = datatype["field"];
	overlays = datatype_to_overlays[datatype["datatype"]];

	overlay_select = document.getElementById("overlay_select");

	node = document.getElementById("overlay_select")
	while (node.hasChildNodes()) {
	    node.removeChild(node.lastChild);
	}

	for(var i = 0, size = overlays.length; i < size ; i++){
		overlay = overlays[i];
		option = document.createElement("option");
		option.value = overlay;
		option.innerText = overlay
		overlay_select.appendChild(option)
	}

	onOverlayChange()
}

function populateMenu(datatypes, mapjson){
	console.log("Populating menu")
	window.datatypes = datatypes;

	field_select = document.getElementById("field_select");
	for(var i = 0, size = datatypes.length; i < size ; i++){
		field = datatypes[i]["field"];
		datatype = datatypes[i]["datatype"];
		option = document.createElement("option");
		option.value = i;
		option.innerText = field
		field_select.appendChild(option)

	}

	onFieldChange();
	console.log("Populated menu")
}

function makePopupContent(overlay, field, feature){

	if (overlay == "autocolor") {
		return `<p>${field}: ${feature.properties[field]}</p>`
	} else if (contains(overlay, "scale")) {
		return `<p>${field}: ${feature.properties[field]}</p>`
	} else {
		return `<p>${JSON.stringify(feature.properties)}</p>`
	} 
}


activelayer = null;
function changeMapLayer(datatype, overlay){

	if (activelayer){
		map.removeLayer(activelayer)
	}

	if (overlay == "raw") {
		activelayer = L.geoJSON(mapdata, {
			onEachFeature: function (feature, layer) {
				layer.bindPopup(makePopupContent(overlay, datatype["field"], feature));
			}
		}).addTo(map);
	} else if (overlay == "autocolor") {
		var encounters = []
		key = datatype["field"]
		function makeAutocolorIcon(feature, key) {
			value = feature.properties[key]
			if (value == datatype["fieldblack"]) {
				return blackIcon
			}
			if (encounters.indexOf(value) == -1) {
				encounters.push(value)
			}
			index = encounters.indexOf(value)
			if (index > normal_leaflet_colors.length - 1) {
				return greyIcon
			} else {
				return normal_leaflet_colors[index]
			}
		}
		activelayer = L.geoJSON(mapdata, {
			pointToLayer: function(feature, latlng) {
				return L.marker(latlng, {icon: makeAutocolorIcon(feature, key)});
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(makePopupContent(overlay, datatype["field"], feature));
			}
		}).addTo(map);
	} else if (contains(overlay, "scale")) {
		key = datatype["field"]
		function getValueList(mapdata, key) {
			list = []
			for (f of mapdata["features"]) {
				value = f.properties[key]
				if (!isNaN(value)) {
					list.push(value)
				}
			}
			return list
		}

		value_list = getValueList(mapdata, key);
		min_feature = Math.min(...value_list)
		max_feature = Math.max(...value_list)

		function makeHtmlPin(feature, scale) {
			value = feature.properties[key]
			if (isNaN(value)) {
				return `<img
						src="img/marker-icon-2x-black.png"
						class="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive"
						style="margin-left: -12px; margin-top: -41px; width: 25px; height: 41px;"
					/>`
			} else {
				scalefactor = ((value - min_feature)/(max_feature-min_feature))
				if (contains(overlay, "color")) {
					hue = scalefactor * 260;
				} else {
					hue = 0
				}
					 
				if (contains(overlay, "size")) {
					sizescale = scalefactor
				} else {
					sizescale = 0
				}
				return `<img
						src="img/marker-icon-2x-green.png"
						class="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive"
						style="filter: hue-rotate(${hue}deg); margin-left: -${(1+sizescale)*12}px; margin-top: -${(1+sizescale)*41}px; width: ${(1+sizescale)*25}px; height: ${(1+sizescale)*41}px;"
					/>`
			}
		}

		activelayer = L.geoJSON(mapdata, {
			pointToLayer: function(feature, latlng) {
				return L.marker(latlng, {icon: 
					L.divIcon({
						className: '',
					  	html: makeHtmlPin(feature)
					})
				});
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(makePopupContent(overlay, datatype["field"], feature));
			}
		}).addTo(map);
		// activelayer = L.geoJSON(mapdata, {
		// 	pointToLayer: function(feature, latlng) {
		// 		myCustomColour = '#583470'

		// 		markerHtmlStyles = `
		// 		  background-color: ${myCustomColour};
		// 		  width: 3rem;
		// 		  height: 3rem;
		// 		  display: block;
		// 		  left: -1.5rem;
		// 		  top: -1.5rem;
		// 		  position: relative;
		// 		  border-radius: 3rem 3rem 0;
		// 		  transform: rotate(45deg);
		// 		  border: 1px solid #FFFFFF`

		// 	    var smallIcon = L.divIcon({
		// 		  className: "my-custom-pin",
		// 		  iconAnchor: [0, 24],
		// 		  labelAnchor: [-6, 0],
		// 		  popupAnchor: [0, -36],
		// 		  html: `<span style="${markerHtmlStyles}" />`
		// 		})
		// 	    return L.marker(latlng, {icon: smallIcon});
		// 	},
		// 	onEachFeature: function (feature, layer) {
		//     	// var marker = L.marker(layer.getBounds().getCenter()).addTo(dummyGroup);
  //     	// 		marker.feature = feature;
		// 		layer.bindPopup(makePopupContent(overlay, feature));
		// 	}
		// }).addTo(map);
	} else {
		console.log("No such overlay " + overlay)
	}

	console.log("Populated map")
}

function load(){
	console.log("Loading")
	map = L.map('mapid').setView([40, -100], 4);

	L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);

	$.ajax({
	    url: map_overlay_json,
	    dataType: 'json',
	    // data: data,
	    success: function(overlayjson) {
			console.log("Loaded overlay json")
			overlay_json = overlayjson
			$.ajax({
			    url: map_json,
			    dataType: 'json',
			    // data: data,
			    success: function(mapjson) {
					console.log("Loaded map json")
			    	mapdata = mapjson;
					populateMenu(overlayjson, mapjson)
				},
			    error: function(e) {console.log(e)}
			});
		},
	    error: function(e) {console.log(e)}
	});

	document.getElementById("field_select").addEventListener("change", onFieldChange);
	document.getElementById("overlay_select").addEventListener("change", onOverlayChange);
	console.log("Loaded")
}


$(document).ready(function() {
    load();
});