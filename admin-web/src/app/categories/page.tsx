'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Edit2, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  X, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  Sliders, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getProductImageUrl } from '@/lib/image';

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  sort_order?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  // Reorder Manager Modal
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderList, setReorderList] = useState<Category[]>([]);
  const [isSavingReorder, setIsSavingReorder] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    let { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
      
    // Fallback if sort_order doesn't exist yet in Supabase
    if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
      const fallback = await supabase.from('categories').select('*').order('name');
      data = fallback.data;
      error = fallback.error;
    }

    if (!error && data) {
      // Ensure local array is consistently sorted by sort_order
      const sorted = [...data].sort((a, b) => {
        const orderA = a.sort_order ?? 9999;
        const orderB = b.sort_order ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
      setCategories(sorted);
    }
    setIsLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatOrder((categories.length + 1).toString());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category, index: number) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatOrder((cat.sort_order ?? (index + 1)).toString());
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSaving(true);
    const orderNum = parseInt(catOrder) || 1;

    const payload: any = {
      name: catName.trim(),
      description: catDesc.trim(),
      sort_order: orderNum,
    };

    if (editingCategory) {
      let { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editingCategory.id);

      // Fallback if column sort_order doesn't exist
      if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
        const fb = await supabase
          .from('categories')
          .update({ name: catName.trim(), description: catDesc.trim() })
          .eq('id', editingCategory.id);
        error = fb.error;
      }

      if (error) {
        alert('Gagal memperbarui kategori: ' + error.message);
      }
    } else {
      let { error } = await supabase
        .from('categories')
        .insert([payload]);

      // Fallback if column sort_order doesn't exist
      if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
        const fb = await supabase
          .from('categories')
          .insert([{ name: catName.trim(), description: catDesc.trim() }]);
        error = fb.error;
      }

      if (error) {
        alert('Gagal membuat kategori: ' + error.message);
      }
    }
    setIsSaving(false);
    setIsModalOpen(false);
    fetchData();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus kategori: ' + error.message);
    } else {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  // Quick Move Up / Down
  const handleQuickMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentItem = categories[index];
    const targetItem = categories[targetIndex];

    const currentOrder = currentItem.sort_order ?? (index + 1);
    const targetOrder = targetItem.sort_order ?? (targetIndex + 1);

    // Swap sort orders (or if they are equal, calculate discrete sequential numbers)
    const newCurrentOrder = targetOrder === currentOrder 
      ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1)
      : targetOrder;
    const newTargetOrder = currentOrder;

    // Optimistic local update
    const nextList = [...categories];
    nextList[index] = { ...currentItem, sort_order: newCurrentOrder };
    nextList[targetIndex] = { ...targetItem, sort_order: newTargetOrder };
    nextList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setCategories(nextList);

    try {
      const p1 = supabase.from('categories').update({ sort_order: newCurrentOrder }).eq('id', currentItem.id);
      const p2 = supabase.from('categories').update({ sort_order: newTargetOrder }).eq('id', targetItem.id);
      const [res1, res2] = await Promise.all([p1, p2]);

      if (res1.error || res2.error) {
        console.error('Error swapping sort_order:', res1.error || res2.error);
        fetchData();
      }
    } catch (e) {
      console.error('Swap error:', e);
      fetchData();
    }
  };

  // Open Reorder Modal
  const handleOpenReorderModal = () => {
    // Clone current categories and ensure sequential order numbers
    const listWithSequential = categories.map((cat, idx) => ({
      ...cat,
      sort_order: cat.sort_order && cat.sort_order > 0 ? cat.sort_order : idx + 1,
    }));
    setReorderList(listWithSequential);
    setIsReorderModalOpen(true);
  };

  const handleReorderMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;

    const updated = [...reorderList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Re-assign sequential ranks 1, 2, 3...
    const reNumbered = updated.map((c, idx) => ({ ...c, sort_order: idx + 1 }));
    setReorderList(reNumbered);
  };

  const handleSaveAllReorder = async () => {
    setIsSavingReorder(true);
    try {
      const updates = reorderList.map((cat, idx) => {
        return supabase
          .from('categories')
          .update({ sort_order: idx + 1 })
          .eq('id', cat.id);
      });

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);

      if (hasError) {
        alert('Beberapa urutan kategori gagal disimpan. Pastikan skrip SQL "add_sort_order.sql" telah dijalankan di Supabase.');
      } else {
        alert('Urutan kategori berhasil disimpan dan langsung aktif di mobile app!');
      }

      setIsReorderModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan urutan: ' + err.message);
    } finally {
      setIsSavingReorder(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      setUploadingId(categoryId);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${categoryId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: publicUrl })
        .eq('id', categoryId);

      if (updateError) throw updateError;

      await fetchData();
      alert('Gambar kategori berhasil diunggah!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Gagal mengunggah gambar: ' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Package size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Kategori Produk</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Kelola urutan prioritas kategori dan visual etalase untuk mobile app.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenReorderModal}
            className="bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Sliders size={16} className="text-emerald-600" /> Atur Urutan Tampilan
          </button>

          <button 
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Kategori
          </button>
        </div>
      </div>

      {/* BANNER INFO URUTAN */}
      <div className="mb-6 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <HelpCircle size={18} className="text-emerald-700" />
          </div>
          <div className="text-xs text-slate-700">
            <span className="font-bold text-emerald-800">Petunjuk Urutan Kategori:</span> Kategori dengan nomor urut terkecil (<span className="font-semibold">#1, #2, #3</span>) akan tampil paling awal di layar katalog aplikasi mobile. Gunakan tombol panah <span className="font-semibold">▲ / ▼</span> pada kartu untuk menggeser urutan secara instan.
          </div>
        </div>
        <button
          onClick={handleOpenReorderModal}
          className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
        >
          Lihat Tabel Urutan
        </button>
      </div>

      {/* GRID KATEGORI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-slate-400 col-span-full">Memuat kategori...</p>
        ) : categories.length === 0 ? (
          <p className="text-slate-400 col-span-full">Belum ada kategori. Klik "Tambah Kategori" untuk mulai membuat.</p>
        ) : (
          categories.map((cat, index) => {
            const currentRank = cat.sort_order ?? (index + 1);
            return (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all group">
                <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                  {cat.image_url ? (
                    <img src={getProductImageUrl(cat.image_url)} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon size={44} strokeWidth={1} />
                      <span className="text-xs mt-2 font-medium">Belum ada gambar</span>
                    </div>
                  )}

                  {/* Badge Urutan Tampilan */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-sm border border-slate-200/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-extrabold text-slate-800">
                      Urutan #{currentRank}
                    </span>
                  </div>

                  {/* Tombol Cepat Naik / Turun Urutan */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-sm border border-slate-200/80">
                    <button
                      onClick={() => handleQuickMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Naikkan Urutan (Tampil Lebih Depan)"
                    >
                      <ArrowUp size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleQuickMove(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Turunkan Urutan (Tampil Lebih Belakang)"
                    >
                      <ArrowDown size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  
                  {/* Upload Overlay */}
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingId === cat.id ? (
                      <span className="text-white text-xs font-bold">Mengunggah...</span>
                    ) : (
                      <>
                        <Upload className="text-white mb-1.5" size={28} />
                        <span className="text-white font-semibold text-xs">Ganti Foto Kategori</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, cat.id)}
                          disabled={uploadingId === cat.id}
                        />
                      </>
                    )}
                  </label>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        Prioritas #{currentRank}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEdit(cat, index)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kategori & Urutan"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mt-2">{cat.description || 'Tidak ada deskripsi'}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori & Urutan' : 'Tambah Kategori Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kategori</label>
                <input 
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Kabel Data, Powerbank, Charger"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Urutan Tampilan (Prioritas)</label>
                  <span className="text-[11px] text-slate-400 font-medium">1 = Paling Depan</span>
                </div>
                <input 
                  type="number"
                  min="1"
                  value={catOrder}
                  onChange={(e) => setCatOrder(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Angka kecil akan tampil lebih dahulu pada etalase katalog mobile app.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi Kategori</label>
                <textarea 
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Deskripsi singkat seputar lini produk..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUSUN URUTAN CEPAT (REORDER MANAGER) */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Atur Urutan Kategori</h3>
                  <p className="text-xs text-slate-500 font-medium">Susun urutan kategori yang akan tampil di mobile app</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              <p className="text-xs text-slate-500 mb-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                💡 <b>Tips:</b> Klik tombol panah <b>▲</b> atau <b>▼</b> untuk memindahkan posisi kategori ke atas atau ke bawah. Urutan nomor 1 akan tampil di posisi teratas etalase mobile.
              </p>

              {reorderList.map((cat, idx) => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between p-3 bg-white border border-slate-200/90 rounded-xl hover:border-emerald-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 font-black text-slate-700 text-xs flex items-center justify-center border border-slate-200">
                      #{idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {cat.image_url ? (
                        <img src={getProductImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{cat.description || 'Tanpa deskripsi'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReorderMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-2 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
                      title="Pindah ke Atas"
                    >
                      <ArrowUp size={15} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleReorderMove(idx, 'down')}
                      disabled={idx === reorderList.length - 1}
                      className="p-2 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
                      title="Pindah ke Bawah"
                    >
                      <ArrowDown size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">Total: {reorderList.length} Kategori</span>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsReorderModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-white cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveAllReorder}
                  disabled={isSavingReorder}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check size={16} /> {isSavingReorder ? 'Menyimpan...' : 'Simpan Urutan Kategori'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
