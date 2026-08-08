'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Tag, Calendar, CheckCircle2, XCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Promo {
  id: string;
  code: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: string;
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPromos(data as any);
    }
    setIsLoading(false);
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount || !newStart || !newEnd) return;

    const newPromo = {
      code: newCode,
      description: newDesc,
      discount_percentage: parseFloat(newDiscount),
      start_date: new Date(newStart).toISOString(),
      end_date: new Date(newEnd).toISOString(),
      status: 'ACTIVE'
    };

    const { data, error } = await supabase.from('promos').insert([newPromo]).select('*');

    if (!error && data) {
      setPromos([data[0] as any, ...promos]);
      setIsModalOpen(false);
      setNewCode(''); setNewDesc(''); setNewDiscount(''); setNewStart(''); setNewEnd('');
    } else {
      alert("Gagal menambahkan promo.");
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (confirm("Hapus promo ini?")) {
      const { error } = await supabase.from('promos').delete().eq('id', id);
      if (!error) {
        setPromos(promos.filter(p => p.id !== id));
      }
    }
  };

  const filteredPromos = promos.filter((p) => 
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Tag size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Promo</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Kelola kode diskon dan periode promosi terhubung ke Supabase.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Buat Promo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Kode Promo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">Kode & Diskon</th>
              <th className="p-5 font-semibold border-b border-gray-100">Deskripsi</th>
              <th className="p-5 font-semibold border-b border-gray-100">Periode</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Memuat data promo...</td>
              </tr>
            ) : filteredPromos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Belum ada promo.</td>
              </tr>
            ) : filteredPromos.map((promo) => (
              <tr key={promo.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5">
                  <p className="font-bold text-slate-900 mb-0.5 text-lg">{promo.code}</p>
                  <p className="text-emerald-600 font-bold text-sm">Diskon {promo.discount_percentage}%</p>
                </td>
                <td className="p-5 font-medium text-slate-600 max-w-xs">{promo.description}</td>
                <td className="p-5">
                  <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12}/> Mulai: {new Date(promo.start_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-slate-400"><Calendar size={12}/> Akhir: {new Date(promo.end_date).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${promo.status === 'ACTIVE' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' : 'bg-slate-100/80 text-slate-600 border border-slate-200'}`}>
                    {promo.status === 'ACTIVE' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-slate-400" />}
                    {promo.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button onClick={() => handleDeletePromo(promo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Promo</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddPromo} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">KODE PROMO <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">DISKON (%) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" required value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">DESKRIPSI</label>
                <textarea 
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none"
                  rows={2}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">TANGGAL MULAI <span className="text-red-500">*</span></label>
                  <input 
                    type="date" required value={newStart} onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">TANGGAL AKHIR <span className="text-red-500">*</span></label>
                  <input 
                    type="date" required value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
