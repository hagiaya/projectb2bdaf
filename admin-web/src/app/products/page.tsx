'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Package, Filter, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string; // UUID from supabase
  name: string;
  sku: string;
  category_id: string;
  price: number;
  stock: number;
  status: string;
  categories?: { name: string }; // joined data
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Add Product
  const [newProductName, setNewProductName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch categories
    const { data: catData, error: catError } = await supabase.from('categories').select('*');
    if (!catError && catData) {
      setCategories(catData);
      if (catData.length > 0) setNewCategoryId(catData[0].id);
    }

    // Fetch products
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
      
    if (!prodError && prodData) {
      setProducts(prodData as any);
    }
    
    setIsLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newSku || !newPrice || !newStock || !newCategoryId) return;

    const stockNum = parseInt(newStock);
    const newProd = {
      name: newProductName,
      sku: newSku,
      category_id: newCategoryId,
      price: parseFloat(newPrice),
      stock: stockNum,
      status: stockNum > 20 ? 'ACTIVE' : 'LOW_STOCK',
    };

    const { data, error } = await supabase.from('products').insert([newProd]).select('*, categories(name)');

    if (!error && data) {
      setProducts([data[0] as any, ...products]);
      setIsModalOpen(false);
      // Reset form
      setNewProductName('');
      setNewSku('');
      setNewPrice('');
      setNewStock('');
    } else {
      console.error("Error adding product:", error);
      alert("Gagal menambahkan produk. Cek console log.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert("Gagal menghapus produk.");
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const catName = p.categories?.name || '';
    const matchesCategory = selectedCategoryFilter === 'Semua Kategori' || catName === selectedCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Package size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Master Produk</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">Kelola katalog produk, harga, dan ketersediaan stok terhubung ke Supabase.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Produk
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari produk (Nama, SKU)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select 
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white font-medium text-gray-700 transition-all appearance-none cursor-pointer"
            >
              <option>Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">Nama Produk</th>
              <th className="p-5 font-semibold border-b border-gray-100">SKU</th>
              <th className="p-5 font-semibold border-b border-gray-100">Kategori</th>
              <th className="p-5 font-semibold border-b border-gray-100">Harga Dealer</th>
              <th className="p-5 font-semibold border-b border-gray-100">Stok</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Memuat data dari Supabase...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">Belum ada produk ditemukan.</td>
              </tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5 font-semibold text-gray-900">{product.name}</td>
                <td className="p-5 text-gray-500 font-medium">{product.sku}</td>
                <td className="p-5">
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200/60">
                    {product.categories?.name || '-'}
                  </span>
                </td>
                <td className="p-5 text-gray-900 font-bold tracking-tight">Rp {product.price.toLocaleString('id-ID')}</td>
                <td className="p-5">
                  <span className={`font-semibold ${product.stock < 20 ? 'text-red-500' : 'text-gray-700'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${product.status === 'ACTIVE' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' : 'bg-red-100/50 text-red-700 border border-red-200/50'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    {product.status === 'ACTIVE' ? 'Aktif' : 'Stok Menipis'}
                  </div>
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-5 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center bg-white">
          <span className="font-medium">Menampilkan <strong className="text-gray-900">{filteredProducts.length}</strong> produk</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Produk Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">NAMA PRODUK <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Semen Padang 40kg"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium placeholder:font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">SKU <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="SP-40"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium placeholder:font-normal uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">KATEGORI <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800 bg-white appearance-none cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">HARGA DEALER <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rp</div>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">STOK AWAL <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-900"
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
                  <Plus size={18} strokeWidth={2.5} /> Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
