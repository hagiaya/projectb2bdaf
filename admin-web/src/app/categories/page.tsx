'use client';

import React, { useState, useEffect } from 'react';
import { Package, Edit2, Upload, Image as ImageIcon, Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (!error && data) {
      setCategories(data);
    }
    setIsLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSaving(true);
    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update({ name: catName.trim(), description: catDesc.trim() })
        .eq('id', editingCategory.id);

      if (error) alert('Gagal memperbarui kategori: ' + error.message);
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: catName.trim(), description: catDesc.trim() }]);

      if (error) alert('Gagal membuat kategori: ' + error.message);
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
          <p className="text-sm text-slate-500 font-medium">Kelola kategori produk dan gambar visualnya untuk etalase mobile app.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Kategori
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-slate-400 col-span-full">Memuat kategori...</p>
        ) : categories.length === 0 ? (
          <p className="text-slate-400 col-span-full">Belum ada kategori. Klik "Tambah Kategori" untuk mulai membuat.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all group">
              <div className="h-48 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <ImageIcon size={44} strokeWidth={1} />
                    <span className="text-xs mt-2 font-medium">Belum ada gambar</span>
                  </div>
                )}
                
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
                  <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Nama"
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
                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{cat.description || 'Tidak ada deskripsi'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
    </div>
  );
}
