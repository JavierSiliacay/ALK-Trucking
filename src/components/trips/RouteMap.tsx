"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper component to auto-fit bounds
function ChangeView({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [bounds, map]);
  return null;
}

interface RouteMapProps {
  routeGeometry?: [number, number][]; // Array of [lat, lon]
}

export default function RouteMap({ routeGeometry }: RouteMapProps) {
  // Default center (CDO approx)
  const defaultCenter: [number, number] = [8.4772, 124.6459];

  // Custom HTML Markers using Leaflet divIcon
  const originIcon = useMemo(() => {
    return L.divIcon({
      html: `<div style="background-color: #22c55e; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }, []);

  const destIcon = useMemo(() => {
    return L.divIcon({
      html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }, []);

  const hasRoute = routeGeometry && routeGeometry.length > 0;
  const originCoord = hasRoute ? routeGeometry[0] : null;
  const destCoord = hasRoute ? routeGeometry[routeGeometry.length - 1] : null;

  return (
    <div className="w-full h-full rounded border border-gray-300 relative overflow-hidden" style={{ zIndex: 10 }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={7} 
        style={{ width: "100%", height: "100%", background: "#f8fafc" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {hasRoute && (
          <>
            {/* Outer Glow / Border Polyline */}
            <Polyline positions={routeGeometry} color="#60a5fa" weight={8} opacity={0.6} />
            {/* Inner Core Polyline */}
            <Polyline positions={routeGeometry} color="#1d4ed8" weight={4} opacity={1} />
            
            {/* Origin & Destination Markers */}
            {originCoord && <Marker position={originCoord} icon={originIcon} />}
            {destCoord && <Marker position={destCoord} icon={destIcon} />}
            
            <ChangeView bounds={routeGeometry} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
