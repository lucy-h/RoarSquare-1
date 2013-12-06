$( document ).ready(function() {

// Variables
var query_txt;
var location_text;
var itinerary = {};
var results = [];
var mapSearch = [];

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

// Functions
function parseVenues(venues) {
	var new_results = [];
	for (var i = 0; i < venues.length; i++) {
		var venue = {};
		var new_venue = venues[i]["venue"];
		venue.name = new_venue.name;
		venue.location = new_venue["location"].address;
		venue.lat = new_venue["location"].lat;
		venue.long = new_venue["location"].lng;
		venue.contact = new_venue["contact"].formattedPhone;
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
	}
	$('#search-panel').html("Currently Exploring: " + query_txt);
}

function addToMap(venues) {
	mapSearch = [];
	var myLatlng = new google.maps.LatLng(venues[0].lat,venues[0].long);
	var mapOptions = {
		zoom: 14,
		center: myLatlng
	};
	var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	for (var i = 0; i < venues.length; i++) {
		var newLatlng = new google.maps.LatLng(venues[i].lat,venues[i].long);
		// To add the marker to the map, use the 'map' property
		var marker = new google.maps.Marker({
			position: newLatlng,
			title: venues[i].name
		});
		mapSearch[i] = marker;
		mapSearch[i].setMap(map);
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




});