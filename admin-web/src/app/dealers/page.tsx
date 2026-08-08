'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, MapPin, Store, CheckCircle2, XCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Dealer {
  id: string;
  profile_id: string;
  store_name: string;
  address: string;
  credit_limit: number;
  status: string;
  created_at: string;
  profiles?: { full_name: string, approval_status?: string };
  regions?: { name: string };
}

interface Region {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('Semua Wilayah');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newRegionId, setNewRegionId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch regions
    const { data: regData } = await supabase.from('regions').select('id, name');
    if (regData) {
      setRegions(regData);
      if (regData.length > 0) setNewRegionId(regData[0].id);
    }

    // Fetch profiles (dealers only ideally)
    const { data: profData } = await supabase.from('profiles').select('id, full_name').eq('role', 'DEALER');
    if (profData) {
      setProfiles(profData);
      if (profData.length > 0) setNewOwnerId(profData[0].id);
    }

    // Fetch dealers
    const { data: dlrData, error } = await supabase
      .from('dealers')
      .select('*, profiles(full_name, approval_status), regions(name)')
      .order('created_at', { ascending: false });
      
    if (!error && dlrData) {
      setDealers(dlrData as any);
    }
    
    setIsLoading(false);
  };

  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newOwnerId || !newRegionId || !newCreditLimit) return;

    const newDlr = {
      store_name: newStoreName,
      profile_id: newOwnerId,
      region_id: newRegionId,
      address: newAddress,
      credit_limit: parseFloat(newCreditLimit),
      status: 'ACTIVE',
    };

    const { data, error } = await supabase.from('dealers').insert([newDlr]).select('*, profiles(full_name), regions(name)');

    if (!error && data) {
      setDealers([data[0] as any, ...dealers]);
      setIsModalOpen(false);
      setNewStoreName('');
      setNewAddress('');
      setNewCreditLimit('');
    } else {
      alert("Gagal menambahkan dealer.");
    }
  };

  const handleDeleteDealer = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus dealer ini?")) {
      const { error } = await supabase.from('dealers').delete().eq('id', id);
      if (!error) {
        setDealers(dealers.filter(d => d.id !== id));
      } else {
        alert("Gagal menghapus dealer.");
      }
    }
  };

  const handleApproveDealer = async (profileId: string) => {
    if (confirm("Setujui pendaftaran dealer ini?")) {
      await supabase.from('profiles').update({ approval_status: 'APPROVED' }).eq('id', profileId);
      // Optional: also update dealer status if needed
      fetchData();
    }
  };

  const filteredDealers = dealers.filter((d) => {
    const regName = d.regions?.name || '';
    const matchesRegion = selectedRegionFilter === 'Semua Wilayah' || regName === selectedRegionFilter;
    const matchesSearch = d.store_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Store size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Dealer</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Kelola data pelanggan B2B, batas kredit, dan wilayah (terhubung Supabase).</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Dealer
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari dealer (Nama Toko, Pemilik)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select 
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white font-medium text-gray-700 transition-all appearance-none cursor-pointer"
            >
              <option>Semua Wilayah</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">ID / Toko</th>
              <th className="p-5 font-semibold border-b border-gray-100">Pemilik & Wilayah</th>
              <th className="p-5 font-semibold border-b border-gray-100">Batas Kredit</th>
              <th className="p-5 font-semibold border-b border-gray-100">Tgl Bergabung</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Memuat data dari Supabase...</td>
              </tr>
            ) : filteredDealers.length === 0 ? (
               <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Belum ada dealer ditemukan.</td>
              </tr>
            ) : filteredDealers.map((dealer) => (
              <tr key={dealer.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5">
                  <p className="font-bold text-slate-900 mb-0.5">{dealer.store_name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 break-all">{dealer.id}</p>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-1">
                    <Users size={14} className="text-slate-400" /> {dealer.profiles?.full_name || 'Tanpa Pemilik'}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <MapPin size={12} className="text-emerald-500" /> {dealer.regions?.name || 'Belum Diatur'}
                  </div>
                </td>
                <td className="p-5 text-emerald-700 font-bold tracking-tight">
                  Rp {dealer.credit_limit.toLocaleString('id-ID')}
                </td>
                <td className="p-5 text-slate-500 font-medium text-xs">
                  {new Date(dealer.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="p-5">
                  {dealer.profiles?.approval_status === 'PENDING' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100/50 text-amber-700 border border-amber-200/50">
                      <CheckCircle2 size={14} className="text-amber-500" /> Pending Approval
                    </div>
                  ) : dealer.status === 'ACTIVE' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100/50 text-emerald-700 border border-emerald-200/50">
                      <CheckCircle2 size={14} className="text-emerald-500" /> Aktif
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100/80 text-slate-600 border border-slate-200">
                      <XCircle size={14} className="text-slate-400" /> Non-Aktif
                    </div>
                  )}
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {dealer.profiles?.approval_status === 'PENDING' && (
                      <button onClick={() => handleApproveDealer(dealer.profile_id)} className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-200">
                        Setujui
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDeleteDealer(dealer.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-5 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center bg-white">
          <span className="font-medium">Menampilkan <strong className="text-gray-900">{filteredDealers.length}</strong> dealer</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Dealer Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddDealer} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">NAMA TOKO <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">PEMILIK (PROFILE) <span className="text-red-500">*</span></label>
                  <select 
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800"
                  >
                    {profiles.map((prof) => (
                      <option key={prof.id} value={prof.id}>{prof.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">WILAYAH <span className="text-red-500">*</span></label>
                  <select 
                    value={newRegionId}
                    onChange={(e) => setNewRegionId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800"
                  >
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>{reg.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">BATAS KREDIT <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</div>
                  <input 
                    type="number" 
                    required
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">ALAMAT <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  rows={3}
                ></textarea>
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
                  <Plus size={18} strokeWidth={2.5} /> Simpan Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
