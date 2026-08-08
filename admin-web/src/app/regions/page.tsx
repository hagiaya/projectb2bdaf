'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Map, Navigation, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Region {
  id: string;
  code: string;
  name: string;
  manager_name: string;
  status: string;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newManager, setNewManager] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setRegions(data as any);
    }
    setIsLoading(false);
  };

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const newReg = {
      code: newCode,
      name: newName,
      manager_name: newManager,
      status: 'ACTIVE',
    };

    const { data, error } = await supabase.from('regions').insert([newReg]).select('*');

    if (!error && data) {
      setRegions([data[0] as any, ...regions]);
      setIsModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewManager('');
    } else {
      alert("Gagal menambahkan wilayah.");
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus wilayah ini?")) {
      const { error } = await supabase.from('regions').delete().eq('id', id);
      if (!error) {
        setRegions(regions.filter(r => r.id !== id));
      } else {
        alert("Gagal menghapus wilayah. Mungkin data ini sudah berelasi.");
      }
    }
  };

  const filteredRegions = regions.filter((r) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Map size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Wilayah</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Kelola area distribusi dan penugasan wilayah (terhubung Supabase).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Wilayah
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari wilayah (Nama, Kode)..." 
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
              <th className="p-5 font-semibold border-b border-gray-100">Nama Wilayah</th>
              <th className="p-5 font-semibold border-b border-gray-100">Regional Manager</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Memuat data dari Supabase...</td>
              </tr>
            ) : filteredRegions.length === 0 ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Belum ada wilayah ditemukan.</td>
              </tr>
            ) : filteredRegions.map((region) => (
              <tr key={region.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5 font-bold text-slate-400">{region.code}</td>
                <td className="p-5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Navigation size={16} className="text-emerald-500" />
                    {region.name}
                  </div>
                </td>
                <td className="p-5 font-medium text-slate-700">{region.manager_name || '-'}</td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${region.status === 'ACTIVE' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100/80 text-slate-600 border border-slate-200'}`}>
                    {region.status === 'ACTIVE' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {region.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDeleteRegion(region.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Wilayah Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddRegion} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">NAMA WILAYAH <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">KODE WILAYAH <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">REGIONAL MANAGER</label>
                  <input 
                    type="text" 
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2"
                >
                  <Plus size={18} strokeWidth={2.5} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
