"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatmapProps {
  locations: [number, number, number][]; // lat, lng, intensity
}

export default function HeatmapComponent({ locations }: HeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current && !mapInstance.current) {
      // Setup global L for leaflet.heat
      (window as any).L = L;
      require('leaflet.heat');

      const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      if ((L as any).heatLayer) {
        (L as any).heatLayer(locations, { 
          radius: 25, 
          blur: 15, 
          maxZoom: 17 
        }).addTo(map);
      }

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [locations]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '12px', zIndex: 0 }} />;
}
