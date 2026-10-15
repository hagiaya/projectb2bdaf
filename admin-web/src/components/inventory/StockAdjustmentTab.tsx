'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Plus, 
  Search, 
  Calendar, 
  Download, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  X, 
  FileText,
  Boxes,
  Eye,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface StockAdjustmentDoc {
  id: string;
  adjustment_number: string;
  adjustment_date: string;
  warehouse: string;
  product_id: string;
  product_name: string;
  sku: string;
  system_stock: number;
  physical_stock: number;
  diff_qty: number;
  unit_price: number;
  diff_amount: number;
  reason: string;
  notes: string;
  created_by: string;
  created_at: string;
}

const ADJUSTMENT_REASONS = [
  'Stok Opname Fisik Rutin',
  'Barang Rusak / Pecah / Cacat Pabrik',
  'Selisih Penghitungan Gudang',
  'Pengambilan Sample / Display Promosi',
  'Koreksi Saldo Awal Persediaan',
  'Hilang / Selisih Bongkar Muat',
  'Lain-lain',
];

interface StockAdjustmentTabProps {
  products: any[];
  adminEmail: string;
  onRefreshStock: () => void;
}

const STORAGE_KEY = 'erp_stock_adjustments_v1';

export default function StockAdjustmentTab({
  products,
  adminEmail,
  onRefreshStock,
}: StockAdjustmentTabProps) {
  const [adjustments, setAdjustments] = useState<StockAdjustmentDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [diffTypeFilter, setDiffTypeFilter] = useState<'ALL' | 'PLUS' | 'MINUS' | 'EQUAL'>('ALL');

  // Modal Create Adjustment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [warehouse, setWarehouse] = useState('Gudang Utama / Pusat (Jakarta)');
  const [physicalStockInput, setPhysicalStockInput] = useState('');
  const [selectedReason, setSelectedReason] = useState(ADJUSTMENT_REASONS[0]);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // Modal Detail
  const [selectedDoc, setSelectedDoc] = useState<StockAdjustmentDoc | null>(null);

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAdjustments(JSON.parse(saved));
      } else {
        const sample: StockAdjustmentDoc[] = [
          {
            id: 'adj-sample-1',
            adjustment_number: 'ADJ-20261014-001',
            adjustment_date: new Date().toISOString().slice(0, 10),
            warehouse: 'Gudang Utama / Pusat (Jakarta)',
            product_id: products[0]?.id || 'p-1',
            product_name: products[0]?.name || 'Sample Produk DAP',
            sku: products[0]?.sku || 'SKU-001',
            system_stock: (products[0]?.stock || 50) + 2,
            physical_stock: products[0]?.stock || 50,
            diff_qty: -2,
            unit_price: Number(products[0]?.price || 50000),
            diff_amount: -2 * Number(products[0]?.price || 50000),
            reason: 'Barang Rusak / Pecah / Cacat Pabrik',
            notes: '2 unit pecah saat pemindahan palet rak gudang',
            created_by: adminEmail || 'Admin',
            created_at: new Date().toISOString(),
          }
        ];
        setAdjustments(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      }
    } catch (e) {
      console.error('Error loading stock adjustments:', e);
    }
  };

  const saveAdjustments = (updated: StockAdjustmentDoc[]) => {
    setAdjustments(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving adjustments:', e);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const diffCalc = useMemo(() => {
    if (!selectedProduct || physicalStockInput === '') {
      return { diffQty: 0, diffAmount: 0 };
    }
    const physical = parseInt(physicalStockInput, 10);
    if (isNaN(physical)) return { diffQty: 0, diffAmount: 0 };
    const diff = physical - selectedProduct.stock;
    const amount = diff * (Number(selectedProduct.price) || 0);
    return { diffQty: diff, diffAmount: amount };
  }, [selectedProduct, physicalStockInput]);

  const handleOpenCreateModal = () => {
    setSelectedProductId(products[0]?.id || '');
    setPhysicalStockInput('');
    setSelectedReason(ADJUSTMENT_REASONS[0]);
    setAdjustmentNotes('');
    setIsModalOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Pilih produk terlebih dahulu.');
      return;
    }
    const physicalQty = parseInt(physicalStockInput, 10);
    if (isNaN(physicalQty) || physicalQty < 0) {
      alert('Masukkan angka stok fisik yang valid (>= 0).');
      return;
    }

    setIsSubmitting(true);
    try {
      const prevStock = selectedProduct.stock;
      const newStock = physicalQty;
      const diffQty = newStock - prevStock;
      const unitPrice = Number(selectedProduct.price) || 0;
      const diffAmount = diffQty * unitPrice;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const adjNumber = `ADJ-${dateStr}-${randomSuffix}`;
      const nowIso = new Date().toISOString();

      // 1. Update stok di Master Produk (Supabase)
      const { error: prodErr } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', selectedProduct.id);

      if (prodErr) throw prodErr;

      // 2. Simpan audit log ke stock_logs
      await supabase.from('stock_logs').insert([{
        product_id: selectedProduct.id,
        type: 'ADJUSTMENT',
        quantity: Math.abs(diffQty),
        previous_stock: prevStock,
        current_stock: newStock,
        notes: `[OPNAME:${adjNumber}] ${selectedReason} | Selisih: ${diffQty > 0 ? '+' : ''}${diffQty} unit | ${adjustmentNotes || '-'}`,
        created_by: adminEmail || 'Admin',
      }]);

      // 3. Simpan dokumen penyesuaian lokal
      const newDoc: StockAdjustmentDoc = {
        id: `adj-${Date.now()}`,
        adjustment_number: adjNumber,
        adjustment_date: new Date().toISOString().slice(0, 10),
        warehouse,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        sku: selectedProduct.sku || '-',
        system_stock: prevStock,
        physical_stock: newStock,
        diff_qty: diffQty,
        unit_price: unitPrice,
        diff_amount: diffAmount,
        reason: selectedReason,
        notes: adjustmentNotes.trim() || 'Penyesuaian stok fisik hasil opname',
        created_by: adminEmail || 'Admin',
        created_at: nowIso,
      };

      const updated = [newDoc, ...adjustments];
      saveAdjustments(updated);

      alert(`Penyesuaian stok "${adjNumber}" berhasil diproses! Stok produk telah disinkronkan ke ${newStock} unit.`);
      setIsModalOpen(false);
      onRefreshStock();
    } catch (err: any) {
      alert('Gagal memproses penyesuaian: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered adjustments
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(adj => {
      if (reasonFilter !== 'ALL' && adj.reason !== reasonFilter) return false;
      if (diffTypeFilter === 'PLUS' && adj.diff_qty <= 0) return false;
      if (diffTypeFilter === 'MINUS' && adj.diff_qty >= 0) return false;
      if (diffTypeFilter === 'EQUAL' && adj.diff_qty !== 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mNum = adj.adjustment_number.toLowerCase().includes(q);
        const mName = adj.product_name.toLowerCase().includes(q);
        const mSku = adj.sku.toLowerCase().includes(q);
        const mNotes = adj.notes.toLowerCase().includes(q);
        if (!mNum && !mName && !mSku && !mNotes) return false;
      }
      return true;
    });
  }, [adjustments, reasonFilter, diffTypeFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalDocs = adjustments.length;
    let totalPlusQty = 0;
    let totalMinusQty = 0;
    let netAmount = 0;

    adjustments.forEach(a => {
      if (a.diff_qty > 0) totalPlusQty += a.diff_qty;
      if (a.diff_qty < 0) totalMinusQty += Math.abs(a.diff_qty);
      netAmount += (a.diff_amount || 0);
    });

    return { totalDocs, totalPlusQty, totalMinusQty, netAmount };
  }, [adjustments]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredAdjustments.length === 0) {
      alert('Tidak ada data penyesuaian persediaan untuk diekspor.');
      return;
    }

    const rows = filteredAdjustments.map(a => ({
      'No. Penyesuaian': a.adjustment_number,
      'Tanggal': a.adjustment_date,
      'Lokasi Gudang': a.warehouse,
      'SKU': a.sku,
      'Nama Barang': a.product_name,
      'Stok Buku (Sistem)': a.system_stock,
      'Stok Fisik (Opname)': a.physical_stock,
      'Selisih Qty': a.diff_qty,
      'Harga Satuan (Rp)': a.unit_price,
      'Nilai Selisih (Rp)': a.diff_amount,
      'Alasan Penyesuaian': a.reason,
      'Catatan': a.notes,
      'Petugas': a.created_by,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penyesuaian_Persediaan');
    XLSX.writeFile(wb, `Laporan_Penyesuaian_Persediaan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Sliders size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Penyesuaian Persediaan (Stok Opname)</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Penyesuaian stok buku sistem dengan stok fisik riil, koreksi selisih hitung, dan pencatatan barang rusak.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Download Excel"
          >
            <Download size={15} /> Export Excel
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} /> Buat Penyesuaian / Opname
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Penyesuaian</span>
            <FileText size={18} className="text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{metrics.totalDocs}</p>
          <p className="text-xs text-slate-500 mt-1">Dokumen opname dicatat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Selisih Lebih (+)</span>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">+{metrics.totalPlusQty.toLocaleString('id-ID')} unit</p>
          <p className="text-xs text-slate-500 mt-1">Stok fisik melebihi sistem</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Selisih Kurang (-)</span>
            <TrendingDown size={18} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">-{metrics.totalMinusQty.toLocaleString('id-ID')} unit</p>
          <p className="text-xs text-slate-500 mt-1">Barang rusak / susut / hilang</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Nilai Selisih</span>
            <Boxes size={18} className="text-amber-600" />
          </div>
          <p className={`text-2xl font-black ${metrics.netAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {metrics.netAmount >= 0 ? '+' : ''}Rp {metrics.netAmount.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Valuasi rupiah hasil opname</p>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari No. Dokumen, SKU, Nama Barang, atau Catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select
            value={diffTypeFilter}
            onChange={(e) => setDiffTypeFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">Semua Selisih</option>
            <option value="PLUS">Selisih Lebih (+)</option>
            <option value="MINUS">Selisih Kurang (-)</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[220px]"
          >
            <option value="ALL">Semua Alasan</option>
            {ADJUSTMENT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Penyesuaian Persediaan */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100/60 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 font-semibold">No. Dokumen & Tanggal</th>
                <th className="p-4 font-semibold">Produk & SKU</th>
                <th className="p-4 font-semibold">Lokasi Gudang</th>
                <th className="p-4 font-semibold text-center">Buku vs Fisik</th>
                <th className="p-4 font-semibold text-center">Selisih Qty</th>
                <th className="p-4 font-semibold text-right">Nilai Selisih (Rp)</th>
                <th className="p-4 font-semibold">Alasan Opname</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Sliders size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada dokumen penyesuaian persediaan</p>
                    <p className="text-[11px] text-slate-400 mt-1">Klik "+ Buat Penyesuaian / Opname" untuk mencocokkan stok fisik di rak.</p>
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((a) => {
                  const isPlus = a.diff_qty > 0;
                  const isMinus = a.diff_qty < 0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <p className="font-black text-slate-900">{a.adjustment_number}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} /> {a.adjustment_date}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{a.product_name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {a.sku}</span>
                      </td>

                      <td className="p-4 font-medium text-slate-700">
                        {a.warehouse}
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-semibold text-slate-500">{a.system_stock}</span>
                        <span className="text-slate-300 mx-1.5">➔</span>
                        <span className="font-black text-slate-900">{a.physical_stock}</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                          isPlus ? 'bg-emerald-100 text-emerald-800' : isMinus ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isPlus ? `+${a.diff_qty}` : a.diff_qty} unit
                        </span>
                      </td>

                      <td className={`p-4 text-right font-black ${isPlus ? 'text-emerald-700' : isMinus ? 'text-rose-600' : 'text-slate-700'}`}>
                        {isPlus ? '+' : ''}Rp {a.diff_amount.toLocaleString('id-ID')}
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded text-[11px] border border-amber-200">
                          {a.reason}
                        </span>
                        {a.notes && <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">"{a.notes}"</p>}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedDoc(a)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Form Buat Penyesuaian Persediaan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Sliders size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Buat Penyesuaian Persediaan (Opname)</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4 mt-4 text-xs">
              {/* Gudang */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Gudang Penyesuaian:</label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Gudang Utama / Pusat (Jakarta)">Gudang Utama / Pusat (Jakarta)</option>
                  <option value="Gudang Toko / Display (Showroom)">Gudang Toko / Display (Showroom)</option>
                  <option value="Gudang Transit & Ekspedisi">Gudang Transit & Ekspedisi</option>
                  <option value="Gudang Retur & Barang Reject">Gudang Retur & Barang Reject</option>
                </select>
              </div>

              {/* Pilih Produk */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Produk Barang:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku || '-'} | Stok Saat Ini: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Perbandingan Stok Buku vs Fisik */}
              {selectedProduct && (
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Stok Buku (Sistem)</span>
                    <p className="text-xl font-black text-slate-700 mt-1">{selectedProduct.stock}</p>
                    <span className="text-[10px] text-slate-400">unit</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Stok Fisik Aktual</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Input fisik..."
                      value={physicalStockInput}
                      onChange={(e) => setPhysicalStockInput(e.target.value)}
                      className="w-full p-1.5 mt-1 bg-white border-2 border-amber-400 rounded-xl font-black text-lg text-center text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Selisih (+/-)</span>
                    <p className={`text-xl font-black mt-1 ${
                      diffCalc.diffQty > 0 ? 'text-emerald-600' : diffCalc.diffQty < 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      {diffCalc.diffQty > 0 ? `+${diffCalc.diffQty}` : diffCalc.diffQty}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      (Rp {diffCalc.diffAmount.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>
              )}

              {/* Alasan Penyesuaian */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Penyesuaian / Opname:</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {ADJUSTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catatan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Catatan Tambahan:</label>
                <textarea
                  rows={2}
                  placeholder="Catat nomor rak atau kronologi selisih penghitungan..."
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-600/20"
                >
                  {isSubmitting ? 'Memproses...' : 'Terapkan Penyesuaian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detail Dokumen Opname */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Rincian Dokumen Penyesuaian</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Nomor Dokumen:</span>
                <span className="font-mono font-black text-slate-800">{selectedDoc.adjustment_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Tanggal Opname:</span>
                <span className="font-semibold text-slate-800">{selectedDoc.adjustment_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Lokasi Gudang:</span>
                <span className="font-semibold text-slate-800">{selectedDoc.warehouse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Barang:</span>
                <span className="font-bold text-slate-900 text-right">{selectedDoc.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">SKU Produk:</span>
                <span className="font-mono text-slate-700">{selectedDoc.sku}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-bold">Stok Sistem:</span>
                <span className="font-bold text-slate-700">{selectedDoc.system_stock} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Stok Fisik Di Rak:</span>
                <span className="font-black text-slate-900">{selectedDoc.physical_stock} unit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Selisih (+/-):</span>
                <span className={`font-black ${selectedDoc.diff_qty > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {selectedDoc.diff_qty > 0 ? `+${selectedDoc.diff_qty}` : selectedDoc.diff_qty} unit
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Nilai Selisih Rupiah:</span>
                <span className="font-black text-slate-900">Rp {selectedDoc.diff_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Alasan:</span>
                <span className="font-bold text-amber-800">{selectedDoc.reason}</span>
              </div>
              {selectedDoc.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-bold block mb-0.5">Catatan:</span>
                  <p className="text-slate-700 italic">"{selectedDoc.notes}"</p>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Petugas: {selectedDoc.created_by}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDoc(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
