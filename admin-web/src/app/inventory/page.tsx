'use client';

import React, { useState, useEffect } from 'react';
import { Search, Archive, AlertTriangle, ArrowRightLeft, ArrowDownToLine, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'subtract'
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, name, stock')
      .order('name', { ascending: true });
      
    if (!error && data) {
      setInventory(data as any);
    }
    setIsLoading(false);
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !adjustmentAmount) return;

    const amount = parseInt(adjustmentAmount);
    const product = inventory.find(p => p.id === selectedProductId);
    if (!product) return;

    let newStock = product.stock;
    if (adjustmentType === 'add') newStock += amount;
    else newStock = Math.max(0, newStock - amount);

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProductId);

    if (!error) {
      setInventory(inventory.map(p => p.id === selectedProductId ? { ...p, stock: newStock } : p));
      setIsModalOpen(false);
      setAdjustmentAmount('');
    } else {
      alert("Gagal memperbarui stok.");
    }
  };

  const filteredInventory = inventory.filter((item) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Archive size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Stok</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Pantau ketersediaan barang dan lakukan penyesuaian stok (Live Supabase).</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setAdjustmentType('subtract'); setIsModalOpen(true); }}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <ArrowRightLeft size={18} strokeWidth={2.5} /> Pengurangan
          </button>
          <button 
            onClick={() => { setAdjustmentType('add'); setIsModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
          >
            <ArrowDownToLine size={18} strokeWidth={2.5} /> Restock (Tambah)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari SKU, Nama Barang..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">SKU & Nama Barang</th>
              <th className="p-5 font-semibold border-b border-gray-100">Stok Tersedia</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status Stok</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Memuat data dari Supabase...</td>
              </tr>
            ) : filteredInventory.length === 0 ? (
               <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Belum ada barang di inventory.</td>
              </tr>
            ) : filteredInventory.map((item) => {
              const isLowStock = item.stock <= 20; // Default min stock 20 for logic
              return (
                <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="p-5">
                    <p className="font-bold text-slate-900 mb-0.5">{item.name}</p>
                    <p className="text-xs font-semibold text-slate-400">{item.sku}</p>
                  </td>
                  <td className="p-5 text-slate-900 font-bold text-lg">
                    {item.stock}
                  </td>
                  <td className="p-5">
                    {isLowStock ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100/50 text-red-700 border border-red-200/50">
                        <AlertTriangle size={14} className="text-red-500" /> Butuh Restock
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100/50 text-emerald-700 border border-emerald-200/50">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Aman
                      </div>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => { setSelectedProductId(item.id); setAdjustmentType('add'); setIsModalOpen(true); }}
                      className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    >
                      Sesuaikan Stok
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {adjustmentType === 'add' ? 'Penambahan Stok' : 'Pengurangan Stok'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAdjustment} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">PILIH PRODUK <span className="text-red-500">*</span></label>
                <select 
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800 bg-white"
                >
                  <option value="" disabled>Pilih Produk...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} (Stok: {item.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 tracking-wide">JUMLAH ({adjustmentType === 'add' ? '+' : '-'}) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-gray-900"
                />
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
                  className={`px-6 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${
                    adjustmentType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {adjustmentType === 'add' ? 'Tambah Stok' : 'Kurangi Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
