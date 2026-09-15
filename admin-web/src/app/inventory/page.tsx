'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Archive, 
  AlertTriangle, 
  ArrowRightLeft, 
  ArrowDownToLine, 
  X, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Folder, 
  RefreshCw, 
  History, 
  Plus, 
  Minus, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  Clock, 
  Sliders, 
  Package,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: number;
  status: string;
  category_id?: string;
  image_url?: string;
  image_urls?: string[];
  categories?: { id?: string; name: string };
}

interface StockLog {
  id: string;
  product_id: string;
  type: 'RESTOCK' | 'REDUCTION' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  quantity: number;
  previous_stock: number;
  current_stock: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

function InventoryContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'restock' ? 'restock' : 'stock';
  
  const [activeTab, setActiveTab] = useState<'stock' | 'restock'>(initialTab);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('Admin');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'WARNING' | 'SAFE' | 'EMPTY'
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'name_asc' | 'priority'>('stock_asc');
  
  // Grouping state for Restock tab
  const [isGroupedByCategory, setIsGroupedByCategory] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'subtract' | 'set'>('add');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History / Stock Monitoring Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<ProductItem | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Quick Restock in History Modal
  const [historyRestockAmount, setHistoryRestockAmount] = useState('');
  const [historyRestockNotes, setHistoryRestockNotes] = useState('');
  const [isHistorySubmitting, setIsHistorySubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'restock') {
      setActiveTab('restock');
    } else if (tabParam === 'stock') {
      setActiveTab('stock');
    }
  }, [searchParams]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    
    // Get Admin Email
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setAdminEmail(user.email);
    }

    // Fetch Categories
    const { data: catData } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });
    if (catData) {
      setCategories(catData);
    }

    // Fetch Products (Terhubung langsung dengan Master Produk)
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id, sku, name, stock, price, status, category_id, image_url, image_urls, categories(id, name)')
      .order('name', { ascending: true });

    if (!prodError && prodData) {
      setProducts(prodData as any);
    }
    setIsLoading(false);
  };

  // Open adjustment modal for a specific product
  const openAdjustmentModal = (product: ProductItem, type: 'add' | 'subtract' | 'set') => {
    setSelectedProduct(product);
    setModalType(type);
    setAdjustmentAmount('');
    setAdjustmentNotes(type === 'add' ? 'Restok Masuk Supplier' : type === 'subtract' ? 'Pengurangan / Penjualan Fisik' : 'Koreksi Stok Fisik');
    setIsModalOpen(true);
  };

  // Handle Adjustment Submit
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustmentAmount) return;

    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Masukkan jumlah stok yang valid (lebih besar dari 0).");
      return;
    }

    setIsSubmitting(true);
    const prevStock = selectedProduct.stock;
    let newStock = prevStock;

    if (modalType === 'add') {
      newStock = prevStock + amount;
    } else if (modalType === 'subtract') {
      newStock = Math.max(0, prevStock - amount);
    } else if (modalType === 'set') {
      newStock = amount;
    }

    // 1. Update ke Supabase Master Produk (Tabel products)
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (updateError) {
      alert("Gagal memperbarui stok di Master Produk: " + updateError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Simpan Riwayat Perubahan ke stock_logs
    try {
      await supabase.from('stock_logs').insert([{
        product_id: selectedProduct.id,
        type: modalType === 'add' ? 'RESTOCK' : modalType === 'subtract' ? 'REDUCTION' : 'ADJUSTMENT',
        quantity: modalType === 'set' ? Math.abs(newStock - prevStock) : amount,
        previous_stock: prevStock,
        current_stock: newStock,
        notes: adjustmentNotes.trim() || (modalType === 'add' ? 'Restok Masuk' : 'Pengurangan Stok'),
        created_by: adminEmail,
      }]);
    } catch (logErr) {
      console.warn("Catatan log stok gagal disimpan:", logErr);
    }

    // 3. Perbarui state lokal produk
    setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, stock: newStock } : p));
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  // Open History / Monitoring Modal
  const openHistoryModal = async (product: ProductItem) => {
    setHistoryProduct(product);
    setIsHistoryModalOpen(true);
    setIsLoadingLogs(true);
    setHistoryRestockAmount('');
    setHistoryRestockNotes('');

    const { data: logsData, error } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });

    if (!error && logsData) {
      setStockLogs(logsData as any);
    } else {
      setStockLogs([]);
    }
    setIsLoadingLogs(false);
  };

  // Quick Restock inside History Modal
  const handleHistoryQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historyProduct || !historyRestockAmount) return;

    const amount = parseInt(historyRestockAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setIsHistorySubmitting(true);
    const prevStock = historyProduct.stock;
    const newStock = prevStock + amount;

    // 1. Update ke Master Produk
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', historyProduct.id);

    if (updateError) {
      alert("Gagal update stok: " + updateError.message);
      setIsHistorySubmitting(false);
      return;
    }

    // 2. Insert ke stock_logs
    const newLogEntry = {
      product_id: historyProduct.id,
      type: 'RESTOCK' as const,
      quantity: amount,
      previous_stock: prevStock,
      current_stock: newStock,
      notes: historyRestockNotes.trim() || 'Restok Cepat dari Riwayat',
      created_by: adminEmail,
    };

    const { data: insertedData } = await supabase.from('stock_logs').insert([newLogEntry]).select();

    // 3. Update State Lokal
    const updatedProd = { ...historyProduct, stock: newStock };
    setHistoryProduct(updatedProd);
    setProducts(prev => prev.map(p => p.id === historyProduct.id ? updatedProd : p));
    
    if (insertedData && insertedData.length > 0) {
      setStockLogs(prev => [insertedData[0] as any, ...prev]);
    } else {
      // Fallback
      setStockLogs(prev => [{
        id: Math.random().toString(),
        ...newLogEntry,
        created_at: new Date().toISOString()
      }, ...prev]);
    }

    setHistoryRestockAmount('');
    setHistoryRestockNotes('');
    setIsHistorySubmitting(false);
  };

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(q) || (item.sku && item.sku.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        const itemCatId = item.category_id || item.categories?.id;
        if (itemCatId !== selectedCategoryFilter && item.categories?.name !== selectedCategoryFilter) {
          return false;
        }
      }

      // Status filter
      if (selectedStatusFilter === 'EMPTY' && item.stock !== 0) return false;
      if (selectedStatusFilter === 'LOW' && (item.stock === 0 || item.stock > 20)) return false;
      if (selectedStatusFilter === 'WARNING' && (item.stock <= 20 || item.stock > 50)) return false;
      if (selectedStatusFilter === 'SAFE' && item.stock <= 50) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedStatusFilter, sortBy]);

  // Grouping Products by Category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, { category: Category; items: ProductItem[] }> = {};

    // Initialise categories
    categories.forEach(cat => {
      groups[cat.id] = { category: cat, items: [] };
    });

    // Handle products without category
    const uncategorized: ProductItem[] = [];

    filteredProducts.forEach(product => {
      const catId = product.category_id;
      if (catId && groups[catId]) {
        groups[catId].items.push(product);
      } else {
        uncategorized.push(product);
      }
    });

    // Convert to array and filter out empty groups if a specific category was searched/filtered
    let result = Object.values(groups);
    if (selectedCategoryFilter !== 'ALL') {
      result = result.filter(g => g.category.id === selectedCategoryFilter || g.category.name === selectedCategoryFilter);
    } else {
      // Hanya tampilkan grup yang memiliki produk jika ada filter pencarian aktif
      if (searchQuery || selectedStatusFilter !== 'ALL') {
        result = result.filter(g => g.items.length > 0);
      }
    }

    if (uncategorized.length > 0 && (selectedCategoryFilter === 'ALL' || selectedCategoryFilter === 'UNCATEGORIZED')) {
      result.push({
        category: { id: 'UNCATEGORIZED', name: 'Tanpa Kategori / Lainnya' },
        items: uncategorized
      });
    }

    return result;
  }, [filteredProducts, categories, selectedCategoryFilter, searchQuery, selectedStatusFilter]);

  // Summary Metrics
  const totalSku = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter(p => p.stock <= 20).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm">
              <Archive size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'restock' ? 'Restok Produk' : 'Manajemen Stok'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <CheckCircle2 size={12} /> Live Sync Master Produk
                </span>
                <span className="text-xs text-slate-400">• Supabase Realtime</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {activeTab === 'restock'
              ? 'Kelola pengisian restok produk dengan filter dan pengelompokan rapi per kategori.'
              : 'Pantau stok live dari Master Produk, mutasi barang, dan riwayat penyesuaian per produk.'}
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchInitialData}
            disabled={isLoading}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm"
            title="Muat Ulang Data"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin text-emerald-600' : ''} />
          </button>
          <button 
            onClick={() => {
              if (products.length > 0) {
                openAdjustmentModal(products[0], 'subtract');
              }
            }}
            className="bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-700 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <ArrowRightLeft size={16} strokeWidth={2.5} className="text-red-500" />
            Pengurangan Stok
          </button>
          <button 
            onClick={() => {
              if (products.length > 0) {
                openAdjustmentModal(products[0], 'add');
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-2 text-sm active:scale-95"
          >
            <ArrowDownToLine size={17} strokeWidth={2.5} />
            + Restok Masuk
          </button>
        </div>
      </div>

      {/* STATISTIK RINGKAS STOK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Produk Master</p>
            <p className="text-2xl font-black text-slate-900">{totalSku} <span className="text-xs font-semibold text-slate-400">SKU</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Unit Fisik</p>
            <p className="text-2xl font-black text-slate-900">{totalUnits.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-400">Pcs</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Butuh Restok (≤ 20)</p>
            <p className="text-2xl font-black text-amber-600">{lowStockCount} <span className="text-xs font-semibold text-slate-400">SKU</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Kosong (0)</p>
            <p className="text-2xl font-black text-red-600">{outOfStockCount} <span className="text-xs font-semibold text-slate-400">SKU</span></p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATOR: RESTOK PRODUK vs MANAJEMEN STOK */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab('restock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'restock'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ArrowDownToLine size={16} strokeWidth={2.5} />
          Restok Produk (Per Kategori)
          {lowStockCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'restock' ? 'bg-white text-emerald-800' : 'bg-red-500 text-white'
            }`}>
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'stock'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Archive size={16} strokeWidth={2.5} />
          Manajemen Stok & Monitoring
        </button>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text" 
              placeholder="Cari SKU, Nama Barang..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* FILTER KATEGORI (Fitur Restok dapat difilter berdasarkan kategori) */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <Folder size={16} className="text-emerald-600 ml-1 hidden sm:block" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kategori ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER STATUS STOK */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <Filter size={16} className="text-slate-400 ml-1 hidden sm:block" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="LOW">🚨 Butuh Restok (≤ 20)</option>
              <option value="WARNING">⚠️ Stok Menipis (21 - 50)</option>
              <option value="SAFE">✅ Stok Aman (&gt; 50)</option>
              <option value="EMPTY">❌ Stok Kosong (0)</option>
            </select>
          </div>

          {/* PENGURUTAN (SORT BY) */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="stock_asc">Stok Terendah (Prioritas Restok)</option>
              <option value="stock_desc">Stok Tertinggi</option>
              <option value="name_asc">Nama Barang (A-Z)</option>
            </select>
          </div>
        </div>

        {/* SUB-TOOLBAR (PENGELOMPOKAN KATEGORI TOGGLE) */}
        {activeTab === 'restock' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Tampilan Restok:</span>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setIsGroupedByCategory(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    isGroupedByCategory ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers size={14} /> Dikelompokkan per Kategori
                </button>
                <button
                  onClick={() => setIsGroupedByCategory(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    !isGroupedByCategory ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package size={14} /> Daftar Tabel Tunggal
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>Menampilkan <b>{filteredProducts.length}</b> produk</span>
              {selectedCategoryFilter !== 'ALL' && (
                <button 
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  (Reset Filter Kategori)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* KONTEN TAB 1: RESTOK PRODUK (PENGELOMPOKAN PER KATEGORI) */}
      {/* ======================================================== */}
      {activeTab === 'restock' && isGroupedByCategory ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              <p className="text-slate-500 font-medium">Memuat data produk dan kategori...</p>
            </div>
          ) : groupedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Archive size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-bold text-base">Tidak ada produk yang sesuai filter.</p>
              <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci pencarian atau filter kategori.</p>
            </div>
          ) : (
            groupedProducts.map((group) => {
              const cat = group.category;
              const items = group.items;
              const isCollapsed = collapsedCategories[cat.id];
              const groupTotalStock = items.reduce((sum, it) => sum + it.stock, 0);
              const groupLowStock = items.filter(it => it.stock <= 20).length;

              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
                  {/* HEADER KELOMPOK KATEGORI */}
                  <div 
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-slate-50/50 to-white flex items-center justify-between cursor-pointer hover:bg-emerald-50/90 transition-colors border-b border-slate-100 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                        <Folder size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                            {items.length} Produk
                          </span>
                          {groupLowStock > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle size={11} /> {groupLowStock} Butuh Restok
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Total Unit Stok Kategori: <b className="text-slate-800">{groupTotalStock.toLocaleString('id-ID')} Pcs</b>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* TABEL PRODUK DALAM KELOMPOK KATEGORI */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium text-sm">
                          Tidak ada produk aktif dalam kategori ini.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/60 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                              <th className="p-4 font-bold">Produk (SKU & Nama)</th>
                              <th className="p-4 font-bold">Harga Master</th>
                              <th className="p-4 font-bold text-center">Stok Saat Ini</th>
                              <th className="p-4 font-bold">Status Kebutuhan</th>
                              <th className="p-4 font-bold text-right">Aksi Restok Cepat</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-100">
                            {items.map((item) => {
                              const isLow = item.stock <= 20;
                              const isWarning = item.stock > 20 && item.stock <= 50;
                              const thumb = (item.image_urls && item.image_urls.length > 0) ? item.image_urls[0] : item.image_url;

                              return (
                                <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                                  {/* Info Produk */}
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                                        {thumb ? (
                                          <img src={thumb} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <Package size={20} className="text-slate-400" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900 leading-snug">{item.name}</p>
                                        <p className="text-xs font-semibold text-emerald-700 mt-0.5">{item.sku || 'SKU Tidak Ada'}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Harga */}
                                  <td className="p-4 font-semibold text-slate-700">
                                    Rp {Number(item.price || 0).toLocaleString('id-ID')}
                                  </td>

                                  {/* Stok Saat Ini */}
                                  <td className="p-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-xl font-black text-base ${
                                      item.stock === 0 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : isLow 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                        : isWarning
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {item.stock}
                                    </span>
                                  </td>

                                  {/* Status Kebutuhan */}
                                  <td className="p-4">
                                    {item.stock === 0 ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                        <AlertCircle size={13} className="text-red-600" /> Stok Kosong!
                                      </span>
                                    ) : isLow ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        <AlertTriangle size={13} className="text-amber-600" /> Butuh Restok
                                      </span>
                                    ) : isWarning ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        <Clock size={13} className="text-blue-500" /> Stok Menipis
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 size={13} className="text-emerald-500" /> Stok Aman
                                      </span>
                                    )}
                                  </td>

                                  {/* Aksi Restok & Pantau */}
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {/* Quick Restok Button */}
                                      <button
                                        onClick={() => openAdjustmentModal(item, 'add')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:shadow"
                                        title="Tambah Restok"
                                      >
                                        <Plus size={14} strokeWidth={3} /> Restok
                                      </button>

                                      {/* Pantau Riwayat Mutasi */}
                                      <button
                                        onClick={() => openHistoryModal(item)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                        title="Pantau Riwayat Stok Produk Ini"
                                      >
                                        <History size={14} /> Riwayat
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* KONTEN TAB 2 ATAU TABEL TUNGGAL (MASTER STOK & MONITORING) */
        /* ======================================================== */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-bold">SKU & Nama Barang</th>
                  <th className="p-4 font-bold">Kategori</th>
                  <th className="p-4 font-bold">Harga Master</th>
                  <th className="p-4 font-bold text-center">Stok Terhubung</th>
                  <th className="p-4 font-bold">Status Ketersediaan</th>
                  <th className="p-4 font-bold text-right">Aksi & Pemantauan</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                      Memuat data dari Master Produk...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                      Tidak ada data produk yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => {
                    const isLow = item.stock <= 20;
                    const isWarning = item.stock > 20 && item.stock <= 50;
                    const thumb = (item.image_urls && item.image_urls.length > 0) ? item.image_urls[0] : item.image_url;

                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                        {/* Info Produk */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {thumb ? (
                                <img src={thumb} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{item.name}</p>
                              <p className="text-xs font-semibold text-emerald-700">{item.sku || 'No SKU'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="p-4">
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.categories?.name || 'Lainnya'}
                          </span>
                        </td>

                        {/* Harga */}
                        <td className="p-4 font-semibold text-slate-700">
                          Rp {Number(item.price || 0).toLocaleString('id-ID')}
                        </td>

                        {/* Stok Live */}
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3.5 py-1.5 rounded-xl font-black text-base ${
                            item.stock === 0 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : isLow 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : isWarning
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.stock}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {item.stock === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <AlertCircle size={13} className="text-red-600" /> Stok Kosong!
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle size={13} className="text-amber-600" /> Butuh Restok
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={13} className="text-blue-500" /> Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={13} className="text-emerald-500" /> Aman
                            </span>
                          )}
                        </td>

                        {/* Aksi & Riwayat */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAdjustmentModal(item, 'add')}
                              className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Restok Produk"
                            >
                              <Plus size={13} strokeWidth={3} /> Restok
                            </button>

                            <button
                              onClick={() => openAdjustmentModal(item, 'subtract')}
                              className="text-slate-600 hover:text-red-700 bg-slate-50 hover:bg-red-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Pengurangan Stok"
                            >
                              <Minus size={13} strokeWidth={3} /> Kurang
                            </button>

                            <button
                              onClick={() => openHistoryModal(item)}
                              className="text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Pantau Riwayat Perubahan Stok"
                            >
                              <History size={13} /> Riwayat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PENYESUAIAN STOK (RESTOK / PENGURANGAN / SET)       */}
      {/* ======================================================== */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2">
                {modalType === 'add' ? (
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <ArrowDownToLine size={18} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                    <ArrowRightLeft size={18} strokeWidth={2.5} />
                  </div>
                )}
                <h2 className="text-lg font-bold text-slate-900">
                  {modalType === 'add' ? 'Restok Masuk (Tambah Stok)' : modalType === 'subtract' ? 'Pengurangan Stok' : 'Penyesuaian Stok Fisik'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              {/* Product Info Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PRODUK TERPILIH</p>
                <p className="text-sm font-bold text-slate-900">{selectedProduct.name}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
                  <span className="font-semibold text-emerald-700">{selectedProduct.sku || 'Tanpa SKU'}</span>
                  <span className="text-slate-600 font-medium">Stok Saat Ini: <b className="text-slate-900 text-sm">{selectedProduct.stock}</b></span>
                </div>
              </div>

              {/* Selector jika ingin ganti produk langsung */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">PILIH PRODUK LAIN</label>
                <select 
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const found = products.find(p => p.id === e.target.value);
                    if (found) setSelectedProduct(found);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-800 bg-white"
                >
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) — Stok: {item.stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Jumlah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
                  JUMLAH {modalType === 'add' ? 'RESTOK (+)' : modalType === 'subtract' ? 'PENGURANGAN (-)' : 'STOK BARU'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="Contoh: 50"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-slate-900"
                />

                {/* Preset Tombol Cepat */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400 font-medium">Preset Cepat:</span>
                  {[10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdjustmentAmount(num.toString())}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan / Keterangan Mutasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
                  CATATAN / KETERANGAN MUTASI <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Restok Surat Jalan #SJ-9982"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              {/* Kalkulasi Preview */}
              {adjustmentAmount && parseInt(adjustmentAmount, 10) > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs flex justify-between items-center text-emerald-900 font-medium">
                  <span>Stok Awal: <b>{selectedProduct.stock}</b></span>
                  <span>{modalType === 'add' ? '+' : '-'} {adjustmentAmount}</span>
                  <span>Stok Akhir: <b className="text-sm text-emerald-700 font-black">
                    {modalType === 'add' ? selectedProduct.stock + parseInt(adjustmentAmount, 10) : Math.max(0, selectedProduct.stock - parseInt(adjustmentAmount, 10))}
                  </b></span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                    modalType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : modalType === 'add' ? (
                    <ArrowDownToLine size={14} strokeWidth={2.5} />
                  ) : (
                    <ArrowRightLeft size={14} strokeWidth={2.5} />
                  )}
                  {modalType === 'add' ? 'Simpan Restok' : 'Simpan Pengurangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PANTAU RIWAYAT PERUBAHAN STOK PER PRODUK            */}
      {/* ======================================================== */}
      {isHistoryModalOpen && historyProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Riwayat Perubahan Stok</h2>
                  <p className="text-xs text-slate-500">Pantau mutasi dan riwayat restok/pengurangan produk ini</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Product Quick Info Card */}
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 mb-1 inline-block">
                    {historyProduct.categories?.name || 'Kategori'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{historyProduct.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">{historyProduct.sku || 'SKU Tidak Diketahui'}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Saat Ini</p>
                  <p className="text-2xl font-black text-emerald-600">{historyProduct.stock} <span className="text-xs font-semibold text-slate-400">Pcs</span></p>
                </div>
              </div>

              {/* Form Tambah Restok Cepat dari Riwayat */}
              <form onSubmit={handleHistoryQuickRestock} className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <input 
                  type="number" 
                  min="1"
                  required
                  placeholder="+ Jumlah Restok"
                  value={historyRestockAmount}
                  onChange={(e) => setHistoryRestockAmount(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-full sm:w-36"
                />
                <input 
                  type="text" 
                  placeholder="Catatan (misal: Penerimaan PO #02)"
                  value={historyRestockNotes}
                  onChange={(e) => setHistoryRestockNotes(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs flex-1 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isHistorySubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> + Restok Cepat
                </button>
              </form>
            </div>

            {/* List Riwayat Log Perubahan */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                LOG PERUBAHAN STOK ({stockLogs.length} Aktivitas)
              </h4>

              {isLoadingLogs ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-xs text-slate-500 font-medium">Mengambil riwayat mutasi...</p>
                </div>
              ) : stockLogs.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-slate-200/80 p-6">
                  <History size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat Tercatat</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Setiap penyesuaian, restok, atau pengurangan stok di aplikasi akan tercatat secara otomatis di tabel log ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stockLogs.map((log) => {
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
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
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

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
