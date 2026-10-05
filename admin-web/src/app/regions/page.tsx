'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Map, Navigation, CheckCircle2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Region {
  id: string;
  code: string;
  name: string;
  city_name?: string;
  district_name?: string;
  manager_name: string;
  status: string;
  created_at?: string;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionType, setRegionType] = useState<'SALES' | 'SPV'>('SALES');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newManager, setNewManager] = useState('');
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // API Data
  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');

  useEffect(() => {
    fetchData();
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
      const data = await res.json();
      setProvinces(data);
    } catch (err) {
      console.error('Failed to fetch provinces', err);
    }
  };

  const fetchCities = async (provinceId: string) => {
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
      const data = await res.json();
      setCities(data);
    } catch (err) {
      console.error('Failed to fetch cities', err);
    }
  };

  // Handle province change
  const handleProvinceChange = (provinceId: string, provinceName: string) => {
    setSelectedProvinceId(provinceId);
    setNewName(provinceName); // 'name' acts as province
    setNewCityName(''); // reset city
    if (provinceId) {
      fetchCities(provinceId);
    } else {
      setCities([]);
    }
  };


  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('name', { ascending: true });
      
    if (!error && data) {
      setRegions(data as any);
    }
    setIsLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingRegion(null);
    setRegionType('SALES');
    setNewCode('');
    setNewName('');
    setNewCityName('');
    setNewDistrictName('');
    setNewManager('');
    setNewStatus('ACTIVE');
    setErrorMessage(null);
    setSelectedProvinceId('');
    setCities([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (region: Region) => {
    setEditingRegion(region);
    setRegionType(region.city_name ? 'SALES' : 'SPV');
    setNewCode(region.code);
    setNewName(region.name);
    setNewCityName(region.city_name || '');
    setNewDistrictName(region.district_name || '');
    setNewManager(region.manager_name || '');
    setNewStatus(region.status || 'ACTIVE');
    setErrorMessage(null);
    
    // Find province ID by name to load cities
    const prov = provinces.find(p => p.name === region.name);
    if (prov) {
      setSelectedProvinceId(prov.id);
      fetchCities(prov.id);
    } else {
      setSelectedProvinceId('');
      setCities([]);
    }
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRegion(null);
    setErrorMessage(null);
  };

  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      city_name: newCityName.trim() || null,
      district_name: newDistrictName.trim() || null,
      manager_name: newManager.trim() || null,
      status: newStatus,
    };

    try {
      if (editingRegion) {
        // Update existing region
        const { data, error } = await supabase
          .from('regions')
          .update(payload)
          .eq('id', editingRegion.id)
          .select('*');

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setRegions(regions.map(r => (r.id === editingRegion.id ? (data[0] as Region) : r)));
          handleCloseModal();
        }
      } else {
        // Insert new region
        const { data, error } = await supabase
          .from('regions')
          .insert([payload])
          .select('*');

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setRegions([data[0] as Region, ...regions]);
          handleCloseModal();
        }
      }
    } catch (err: any) {
      console.error('Error saving region:', err);
      let msg = err.message || 'Gagal menyimpan wilayah.';
      if (err.code === '42501' || msg.includes('row-level security')) {
        msg = 'Akses ditolak oleh RLS Supabase (Kode 42501). Harap jalankan file migrasi "fix_regions_rls.sql" di menu SQL Editor Supabase.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRegion = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus wilayah "${name}"?`)) {
      const { error } = await supabase.from('regions').delete().eq('id', id);
      if (!error) {
        setRegions(regions.filter(r => r.id !== id));
      } else {
        if (error.code === '42501' || error.message.includes('row-level security')) {
          alert('Gagal menghapus wilayah: Akses ditolak oleh RLS Supabase. Harap jalankan "fix_regions_rls.sql" di Supabase SQL Editor.');
        } else {
          alert(`Gagal menghapus wilayah: ${error.message}. Data mungkin sedang digunakan oleh toko/dealer.`);
        }
      }
    }
  };

  const filteredRegions = regions.filter((r) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.manager_name && r.manager_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <Map size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Wilayah</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Kelola area operasional, regional manager, dan penugasan distribusi wilayah.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Wilayah
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari wilayah (Nama, Kode, Regional Manager)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
        </div>
        
        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">Kode</th>
              <th className="p-5 font-semibold border-b border-gray-100">Provinsi</th>
              <th className="p-5 font-semibold border-b border-gray-100">Kota / Kabupaten</th>
              <th className="p-5 font-semibold border-b border-gray-100">Regional Manager</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin text-emerald-600" />
                    <span>Memuat data dari Supabase...</span>
                  </div>
                </td>
              </tr>
            ) : filteredRegions.length === 0 ? (
               <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                  {searchQuery ? 'Tidak ada wilayah yang cocok dengan pencarian.' : 'Belum ada wilayah ditemukan. Klik tombol "+ Tambah Wilayah" di atas.'}
                </td>
              </tr>
            ) : filteredRegions.map((region) => (
              <tr key={region.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5 font-bold text-slate-500">{region.code}</td>
                <td className="p-5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Navigation size={16} className="text-emerald-500" />
                    {region.name}
                  </div>
                </td>
                <td className="p-5 font-medium text-slate-700">{region.city_name || '-'}</td>
                <td className="p-5 font-medium text-slate-700">{region.manager_name || '-'}</td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${region.status === 'ACTIVE' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100/80 text-slate-600 border border-slate-200'}`}>
                    {region.status === 'ACTIVE' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {region.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenEdit(region)}
                      title="Edit Wilayah"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleDeleteRegion(region.id, region.name)} 
                      title="Hapus Wilayah"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRegion ? 'Edit Wilayah' : 'Tambah Wilayah Baru'}
              </h2>
              <button 
                onClick={handleCloseModal} 
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSaveRegion} className="p-6 space-y-5">
              {errorMessage && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs leading-relaxed font-medium">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                    TIPE WILAYAH
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setRegionType('SALES');
                        setNewName('');
                        setNewCityName('');
                        setSelectedProvinceId('');
                      }}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        regionType === 'SALES' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Untuk Sales (Provinsi & Kota)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegionType('SPV');
                        setNewName('');
                        setNewCityName('');
                        setSelectedProvinceId('');
                      }}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        regionType === 'SPV' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Untuk SPV (Area Bebas)
                    </button>
                  </div>
                </div>

                {regionType === 'SALES' ? (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                        PROVINSI <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedProvinceId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = e.target.options[e.target.selectedIndex].text;
                          handleProvinceChange(id, id ? name : '');
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium bg-white"
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {provinces.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                        KOTA / KABUPATEN <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                        disabled={!selectedProvinceId}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium bg-white disabled:bg-gray-100"
                      >
                        <option value="">-- Pilih Kota/Kabupaten --</option>
                        {cities.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                      NAMA AREA SPV <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Jabodetabek, Jawa Barat, Area Timur"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                    KODE WILAYAH <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="misal: JKT, BDG, SBY"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                    REGIONAL MANAGER
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nama manager penanggung jawab"
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">
                    STATUS WILAYAH
                  </label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium bg-white"
                  >
                    <option value="ACTIVE">Aktif (Bisa dipilih dealer/sales)</option>
                    <option value="INACTIVE">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} strokeWidth={2.5} />
                      <span>{editingRegion ? 'Simpan Perubahan' : 'Simpan Wilayah'}</span>
                    </>
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
