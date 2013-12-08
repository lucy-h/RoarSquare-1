// Variables
var query_txt;
var location_text;
var itineraries = [];
var itinerary = [];
var itinerary_name;
var itineraryMarkers = [];
var results = [];
var mapSearch = [];
var mapPaths = [];
var map;
var infowindows;

// Constants
var MAX_QUERY_SIZE = 15;

/*
Venue Object
- name
- location (address + coordinates)
- contact
- phone
- hours
- category
- canonical url
- rating
*/

$( document ).ready(function() {

// Functions
function initialize() {
	var mapOptions = {
		center: new google.maps.LatLng(40.67, -73.94),
		zoom: 10
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}
google.maps.event.addDomListener(window, 'load', initialize);

function parseVenues(venues) {
	var new_results = [];
	for (var i = 0; i < venues.length; i++) {
		var venue = {};
		var new_venue = venues[i]["venue"];
		venue.name = new_venue.name;
		if (new_venue["location"] && new_venue["location"].hasOwnProperty("address")) {
			venue.location = new_venue["location"].address;
		} else {
			venue.location = "Location Unavailable";
		}
		venue.lat = new_venue["location"].lat;
		venue.long = new_venue["location"].lng;
		if (new_venue["contact"] && new_venue["contact"].hasOwnProperty("formattedPhone")) {
			venue.contact = new_venue["contact"].formattedPhone;
		} else {
			venue.contact = "Phone Unavailable";
		}
		if (new_venue["hours"] && new_venue["hours"].hasOwnProperty("status")) {
			venue.hours = new_venue["hours"].status;
		} else {
			venue.hours = "Hours Unavailable";
		}
		venue.category = new_venue["categories"][0].shortName;
		venue.url = new_venue.url;
		if (new_venue.hasOwnProperty("rating")) {
			venue.rating = new_venue.rating;
		} else {
			venue.rating = "N/A";
		}
		new_results.push(venue);
	}
	return new_results;
}

function postVenuesInSearch(new_results) {
	$('#results').html("");
	addToMap(new_results);
	for (var i = 0; i < new_results.length; i++) {
		$('#results').append("<a href=\"#\" class=\"list-group-item result" + i + "\">" + "<div><h4 style=\"display:inline;\">" + new_results[i].name + "</h4><span class=\"label label-info pull-right\">" + new_results[i].rating + "</span></div><div><h6 style=\"display:inline;\">" + new_results[i].location + "</h6><h6 class=\"pull-right\">" + new_results[i].hours + "</h6></div><h6 style=\"margin-top:3px;\">" + new_results[i].contact + "</h6>" + "</a>");
		var name = ".result" + i;
		$(name).click(function(key) {
			return function() {
				for (var i = 0; i < infowindows.length; i++) {
					infowindows[i].close();
				}
				infowindows[key].open(map, mapSearch[key]);
			}
		}(i));
	}
	$('#search-panel').html("Currently Exploring: " + query_txt);
}

function addToMap(venues) {
	// Remove all map markers.
	for (var i = 0; i < mapSearch.length; i++) {
		mapSearch[i].setMap(null);
	}
	drawMarkers(map);
	mapSearch = [];
	infowindows = [];
	var myLatlng = new google.maps.LatLng(venues[0].lat,venues[0].long);
	if (map.getZoom() != 14) {
		map.setZoom(14);
	}
	map.panTo(myLatlng);
	//map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	for (var i = 0; i < venues.length; i++) {
		var newLatlng = new google.maps.LatLng(venues[i].lat,venues[i].long);
		// To add the marker to the map, use the 'map' property
		var marker = new google.maps.Marker({
			position: newLatlng,
			title: venues[i].name
		});
		mapSearch[i] = marker;
		mapSearch[i].setMap(map);

		var content_string = "<a href=\"#\" class=\"list-group-item\"><h4 class=\"text-center\">" + venues[i].name + "</h4><h6 class=\"text-center\">" + venues[i].location + "</h6><h6 class=\"text-center\">" + venues[i].contact + "</h6><h6 class=\"text-center\">" + venues[i].hours + "</h6><h6 class=\"text-center\">" + venues[i].category + "</h6><button onclick=\"mapButton("+i+")\" id=\"addbutton" + i + "\"  type=\"button\" class=\"btn btn-info btn-lg btn-block\">Add</button></a>";

		var infowindow = new google.maps.InfoWindow({
			content: content_string,
			maxWidth: 1000
		});
		infowindows[i] = infowindow;

		google.maps.event.addListener(mapSearch[i], 'click', function(innerKey) {
			return function() {
				for (var i = 0; i < infowindows.length; i++) {
					infowindows[i].close();
				}
				infowindows[innerKey].open(map, mapSearch[innerKey]);
			};
			//console.log(i);
		}(i));
	}
}

// Function to process results for the given queries.
var search_button = $('#search-button');
search_button.click(function() {
	query_txt = $('#query').val();
	location_text = $('#location').val();
	$.get("https://api.foursquare.com/v2/venues/explore?near=" + location_text + "&query=" + query_txt + "&limit=" + MAX_QUERY_SIZE + "&client_id=5QOFVXQSQM2SECMPYPSWE3VK0Y5ORTYW4ON0ZH1XKGZQTVHN&client_secret=SANTGA13QLXWNZFX55VYD4QTEQISAMTLZVLS350WOPOSRNFY&v=20131206", function(data, status) {
		if (status == "success") {
			var venues = data["response"]["groups"][0]["items"];
			if (venues.length > 0) {
				results = parseVenues(venues);
				postVenuesInSearch(results);
				//console.log(data["response"]["groups"][0]["items"]);
				//console.log(results[0].hours);
			} else {
				$('#search-panel').html("Please try a different search!");
			}
		} else {
			$('#search-panel').html("Failed to connect to FourSquare!");
		}
	});

});

// Function to remove queries.
var remove_button = $('#remove-button');
remove_button.click(function() {
	$('#results').html("");
	for (var i = 0; i < mapSearch.length; i++) {
		mapSearch[i].setMap(null);
	}
	mapSearch = [];
	results = [];
	infowindows = [];
	$('#query').val("");
	$('#location').val("");
	$('#search-panel').html("Search for a new destination!");
	drawMarkers(map);
});

// Function to save itinerary name.
var name_button = $('#name-button');
name_button.click(function() {
	itinerary_name = $('#itinerary-name').val();
	$('#name-input').hide();
	$('#itinerary-title').html(itinerary_name);
});

// Function to save entire itinerary.
var save_button = $('#save-itinerary');
save_button.click(function() {
	var new_itinerary = {};
	new_itinerary.name = itinerary_name;
	new_itinerary.schedule = itinerary;
	new_itinerary.markers = itineraryMarkers;
	itineraries.push(new_itinerary);
	itinerary = [];
	for (var i = 0; i < itineraryMarkers.length; i++) {
		itineraryMarkers[i].setMap(null);
	}
	itineraryMarkers = [];
	query_txt = "";
	location_text = "";
	itinerary_name = "";
	results = [];
	for (var i = 0; i < mapSearch.length; i++) {
		mapSearch[i].setMap(null);
	}
	for (var i = 0; i < mapPaths.length; i++) {
		mapPaths[i].setMap(null);
	}
	mapSearch = [];
	mapPaths = [];
	$('#results').html("");
	$('#search-panel').html("Search for a new destination!");
	$('#itinerary').html("<div id=\"itinerary-panel\" class=\"panel panel-info\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Add a New Destination!</h3></div></div>");
	$('#save-itinerary').hide();
});

function refreshItinerary() {
	var new_itinerary = [];
	var new_markers = [];
	var venue = $('#itinerary-panel');
	for (var i = 0; i < itinerary.length; i++) {
		venue = venue.next();
		var id = venue.attr('id');
		var index = id.replace( /^\D+/g, '');
		new_itinerary[i] = itinerary[index];
		new_markers[i] = itineraryMarkers[index];
		venue.attr("id", "itinerary" + i);
		venue.html("<div><h4 style=\"display:inline;\">" + new_itinerary[i].name + "</h4><span class=\"label label-info pull-right\">" + new_itinerary[i].rating + "</span></div><div><h6 style=\"display:inline;\">" + new_itinerary[i].location + "</h6><h6 class=\"pull-right\" id=\"hideForRemoveButton" + i + "\">"  + new_itinerary[i].hours + "</h6><button style=\"display:none;\" class=\"btn btn-danger btn-xs pull-right\" onclick=\"removeFromItinerary(" + i + ")\" id=\"removeitinerary" + i + "\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button></div><h6 style=\"margin-top:3px;\">" + new_itinerary[i].contact + "</h6>");
	}
	itinerary = [];
	itineraryMarkers = [];
	for (var i = 0; i < new_itinerary.length; i++) {
		itinerary[i] = new_itinerary[i];
		itineraryMarkers[i] = new_markers[i];
	}
	drawLines(map);
	drawMarkers(map);
}

// Drag functionality.
$(function () {
    $("#itinerary").sortable({
        tolerance: 'pointer',
        revert: 'invalid',
        forceHelperSize: true,
        update: function(event, ui) {
			refreshItinerary();
        }
    });
});

});

// Fill map with path.
function drawLines(map) {
	for (var i = 0; i < mapPaths.length; i++) {
		mapPaths[i].setMap(null);
	}
	mapPaths = [];
	if (itinerary.length > 1) {
		for (var i = 1; i < itinerary.length; i++) {
			var last_venue = itinerary[i - 1];
			var curr_venue = itinerary[i];

			var coordinates = [
				new google.maps.LatLng(last_venue.lat, last_venue.long),
				new google.maps.LatLng(curr_venue.lat, curr_venue.long)
			];
			var newPath = new google.maps.Polyline({
				path: coordinates,
				geodesic: true,
				strokeColor: '#FF0000',
				strokeOpacity: 0.8,
				strokeWeight: 4
			});
			mapPaths.push(newPath);
			newPath.setMap(map);
		}
	}
}

function drawMarkers(map) {
	var star = 'assets/star.png';
	var start = 'assets/start.png';
	var finish = 'assets/finish.png';
	for (var i = 0; i < itineraryMarkers.length; i++) {
		if (i == 0) {
			itineraryMarkers[i].setIcon(start);
		} else if (i == itineraryMarkers.length - 1) {
			itineraryMarkers[i].setIcon(finish);
		} else {
			itineraryMarkers[i].setIcon(star);
		}
		itineraryMarkers[i].setMap(map);
	}
}

// Fill map with itinerary markers.
function addItinerary(map, venue, marker) {
	$('#itinerary-panel').hide();
	$('#save-itinerary').show();
	itineraryMarkers.push(marker);
	drawMarkers(map);
	drawLines(map);
}

function showRemoveButton(event) {
	var id = event.currentTarget.id;
	var idx = id.replace( /^\D+/g, '');
	var toHide = "#hideForRemoveButton" + idx;
	var toShow = "#removeitinerary" + idx;
	$(toHide).hide();
	$(toShow).show();
}

function hideRemoveButton(event) {
	var id = event.currentTarget.id;
	var idx = id.replace( /^\D+/g, '');
	var toHide = "#removeitinerary" + idx;
	var toShow = "#hideForRemoveButton" + idx;
	$(toHide).hide();
	$(toShow).show();
}

function mapButton(index) {
	var venue = results[index];
	var added = false;
	for (var i = 0; i < itinerary.length; i++) {
		if (venue == itinerary[i]) {
			added = true;
		}
	}

	if(!added) {
		for (var i = 0; i < infowindows.length; i++) {
			infowindows[i].close();
		}
		itinerary.push(results[index]);

		$('#itinerary').append("<a href=\"#\" class=\"list-group-item\" id=\"itinerary" + (itinerary.length - 1) + "\">" + "<div><h4 style=\"display:inline;\">" + results[index].name + "</h4><span class=\"label label-info pull-right\">" + results[index].rating + "</span></div><div><h6 style=\"display:inline;\">" + results[index].location + "</h6><h6 class=\"pull-right\" id=\"hideForRemoveButton" + (itinerary.length - 1) + "\">"  + results[index].hours + "</h6><button style=\"display:none;\" class=\"btn btn-danger btn-xs pull-right\" onclick=\"removeFromItinerary(" + (itinerary.length - 1) + ")\" id=\"removeitinerary" + (itinerary.length - 1) + "\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button></div><h6 style=\"margin-top:3px;\">" + results[index].contact + "</h6>" + "</a>");
		
		// Hover functionality on remove button.
		var name = "#itinerary" + (itinerary.length - 1);
		$(name).hover(function(event) {
				showRemoveButton(event);
			}, function(event) {
				hideRemoveButton(event);
			}
		);

		addItinerary(map, results[index], mapSearch[index]);
	} else {
		infowindows[index].close();
	}
}

function refreshItinerary() {
	var new_itinerary = [];
	var new_markers = [];
	var venue = $('#itinerary-panel');
	var i = 0;
	while (venue.next().length) {
		venue = venue.next();
		var id = venue.attr('id');
		var index = id.replace( /^\D+/g, '');
		new_itinerary[i] = itinerary[index];
		new_markers[i] = itineraryMarkers[index];
		venue.attr("id", "itinerary" + i);
		venue.html("<div><h4 style=\"display:inline;\">" + new_itinerary[i].name + "</h4><span class=\"label label-info pull-right\">" + new_itinerary[i].rating + "</span></div><div><h6 style=\"display:inline;\">" + new_itinerary[i].location + "</h6><h6 class=\"pull-right\" id=\"hideForRemoveButton" + i + "\">"  + new_itinerary[i].hours + "</h6><button style=\"display:none;\" class=\"btn btn-danger btn-xs pull-right\" onclick=\"removeFromItinerary(" + i + ")\" id=\"removeitinerary" + i + "\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button></div><h6 style=\"margin-top:3px;\">" + new_itinerary[i].contact + "</h6>");
		i++;
	}
	for (var i = 0; i < itineraryMarkers.length; i++) {
		itineraryMarkers[i].setMap(null);
	}
	itinerary = [];
	itineraryMarkers = [];
	for (var i = 0; i < new_itinerary.length; i++) {
		itinerary[i] = new_itinerary[i];
		itineraryMarkers[i] = new_markers[i];
	}
	drawLines(map);
	drawMarkers(map);
}

function removeFromItinerary(index) {
	var name = "#itinerary" + index;
	var venue = $(name);
	//var id = venue.attr('id');
	//var idx = id.replace( /^\D+/g, '');
	//itinerary.splice(idx, 1);
	//itineraryMarkers.splice(idx, 1);
	venue.remove();
	refreshItinerary();
	//drawMarkers(map);
	//drawLines(map);
}

function changeName() {
	$('#name-input').show();
}