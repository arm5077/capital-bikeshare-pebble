var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');
var Accel = require('ui/accel');

// Run data fetching function
getData();

function getData(){
  var card = new UI.Card({
    title: 'Capital Bikeshare',
    subtitle: "Getting bikeshare data..."
  });
  
  card.show();
  
  ajax(
    {
      url: "https://api-core.capitalbikeshare.com/gbfs/en/station_information.json",
      type: "json"
    },
    function(info){
      // Got station info 
      ajax(
        {
          url: "https://api-core.capitalbikeshare.com/gbfs/en/station_status.json",
          type: "json"
        },
        function(status){
          // Make array of station ids 
          var station_ids = info.data.stations.map(function(d){ return d.station_id; });
          status.data.stations.forEach(function(station){
            var station_info = info.data.stations[station_ids.indexOf(station.station_id)];
            station.name = station_info.name;
            station.latitude = station_info.lat;
            station.longitude = station_info.lon;
            station.capacity = station_info.capacity;
          });
          
          // Get location
          card.body("Getting your position...");
          navigator.geolocation.getCurrentPosition(function(position){
            var user = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            // Get closest station
            status.data.stations.sort(function(a,b){
              return haversine(user, a) - haversine(user, b);
            });
            
            // Loop through the top 10 stations closest to the user
            var menu_items = [];
            for( i=0; i<=9; i++){
              menu_items.push({
                title: status.data.stations[i].name,
                subtitle: status.data.stations[i].num_bikes_available + " bikes/" + status.data.stations[i].capacity
              })
            }
            
            var resultsMenu = new UI.Menu({
              sections: [{
                title: "Nearest stations:",
                items: menu_items
              }],
              highlightBackgroundColor: "#EC008C",
              highlightColor: "black"
            });
            
            resultsMenu.on('select', function(e){
              var station = status.data.stations[e.itemIndex]
              var stationCard = new UI.Card({
                title: station.name,
                body: "Bikes available: " + station.num_bikes_available
                  + "\nDocks available: " + station.num_docks_available,
                scrollable: true
              })
              stationCard.show();
            })
            
            resultsMenu.show();
            card.hide();
            Vibe.vibrate('short')
            
            // Set watch to refresh list upon shake
            resultsMenu.on('accelTap', function(){
              resultsMenu.hide();
              getData();
            });
            
          }, function(err){
            throw err;
          }, {
            enableHighAccuracy: true
          });
          
          
          
  
          
        }
      );
    },
    function(err){
      throw err;
    }
  );
    
}

// Thanks to Jackson Geller: https://github.com/jaxgeller/node-geo-distance/blob/master/index.js
Number.prototype.toRad = function() { return this * Math.PI / 180; }
function haversine(coord1, coord2) {
  var R = 6371;
  var lat1 = coord1.latitude;
  var lon1 = coord1.longitude;
  var lat2 = coord2.latitude;
  var lon2 = coord2.longitude;

  var dLat = (lat2 - lat1).toRad();
  var dLong = (lon2 - lon1).toRad();

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return (d*1000).toFixed(3);
}
