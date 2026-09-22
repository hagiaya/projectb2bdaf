'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Trash2, Tag, Calendar, CheckCircle2, XCircle, X, 
  Percent, Clock, AlertCircle, Upload, Image as ImageIcon, Eye, ExternalLink 
} from 'lucide-react';
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
  banner_url?: string | null;
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
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quick banner upload for existing promo
  const [uploadingPromoId, setUploadingPromoId] = useState<string | null>(null);
  const [selectedBannerPreview, setSelectedBannerPreview] = useState<string | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = fileExt.toLowerCase();
    const fileName = `promo-${Date.now()}-${Math.random().toString(36).substring(7)}.${cleanExt}`;
    const filePath = `promos/${fileName}`;

    // Bucket 1: promo-banners
    let { error: err1 } = await supabase.storage
      .from('promo-banners')
      .upload(filePath, file, { contentType: file.type || 'image/jpeg' });

    if (!err1) {
      const { data: { publicUrl } } = supabase.storage.from('promo-banners').getPublicUrl(filePath);
      return publicUrl;
    }

    // Fallback Bucket 2: product-images
    let { error: err2 } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { contentType: file.type || 'image/jpeg' });

    if (!err2) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return publicUrl;
    }

    // Fallback Bucket 3: category-images
    let { error: err3 } = await supabase.storage
      .from('category-images')
      .upload(filePath, file, { contentType: file.type || 'image/jpeg' });

    if (!err3) {
      const { data: { publicUrl } } = supabase.storage.from('category-images').getPublicUrl(filePath);
      return publicUrl;
    }

    throw new Error('Gagal mengunggah file gambar ke storage Supabase. Pastikan bucket promo-banners atau product-images aktif.');
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleQuickUploadForPromo = async (e: React.ChangeEvent<HTMLInputElement>, promoId: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setUploadingPromoId(promoId);
      const publicUrl = await uploadFileToStorage(file);

      const { error } = await supabase
        .from('promos')
        .update({ banner_url: publicUrl })
        .eq('id', promoId);

      if (error) {
        if (error.message?.includes('banner_url')) {
          alert("Kolom 'banner_url' belum ada di database Supabase.\nSilakan jalankan skrip SQL 'update_promo_and_payment_bank.sql' di Supabase SQL Editor terlebih dahulu.");
        } else {
          alert('Gagal menyimpan banner: ' + error.message);
        }
        return;
      }

      setPromos((prev) => prev.map((p) => p.id === promoId ? { ...p, banner_url: publicUrl } : p));
      alert('Foto banner promo JPG berhasil diunggah!');
    } catch (err: any) {
      console.error(err);
      alert('Gagal upload banner: ' + err.message);
    } finally {
      setUploadingPromoId(null);
    }
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim() || !newDiscount) {
      alert("Harap lengkapi Judul Promo, Kode Promo, dan Persentase Diskon.");
      return;
    }

    setIsSaving(true);
    try {
      let finalBannerUrl = newBannerUrl.trim() || null;

      if (bannerFile) {
        setIsUploadingBanner(true);
        try {
          finalBannerUrl = await uploadFileToStorage(bannerFile);
        } catch (uploadErr: any) {
          console.warn('Upload banner storage warning:', uploadErr.message);
        } finally {
          setIsUploadingBanner(false);
        }
      }

      const payload: any = {
        title: newTitle.trim(),
        code: newCode.trim().toUpperCase(),
        description: newDesc.trim() || null,
        discount_percent: parseFloat(newDiscount) || 0,
      };

      if (finalBannerUrl) {
        payload.banner_url = finalBannerUrl;
      }

      if (newMinPurchase && Number(newMinPurchase) > 0) {
        payload.min_purchase_amount = parseFloat(newMinPurchase);
      }
      if (newMaxDiscount && Number(newMaxDiscount) > 0) {
        payload.max_discount_amount = parseFloat(newMaxDiscount);
      }
      if (newExpiresAt) {
        payload.expires_at = new Date(newExpiresAt).toISOString();
      }

      let { data, error } = await supabase
        .from('promos')
        .insert([payload])
        .select('*');

      // Fallback if banner_url column does not exist in DB yet
      if (error && error.message?.includes('banner_url')) {
        console.warn("Retrying insert without banner_url column...");
        delete payload.banner_url;
        const retry = await supabase.from('promos').insert([payload]).select('*');
        data = retry.data;
        error = retry.error;
        if (!error) {
          alert("Kode Promo berhasil dibuat!\n\nCatatan: Kolom 'banner_url' belum ada di database Supabase Anda. Jalankan skrip SQL 'update_promo_and_payment_bank.sql' di Supabase SQL Editor agar banner JPG tersimpan di database.");
        }
      }

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
        setNewBannerUrl('');
        setBannerFile(null);
        setBannerPreview(null);
        alert("Kode Promo & Banner berhasil ditambahkan!");
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
              <th className="p-5 font-semibold">Banner Poster</th>
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
                <td colSpan={8} className="p-8 text-center text-gray-500 font-medium">Memuat data promo...</td>
              </tr>
            ) : filteredPromos.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400 font-medium">
                  <Tag size={36} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-slate-600">Belum ada promo terdaftar</p>
                  <p className="text-xs text-gray-400 mt-1">Klik tombol &ldquo;Buat Promo Baru&rdquo; untuk membuat kode diskon dan mengunggah banner poster.</p>
                </td>
              </tr>
            ) : filteredPromos.map((promo) => {
              const active = isPromoActive(promo.expires_at);

              return (
                <tr key={promo.id} className="hover:bg-emerald-50/30 transition-colors group">
                  {/* Banner Poster */}
                  <td className="p-5">
                    {promo.banner_url ? (
                      <div 
                        className="relative group/banner w-24 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm cursor-pointer"
                        onClick={() => setSelectedBannerPreview(promo.banner_url!)}
                        title="Klik untuk melihat banner penuh"
                      >
                        <img src={promo.banner_url} alt={promo.title} className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
                          <Eye size={12} /> Lihat
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-dashed border-slate-300 hover:border-emerald-400 rounded-lg text-xs font-semibold transition-all">
                        <Upload size={12} />
                        <span>Upload JPG</span>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp,image/jpg" 
                          className="hidden" 
                          onChange={(e) => handleQuickUploadForPromo(e, promo.id)}
                          disabled={uploadingPromoId === promo.id}
                        />
                      </label>
                    )}
                    {uploadingPromoId === promo.id && (
                      <span className="text-[10px] text-emerald-600 font-bold animate-pulse block mt-1">Mengunggah...</span>
                    )}
                  </td>

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

              {/* Upload Banner JPG / Poster */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide uppercase flex items-center justify-between">
                  <span>Upload Poster Banner (JPG / PNG)</span>
                  <span className="text-slate-400 text-[10px] font-medium lowercase">(tampil di carousel depan aplikasi)</span>
                </label>

                {bannerPreview ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 bg-slate-50 mb-2 group">
                    <img src={bannerPreview} alt="Preview Banner" className="w-full h-32 object-cover" />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null);
                          setBannerPreview(null);
                          setNewBannerUrl('');
                        }}
                        className="p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-sm"
                        title="Hapus banner"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-2 bg-emerald-50 border-t border-emerald-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                      <CheckCircle2 size={13} className="text-emerald-600" /> 
                      <span>Poster Siap: {bannerFile ? bannerFile.name : 'URL Banner'}</span>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/40 hover:bg-emerald-50/80 transition-all cursor-pointer group">
                    <Upload size={24} className="text-emerald-600 group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-bold text-emerald-900">Pilih Foto Banner Promo (JPG / PNG)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Rekomendasi rasio lebar 16:9 (JPG, WebP, PNG)</span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp,image/jpg" 
                      className="hidden" 
                      onChange={handleBannerFileChange} 
                    />
                  </label>
                )}

                {/* Input URL alternatif */}
                <div className="mt-2">
                  <input 
                    type="text"
                    placeholder="Atau masukkan link URL gambar banner eksternal..."
                    value={newBannerUrl}
                    onChange={(e) => {
                      setNewBannerUrl(e.target.value);
                      if (e.target.value.startsWith('http')) {
                        setBannerPreview(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 font-mono"
                  />
                </div>
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
                  disabled={isSaving || isUploadingBanner}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving || isUploadingBanner ? 'Menyimpan Promo...' : 'Simpan Promo & Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL UNTUK PREVIEW BANNER FULL */}
      {selectedBannerPreview && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBannerPreview(null)}
        >
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 bg-slate-800/80 flex justify-between items-center text-white border-b border-white/10">
              <span className="text-xs font-bold">Preview Poster Banner Promo</span>
              <button 
                onClick={() => setSelectedBannerPreview(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/50 min-h-[300px]">
              <img src={selectedBannerPreview} alt="Banner Full" className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
