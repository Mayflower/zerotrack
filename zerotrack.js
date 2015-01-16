sjcl.random.startCollectors();


var Zerotrack;

Zerotrack = (function(){
  function Zerotrack() {
    this.group = window.location.pathname.substring(1);
    this.username = Math.random().toString(36).substring(7);
    this.socket = new WebSocket('ws://localhost:9393/' + this.group);
    this.markers = {};
    this.map = L.map('map', { zoomControl: false }).locate({setView: true, maxZoom: 18});

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18,
    }).addTo(this.map);

    L.control.zoom({
      position: 'topright',
    }).addTo(this.map);

    this.socket.onmessage = function(e) { this.processMessage(e); }.bind(this);
    this.socket.onerror = function(e) { console.error('Error: ' + e); };
    this.socket.onclose = function(e) { console.error('Connection closed'); };
  };

  Zerotrack.prototype.processMessage = function(event) {
    var msg = JSON.parse(this.decrypt(this.groupKey(), event.data));
    console.log(msg);
    this.setMarker(msg);
  };

  Zerotrack.prototype.sendMessage = function(msg) {
    this.socket.send(this.encrypt(this.groupKey(), JSON.stringify(msg)));
  };

  Zerotrack.prototype.setMarker = function(data) {
    if (typeof(this.markers[data.user]) === 'undefined') {
      marker = new L.marker([data.lat, data.lon]).addTo(this.map);
      marker.bindPopup("<strong>" + data.user + "</strong>");
      this.markers[data.user] = marker;
    } else {
      this.markers[data.user].setLatLng([data.lat, data.lon]).update();
    }
  }

  Zerotrack.prototype.sendLocation = function(event) {
    navigator.geolocation.getCurrentPosition(
      function success(event) {
        this.sendMessage({'user': this.username, 'lat': event.coords.latitude, 'lon': event.coords.longitude});
      }.bind(this),
      function error(error) {
        alert(error);
      }
    );
  };

  Zerotrack.prototype.encrypt = function(key, message) {
    return sjcl.encrypt(key, message);
  };

  Zerotrack.prototype.decrypt = function(key, data) {
    return sjcl.decrypt(key, data);
  };

  Zerotrack.prototype.groupKey = function() {
    // shamelessly copied from ZeroBin's zerobin.js (pageKey)
    var key = window.location.hash.substring(1);
    i = key.indexOf('='); if (i>-1) { key = key.substring(0,i+1); };
    i = key.indexOf('&'); if (i>-1) { key = key.substring(0,i); };
    if (key.charAt(key.length-1)!=='=') key+='=';

    return key;
  };

  return Zerotrack;
})();

var zerotrack = new Zerotrack();
