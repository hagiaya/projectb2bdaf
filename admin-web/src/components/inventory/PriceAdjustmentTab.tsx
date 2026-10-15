'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Calendar, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Boxes, 
  X, 
  Trash2, 
  Eye, 
  FileText,
  DollarSign,
  Tag,
  ArrowRightLeft,
  Percent,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface PriceAdjustmentItem {
  product_id: string;
  sku: string;
  name: string;
  category_name?: string;
  current_stock: number;
  old_price: number;
  new_price: number;
  diff_amount: number;
  diff_percent: number;
}

export interface PriceAdjustmentDoc {
  id: string;
  adjustment_number: string;
  adjustment_date: string;
  effective_date: string;
  reason: string;
  notes: string;
  created_by: string;
  created_at: string;
  items: PriceAdjustmentItem[];
  total_items: number;
  status: 'APPLIED' | 'DRAFT';
}

interface PriceAdjustmentTabProps {
  products: any[];
  adminEmail: string;
  onRefreshStock: () => void;
}

export const PRICE_ADJUSTMENT_REASONS = [
  'Kenaikan Kurs / Valuta Asing (Impor)',
  'Penyesuaian Harga Pabrik / Principal',
  'Kenaikan Biaya Logistik & Operasional',
  'Penyesuaian Pasar & Inflasi',
  'Program Promo / Diskon Periode Terbatas',
  'Cuci Gudang / Clearance Sale',
  'Koreksi Kesalahan Input Harga Sebelumnya',
  'Lainnya / Kebijakan Manajemen'
];

const STORAGE_KEY = 'erp_price_adjustments_v1';

export default function PriceAdjustmentTab({
  products,
  adminEmail,
  onRefreshStock,
}: PriceAdjustmentTabProps) {
  const [adjustments, setAdjustments] = useState<PriceAdjustmentDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [trendFilter, setTrendFilter] = useState<'ALL' | 'UP' | 'DOWN' | 'EQUAL'>('ALL');

  // Modal Create Adjustment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedReason, setSelectedReason] = useState(PRICE_ADJUSTMENT_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [selectedLines, setSelectedLines] = useState<PriceAdjustmentItem[]>([]);

  // Picker Row state
  const [pickerProductId, setPickerProductId] = useState('');
  const [pickerNewPrice, setPickerNewPrice] = useState('');

  // Modal Detail & Print
  const [selectedDoc, setSelectedDoc] = useState<PriceAdjustmentDoc | null>(null);

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAdjustments(JSON.parse(saved));
      } else {
        // Initial sample data if empty
        const sample: PriceAdjustmentDoc[] = [
          {
            id: 'adj-prc-init-1',
            adjustment_number: 'ADJ-PRC-20261014-001',
            adjustment_date: '2026-10-14 10:15',
            effective_date: '2026-10-14',
            reason: 'Penyesuaian Harga Pabrik / Principal',
            notes: 'Pemberitahuan resmi kenaikan harga per kuartal 4 dari principal.',
            created_by: 'Supervisor Operasional',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'APPLIED',
            total_items: 2,
            items: [
              {
                product_id: 'sample-p1',
                sku: 'PRD-001',
                name: 'Oli Mesin Premium 1L',
                category_name: 'Pelumas & Oli',
                current_stock: 120,
                old_price: 65000,
                new_price: 72000,
                diff_amount: 7000,
                diff_percent: 10.77,
              },
              {
                product_id: 'sample-p2',
                sku: 'PRD-002',
                name: 'Filter Udara Racing Pro',
                category_name: 'Sparepart',
                current_stock: 45,
                old_price: 45000,
                new_price: 48000,
                diff_amount: 3000,
                diff_percent: 6.67,
              }
            ]
          }
        ];
        setAdjustments(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      }
    } catch (e) {
      console.error('Error loading price adjustments:', e);
    }
  };

  const saveAdjustments = (updated: PriceAdjustmentDoc[]) => {
    setAdjustments(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving price adjustments:', e);
    }
  };

  // Add Item to Line list
  const handleAddLineItem = () => {
    if (!pickerProductId) {
      alert('Pilih produk terlebih dahulu.');
      return;
    }
    const newPriceNum = parseFloat(pickerNewPrice);
    if (isNaN(newPriceNum) || newPriceNum < 0) {
      alert('Masukkan harga baru yang valid (angka positif).');
      return;
    }

    const prod = products.find(p => p.id === pickerProductId);
    if (!prod) return;

    if (selectedLines.some(line => line.product_id === prod.id)) {
      alert('Produk ini sudah ada di daftar penyesuaian saat ini.');
      return;
    }

    const oldPrice = prod.price || 0;
    const diffAmount = newPriceNum - oldPrice;
    const diffPercent = oldPrice > 0 ? (diffAmount / oldPrice) * 100 : 0;

    const newLine: PriceAdjustmentItem = {
      product_id: prod.id,
      sku: prod.sku || '-',
      name: prod.name,
      category_name: prod.categories?.name || 'Umum',
      current_stock: prod.stock || 0,
      old_price: oldPrice,
      new_price: newPriceNum,
      diff_amount: diffAmount,
      diff_percent: diffPercent,
    };

    setSelectedLines([...selectedLines, newLine]);
    setPickerProductId('');
    setPickerNewPrice('');
  };

  const handleRemoveLineItem = (index: number) => {
    setSelectedLines(selectedLines.filter((_, i) => i !== index));
  };

  const handleUpdateLinePrice = (index: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = [...selectedLines];
    const item = updated[index];
    const diffAmount = num - item.old_price;
    const diffPercent = item.old_price > 0 ? (diffAmount / item.old_price) * 100 : 0;
    updated[index] = {
      ...item,
      new_price: num,
      diff_amount: diffAmount,
      diff_percent: diffPercent,
    };
    setSelectedLines(updated);
  };

  // Submit Document & Sync to Supabase
  const handleCreateAdjustment = async () => {
    if (selectedLines.length === 0) {
      alert('Tambahkan minimal 1 produk untuk disesuaikan harganya.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const docNumber = `ADJ-PRC-${dateCode}-${randomSuffix}`;
      const formattedDate = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 1. Update product prices in Supabase
      for (const line of selectedLines) {
        const { error: prodErr } = await supabase
          .from('products')
          .update({ price: line.new_price })
          .eq('id', line.product_id);

        if (prodErr) {
          console.error(`Failed to update price for ${line.name}:`, prodErr);
        }

        // 2. Insert into stock_logs for complete audit trail
        const trendSign = line.diff_amount > 0 ? '+' : '';
        const logNotes = `[PENYESUAIAN_HARGA: ${docNumber}] Harga diubah: Rp ${line.old_price.toLocaleString('id-ID')} -> Rp ${line.new_price.toLocaleString('id-ID')} (${trendSign}${line.diff_percent.toFixed(1)}%). Alasan: ${selectedReason}. Catatan: ${notes || '-'}`;

        await supabase.from('stock_logs').insert({
          product_id: line.product_id,
          type: 'ADJUSTMENT',
          quantity: 0,
          previous_stock: line.current_stock,
          current_stock: line.current_stock,
          notes: logNotes,
          created_by: adminEmail || 'Admin',
        });
      }

      // 3. Build doc object and save locally
      const newDoc: PriceAdjustmentDoc = {
        id: `adj-prc-${Date.now()}`,
        adjustment_number: docNumber,
        adjustment_date: formattedDate,
        effective_date: effectiveDate,
        reason: selectedReason,
        notes: notes || '-',
        created_by: adminEmail || 'Admin',
        created_at: now.toISOString(),
        items: selectedLines,
        total_items: selectedLines.length,
        status: 'APPLIED',
      };

      saveAdjustments([newDoc, ...adjustments]);
      setIsModalOpen(false);
      setSelectedLines([]);
      setNotes('');
      onRefreshStock();
      alert(`Berhasil! Dokumen ${docNumber} telah diterapkan ke harga katalog live.`);
    } catch (err: any) {
      console.error('Error submitting price adjustment:', err);
      alert('Gagal memproses penyesuaian harga: ' + (err.message || 'Error internal'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const filteredAdjustments = useMemo(() => {
    return adjustments.filter(doc => {
      // Reason filter
      if (reasonFilter !== 'ALL' && doc.reason !== reasonFilter) return false;

      // Trend filter
      if (trendFilter !== 'ALL') {
        const hasUp = doc.items.some(i => i.diff_amount > 0);
        const hasDown = doc.items.some(i => i.diff_amount < 0);
        if (trendFilter === 'UP' && !hasUp) return false;
        if (trendFilter === 'DOWN' && !hasDown) return false;
        if (trendFilter === 'EQUAL' && (hasUp || hasDown)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = doc.adjustment_number.toLowerCase().includes(q);
        const matchReason = doc.reason.toLowerCase().includes(q);
        const matchNotes = (doc.notes || '').toLowerCase().includes(q);
        const matchCreator = (doc.created_by || '').toLowerCase().includes(q);
        const matchItem = doc.items.some(
          i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
        if (!matchNumber && !matchReason && !matchNotes && !matchCreator && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [adjustments, searchQuery, reasonFilter, trendFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalItemsAdjusted = 0;
    let upCount = 0;
    let downCount = 0;
    let totalDocs = adjustments.length;

    adjustments.forEach(doc => {
      totalItemsAdjusted += doc.total_items;
      doc.items.forEach(item => {
        if (item.diff_amount > 0) upCount++;
        else if (item.diff_amount < 0) downCount++;
      });
    });

    return { totalDocs, totalItemsAdjusted, upCount, downCount };
  }, [adjustments]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredAdjustments.length === 0) {
      alert('Tidak ada data penyesuaian harga untuk diekspor.');
      return;
    }

    const flatRows: any[] = [];
    filteredAdjustments.forEach(doc => {
      doc.items.forEach((item, idx) => {
        flatRows.push({
          'No. Dokumen': doc.adjustment_number,
          'Tgl Penyesuaian': doc.adjustment_date,
          'Tgl Berlaku': doc.effective_date,
          'Alasan': doc.reason,
          'Item Ke': idx + 1,
          'SKU': item.sku,
          'Nama Produk': item.name,
          'Kategori': item.category_name || '-',
          'Stok Saat Ini': item.current_stock,
          'Harga Lama (Rp)': item.old_price,
          'Harga Baru (Rp)': item.new_price,
          'Selisih (Rp)': item.diff_amount,
          'Perubahan (%)': `${item.diff_percent > 0 ? '+' : ''}${item.diff_percent.toFixed(2)}%`,
          'Status': doc.status,
          'Catatan': doc.notes,
          'Dibuat Oleh': doc.created_by,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(flatRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penyesuaian Harga');
    XLSX.writeFile(workbook, `Laporan_Penyesuaian_Harga_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print single doc
  const handlePrintDoc = () => {
    window.print();
  };

  const selectedPickerProduct = products.find(p => p.id === pickerProductId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase">
              Modul ERP Persediaan
            </span>
            <span className="text-amber-200 text-xs font-semibold">Live Real-time Synchronized</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <DollarSign className="p-1 bg-white/20 rounded-xl" size={32} />
            Penyesuaian Harga (Price Adjustment)
          </h2>
          <p className="text-amber-100 text-sm mt-1 max-w-2xl">
            Kelola kenaikan atau penurunan harga jual produk, penyesuaian fluktuasi kurs, harga principal pabrik, dan program diskon promo dengan riwayat audit akuntansi lengkap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/20 shadow-sm"
          >
            <Download size={16} />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-800 hover:bg-orange-50 rounded-xl text-sm font-black transition shadow-md hover:scale-105 transform active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Buat Penyesuaian Harga</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Dokumen</span>
            <FileText size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {stats.totalDocs}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Dokumen penyesuaian tersimpan</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Produk Naik Harga</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.upCount}
          </p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Penyesuaian naik / inflasi</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Produk Turun Harga</span>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats.downCount}
          </p>
          <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">Diskon, promo & clearance</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Item Disetel</span>
            <Boxes size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {stats.totalItemsAdjusted}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Total frekuensi perubahan SKU</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. dokumen, nama produk, SKU, atau keterangan..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reason Filter */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Semua Alasan Perubahan</option>
            {PRICE_ADJUSTMENT_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Trend Filter */}
          <select
            value={trendFilter}
            onChange={(e) => setTrendFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">Semua Arah Harga</option>
            <option value="UP">📈 Kenaikan Harga (Naik)</option>
            <option value="DOWN">📉 Penurunan Harga (Turun)</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Tgl & Berlaku</th>
                <th className="py-3 px-4">Alasan Perubahan</th>
                <th className="py-3 px-4">Rincian Barang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <AlertCircle size={36} className="mx-auto mb-2 text-gray-300" />
                    Belum ada riwayat dokumen penyesuaian harga yang cocok.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((doc) => {
                  const firstItem = doc.items[0];
                  const remainingCount = doc.items.length - 1;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Tag size={14} className="text-amber-500" />
                          <span>{doc.adjustment_number}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {doc.total_items} produk disetel
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          <span>{doc.adjustment_date}</span>
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Eff: {doc.effective_date}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                          {doc.reason}
                        </span>
                        {doc.notes && doc.notes !== '-' && (
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 line-clamp-1">
                            {doc.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {firstItem && (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                              <span>{firstItem.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                {firstItem.sku}
                              </span>
                            </div>
                            <div className="text-xs flex items-center gap-2">
                              <span className="text-gray-400 line-through">
                                Rp {firstItem.old_price.toLocaleString('id-ID')}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-extrabold text-gray-900 dark:text-white">
                                Rp {firstItem.new_price.toLocaleString('id-ID')}
                              </span>
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                firstItem.diff_amount > 0 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                              }`}>
                                {firstItem.diff_amount > 0 ? '+' : ''}{firstItem.diff_percent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                        {remainingCount > 0 && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold cursor-pointer hover:underline block mt-1"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            +{remainingCount} produk lainnya...
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={12} />
                          Diterapkan
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                          {doc.created_by}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-950/50 text-gray-700 dark:text-zinc-300 hover:text-amber-700 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
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

      {/* Modal Create Price Adjustment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="p-1 bg-white/20 rounded-xl" size={28} />
                <div>
                  <h3 className="font-extrabold text-lg">Buat Penyesuaian Harga Produk</h3>
                  <p className="text-xs text-amber-100">
                    Perubahan harga akan langsung tersinkronisasi ke katalog & transaksi kasir/B2B
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Form Info Umum */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    Alasan Penyesuaian
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {PRICE_ADJUSTMENT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    Tanggal Efektif Berlaku
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                  Catatan / Nomor Referensi (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Surat Keputusan Direksi No. 04/SK/X/2026 atau Memo Principal"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Box Tambah Produk */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>Pilih Produk & Tentukan Harga Baru</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 mb-1">
                      Pilih Produk Katalog
                    </label>
                    <select
                      value={pickerProductId}
                      onChange={(e) => {
                        setPickerProductId(e.target.value);
                        const p = products.find(prod => prod.id === e.target.value);
                        if (p) {
                          setPickerNewPrice(String(p.price || 0));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku ? `[${p.sku}] ` : ''}{p.name} (Harga Saat Ini: Rp {(p.price || 0).toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 mb-1">
                      Harga Baru (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={pickerNewPrice}
                      onChange={(e) => setPickerNewPrice(e.target.value)}
                      placeholder="Masukkan harga baru..."
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* Preview Kalkulasi Selisih Picker */}
                {selectedPickerProduct && pickerNewPrice !== '' && (
                  <div className="pt-2 text-xs flex flex-wrap items-center gap-4 text-gray-600 dark:text-zinc-300">
                    <span>
                      Harga Lama: <strong className="text-gray-900 dark:text-white">Rp {(selectedPickerProduct.price || 0).toLocaleString('id-ID')}</strong>
                    </span>
                    <span>
                      Selisih:{' '}
                      <strong className={parseFloat(pickerNewPrice) >= (selectedPickerProduct.price || 0) ? 'text-emerald-600' : 'text-rose-600'}>
                        {parseFloat(pickerNewPrice) >= (selectedPickerProduct.price || 0) ? '+' : ''}
                        Rp {(parseFloat(pickerNewPrice) - (selectedPickerProduct.price || 0)).toLocaleString('id-ID')}
                      </strong>
                    </span>
                    <span>
                      Persentase:{' '}
                      <strong className={parseFloat(pickerNewPrice) >= (selectedPickerProduct.price || 0) ? 'text-emerald-600' : 'text-rose-600'}>
                        {selectedPickerProduct.price > 0
                          ? `${(((parseFloat(pickerNewPrice) - selectedPickerProduct.price) / selectedPickerProduct.price) * 100).toFixed(1)}%`
                          : '0%'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Tabel Daftar Produk Disetel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                    Daftar Produk yang Disesuaikan ({selectedLines.length} item)
                  </h4>
                </div>

                {selectedLines.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-center text-gray-400 text-xs">
                    Belum ada produk yang ditambahkan. Pilih produk pada formulir di atas.
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Produk</th>
                          <th className="py-2.5 px-3">Harga Lama</th>
                          <th className="py-2.5 px-3">Harga Baru</th>
                          <th className="py-2.5 px-3">Selisih & %</th>
                          <th className="py-2.5 px-3 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {selectedLines.map((line, idx) => (
                          <tr key={line.product_id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-gray-900 dark:text-white">{line.name}</p>
                              <span className="text-[10px] text-gray-400 font-mono">{line.sku}</span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-gray-500">
                              Rp {line.old_price.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min={0}
                                value={line.new_price}
                                onChange={(e) => handleUpdateLinePrice(idx, e.target.value)}
                                className="w-28 px-2 py-1 bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`font-bold ${line.diff_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {line.diff_amount >= 0 ? '+' : ''}Rp {line.diff_amount.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-1">
                                ({line.diff_amount >= 0 ? '+' : ''}{line.diff_percent.toFixed(1)}%)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleRemoveLineItem(idx)}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 dark:bg-zinc-800/60 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                Pencatatan ini akan diaudit di riwayat log stok secara otomatis.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || selectedLines.length === 0}
                  onClick={handleCreateAdjustment}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black transition shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? 'Memproses...' : 'Terapkan Penyesuaian Harga'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail & Print Berita Acara */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 print:p-0 print:border-none print:shadow-none">
            {/* Header Dialog */}
            <div className="p-5 bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-600" size={20} />
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                  Berita Acara Penyesuaian Harga Produk
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDoc}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer size={14} />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 space-y-6 text-gray-900 dark:text-white print:text-black">
              {/* Kop Surat ERP */}
              <div className="border-b-2 border-gray-900 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-amber-700">PT. DISTRIBUSI AUTO PRIMA (DAP)</h1>
                  <p className="text-xs text-gray-600">Sistem ERP Manajemen Persediaan & Penetapan Harga</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-gray-500 block">DOKUMEN RESMI</span>
                  <span className="text-sm font-black text-gray-900">{selectedDoc.adjustment_number}</span>
                </div>
              </div>

              {/* Info Dokumen */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Tanggal Dokumen:</span>
                  <span className="font-bold">{selectedDoc.adjustment_date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Tanggal Efektif Berlaku:</span>
                  <span className="font-bold text-emerald-600">{selectedDoc.effective_date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Alasan Penyesuaian:</span>
                  <span className="font-bold">{selectedDoc.reason}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Dibuat Oleh / Administrator:</span>
                  <span className="font-bold">{selectedDoc.created_by}</span>
                </div>
              </div>

              {selectedDoc.notes && (
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs border border-gray-200 dark:border-zinc-700">
                  <span className="font-bold text-gray-700 dark:text-zinc-300 block mb-0.5">Catatan / Referensi:</span>
                  <p className="text-gray-600 dark:text-zinc-400">{selectedDoc.notes}</p>
                </div>
              )}

              {/* Rincian Produk Tabel */}
              <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 dark:bg-zinc-800 uppercase font-bold text-[10px] text-gray-600 dark:text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-right">Harga Lama</th>
                      <th className="py-2.5 px-3 text-right">Harga Baru</th>
                      <th className="py-2.5 px-3 text-right">Selisih (+/-)</th>
                      <th className="py-2.5 px-3 text-right">% Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {selectedDoc.items.map((it, idx) => (
                      <tr key={it.product_id}>
                        <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium">{it.sku}</td>
                        <td className="py-2 px-3 font-bold">{it.name}</td>
                        <td className="py-2 px-3 text-right text-gray-500">
                          Rp {it.old_price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900 dark:text-white">
                          Rp {it.new_price.toLocaleString('id-ID')}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${it.diff_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {it.diff_amount >= 0 ? '+' : ''}Rp {it.diff_amount.toLocaleString('id-ID')}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${it.diff_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {it.diff_amount >= 0 ? '+' : ''}{it.diff_percent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tanda Tangan Dokumen */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                <div>
                  <p className="text-gray-500 mb-14">Dibuat Oleh,</p>
                  <div className="border-t border-gray-400 pt-1 font-bold">
                    {selectedDoc.created_by}
                  </div>
                  <span className="text-[10px] text-gray-400">Staff Persediaan & Pricing</span>
                </div>

                <div>
                  <p className="text-gray-500 mb-14">Diperiksa Oleh,</p>
                  <div className="border-t border-gray-400 pt-1 font-bold">
                    Supervisor Operasional
                  </div>
                  <span className="text-[10px] text-gray-400">Finance & Purchasing</span>
                </div>

                <div>
                  <p className="text-gray-500 mb-14">Disetujui Oleh,</p>
                  <div className="border-t border-gray-400 pt-1 font-bold">
                    Manager / Direktur
                  </div>
                  <span className="text-[10px] text-gray-400">Otorisasi Manajemen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
