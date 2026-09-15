'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapPin, 
  Store, 
  RefreshCw, 
  Search, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  Edit3,
  X,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DealerPin } from '@/components/HeatmapComponent';

const Heatmap = dynamic(() => import('@/components/HeatmapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/80 rounded-2xl text-slate-500 font-medium border border-slate-200 gap-3">
      <Loader2 size={32} className="animate-spin text-emerald-600" />
      <span className="text-sm font-semibold">Memuat Peta Sebaran Dealer (OpenStreetMap)...</span>
    </div>
  ),
});

interface DealerItem {
  id: string;
  store_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  owner_name: string;
  phone_number: string;
  region_name: string;
  hasGps: boolean;
}

interface RawDealerQuery {
  id: string;
  store_name: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  status: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    role: string | null;
    approval_status: string | null;
    lat: number | string | null;
    lng: number | string | null;
    address: string | null;
  } | null;
  regions: {
    id: string;
    name: string | null;
  } | null;
}

export default function CustomersMapPage() {
  const [dealers, setDealers] = useState<DealerItem[]>([]);
  const [mappedPins, setMappedPins] = useState<DealerPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Semua');

  // Modal Update Koordinat
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<DealerItem | null>(null);
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const [isSavingGps, setIsSavingGps] = useState(false);

  const parseDealerData = (data: RawDealerQuery[]) => {
    const formattedList: DealerItem[] = [];
    const pinsList: DealerPin[] = [];

    data.forEach((item) => {
      let lat: number | null = null;
      let lng: number | null = null;

      if (item.latitude !== null && item.latitude !== undefined && item.latitude !== '') {
        lat = parseFloat(String(item.latitude));
      } else if (item.profiles?.lat !== null && item.profiles?.lat !== undefined) {
        lat = parseFloat(String(item.profiles.lat));
      }

      if (item.longitude !== null && item.longitude !== undefined && item.longitude !== '') {
        lng = parseFloat(String(item.longitude));
      } else if (item.profiles?.lng !== null && item.profiles?.lng !== undefined) {
        lng = parseFloat(String(item.profiles.lng));
      }

      const hasValidGps = 
        lat !== null && 
        lng !== null && 
        !isNaN(lat) && 
        !isNaN(lng) && 
        (lat !== 0 || lng !== 0);

      const dealerObj: DealerItem = {
        id: item.id,
        store_name: item.store_name || 'Toko Tanpa Nama',
        address: item.address || item.profiles?.address || 'Alamat belum diatur',
        latitude: hasValidGps ? lat : null,
        longitude: hasValidGps ? lng : null,
        status: item.status || 'ACTIVE',
        owner_name: item.profiles?.full_name || '-',
        phone_number: item.profiles?.phone_number || '',
        region_name: item.regions?.name || 'Nasional',
        hasGps: hasValidGps,
      };

      formattedList.push(dealerObj);

      if (hasValidGps && lat !== null && lng !== null) {
        pinsList.push({
          id: item.id,
          store_name: dealerObj.store_name,
          owner_name: dealerObj.owner_name,
          phone_number: dealerObj.phone_number,
          address: dealerObj.address,
          region_name: dealerObj.region_name,
          status: dealerObj.status,
          latitude: lat,
          longitude: lng,
        });
      }
    });

    return { formattedList, pinsList };
  };

  const fetchDealers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select(`
          id,
          store_name,
          address,
          latitude,
          longitude,
          status,
          profiles!inner (
            id,
            full_name,
            phone_number,
            role,
            approval_status,
            lat,
            lng,
            address
          ),
          regions (
            id,
            name
          )
        `)
        .eq('profiles.role', 'DEALER')
        .order('store_name', { ascending: true });

      if (error) {
        console.error('Error fetching dealers for map:', error);
        return;
      }

      if (data) {
        const { formattedList, pinsList } = parseDealerData(data as unknown as RawDealerQuery[]);
        setDealers(formattedList);
        setMappedPins(pinsList);
      }
    } catch (err) {
      console.error('Fatal fetch map error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      try {
        const { data, error } = await supabase
          .from('dealers')
          .select(`
            id,
            store_name,
            address,
            latitude,
            longitude,
            status,
            profiles!inner (
              id,
              full_name,
              phone_number,
              role,
              approval_status,
              lat,
              lng,
              address
            ),
            regions (
              id,
              name
            )
          `)
          .eq('profiles.role', 'DEALER')
          .order('store_name', { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error('Error on initial dealer map load:', error);
          return;
        }

        if (data) {
          const { formattedList, pinsList } = parseDealerData(data as unknown as RawDealerQuery[]);
          setDealers(formattedList);
          setMappedPins(pinsList);
        }
      } catch (err) {
        console.error('Fatal initial load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEditGps = (dealer: DealerItem) => {
    setEditingDealer(dealer);
    setInputLat(dealer.latitude !== null ? String(dealer.latitude) : '');
    setInputLng(dealer.longitude !== null ? String(dealer.longitude) : '');
    setIsEditModalOpen(true);
  };

  const handleSaveGps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealer) return;

    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Koordinat Latitude dan Longitude harus berupa angka desimal yang valid.');
      return;
    }

    setIsSavingGps(true);
    try {
      const { error } = await supabase
        .from('dealers')
        .update({ latitude: lat, longitude: lng })
        .eq('id', editingDealer.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditingDealer(null);
      await fetchDealers();
      setSelectedDealerId(editingDealer.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal memperbarui koordinat: ' + msg);
    } finally {
      setIsSavingGps(false);
    }
  };

  // Filtered dealers for the list
  const filteredDealers = dealers.filter((d) => {
    const matchesSearch =
      d.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion =
      selectedRegion === 'Semua' || d.region_name === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  const registeredCount = dealers.length;
  const mappedCount = dealers.filter((d) => d.hasGps).length;
  const unmappedCount = registeredCount - mappedCount;

  // Extract unique regions for filter
  const regionOptions = Array.from(
    new Set(dealers.map((d) => d.region_name).filter(Boolean))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm">
              <MapPin size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Peta Sebaran Pelanggan (Dealer)
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Visualisasi titik lokasi toko dealer terdaftar menggunakan OpenStreetMap berbasis data riil Supabase.
          </p>
        </div>
        <button
          onClick={fetchDealers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 shadow-sm transition-all text-sm cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin text-emerald-600' : ''} />
          <span>Refresh Lokasi</span>
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Dealer Terdaftar
            </p>
            <p className="text-2xl font-black text-slate-900">{registeredCount} Toko</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <ShieldCheck size={14} className="text-emerald-600" /> Khusus akun Role DEALER
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Store size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              Titik GPS Terverifikasi
            </p>
            <p className="text-2xl font-black text-emerald-700">{mappedCount} Toko</p>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">
              Tampil aktif pada pin peta
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <MapPin size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              Belum Ada Koordinat GPS
            </p>
            <p className="text-2xl font-black text-amber-700">{unmappedCount} Toko</p>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              Dapat diinput melalui tombol Edit GPS
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* MAP & DEALER LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP CONTAINER (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 h-[68vh] flex flex-col">
          <Heatmap
            dealers={mappedPins}
            selectedDealerId={selectedDealerId}
            onSelectDealer={(id) => setSelectedDealerId(id)}
          />
        </div>

        {/* DEALER LIST SIDEBAR (1 COL) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 h-[68vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store size={18} className="text-emerald-600" />
              Daftar Dealer ({filteredDealers.length})
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
              Hanya Dealer
            </span>
          </div>

          {/* Search & Region Filter */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cari toko atau pemilik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            {regionOptions.length > 0 && (
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none font-medium"
              >
                <option value="Semua">Semua Wilayah</option>
                {regionOptions.map((reg) => (
                  <option key={reg} value={reg}>
                    Wilayah: {reg}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scrollable Dealer List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Memuat daftar dealer...</div>
            ) : filteredDealers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data dealer ditemukan.
              </div>
            ) : (
              filteredDealers.map((dealer) => {
                const isSelected = selectedDealerId === dealer.id;
                return (
                  <div
                    key={dealer.id}
                    onClick={() => {
                      if (dealer.hasGps) {
                        setSelectedDealerId(dealer.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {dealer.store_name}
                      </h4>
                      {dealer.hasGps ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={11} /> GPS Aktif
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                          <AlertCircle size={11} /> Tanpa GPS
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium mb-1">
                      Pemilik: <span className="text-slate-800">{dealer.owner_name}</span>
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                      {dealer.address}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      {dealer.hasGps ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDealerId(dealer.id);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Navigation size={13} /> Fokus di Peta
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Koordinat kosong</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditGps(dealer);
                        }}
                        className="text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                      >
                        <Edit3 size={12} /> {dealer.hasGps ? 'Ubah GPS' : 'Set GPS'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL UPDATE KOORDINAT GPS */}
      {isEditModalOpen && editingDealer && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Atur Koordinat GPS Dealer</h3>
                <p className="text-xs text-slate-500 font-medium">{editingDealer.store_name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGps} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  LATITUDE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: -6.2088 atau -4.5578"
                  value={inputLat}
                  onChange={(e) => setInputLat(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  LONGITUDE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: 106.8456 atau 136.8815"
                  value={inputLng}
                  onChange={(e) => setInputLng(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/60 leading-relaxed">
                💡 <strong>Tips:</strong> Buka lokasi toko di Google Maps, klik kanan pada titik lokasi, lalu salin angka Latitude dan Longitude.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingGps}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingGps}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingGps ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Titik GPS</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
