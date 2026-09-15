'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Package, 
  Filter, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Sliders, 
  RefreshCw, 
  Check, 
  ArrowUpDown, 
  HelpCircle,
  Archive,
  History,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string; // UUID from supabase
  name: string;
  sku: string;
  category_id: string;
  price: number;
  stock: number;
  status: string;
  sort_order?: number;
  image_urls?: string[];
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua Kategori');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'name_asc' | 'price_asc' | 'price_desc' | 'stock_desc' | 'newest'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Form State for Add / Edit Product
  const [newProductName, setNewProductName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('1');
  const [newImageUrls, setNewImageUrls] = useState(''); // comma separated for now
  const [isSaving, setIsSaving] = useState(false);

  // Quick Reorder Modal
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderCategoryFilter, setReorderCategoryFilter] = useState('ALL');
  const [reorderList, setReorderList] = useState<Product[]>([]);
  const [isSavingReorder, setIsSavingReorder] = useState(false);

  // Stock Monitoring Modal
  const [stockMonitoringProduct, setStockMonitoringProduct] = useState<Product | null>(null);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [isLoadingStockLogs, setIsLoadingStockLogs] = useState(false);
  const [quickRestockAmount, setQuickRestockAmount] = useState('');
  const [quickRestockNotes, setQuickRestockNotes] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);

  const handleOpenStockMonitoring = async (product: Product) => {
    setStockMonitoringProduct(product);
    setIsLoadingStockLogs(true);
    setQuickRestockAmount('');
    setQuickRestockNotes('');

    const { data: logsData, error } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });

    if (!error && logsData) {
      setStockLogs(logsData);
    } else {
      setStockLogs([]);
    }
    setIsLoadingStockLogs(false);
  };

  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMonitoringProduct || !quickRestockAmount) return;

    const amount = parseInt(quickRestockAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setIsSavingStock(true);
    const prevStock = stockMonitoringProduct.stock;
    const newStock = prevStock + amount;

    // 1. Update ke Master Produk (tabel products)
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', stockMonitoringProduct.id);

    if (updateError) {
      alert('Gagal update stok: ' + updateError.message);
      setIsSavingStock(false);
      return;
    }

    // 2. Simpan log mutasi ke stock_logs
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('stock_logs').insert([{
        product_id: stockMonitoringProduct.id,
        type: 'RESTOCK',
        quantity: amount,
        previous_stock: prevStock,
        current_stock: newStock,
        notes: quickRestockNotes.trim() || 'Restok dari Master Produk',
        created_by: user?.email || 'Admin',
      }]);
    } catch (err) {
      console.warn(err);
    }

    // 3. Update state lokal
    const updated = { ...stockMonitoringProduct, stock: newStock };
    setStockMonitoringProduct(updated);
    setProducts(prev => prev.map(p => p.id === stockMonitoringProduct.id ? updated : p));
    setQuickRestockAmount('');
    setQuickRestockNotes('');
    setIsSavingStock(false);

    // Refresh logs
    const { data: refreshedLogs } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('product_id', stockMonitoringProduct.id)
      .order('created_at', { ascending: false });
    if (refreshedLogs) setStockLogs(refreshedLogs);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch categories
    const { data: catData, error: catError } = await supabase.from('categories').select('*').order('name');
    if (!catError && catData) {
      setCategories(catData);
      if (catData.length > 0 && !newCategoryId) setNewCategoryId(catData[0].id);
    }

    // Fetch products ordered by sort_order
    let { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
      
    // Fallback if column sort_order doesn't exist yet
    if (prodError && (prodError.message?.includes('sort_order') || prodError.code === '42703')) {
      const fallback = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      prodData = fallback.data;
      prodError = fallback.error;
    }

    if (!prodError && prodData) {
      setProducts(prodData as any);
    }
    
    setIsLoading(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setNewProductName('');
    setNewSku('');
    setNewPrice('');
    setNewStock('');
    setNewSortOrder('1');
    setNewImageUrls('');
  };

  const handleEditClick = (product: Product, index: number) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewSku(product.sku || '');
    setNewCategoryId(product.category_id || categories[0]?.id || '');
    setNewPrice(product.price.toString());
    setNewStock(product.stock.toString());
    setNewSortOrder((product.sort_order ?? (index + 1)).toString());
    setNewImageUrls(product.image_urls ? product.image_urls.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newSku || !newPrice || !newStock || !newCategoryId) return;

    setIsSaving(true);
    const stockNum = parseInt(newStock);
    const orderNum = parseInt(newSortOrder) || 1;

    const prodData: any = {
      name: newProductName,
      sku: newSku,
      category_id: newCategoryId,
      price: parseFloat(newPrice),
      stock: stockNum,
      sort_order: orderNum,
      status: stockNum > 20 ? 'ACTIVE' : 'LOW_STOCK',
      image_urls: newImageUrls ? newImageUrls.split(',').map(u => u.trim()).filter(Boolean) : [],
    };

    if (editingProduct) {
      let { data, error } = await supabase
        .from('products')
        .update(prodData)
        .eq('id', editingProduct.id)
        .select('*, categories(name)');

      // Fallback if sort_order doesn't exist yet
      if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
        delete prodData.sort_order;
        const fallback = await supabase
          .from('products')
          .update(prodData)
          .eq('id', editingProduct.id)
          .select('*, categories(name)');
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data) {
        setProducts(products.map(p => p.id === editingProduct.id ? data[0] as any : p));
        closeModal();
      } else {
        console.error("Error updating product:", error);
        alert("Gagal mengupdate produk: " + (error?.message || 'Error'));
      }
    } else {
      let { data, error } = await supabase
        .from('products')
        .insert([prodData])
        .select('*, categories(name)');

      // Fallback if sort_order doesn't exist yet
      if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
        delete prodData.sort_order;
        const fallback = await supabase
          .from('products')
          .insert([prodData])
          .select('*, categories(name)');
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data) {
        setProducts([data[0] as any, ...products]);
        closeModal();
      } else {
        console.error("Error adding product:", error);
        alert("Gagal menambahkan produk: " + (error?.message || 'Error'));
      }
    }
    setIsSaving(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert("Gagal menghapus produk: " + error.message);
      }
    }
  };

  // Quick Move Up / Down in Table
  const handleQuickMove = async (filteredIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? filteredIdx - 1 : filteredIdx + 1;
    if (targetIdx < 0 || targetIdx >= filteredProducts.length) return;

    const currentItem = filteredProducts[filteredIdx];
    const targetItem = filteredProducts[targetIdx];

    const currentOrder = currentItem.sort_order ?? (filteredIdx + 1);
    const targetOrder = targetItem.sort_order ?? (targetIdx + 1);

    const newCurrentOrder = targetOrder === currentOrder 
      ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1)
      : targetOrder;
    const newTargetOrder = currentOrder;

    // Optimistic local update
    const updatedAll = products.map(p => {
      if (p.id === currentItem.id) return { ...p, sort_order: newCurrentOrder };
      if (p.id === targetItem.id) return { ...p, sort_order: newTargetOrder };
      return p;
    });
    setProducts(updatedAll);

    try {
      const p1 = supabase.from('products').update({ sort_order: newCurrentOrder }).eq('id', currentItem.id);
      const p2 = supabase.from('products').update({ sort_order: newTargetOrder }).eq('id', targetItem.id);
      const [r1, r2] = await Promise.all([p1, p2]);

      if (r1.error || r2.error) {
        console.error("Error swapping product order:", r1.error || r2.error);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Open Reorder Modal
  const handleOpenReorderModal = () => {
    const initialCategory = selectedCategoryFilter !== 'Semua Kategori'
      ? categories.find(c => c.name === selectedCategoryFilter)?.id || 'ALL'
      : 'ALL';

    setReorderCategoryFilter(initialCategory);
    filterReorderList(initialCategory);
    setIsReorderModalOpen(true);
  };

  const filterReorderList = (catId: string) => {
    let list = [...products];
    if (catId !== 'ALL') {
      list = list.filter(p => p.category_id === catId);
    }
    // Sort by sort_order
    list.sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
    const normalized = list.map((p, i) => ({
      ...p,
      sort_order: p.sort_order && p.sort_order > 0 ? p.sort_order : i + 1,
    }));
    setReorderList(normalized);
  };

  const handleReorderCategoryChange = (catId: string) => {
    setReorderCategoryFilter(catId);
    filterReorderList(catId);
  };

  const handleReorderMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;

    const updated = [...reorderList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reNumbered = updated.map((p, idx) => ({ ...p, sort_order: idx + 1 }));
    setReorderList(reNumbered);
  };

  const handleSaveAllReorder = async () => {
    setIsSavingReorder(true);
    try {
      const updates = reorderList.map((p, idx) => {
        return supabase
          .from('products')
          .update({ sort_order: idx + 1 })
          .eq('id', p.id);
      });

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);

      if (hasError) {
        alert('Beberapa urutan produk gagal disimpan. Pastikan skrip SQL "add_sort_order.sql" telah dijalankan di Supabase.');
      } else {
        alert('Prioritas urutan produk berhasil disimpan dan aktif di mobile app!');
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

  // Filtering and Sorting
  const filteredProducts = products.filter((p) => {
    const catName = p.categories?.name || '';
    const matchesCategory = selectedCategoryFilter === 'Semua Kategori' || catName === selectedCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const orderA = a.sort_order ?? 9999;
        const orderB = b.sort_order ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      }
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'stock_desc':
        return b.stock - a.stock;
      case 'newest':
        return (b as any).created_at ? new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime() : 0;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Package size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Master Produk</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Kelola katalog produk, urutan prioritas tampilan etalase, dan ketersediaan stok.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenReorderModal}
            className="bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Sliders size={16} className="text-emerald-600" /> Atur Prioritas Produk
          </button>

          <button 
            onClick={() => {
              setEditingProduct(null);
              setNewProductName('');
              setNewSku('');
              setNewPrice('');
              setNewStock('');
              setNewSortOrder((products.length + 1).toString());
              setNewImageUrls('');
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* BANNER INFO PRIORITAS PRODUK */}
      <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <HelpCircle size={18} className="text-emerald-700" />
          </div>
          <div className="text-xs text-slate-700">
            <span className="font-bold text-emerald-800">Prioritas Tampilan Produk:</span> Produk dengan urutan teratas (<span className="font-semibold">#1, #2, #3</span>) akan tampil di posisi pertama pada kategori produk dan rekomendasi utama beranda mobile app. Gunakan tombol <span className="font-semibold">▲ / ▼</span> pada tabel untuk menaikkan/menurunkan prioritas produk.
          </div>
        </div>
        <button
          onClick={handleOpenReorderModal}
          className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
        >
          Susun Prioritas
        </button>
      </div>

      {/* SEARCH, CATEGORY FILTER & SORT SELECT */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari produk (Nama, SKU)..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Kategori */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <select 
                value={selectedCategoryFilter}
                onChange={(e) => { setSelectedCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white font-medium text-gray-700 transition-all appearance-none cursor-pointer"
              >
                <option>Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white font-bold text-emerald-800 transition-all appearance-none cursor-pointer"
              >
                <option value="priority">Urut: Prioritas Admin (Default)</option>
                <option value="name_asc">Urut: Nama Produk (A - Z)</option>
                <option value="price_asc">Urut: Harga Terendah</option>
                <option value="price_desc">Urut: Harga Tertinggi</option>
                <option value="stock_desc">Urut: Stok Terbanyak</option>
                <option value="newest">Urut: Terbaru Ditambahkan</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold border-b border-gray-100 text-center w-28">Prioritas</th>
                <th className="p-4 font-semibold border-b border-gray-100">Nama Produk</th>
                <th className="p-4 font-semibold border-b border-gray-100">SKU</th>
                <th className="p-4 font-semibold border-b border-gray-100">Kategori</th>
                <th className="p-4 font-semibold border-b border-gray-100">Gambar</th>
                <th className="p-4 font-semibold border-b border-gray-100">Harga Dealer</th>
                <th className="p-4 font-semibold border-b border-gray-100">Stok</th>
                <th className="p-4 font-semibold border-b border-gray-100">Status</th>
                <th className="p-4 font-semibold border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Memuat data dari Supabase...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Belum ada produk ditemukan.</td>
                </tr>
              ) : paginatedProducts.map((product, idx) => {
                const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                const currentRank = product.sort_order ?? (globalIndex + 1);

                return (
                  <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors group">
                    {/* Urutan / Prioritas */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="px-2 py-1 rounded-lg text-xs font-black bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                          #{currentRank}
                        </span>
                        {sortBy === 'priority' && (
                          <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleQuickMove(globalIndex, 'up')}
                              disabled={globalIndex === 0}
                              className="p-0.5 hover:text-emerald-700 disabled:opacity-20 cursor-pointer"
                              title="Naikkan Prioritas"
                            >
                              <ArrowUp size={12} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => handleQuickMove(globalIndex, 'down')}
                              disabled={globalIndex === filteredProducts.length - 1}
                              className="p-0.5 hover:text-emerald-700 disabled:opacity-20 cursor-pointer"
                              title="Turunkan Prioritas"
                            >
                              <ArrowDown size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-gray-900">{product.name}</td>
                    <td className="p-4 text-gray-500 font-medium">{product.sku}</td>
                    <td className="p-4">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200/60">
                        {product.categories?.name || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <div className="flex -space-x-2">
                          {product.image_urls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover bg-gray-100" />
                          ))}
                          {product.image_urls.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                              +{product.image_urls.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-900 font-bold tracking-tight">Rp {product.price.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleOpenStockMonitoring(product)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          product.stock <= 20 
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200'
                        }`}
                        title="Klik untuk Pantau Mutasi & Riwayat Stok"
                      >
                        <Archive size={12} className={product.stock <= 20 ? 'text-amber-600' : 'text-emerald-600'} />
                        <span>{product.stock}</span>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${product.status === 'ACTIVE' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' : 'bg-red-100/50 text-red-700 border border-red-200/50'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${product.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        {product.status === 'ACTIVE' ? 'Aktif' : 'Stok Menipis'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenStockMonitoring(product)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Pantau Riwayat Stok & Restok"
                        >
                          <History size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(product, globalIndex)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Produk & Urutan"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Produk"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <p className="text-xs text-gray-500 font-medium">
            Menampilkan {paginatedProducts.length} dari total {filteredProducts.length} produk
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="text-xs font-bold text-gray-700 px-2">
                Hal {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingProduct ? 'Edit Produk & Prioritas' : 'Tambah Produk Baru'}</h2>
              <button type="button" onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">NAMA PRODUK <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Kabel Charger Fast Charging Type-C"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">SKU <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="DAP-TC100"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">KATEGORI <span className="text-red-500">*</span></label>
                  <select 
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800 bg-white cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">HARGA DEALER <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">Rp</div>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">STOK AWAL <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* INPUT URUTAN PRIORITAS */}
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-emerald-900 uppercase">
                    Urutan Tampilan / Prioritas Produk
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700">1 = Prioritas Paling Awal</span>
                </div>
                <input 
                  type="number"
                  min="1"
                  required
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(e.target.value)}
                  placeholder="1, 2, 3..."
                  className="w-full px-4 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-extrabold text-emerald-800 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                />
                <p className="text-[11px] text-emerald-700 mt-1">
                  Produk dengan nomor urutan terkecil akan tampil paling awal di katalog kategori & beranda mobile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">URL GAMBAR (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  placeholder="https://.../img1.jpg, https://.../img2.jpg"
                  value={newImageUrls}
                  onChange={(e) => setNewImageUrls(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium placeholder:font-normal"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={18} strokeWidth={2.5} /> {isSaving ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUSUN PRIORITAS PRODUK (REORDER MANAGER) */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Atur Prioritas Urutan Produk</h3>
                  <p className="text-xs text-slate-500 font-medium">Tentukan produk mana yang tampil lebih awal di etalase mobile app</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* FILTER KATEGORI DI DALAM MODAL */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
              <span className="text-xs font-bold text-slate-700">Filter Kategori:</span>
              <select
                value={reorderCategoryFilter}
                onChange={(e) => handleReorderCategoryChange(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({products.length} Produk)</option>
                {categories.map((cat) => {
                  const count = products.filter(p => p.category_id === cat.id).length;
                  return (
                    <option key={cat.id} value={cat.id}>{cat.name} ({count} Produk)</option>
                  );
                })}
              </select>
            </div>

            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              <p className="text-xs text-slate-500 mb-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                💡 <b>Petunjuk:</b> Gunakan tombol <b>▲</b> atau <b>▼</b> untuk memindahkan prioritas produk. Produk nomor <b>#1</b> akan tampil di urutan paling pertama di mobile app dealer.
              </p>

              {reorderList.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">Tidak ada produk dalam filter ini.</p>
              ) : (
                reorderList.map((prod, idx) => (
                  <div 
                    key={prod.id} 
                    className="flex items-center justify-between p-3 bg-white border border-slate-200/90 rounded-xl hover:border-emerald-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 font-black text-emerald-800 text-xs flex items-center justify-center border border-emerald-200">
                        #{idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {prod.image_urls && prod.image_urls.length > 0 ? (
                          <img src={prod.image_urls[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{prod.name}</p>
                        <p className="text-[11px] text-slate-400">
                          SKU: <span className="font-mono text-slate-600">{prod.sku}</span> | Rp {prod.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReorderMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Pindah Prioritas Lebih Tinggi"
                      >
                        <ArrowUp size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleReorderMove(idx, 'down')}
                        disabled={idx === reorderList.length - 1}
                        className="p-2 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Pindah Prioritas Lebih Rendah"
                      >
                        <ArrowDown size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">Total: {reorderList.length} Produk</span>
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
                  disabled={isSavingReorder || reorderList.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} /> {isSavingReorder ? 'Menyimpan...' : 'Simpan Urutan Produk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MONITORING & RIWAYAT STOK (TERHUBUNG KE MANAJEMEN STOK) */}
      {stockMonitoringProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Archive size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pantau & Sesuaikan Stok Master</h2>
                  <p className="text-xs text-slate-500">Terhubung langsung dengan Manajemen Stok & Restok</p>
                </div>
              </div>
              <button 
                onClick={() => setStockMonitoringProduct(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Product Quick Info Card */}
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 mb-1 inline-block">
                    {stockMonitoringProduct.categories?.name || 'Kategori'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{stockMonitoringProduct.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">SKU: {stockMonitoringProduct.sku || '-'}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Master</p>
                  <p className="text-2xl font-black text-emerald-600">{stockMonitoringProduct.stock} <span className="text-xs font-semibold text-slate-400">Pcs</span></p>
                </div>
              </div>

              {/* Form Tambah Restok Cepat dari Master Produk */}
              <form onSubmit={handleQuickRestockSubmit} className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <input 
                  type="number" 
                  min="1"
                  required
                  placeholder="+ Jumlah Restok"
                  value={quickRestockAmount}
                  onChange={(e) => setQuickRestockAmount(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-full sm:w-36"
                />
                <input 
                  type="text" 
                  placeholder="Catatan Restok (Contoh: Penerimaan Pabrik)"
                  value={quickRestockNotes}
                  onChange={(e) => setQuickRestockNotes(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs flex-1 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> + Restok Cepat
                </button>
              </form>
            </div>

            {/* List Riwayat Log Perubahan */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  LOG MUTASI STOK ({stockLogs.length} Aktivitas)
                </h4>
                <a 
                  href="/inventory"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Buka Halaman Manajemen Stok ➔
                </a>
              </div>

              {isLoadingStockLogs ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-xs text-slate-500 font-medium">Mengambil riwayat mutasi...</p>
                </div>
              ) : stockLogs.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 p-6">
                  <History size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat Tercatat</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Setiap mutasi stok di Master Produk atau Manajemen Stok akan tercatat secara otomatis di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stockLogs.map((log: any) => {
                    const isPlus = log.type === 'RESTOCK' || log.type === 'RETURN';
                    const dateObj = new Date(log.created_at);
                    const formattedDate = dateObj.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={log.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg font-bold text-xs ${
                            isPlus 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isPlus ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">
                                {log.type === 'RESTOCK' ? 'Restok Masuk' : log.type === 'REDUCTION' ? 'Pengurangan Stok' : log.type}
                              </span>
                              <span className={`text-xs font-extrabold ${isPlus ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isPlus ? `+${log.quantity}` : `-${log.quantity}`} Pcs
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {log.notes || 'Penyesuaian stok'} • <span className="text-slate-400">{log.created_by || 'Admin'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-700">
                            {log.previous_stock} ➔ <b className="text-slate-900">{log.current_stock}</b>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formattedDate}, {formattedTime}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setStockMonitoringProduct(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
