// Variables
var query_txt;
var location_text;
var itineraries = [];
var itinerary = [];
var itinerary_name = "Your Itinerary";
var itineraryMarkers = [];
var results = [];
var mapSearch = [];
var mapPaths = [];
var map;
var infowindows = [];
var itineraryInfo = [];
var currItinerary;
var isNewItinerary = true;

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

itineraries = recreate();

if (itineraries) {
	for (var i = 0; i < itineraries.length; i++) {
		$('#itinerary-dropdown').append("<li><a id=\"saveditinerary" + i + "\" onclick=\"reloadItinerary(" + i + ")\">"+ itineraries[i].name + "</a></li>")
	}
	createNewItinerary();
} else {
	itineraries = [];
}

// Functions
function initialize() {
	var mapOptions = {
		center: new google.maps.LatLng(40.67, -73.94),
		zoom: 10,
		scrollwheel: false
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

		var content_string = "<div class=\"list-group-item\"><h4 class=\"text-center\">" + venues[i].name + "</h4><h6 class=\"text-center\">" + venues[i].location + "</h6><h6 class=\"text-center\">" + venues[i].contact + "</h6><h6 class=\"text-center\">" + venues[i].hours + "</h6><h6 class=\"text-center\">" + venues[i].category + "</h6><button onclick=\"mapButton("+i+")\" id=\"addbutton" + i + "\"  type=\"button\" class=\"btn btn-info btn-lg btn-block\">Add</button></div>";

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
	$('#loader').show();
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
				$('#result-panel').removeClass("panel-info");
				$('#result-panel').addClass("panel-danger");
				$('#search-panel').html("Please try a different search!");
				$('#result-panel').fadeOut(500).fadeIn(500);
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
			}
		} else {
			$('#result-panel').removeClass("panel-info");
			$('#result-panel').addClass("panel-danger");
			$('#search-panel').html("Failed to connect to FourSquare!");
			$('#result-panel').fadeOut(500).fadeIn(500);
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
		}
	});

	$('#loader').fadeOut(2000);
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
	$('#itinerary-title-group').show();
});

var edit_name_button = $('#edit-name-button');
edit_name_button.click(function() {
	changeName();
});

// Function to save entire itinerary.
var save_button = $('#save-itinerary');
save_button.click(function() {
	var new_itinerary = {};
	new_itinerary.name = itinerary_name;
	new_itinerary.schedule = itinerary;
	new_itinerary.markers = itineraryMarkers;
	new_itinerary.info = itineraryInfo;
	if (isNewItinerary) {
		itineraries.push(new_itinerary);
	} else {
		itineraries[currItinerary] = new_itinerary;
	}
	itinerary = [];
	for (var i = 0; i < itineraryMarkers.length; i++) {
		itineraryMarkers[i].setMap(null);
	}
	itineraryMarkers = [];
	itineraryInfo = [];
	query_txt = "";
	location_text = "";
	itinerary_name = "Your Itinerary";
	results = [];
	for (var i = 0; i < mapSearch.length; i++) {
		mapSearch[i].setMap(null);
	}
	for (var i = 0; i < mapPaths.length; i++) {
		mapPaths[i].setMap(null);
	}
	mapSearch = [];
	mapPaths = [];
	$('#name-input').show();
	$('#itinerary-title').html("My Itinerary");
	$('#results').html("");
	$('#search-panel').html("Search for a new destination!");
	$('#itinerary').html("<div id=\"itinerary-panel\" class=\"panel panel-info\"><div class=\"panel-heading\"><h3 id=\"panel-name\" class=\"panel-title\">Add a New Destination!</h3></div></div>");
	$('#save-itinerary').hide();
	$('#delete-itinerary').hide();
	$('#itinerary-dropdown').html("");
	for (var i = 0; i < itineraries.length; i++) {
		$('#itinerary-dropdown').append("<li><a id=\"saveditinerary" + i + "\" onclick=\"reloadItinerary(" + i + ")\">"+ itineraries[i].name + "</a></li>")
	}
	store(itineraries);
	createNewItinerary();
	$('#itinerary-panel').removeClass("panel-info");
	$('#itinerary-panel').addClass("panel-success");
	$('#panel-name').html("Itinerary Saved!");
	$('#itinerary-panel').delay(1000).fadeOut(300).queue(function(n) { $('#panel-name').html("Add a New Destination!"); $('#itinerary-panel').addClass("panel-info"); $('#itinerary-panel').removeClass("panel-success"); n();}).fadeIn(300);
});

// Function to delete itinerary.
var delete_button = $('#delete-itinerary');
delete_button.click(function() {
	if (isNewItinerary) {
		createNewItinerary();
	} else {
		itineraries.splice(currItinerary, 1);
		store(itineraries);
		createNewItinerary();
	}
	$('#itinerary-panel').removeClass("panel-info");
	$('#itinerary-panel').addClass("panel-danger");
	$('#panel-name').html("Itinerary Deleted!");
	$('#itinerary-panel').delay(1000).fadeOut(300).queue(function(n) { $('#panel-name').html("Add a New Destination!"); $('#itinerary-panel').addClass("panel-info"); $('#itinerary-panel').removeClass("panel-danger"); n();}).fadeIn(300);
})

// Drag functionality.
$(function () {
    $("#itinerary").sortable({
        tolerance: 'pointer',
        revert: 'invalid',
        forceHelperSize: true,
        update: function(event, ui) {
			refreshItinerary();
        },
    });
});

//adds array of itineraries to local storage
function store(itin) {
	var simpleitineraries = [];
	for (var i = 0; i < itin.length; i++) {
		var new_itinerary = {};
		new_itinerary.name = itin[i].name;
		new_itinerary.schedule = itin[i].schedule;
		simpleitineraries.push(new_itinerary);
	}
	localStorage.setItem('itinerary', JSON.stringify(simpleitineraries));
}
//reads array of itinieraries from local storage
function recreate() {
	if (localStorage.getItem('itinerary') !== null) {
		var simpleitineraries = JSON.parse(localStorage.getItem('itinerary'));
		console.log(simpleitineraries.length);
		for (var i = 0; i < simpleitineraries.length; i++) {
			var venues = simpleitineraries[i].schedule;
			var newmarkers = [];
			var newinfo = [];
			for (var j = 0; j < simpleitineraries[i].schedule.length; j++) {
				var newLatlng = new google.maps.LatLng(venues[j].lat,venues[j].long);
				// To add the marker to the map, use the 'map' property
				var marker = new google.maps.Marker({
					position: newLatlng,
					title: venues[j].name
				});
				newmarkers[j] = marker;
				var content_string = "<div class=\"list-group-item\"><h4 class=\"text-center\">" + venues[j].name + "</h4><h6 class=\"text-center\">" + venues[j].location + "</h6><h6 class=\"text-center\">" + venues[j].contact + "</h6><h6 class=\"text-center\">" + venues[j].hours + "</h6><h6 class=\"text-center\">" + venues[j].category + "</h6><button onclick=\"mapButton("+j+")\" id=\"addbutton" + j + "\"  type=\"button\" class=\"btn btn-info btn-lg btn-block\">Add</button></div>";

				var infowindow = new google.maps.InfoWindow({
					content: content_string,
					maxWidth: 1000
				});
				newinfo[j] = infowindow;
			}
			simpleitineraries[i].markers = newmarkers;
			simpleitineraries[i].info = newinfo;
		}
		return simpleitineraries;
	} else {
		return null;
	}
}

});

function delete_storage() {
	localStorage.removeItem('itinerary');
}

// Load itineraries into the itinerary page.
//function loadItineraries() {
//	console.log(itineraries.length);
//	for (var i = 0; i < itineraries.length; i++) {
//		$('#main-jumbotron').append("<button id=\"itinerary" + i + "\" class=\"btn btn-primary btn-lg btn-block\">"+ itineraries[i].name +"</button>");
//	}
//}

// Reload itinerary into the itinerary page.
function reloadItinerary(index) {
	createNewItinerary();
	isNewItinerary = false;
	currItinerary = index;
	itinerary = itineraries[index].schedule;
	itineraryMarkers = itineraries[index].markers;
	itinerary_name = itineraries[index].name;
	itineraryInfo = itineraries[index].info;
	$('#itinerary-title-group').show();
	$('#name-input').hide();
	$('#itinerary-title').html(itinerary_name);
	$('#save-itinerary').show();
	$('#delete-itinerary').show();
	$('#itinerary-panel').hide();
	map.setZoom(14);
	map.panTo(itineraryMarkers[0].getPosition());
	drawMarkers(map);
	drawLines(map);
	for (var i = 0; i < itinerary.length; i++) {
		$('#itinerary').append("<a href=\"#\" class=\"list-group-item\" id=\"itinerary" + i + "\">" + "<div><h4 style=\"display:inline;\">" + itinerary[i].name + "</h4><span class=\"label label-info pull-right\">" + itinerary[i].rating + "</span></div><div><h6 style=\"display:inline;\">" + itinerary[i].location + "</h6><h6 class=\"pull-right\" id=\"hideForRemoveButton" + i + "\">"  + itinerary[i].hours + "</h6><button style=\"display:none;\" class=\"btn btn-danger btn-xs pull-right\" onclick=\"removeFromItinerary(" + i + ")\" id=\"removeitinerary" + i + "\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button></div><h6 style=\"margin-top:3px;\">" + itinerary[i].contact + "</h6>" + "</a>");
		var name = "#itinerary" + i;
		$(name).hover(function(event) {
				showRemoveButton(event);
			}, function(event) {
				hideRemoveButton(event);
			}
		);

		google.maps.event.addListener(itineraryMarkers[i], 'click', function(innerKey) {
			return function() {
				for (var i = 0; i < itineraryInfo.length; i++) {
					itineraryInfo[i].close();
				}
				itineraryInfo[innerKey].open(map, itineraryMarkers[innerKey]);
			};
		}(i));

		var name = "#itinerary" + i;
		$(name).click(function(key) {
			return function() {
				for (var i = 0; i < itineraryInfo.length; i++) {
					itineraryInfo[i].close();
				}
				itineraryInfo[key].open(map, itineraryMarkers[key]);
			}
		}(i));
	}
}

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
	$('#delete-itinerary').show();
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

function createNewItinerary() {
	isNewItinerary = true;
	currItinerary = -1;
	itinerary = [];
	for (var i = 0; i < itineraryMarkers.length; i++) {
		itineraryMarkers[i].setMap(null);
	}
	itineraryMarkers = [];
	itineraryInfo = [];
	query_txt = "";
	location_text = "";
	itinerary_name = "Your Itinerary";
	results = [];
	for (var i = 0; i < mapSearch.length; i++) {
		mapSearch[i].setMap(null);
	}
	for (var i = 0; i < mapPaths.length; i++) {
		mapPaths[i].setMap(null);
	}
	mapSearch = [];
	mapPaths = [];
	$('#query').val("");
	$('#location').val("");
	$('#itinerary-name').val("");
	$('#itinerary-title-group').hide();
	$('#name-input').show();
	$('#itinerary-name').focus();
	$('#itinerary-title').html("My Itinerary");
	$('#results').html("");
	$('#search-panel').html("Search for a new destination!");
	$('#itinerary').html("<div id=\"itinerary-panel\" class=\"panel panel-info\"><div class=\"panel-heading\"><h3 id=\"panel-name\" class=\"panel-title\">Add a New Destination!</h3></div></div>");
	$('#save-itinerary').hide();
	$('#delete-itinerary').hide();
	if (itineraries.length > 0) {
		$('#itinerary-dropdown').html("");
		for (var i = 0; i < itineraries.length; i++) {
			$('#itinerary-dropdown').append("<li><a id=\"saveditinerary" + i + "\" onclick=\"reloadItinerary(" + i + ")\">"+ itineraries[i].name + "</a></li>");
		}
	}
	$(document).scrollTop( $("#header").height() +  $("#map-canvas").height());

}

function mapButton(index) {
	var venue = results[index];
	var added = false;
	if (venue == undefined) {
		added = true;
	} else {
		for (var i = 0; i < itinerary.length; i++) {
			if (venue.name == itinerary[i].name) {
				if (venue.location == itinerary[i].location) {
					added = true;
				}
			}
		}
	}
	if(!added) {
		for (var i = 0; i < infowindows.length; i++) {
			infowindows[i].close();
		}
		itinerary.push(results[index]);
		itineraryInfo.push(infowindows[index]);

		$('#itinerary').append("<a href=\"#\" class=\"list-group-item\" id=\"itinerary" + (itinerary.length - 1) + "\">" + "<div><h4 style=\"display:inline;\">" + results[index].name + "</h4><span class=\"label label-info pull-right\">" + results[index].rating + "</span></div><div><h6 style=\"display:inline;\">" + results[index].location + "</h6><h6 class=\"pull-right\" id=\"hideForRemoveButton" + (itinerary.length - 1) + "\">"  + results[index].hours + "</h6><button style=\"display:none;\" class=\"btn btn-danger btn-xs pull-right\" onclick=\"removeFromItinerary(" + (itinerary.length - 1) + ")\" id=\"removeitinerary" + (itinerary.length - 1) + "\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button></div><h6 style=\"margin-top:3px;\">" + results[index].contact + "</h6>" + "</a>");
		
		// Hover functionality on remove button.
		var name = "#itinerary" + (itinerary.length - 1);
		$(name).hover(function(event) {
				showRemoveButton(event);
			}, function(event) {
				hideRemoveButton(event);
			}
		);

		name = "#itinerary" + (itinerary.length - 1);
		$(name).click(function(key) {
			return function() {
				for (var i = 0; i < itineraryInfo.length; i++) {
					itineraryInfo[i].close();
				}
				itineraryInfo[key].open(map, itineraryMarkers[key]);
			}
		}(itinerary.length - 1));

		addItinerary(map, results[index], mapSearch[index]);
	} else {
		for (var i = 0; i < infowindows.length; i++) {
			infowindows[i].close();
		}
		for (var i = 0; i < itineraryInfo.length; i++) {
			itineraryInfo[i].close();
		}
	}
}

function refreshItinerary() {
	var new_itinerary = [];
	var new_markers = [];
	var new_infowindows = [];
	var venue = $('#itinerary-panel');
	var i = 0;
	while (venue.next().length) {
		venue = venue.next();
		var id = venue.attr('id');
		var index = id.replace( /^\D+/g, '');
		new_itinerary[i] = itinerary[index];
		new_markers[i] = itineraryMarkers[index];
		new_infowindows[i] = itineraryInfo[index];
		venue.attr("id", "itinerary" + i);
		venue.html("<div><h4 style=\"display:inline;\">" + new_itinerary[i].name + "</h4><span class=\"label label-info pull-right\">" + new_itinerary[i].rating + "</span></div><div><h6 style=\"display:inline;\">" + new_itinerary[i].location + "</h6><h6 class=\"pull-right\" id=\"hideForRemoveButton" + i + "\">"  + new_itinerary[i].hours + "</h6><button style=\"display:none;\" class=\"btn btn-danger btn-xs pull-right\" onclick=\"removeFromItinerary(" + i + ")\" id=\"removeitinerary" + i + "\" type=\"button\"><span class=\"glyphicon glyphicon-remove\"></span></button></div><h6 style=\"margin-top:3px;\">" + new_itinerary[i].contact + "</h6>");
		i++;
	}
	for (var i = 0; i < itineraryMarkers.length; i++) {
		itineraryMarkers[i].setMap(null);
	}
	itinerary = [];
	itineraryMarkers = [];
	itineraryInfo = [];
	for (var i = 0; i < new_itinerary.length; i++) {
		itinerary[i] = new_itinerary[i];
		itineraryMarkers[i] = new_markers[i];
		itineraryInfo[i] = new_infowindows[i];

		google.maps.event.addListener(itineraryMarkers[i], 'click', function(innerKey) {
			return function() {
				for (var i = 0; i < itineraryInfo.length; i++) {
					itineraryInfo[i].close();
				}
				itineraryInfo[innerKey].open(map, itineraryMarkers[innerKey]);
			};
		}(i));

		var name = "#itinerary" + i;
		$(name).click(function(key) {
			return function() {
				for (var i = 0; i < itineraryInfo.length; i++) {
					itineraryInfo[i].close();
				}
				itineraryInfo[key].open(map, itineraryMarkers[key]);
			}
		}(i));
	}
	drawLines(map);
	drawMarkers(map);
	if (itinerary.length == 0) {
		$('#itinerary-panel').show();
		$('#save-itinerary').hide();
		$('#delete-itinerary').hide();
	}
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
	$('#itinerary-title-group').hide();
	$('#name-input').show();
	$('itinerary-name').val(itinerary_name);
}