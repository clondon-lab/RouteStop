import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fmtPrice } from '../utils/format';

// Fix default leaflet icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(emoji, color, size = 32) {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.45}px;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "><div style="transform:rotate(45deg)">${emoji}</div></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS = {
  origin: makeIcon('📍', '#22C55E'),
  dest: makeIcon('🏁', '#0F172A'),
  gas: makeIcon('⛽', '#22C55E'),
  food: makeIcon('🍽️', '#F97316'),
  hotel: makeIcon('🏨', '#A855F7'),
  gasAlt: makeIcon('⛽', '#4ADE80', 26),
};

function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords.map(([lng, lat]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

function PanTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo([center.lat, center.lng], { animate: true });
  }, [center, map]);
  return null;
}

export default function MapView({ plan, origin, destination, focusedStop }) {
  const routeCoords = plan?.route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]);

  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height: '100%', width: '100%' }}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      {/* Route polyline */}
      {routeCoords && (
        <>
          <Polyline positions={routeCoords} color="#22C55E" weight={4} opacity={0.9} />
          <FitBounds coords={plan.route.geometry.coordinates} />
        </>
      )}

      {/* Origin / Destination markers */}
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={ICONS.origin}>
          <Popup>
            <b>Start</b>
            <br />{origin.name?.split(',')[0]}
          </Popup>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={ICONS.dest}>
          <Popup>
            <b>Destination</b>
            <br />{destination.name?.split(',')[0]}
          </Popup>
        </Marker>
      )}

      {/* Gas stop zone circles + markers */}
      {plan?.gasStops?.map((gs, i) => (
        gs.selected && (
          <React.Fragment key={`gas-${i}`}>
            <Circle
              center={[gs.center.lat, gs.center.lng]}
              radius={gs.radiusUsed * 1609.34}
              pathOptions={{ color: '#22C55E', fillColor: '#22C55E', fillOpacity: 0.06, weight: 1 }}
            />
            <Marker position={[gs.selected.lat, gs.selected.lng]} icon={ICONS.gas}>
              <Popup>
                <b>{gs.selected.name || gs.selected.brand || 'Gas Station'}</b>
                {gs.selected.price && <><br />{fmtPrice(gs.selected.price)}/gal</>}
                <br />Stop {i + 1} — {Math.round(gs.distanceAlongRoute)} mi from start
              </Popup>
            </Marker>
            {gs.stations.slice(1, 4).map((s, j) => (
              <Marker key={`gas-alt-${i}-${j}`} position={[s.lat, s.lng]} icon={ICONS.gasAlt} opacity={0.5}>
                <Popup>
                  <b>{s.name || s.brand || 'Station'}</b>
                  {s.price && <><br />{fmtPrice(s.price)}/gal</>}
                  {s.detour > 0.05 && <><br />+{s.detour.toFixed(1)} mi detour</>}
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        )
      ))}

      {/* Food stops */}
      {plan?.foodStops?.map((fs, i) => (
        fs.selected && (
          <Marker key={`food-${i}`} position={[fs.selected.lat, fs.selected.lng]} icon={ICONS.food}>
            <Popup>
              <b>{fs.selected.name || 'Restaurant'}</b>
              {fs.selected.cuisine && <><br />{fs.selected.cuisine.replace(/_/g, ' ')}</>}
            </Popup>
          </Marker>
        )
      ))}

      {/* Hotel stops */}
      {plan?.hotelStops?.map((hs, i) => (
        hs.selected && (
          <Marker key={`hotel-${i}`} position={[hs.selected.lat, hs.selected.lng]} icon={ICONS.hotel}>
            <Popup>
              <b>{hs.selected.name || 'Hotel'}</b>
              {hs.selected.stars && <><br />{'★'.repeat(parseInt(hs.selected.stars))}</>}
            </Popup>
          </Marker>
        )
      ))}

      {/* Pan to focused stop */}
      {focusedStop?.selected && (
        <PanTo center={{ lat: focusedStop.selected.lat, lng: focusedStop.selected.lng }} />
      )}
    </MapContainer>
  );
}
