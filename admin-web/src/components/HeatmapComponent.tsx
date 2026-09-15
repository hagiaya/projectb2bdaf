'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Flame } from 'lucide-react';

export interface DealerPin {
  id: string;
  store_name: string;
  owner_name: string;
  phone_number: string;
  address: string;
  region_name?: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface HeatmapProps {
  dealers: DealerPin[];
  selectedDealerId?: string | null;
  onSelectDealer?: (id: string) => void;
}

interface HeatLayerType extends L.Layer {
  setLatLngs: (latlngs: [number, number, number][]) => this;
}

export default function HeatmapComponent({
  dealers,
  selectedDealerId,
  onSelectDealer,
}: HeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<HeatLayerType | null>(null);
  const markerMapRef = useRef<Record<string, L.Marker>>({});

  const [viewMode, setViewMode] = useState<'both' | 'pins' | 'heat'>('both');

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstance.current) return;

    // Set global L for leaflet.heat
    (window as unknown as { L: typeof L }).L = L;

    // Load leaflet.heat asynchronously
    import('leaflet.heat').catch((e) => {
      console.warn('Leaflet heat load error:', e);
    });

    // Default center on Indonesia
    const map = L.map(mapRef.current, {
      center: [-2.5489, 118.0149],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Markers & Heatmap when dealers or viewMode changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // 1. Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }
    markerMapRef.current = {};

    // 2. Clear existing heatLayer
    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!dealers || dealers.length === 0) return;

    // Heat points array [lat, lng, intensity]
    const heatPoints: [number, number, number][] = dealers.map((d) => [
      d.latitude,
      d.longitude,
      0.8,
    ]);

    // 3. Add Heat Layer if enabled
    const LWithHeat = L as unknown as { heatLayer?: (points: [number, number, number][], options: Record<string, unknown>) => HeatLayerType };
    if ((viewMode === 'both' || viewMode === 'heat') && typeof LWithHeat.heatLayer === 'function') {
      try {
        const heat = LWithHeat.heatLayer(heatPoints, {
          radius: 35,
          blur: 20,
          maxZoom: 14,
          max: 1.0,
          gradient: {
            0.2: '#10b981',
            0.4: '#3b82f6',
            0.6: '#f59e0b',
            0.9: '#ef4444',
          },
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      } catch (err) {
        console.error('Failed to create heat layer:', err);
      }
    }

    // 4. Add Pin Markers if enabled
    const markerList: L.Marker[] = [];

    if (viewMode === 'both' || viewMode === 'pins') {
      dealers.forEach((dealer) => {
        // Custom Styled Pin HTML
        const customIcon = L.divIcon({
          className: 'dealer-custom-marker',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <!-- Pulsing Ring -->
              <div style="position: absolute; top: 0; width: 34px; height: 34px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              
              <!-- Pin Circle -->
              <div style="position: relative; width: 34px; height: 34px; background: #059669; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                  <path d="M2 7h20"/>
                </svg>
              </div>

              <!-- Pin Pointer Tip -->
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #059669; margin-top: -2px;"></div>

              <!-- Store Label Badge -->
              <div style="margin-top: 4px; background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis; border: 1px solid rgba(255,255,255,0.2);">
                ${dealer.store_name}
              </div>
            </div>
          `,
          iconSize: [140, 60],
          iconAnchor: [70, 36],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([dealer.latitude, dealer.longitude], {
          icon: customIcon,
          title: dealer.store_name,
        });

        // Popup Content
        const waLink = dealer.phone_number
          ? `https://wa.me/${dealer.phone_number.replace(/^0/, '62').replace(/[^0-9]/g, '')}`
          : null;
        const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${dealer.latitude},${dealer.longitude}`;

        const popupContent = `
          <div style="font-family: inherit; min-width: 240px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; background: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 6px;">
                Dealer Resmi
              </span>
              <span style="font-size: 11px; color: #64748b; font-weight: 600;">
                ${dealer.region_name || 'Nasional'}
              </span>
            </div>
            
            <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">
              ${dealer.store_name}
            </h3>

            <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
              <strong>Pemilik:</strong> ${dealer.owner_name || '-'}
            </div>

            <div style="font-size: 12px; color: #475569; margin-bottom: 8px; line-height: 1.4;">
              <strong>Alamat:</strong> ${dealer.address || '-'}
            </div>

            <div style="font-size: 11px; color: #64748b; margin-bottom: 12px; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong>GPS:</strong> ${dealer.latitude.toFixed(6)}, ${dealer.longitude.toFixed(6)}
            </div>

            <div style="display: flex; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
              ${
                waLink
                  ? `<a href="${waLink}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #25D366; color: white; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;">
                      WhatsApp
                    </a>`
                  : ''
              }
              <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #3b82f6; color: white; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;">
                Google Maps
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 320 });

        marker.on('click', () => {
          if (onSelectDealer) onSelectDealer(dealer.id);
        });

        if (markersLayerRef.current) {
          markersLayerRef.current.addLayer(marker);
        }

        markerList.push(marker);
        markerMapRef.current[dealer.id] = marker;
      });
    }

    // 5. Automatically fit bounds to all markers
    if (markerList.length > 0) {
      const group = L.featureGroup(markerList);
      map.fitBounds(group.getBounds().pad(0.2), {
        maxZoom: 13,
      });
    }
  }, [dealers, viewMode, onSelectDealer]);

  // Handle external selection (pan & open popup)
  useEffect(() => {
    if (!selectedDealerId || !mapInstance.current) return;
    const marker = markerMapRef.current[selectedDealerId];
    if (marker) {
      mapInstance.current.flyTo(marker.getLatLng(), 15, { duration: 1.2 });
      marker.openPopup();
    }
  }, [selectedDealerId]);

  const handleFitAll = () => {
    if (!mapInstance.current || !dealers || dealers.length === 0) return;
    const group = L.featureGroup(Object.values(markerMapRef.current));
    if (group.getLayers().length > 0) {
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }
  };

  const handleFocusRegion = (lat: number, lng: number, zoom: number) => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([lat, lng], zoom, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {/* MAP CONTROLS OVERLAY */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 bg-white/95 backdrop-blur-sm p-2 rounded-xl border border-slate-200 shadow-lg">
        {/* Layer Mode Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-700">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'both' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Layers size={14} /> Pin & Panas
          </button>
          <button
            onClick={() => setViewMode('pins')}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'pins' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            <MapPin size={14} /> Hanya Pin
          </button>
          <button
            onClick={() => setViewMode('heat')}
            className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              viewMode === 'heat' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'hover:text-slate-900'
            }`}
          >
            <Flame size={14} /> Hanya Panas
          </button>
        </div>

        {/* Quick Focus Shortcuts */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 justify-between pt-1 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Fokus:</span>
          <button
            onClick={handleFitAll}
            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md transition-colors"
          >
            Semua ({dealers.length})
          </button>
          <button
            onClick={() => handleFocusRegion(-6.2088, 106.8456, 11)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            Jakarta/Jawa
          </button>
          <button
            onClick={() => handleFocusRegion(-4.5578, 136.8815, 12)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            Papua (Timika)
          </button>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
}
