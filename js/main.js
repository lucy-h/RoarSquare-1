// Variables
var query_txt;
var location_text;
var itinerary = {};
var results = [];
var mapSearch = [];
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
function parseVenues(venues) {
	var new_results = [];
	for (var i = 0; i < venues.length; i++) {
		var venue = {};
		var new_venue = venues[i]["venue"];
		venue.name = new_venue.name;
		venue.location = new_venue["location"].address;
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
	mapSearch = [];
	infowindows = [];
	var myLatlng = new google.maps.LatLng(venues[0].lat,venues[0].long);
	var mapOptions = {
		zoom: 14,
		center: myLatlng
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
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

// Drag functionality.
$(function () {
    $("#itinerary").sortable({
        tolerance: 'pointer',
        revert: 'invalid',
        forceHelperSize: true
    });
});



});

function mapButton(index) {
	for (var i = 0; i < infowindows.length; i++) {
		infowindows[i].close();
	}
	$('#itinerary').append("<a href=\"#\" class=\"list-group-item result" + index + "\">" + "<div><h4 style=\"display:inline;\">" + results[index].name + "</h4><span class=\"label label-info pull-right\">" + results[index].rating + "</span></div><div><h6 style=\"display:inline;\">" + results[index].location + "</h6><h6 class=\"pull-right\">" + results[index].hours + "</h6></div><h6 style=\"margin-top:3px;\">" + results[index].contact + "</h6>" + "</a>");
}