'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Tag, Calendar, CheckCircle2, XCircle, X, Percent, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Promo {
  id: string;
  code: string;
  title: string;
  description?: string;
  discount_percent: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  expires_at?: string;
  created_at?: string;
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDiscount, setNewDiscount] = useState('10');
  const [newMinPurchase, setNewMinPurchase] = useState('');
  const [newMaxDiscount, setNewMaxDiscount] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      setPromos(data as Promo[]);
    } else if (error) {
      console.error('Error loading promos:', error);
    }
    setIsLoading(false);
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim() || !newDiscount) {
      alert("Harap lengkapi Judul Promo, Kode Promo, dan Persentase Diskon.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: newTitle.trim(),
        code: newCode.trim().toUpperCase(),
        description: newDesc.trim() || null,
        discount_percent: parseFloat(newDiscount) || 0,
      };

      if (newMinPurchase && Number(newMinPurchase) > 0) {
        payload.min_purchase_amount = parseFloat(newMinPurchase);
      }
      if (newMaxDiscount && Number(newMaxDiscount) > 0) {
        payload.max_discount_amount = parseFloat(newMaxDiscount);
      }
      if (newExpiresAt) {
        payload.expires_at = new Date(newExpiresAt).toISOString();
      }

      const { data, error } = await supabase
        .from('promos')
        .insert([payload])
        .select('*');

      if (error) {
        console.error("Insert promo error:", error);
        alert(`Gagal menambahkan promo: ${error.message}\n\nJika terdapat kendala RLS, jalankan skrip SQL "fix_promos_rls.sql" di Supabase SQL Editor.`);
        return;
      }

      if (data && data.length > 0) {
        setPromos([data[0] as Promo, ...promos]);
        setIsModalOpen(false);
        setNewTitle('');
        setNewCode('');
        setNewDesc('');
        setNewDiscount('10');
        setNewMinPurchase('');
        setNewMaxDiscount('');
        setNewExpiresAt('');
        alert("Kode Promo berhasil ditambahkan!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (!confirm(`Hapus promo "${code}"?`)) return;

    const { error } = await supabase.from('promos').delete().eq('id', id);
    if (!error) {
      setPromos(promos.filter(p => p.id !== id));
    } else {
      alert("Gagal menghapus promo: " + error.message);
    }
  };

  const formatRupiah = (val?: number) => {
    if (!val) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const isPromoActive = (expiresAt?: string) => {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() >= new Date().getTime();
  };

  const filteredPromos = promos.filter((p) => 
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Tag size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Promo & Diskon</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Kelola kode voucher diskon dan periode promosi belanja untuk dealer terhubung ke Supabase.
          </p>
        </div>
        <button 
          onClick={() => {
            // Default expiry date: 30 days from now
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            setNewExpiresAt(nextMonth.toISOString().split('T')[0]);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95 cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} /> Buat Promo Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari kode promo, judul, atau keterangan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="p-5 font-semibold">Kode Voucher</th>
              <th className="p-5 font-semibold">Nama Promo & Keterangan</th>
              <th className="p-5 font-semibold">Besar Diskon</th>
              <th className="p-5 font-semibold">Syarat Belanja</th>
              <th className="p-5 font-semibold">Masa Berlaku</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Memuat data promo...</td>
              </tr>
            ) : filteredPromos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400 font-medium">
                  <Tag size={36} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-slate-600">Belum ada promo terdaftar</p>
                  <p className="text-xs text-gray-400 mt-1">Klik tombol &ldquo;Buat Promo Baru&rdquo; untuk membuat kode diskon.</p>
                </td>
              </tr>
            ) : filteredPromos.map((promo) => {
              const active = isPromoActive(promo.expires_at);

              return (
                <tr key={promo.id} className="hover:bg-emerald-50/30 transition-colors group">
                  {/* Kode Voucher */}
                  <td className="p-5">
                    <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm rounded-lg tracking-wider">
                      {promo.code}
                    </span>
                  </td>

                  {/* Judul & Deskripsi */}
                  <td className="p-5 max-w-xs">
                    <p className="font-bold text-slate-900">{promo.title || 'Promo Diskon'}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{promo.description || '-'}</p>
                  </td>

                  {/* Diskon */}
                  <td className="p-5">
                    <div className="flex items-center gap-1 text-emerald-700 font-extrabold text-base">
                      <Percent size={14} strokeWidth={3} />
                      <span>{promo.discount_percent}%</span>
                    </div>
                    {promo.max_discount_amount ? (
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Maks. {formatRupiah(promo.max_discount_amount)}
                      </span>
                    ) : null}
                  </td>

                  {/* Syarat Belanja */}
                  <td className="p-5 text-xs text-slate-600 font-medium">
                    {promo.min_purchase_amount ? (
                      <span>Min. {formatRupiah(promo.min_purchase_amount)}</span>
                    ) : (
                      <span className="text-slate-400">Tanpa Minimum</span>
                    )}
                  </td>

                  {/* Masa Berlaku */}
                  <td className="p-5">
                    {promo.expires_at ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Clock size={13} className="text-slate-400" />
                        <span>{new Date(promo.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Permanen</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      active 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      {active ? 'Aktif' : 'Kadaluarsa'}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => handleDeletePromo(promo.id, promo.code)} 
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Promo"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH PROMO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">Buat Promo Baru</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddPromo} className="p-6 space-y-4 overflow-y-auto">
              {/* Judul Promo */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">
                  Judul / Nama Promo <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Promo Spesial Dealer Baru"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Kode Promo & Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">
                    Kode Promo <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={newCode} 
                    onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    placeholder="HEMAT10"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none uppercase font-extrabold text-emerald-800 tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">
                    Diskon (%) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    required 
                    step="0.5"
                    min="1"
                    max="100"
                    value={newDiscount} 
                    onChange={(e) => setNewDiscount(e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-extrabold text-emerald-700"
                  />
                </div>
              </div>

              {/* Min Belanja & Max Potongan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">
                    Min. Pembelian (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={newMinPurchase} 
                    onChange={(e) => setNewMinPurchase(e.target.value)}
                    placeholder="Opsional (misal: 1000000)"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">
                    Maks. Potongan (Rp)
                  </label>
                  <input 
                    type="number" 
                    value={newMaxDiscount} 
                    onChange={(e) => setNewMaxDiscount(e.target.value)}
                    placeholder="Opsional (misal: 250000)"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Tanggal Kadaluarsa */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">
                  Masa Berlaku Hingga
                </label>
                <input 
                  type="date" 
                  value={newExpiresAt} 
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-800"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase">Deskripsi / Keterangan</label>
                <textarea 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Keterangan syarat atau manfaat promo..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
