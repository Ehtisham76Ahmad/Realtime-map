// import React, { useState, useEffect } from "react";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import axios from "axios";

// const MapComponent = () => {
//   const [map, setMap] = useState(null);
//   const [start, setStart] = useState("");
//   const [end, setEnd] = useState("");
//   const [startMarker, setStartMarker] = useState(null);
//   const [endMarker, setEndMarker] = useState(null);

//   useEffect(() => {
//     if (map) return; // ✅ Agar map already initialized hai toh dobara initialize mat karo

//     // 🛠 Pehle existing map ko remove karna zaroori hai
//     const existingMap = L.DomUtil.get("map");
//     if (existingMap) existingMap._leaflet_id = null;

//     const leafletMap = L.map("map").setView([20.5937, 78.9629], 5);
//     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       attribution: "&copy; OpenStreetMap contributors",
//     }).addTo(leafletMap);

//     setMap(leafletMap);
//   }, []);

//   const addMarker = (lat, lng, type) => {
//     if (!map) return;

//     if (type === "start") {
//       if (startMarker) map.removeLayer(startMarker);
//       const newMarker = L.marker([lat, lng]).addTo(map).bindPopup("Start Location").openPopup();
//       setStartMarker(newMarker);
//     } else {
//       if (endMarker) map.removeLayer(endMarker);
//       const newMarker = L.marker([lat, lng]).addTo(map).bindPopup("Destination").openPopup();
//       setEndMarker(newMarker);
//     }
//   };

//   const getLocation = async (type) => {
//     const location = type === "start" ? start : end;
//     if (!location) return;
//     try {
//       const res = await axios.post("http://localhost:5000/geocode", { location });
//       addMarker(res.data.lat, res.data.lon, type);
//       map.setView([res.data.lat, res.data.lon], 13);
//     } catch (error) {
//       alert("Location not found");
//     }
//   };

//   const swapLocations = () => {
//     setStart(end);
//     setEnd(start);
//   };

//   const getCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(position => {
//         const { latitude, longitude } = position.coords;
//         addMarker(latitude, longitude, "start");
//         map.setView([latitude, longitude], 13);
//       }, () => {
//         alert("Geolocation failed");
//       });
//     } else {
//       alert("Geolocation not supported");
//     }
//   };

//   return (
//     <div>
//       <input type="text" value={start} onChange={(e) => setStart(e.target.value)} placeholder="Enter starting location" />
//       <button onClick={() => getLocation("start")}>Set Start</button>
//       <input type="text" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="Enter destination" />
//       <button onClick={() => getLocation("end")}>Set Destination</button>
//       <button onClick={swapLocations}>Swap</button>
//       <button onClick={getCurrentLocation}>Use My Location</button>
//       <div id="map" style={{ height: "500px", width: "100%" }}></div>
//     </div>
//   );
// };

// export default MapComponent;

import React, { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import axios from "axios";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

const MapComponent = () => {
  const [map, setMap] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);

  useEffect(() => {
    if (!map) {
      // 🔄 Purane map instance ko remove karo (agar exist karta ho)
      const existingMap = L.DomUtil.get("map");
      if (existingMap) existingMap._leaflet_id = null;

      // 🗺️ Map initialize karo
      const leafletMap = L.map("map").setView([20.5937, 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(leafletMap);
      
      setMap(leafletMap);
    }
  }, [map]);

  // 📌 Haversine Formula for Air Distance Calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in km
  };

  const addMarker = (lat, lng, type) => {
    if (!map) return;

    if (type === "start") {
      if (startMarker) map.removeLayer(startMarker);
      const newMarker = L.marker([lat, lng]).addTo(map).bindPopup("Start Location").openPopup();
      setStartMarker(newMarker);
    } else {
      if (endMarker) map.removeLayer(endMarker);
      const newMarker = L.marker([lat, lng]).addTo(map).bindPopup("Destination").openPopup();
      setEndMarker(newMarker);
    }
  };

  // 📌 Location Fetch & Distance Calculation
  const getLocation = async (type) => {
    const location = type === "start" ? start : end;
    if (!location) return;
    try {
      const res = await axios.post("http://localhost:5000/geocode", { location });

      addMarker(res.data.lat, res.data.lon, type);
      map.setView([res.data.lat, res.data.lon], 13);

      // ✅ Distance Calculation (Air Distance)
      if (startMarker && endMarker) {
        const distance = calculateDistance(
          startMarker.getLatLng().lat,
          startMarker.getLatLng().lng,
          endMarker.getLatLng().lat,
          endMarker.getLatLng().lng
        );
        alert(`Distance: ${distance} km`);
      }

      // ✅ Routing (if both markers exist)
      if (startMarker && endMarker) {
        if (routingControl) map.removeControl(routingControl);

        const newRoutingControl = L.Routing.control({
          waypoints: [
            L.latLng(startMarker.getLatLng().lat, startMarker.getLatLng().lng),
            L.latLng(endMarker.getLatLng().lat, endMarker.getLatLng().lng),
          ],
          routeWhileDragging: true,
        }).addTo(map);

        setRoutingControl(newRoutingControl);
      }
      
    } catch (error) {
      alert("Location not found");
    }
  };

  const swapLocations = () => {
    setStart(end);
    setEnd(start);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        addMarker(latitude, longitude, "start");
        map.setView([latitude, longitude], 13);
      }, () => {
        alert("Geolocation failed");
      });
    } else {
      alert("Geolocation not supported");
    }
  };

  return (
    <div>
      <input type="text" value={start} onChange={(e) => setStart(e.target.value)} placeholder="Enter starting location" />
      <button onClick={() => getLocation("start")}>Set Start</button>
      <input type="text" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="Enter destination" />
      <button onClick={() => getLocation("end")}>Set Destination</button>
      <button onClick={swapLocations}>Swap</button>
      <button onClick={getCurrentLocation}>Use My Location</button>
      <div id="map" style={{ height: "500px", width: "100%" }}></div>
    </div>
  );
};

export default MapComponent;
