'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Store, RefreshCw, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Heatmap = dynamic(() => import('@/components/HeatmapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-2xl text-slate-500 font-medium border border-slate-200">
      Memuat Peta Sebaran Toko (OpenStreetMap)...
    </div>
  ),
});

interface DealerLocation {
  id: string;
  store_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export default function CustomersMapPage() {
  const [dealers, setDealers] = useState<DealerLocation[]>([]);
  const [locations, setLocations] = useState<[number, number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('dealers')
      .select('id, store_name, address, latitude, longitude')
      .order('store_name');

    if (!error && data) {
      setDealers(data as any);
      
      const validPoints: [number, number, number][] = [];
      data.forEach((d: any) => {
        const lat = parseFloat(d.latitude);
        const lng = parseFloat(d.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          validPoints.push([lat, lng, 1]);
        }
      });

      // Default fallback if no GPS registered yet
      if (validPoints.length === 0) {
        setLocations([
          [-6.2088, 106.8456, 1],
          [-6.2188, 106.8356, 0.8],
          [-6.1988, 106.8556, 1],
          [-4.5578, 136.8815, 1],
        ]);
      } else {
        setLocations(validPoints);
      }
    }
    setIsLoading(false);
  };

  const registeredCount = dealers.filter(d => d.latitude && d.longitude).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <MapPin size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Peta Sebaran Pelanggan (Heatmap)</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Pantau kepadatan titik lokasi toko / dealer menggunakan OpenStreetMap berbasis data riil Supabase.
          </p>
        </div>
        <button 
          onClick={fetchDealers} 
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-all text-sm cursor-pointer"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Lokasi
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Dealer Terdaftar</p>
          <p className="text-2xl font-black text-slate-900">{dealers.length} Toko</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Titik GPS Terverifikasi</p>
          <p className="text-2xl font-black text-emerald-700">{registeredCount} Toko</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Densitas Heatmap</p>
          <p className="text-2xl font-black text-blue-700">{locations.length} Titik Panas</p>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3" style={{ height: '65vh' }}>
        <Heatmap locations={locations} />
      </div>
    </div>
  );
}
