// generate unique user id
var userId = Math.random().toString(16).substring(2, 15);
var map;

var info = $("#infobox");
var doc = $(document);

// custom marker's icon styles
var tinyIcon = L.Icon.extend({
    options: {
        shadowUrl: "../assets/marker-shadow.png",
        iconSize: [25, 39],
        iconAnchor: [12, 36],
        shadowSize: [41, 41],
        shadowAnchor: [12, 38],
        popupAnchor: [0, -30]
    }
});
var redIcon = new tinyIcon({ iconUrl: "../assets/marker-red.png" });
var yellowIcon = new tinyIcon({ iconUrl: "../assets/marker-yellow.png" });

var sentData = {}

var connects = {};
var markers = {};
var active = false;

// check whether browser supports geolocation api
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
} else {
    $(".map").text("Jouw browser ondersteunt geen geolocatie!");
}

function positionSuccess(position) {
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;
    var acr = position.coords.accuracy;

    // mark user's position
    var userMarker = L.marker([lat, lng], {
        icon: redIcon
    });

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    }
    // load leaflet map
    map = new L.map("map", {
        maxZoom: 22,
        minZoom: 5,
        zoom: 17,
        center: [lat, lng]
    });
    // leaflet API key tiler
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 22, maxNativeZoom: 18, detectRetina: true }).addTo(map);
    // set map bounds
    //map.fitWorld();
    if (!disable_marker) {
        userMarker.addTo(map);
        userMarker.bindPopup("Jij bent hier! Jouw ID is " + userId + "").openPopup();
    }
    // send coords on when user is active
    /*setInterval(function() {
        active = true;

        sentData = {
            id: userId,
            active: active,
            coords: [{
                lat: lat,
                lng: lng,
                acr: acr
            }]
        }
        socket.emit("send:coords", sentData);
    }, 500);*/
}

// showing markers for connections
function setMarker(data) {
    console.log(data);
    for (i = 0; i < data.coords.length; i++) {
        var marker = L.marker([data.coords[i].lat, data.coords[i].lng], { icon: yellowIcon }).addTo(map);
        marker.bindPopup(data.id + " is hier!");
        markers[data.id] = marker;
    }
}

// handle geolocation api errors
function positionError(error) {
    var errors = {
        1: "Authorization fails", // permission denied
        2: "Can't detect your location", //position unavailable
        3: "Connection timeout" // timeout
    };
    showError("Error:" + errors[error.code]);
}

function showError(msg) {
    info.addClass("error").text(msg);
}

// delete inactive users every 15 sec
setInterval(function() {
    for (ident in connects) {
        if ($.now() - connects[ident].updated > 15000) {
            delete connects[ident];
            map.removeLayer(markers[ident]);
        }
    }
}, 15000);