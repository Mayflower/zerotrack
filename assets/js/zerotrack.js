sjcl.random.startCollectors();

var Zerotrack;

Zerotrack = (function(){
  function Zerotrack(map) {
    this.group = window.location.pathname.substring(1);
    this.username = Math.random().toString(36).substring(7);
    this.socket = new WebSocket('ws://' + window.location.hostname + ':9393/' + this.group);
    this.markers = {};
    this.map = map;

    this.socket.onmessage = function(e) { this.processMessage(e); }.bind(this);
    this.socket.onerror = function(e) { console.error('Error: ' + e); };
    this.socket.onclose = function(e) { console.error('Connection closed'); };

    if (this.groupKey() == "") {
      window.location.href = "#" + Math.random().toString(36).substring(7);
    };
  };


  Zerotrack.prototype.processMessage = function(event) {
    var msg = JSON.parse(this.decrypt(this.groupKey(), event.data));
    console.log(msg);

    if (msg.user == this.username) {
      console.log("received update from self");
    } else {
      this.setMarker(msg);
    }
  };

  Zerotrack.prototype.sendMessage = function(msg) {
    this.socket.send(this.encrypt(this.groupKey(), JSON.stringify(msg)));
  };

  Zerotrack.prototype.setMarker = function(data) {
    if (typeof(this.markers[data.user]) === 'undefined') {
      marker = new L.marker([data.lat, data.lon], 100).addTo(this.map);
      marker.bindPopup("<strong>" + data.user + "</strong>");
      this.markers[data.user] = marker;
      $("#feature-list tbody").append('<tr class="feature-row" id="' + data.user + '" lat="' + data.lat + '" lng="' + data.lon + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/theater.png"></td><td class="feature-name">' + data.user + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>')
    } else {
      this.markers[data.user].setLatLng([data.lat, data.lon]).update();
    }
  }

  Zerotrack.prototype.sendLocation = function(event) {
    navigator.geolocation.getCurrentPosition(
      function success(event) {
        this.sendMessage({'user': this.username, 'lat': event.coords.latitude, 'lon': event.coords.longitude, 'acc': event.coords.accuracy});
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
    // if (key.charAt(key.length-1)!=='=') key+='=';

    return key;
  };

  return Zerotrack;
})();

var zerotrack = new Zerotrack(map);
