sjcl.random.startCollectors();

fromLocalStorage = function(key, fallback) {
  return typeof localStorage.getItem(key) !== "string" ? fallback : localStorage.getItem(key);
};

var Zerotrack = (function(){
  function Zerotrack(map) {
    var username, group, watching;

    // this.username
    this.__defineGetter__('username', function() {
      return username;
    });

    this.__defineSetter__('username', function(val) {
      localStorage.setItem('username', val);
      $('#userdisplay').text(val);

      username = val;
    });

    // this.group
    this.__defineGetter__('group', function() {
      return group;
    });

    this.__defineSetter__('group', function(val) {
      $('#groupdisplay').text(val);
      group = val;
    });

    // this.watching
    this.__defineGetter__('watching', function() {
      return watching;
    });

    this.__defineSetter__('watching', function(val) {
      $("#share-location").toggleClass('btn-danger', val);

      watching = val;
    });

    this.username = fromLocalStorage('username', Math.random().toString(36).substring(7));
    this.group    = window.location.pathname.substring(1);
    this.socket   = new WebSocket('ws://' + window.location.hostname + '/socket/' + this.group);
    this.markers  = {};
    this.timers   = {};
    this.map      = map;
    this.watching = false;
    this.showself = fromLocalStorage('showself', false);

    var el = $('#showself').get(0);
    el.checked = (this.showself === "true") ? true : false;

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

    if (msg.user == this.username && this.showself === "false") {
      console.log("received update from self");
    } else {
      this.setMarker(msg);
    }
  };

  Zerotrack.prototype.sendMessage = function(msg) {
    msg.time = Math.round(Date.now()/1000);
    this.socket.send(this.encrypt(this.groupKey(), JSON.stringify(msg)));
  };

  Zerotrack.prototype.setMarker = function(data) {
    time = (Math.round((Date.now()/1000)) - data.time),
    time = time <= 0 ? 'less than 1' : time;

    if (typeof(this.markers[data.user]) === 'undefined') {
      marker = new L.circle([data.lat, data.lon], data.acc).addTo(this.map);
      marker.bindPopup("<p><strong>" + data.user + "</strong><br />" + data.acc + "</p>");
      this.markers[data.user] = marker;
      user_element = '<tr class="feature-row" id="' + data.user + '" lat="' + data.lat + '" lng="' + data.lon + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/globe.png"></td><td class="feature-name">' + data.user + '&nbsp;&nbsp;<small>' + time +'s ago</small></td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>'
      $("#feature-list tbody").append(user_element);
    } else {
      $('tr.feature-row#' + data.user + ' td.feature-name').html(data.user + '&nbsp;&nbsp;<small>' + time +'s ago</small>');
      this.markers[data.user].setLatLng([data.lat, data.lon]);
      clearTimeout(this.timers[data.user]);
      delete(this.timers[data.user]);
    }

    this.timers[data.user] = setTimeout(function() {
      this.map.removeLayer(this.markers[data.user]);

      tr = $('tr.feature-row#' + data.user);
      tr.fadeOut(400, function(){
        tr.remove();
      });

      delete(this.markers[data.user]);
      delete(this.timers[data.user]);
    }.bind(this), 120 * 1000);
  }

  Zerotrack.prototype.watchPosition = function() {
    this.watching = true;

    watcher = navigator.geolocation.watchPosition(function(pos) {
      this.sendMessage({'user': this.username, 'lat': pos.coords.latitude, 'lon': pos.coords.longitude, 'acc': pos.coords.accuracy});
    }.bind(this));

    this.watcher = watcher;
  };

  Zerotrack.prototype.stopWatching = function() {
    this.watching = false;
    navigator.geolocation.clearWatch(this.watcher);
  };

  Zerotrack.prototype.sendLocation = function(event) {
    navigator.geolocation.getCurrentPosition(
      function success(event) {
        console.log(event);
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
