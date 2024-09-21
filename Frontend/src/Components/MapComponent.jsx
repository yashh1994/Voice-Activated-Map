import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

const MapComponent = ({ position, zoom, markers, route }) => {
  const map = useMap();

  useEffect(() => {
    console.log("get the map info: "+ zoom);
    if (markers.length) {
      const bounds = L.latLngBounds(markers.map(marker => marker.position));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(position, 50);
    }
  }, [position, zoom, markers, map]);

  useEffect(() => {
    if (route) {
      L.Routing.control({
        waypoints: route.map(pos => L.latLng(pos[0], pos[1])),
        lineOptions: {
          styles: [{ color: 'blue', opacity: 0.6, weight: 5 }]
        },
        createMarker: () => null
      }).addTo(map);
    }
  }, [route, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          <Popup>
            <div>
              <strong>{marker.text}</strong><br />
              {marker.details && marker.details.map((detail, i) => (
                <div key={i}>{detail}</div>
              ))}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const MapWrapper = ({ position, zoom, markers, route }) => (
  <MapContainer center={position} zoom={zoom} className="h-full w-full">
    <MapComponent position={position} zoom={zoom} markers={markers} route={route} />
  </MapContainer>
);

export default MapWrapper;
