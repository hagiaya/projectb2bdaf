'use client';

import React, { useState, useEffect } from 'react';
import { Package, Edit2, Upload, Image as ImageIcon } from 'lucide-react';
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      setUploadingId(categoryId);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${categoryId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      // Update category record
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: publicUrl })
        .eq('id', categoryId);

      if (updateError) {
        throw updateError;
      }

      // Refresh list
      await fetchData();
      alert('Gambar berhasil diunggah!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Gagal mengunggah gambar: ' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Package size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Master Kategori</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">Kelola kategori produk dan gambar visualnya.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-gray-500 col-span-full">Memuat kategori...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500 col-span-full">Belum ada kategori.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="h-48 bg-gray-100 relative group flex items-center justify-center overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <ImageIcon size={48} strokeWidth={1} />
                    <span className="text-sm mt-2 font-medium">Belum ada gambar</span>
                  </div>
                )}
                
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingId === cat.id ? (
                    <span className="text-white font-bold">Mengunggah...</span>
                  ) : (
                    <>
                      <Upload className="text-white mb-2" size={32} />
                      <span className="text-white font-semibold text-sm">Ganti Gambar</span>
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
                <h3 className="font-bold text-gray-900 text-lg mb-1">{cat.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">{cat.description || 'Tidak ada deskripsi'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
