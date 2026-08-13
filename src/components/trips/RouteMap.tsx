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

// Floating button to allow users to snap back if they get lost
function RecenterButton({ bounds }: { bounds?: [number, number][] }) {
  const map = useMap();
  
  if (!bounds || bounds.length === 0) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 1 });
      }}
      className="absolute top-3 right-3 z-[1000] bg-white border border-gray-300 rounded-lg shadow-sm p-2 hover:bg-blue-50 hover:text-blue-600 text-slate-500 transition-colors cursor-pointer group"
      title="Recenter Map to Route"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-active:scale-90 transition-transform">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19 12h2"></path>
        <path d="M3 12h2"></path>
        <path d="M12 19v2"></path>
        <path d="M12 3v2"></path>
      </svg>
    </button>
  );
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
            <RecenterButton bounds={routeGeometry} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
