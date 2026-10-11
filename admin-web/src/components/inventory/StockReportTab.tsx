'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Search,
  Filter,
  RefreshCw,
  Folder,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Boxes,
  Package,
  History,
  X,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import ProductImage from '@/components/ProductImage';

export interface StockLogItem {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  previous_stock: number;
  current_stock: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  products?: {
    id: string;
    sku?: string;
    name: string;
    price?: number;
    category_id?: string;
    image_url?: string;
    image_urls?: string[];
    categories?: {
      id?: string;
      name?: string;
    };
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface StockReportTabProps {
  categories: Category[];
  onOpenProductHistory?: (product: any) => void;
  refreshTrigger?: number;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function StockReportTab({
  categories,
  onOpenProductHistory,
  refreshTrigger = 0
}: StockReportTabProps) {
  const [logs, setLogs] = useState<StockLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const now = new Date();
  const [periodType, setPeriodType] = useState<
    'THIS_MONTH' | 'LAST_MONTH' | '7_DAYS' | '30_DAYS' | 'CUSTOM_MONTH' | 'CUSTOM_RANGE' | 'ALL'
  >('THIS_MONTH');

  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RESTOCK' | 'REDUCTION' | 'ADJUSTMENT' | 'RETURN'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchStockLogs();
  }, [refreshTrigger]);

  const fetchStockLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_logs')
        .select(`
          id,
          product_id,
          type,
          quantity,
          previous_stock,
          current_stock,
          notes,
          created_by,
          created_at,
          products (
            id,
            sku,
            name,
            price,
            category_id,
            image_url,
            image_urls,
            categories (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock logs:', error);
      } else if (data) {
        setLogs(data as any);
      }
    } catch (err) {
      console.error('Exception fetching stock logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Human-readable Period Label
  const periodLabel = useMemo(() => {
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    if (periodType === 'THIS_MONTH') {
      return `Bulan Ini (${MONTH_NAMES[curMonth]} ${curYear})`;
    }
    if (periodType === 'LAST_MONTH') {
      const lastMonthDate = new Date(curYear, curMonth - 1, 1);
      return `Bulan Lalu (${MONTH_NAMES[lastMonthDate.getMonth()]} ${lastMonthDate.getFullYear()})`;
    }
    if (periodType === '7_DAYS') {
      return '7 Hari Terakhir';
    }
    if (periodType === '30_DAYS') {
      return '30 Hari Terakhir';
    }
    if (periodType === 'CUSTOM_MONTH') {
      return `Bulan ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    if (periodType === 'CUSTOM_RANGE') {
      if (startDate && endDate) {
        return `Rentang ${startDate} s/d ${endDate}`;
      }
      return 'Rentang Tanggal Khusus';
    }
    return 'Semua Waktu (Seluruh Riwayat)';
  }, [periodType, selectedMonth, selectedYear, startDate, endDate]);

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const logDate = new Date(item.created_at);

      // 1. Filter Waktu
      if (periodType === 'THIS_MONTH') {
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();
        if (logDate.getFullYear() !== curYear || logDate.getMonth() !== curMonth) {
          return false;
        }
      } else if (periodType === 'LAST_MONTH') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (
          logDate.getFullYear() !== lastMonthDate.getFullYear() ||
          logDate.getMonth() !== lastMonthDate.getMonth()
        ) {
          return false;
        }
      } else if (periodType === '7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (logDate < sevenDaysAgo) return false;
      } else if (periodType === '30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (logDate < thirtyDaysAgo) return false;
      } else if (periodType === 'CUSTOM_MONTH') {
        if (
          logDate.getFullYear() !== Number(selectedYear) ||
          logDate.getMonth() !== Number(selectedMonth)
        ) {
          return false;
        }
      } else if (periodType === 'CUSTOM_RANGE') {
        if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + 'T23:59:59');
          if (logDate > end) return false;
        }
      }

      // 2. Filter Tipe Mutasi
      if (typeFilter !== 'ALL') {
        if (item.type !== typeFilter) return false;
      }

      // 3. Filter Kategori
      if (categoryFilter !== 'ALL') {
        const prodCatId = item.products?.category_id || item.products?.categories?.id;
        const prodCatName = item.products?.categories?.name;
        if (prodCatId !== categoryFilter && prodCatName !== categoryFilter) {
          return false;
        }
      }

      // 4. Filter Pencarian Text (SKU, Nama, Notes, Admin)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sku = (item.products?.sku || '').toLowerCase();
        const name = (item.products?.name || '').toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        const admin = (item.created_by || '').toLowerCase();

        if (
          !sku.includes(q) &&
          !name.includes(q) &&
          !notes.includes(q) &&
          !admin.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    logs,
    periodType,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
    typeFilter,
    categoryFilter,
    searchQuery
  ]);

  // Aggregated Metrics
  const metrics = useMemo(() => {
    let totalAdded = 0;
    let totalReduced = 0;
    let addCount = 0;
    let reduceCount = 0;
    const affectedProducts = new Set<string>();

    const addedByProduct: Record<string, { name: string; sku: string; qty: number; thumb?: string }> = {};
    const reducedByProduct: Record<string, { name: string; sku: string; qty: number; thumb?: string }> = {};

    filteredLogs.forEach((l) => {
      affectedProducts.add(l.product_id);
      const isAdd = l.type === 'RESTOCK' || l.type === 'RETURN';
      const isReduce = l.type === 'REDUCTION' || l.type === 'SALE';
      const prodName = l.products?.name || 'Produk';
      const prodSku = l.products?.sku || '-';
      const thumb = (l.products?.image_urls && l.products.image_urls.length > 0)
        ? l.products.image_urls[0]
        : l.products?.image_url;

      if (isAdd) {
        totalAdded += l.quantity;
        addCount += 1;
        if (!addedByProduct[l.product_id]) {
          addedByProduct[l.product_id] = { name: prodName, sku: prodSku, qty: 0, thumb };
        }
        addedByProduct[l.product_id].qty += l.quantity;
      } else if (isReduce) {
        totalReduced += l.quantity;
        reduceCount += 1;
        if (!reducedByProduct[l.product_id]) {
          reducedByProduct[l.product_id] = { name: prodName, sku: prodSku, qty: 0, thumb };
        }
        reducedByProduct[l.product_id].qty += l.quantity;
      }
    });

    const topAddedList = Object.values(addedByProduct)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    const topReducedList = Object.values(reducedByProduct)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    return {
      totalAdded,
      totalReduced,
      netFlow: totalAdded - totalReduced,
      totalActivities: filteredLogs.length,
      affectedSkuCount: affectedProducts.size,
      addCount,
      reduceCount,
      topAddedList,
      topReducedList
    };
  }, [filteredLogs]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada data riwayat stok pada periode ini untuk diekspor.');
      return;
    }

    const rows = filteredLogs.map((log, index) => {
      const dateObj = new Date(log.created_at);
      const dateStr = dateObj.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const timeStr = dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const isAdded = log.type === 'RESTOCK' || log.type === 'RETURN';
      const typeLabel =
        log.type === 'RESTOCK'
          ? 'Penambahan (Restok Masuk)'
          : log.type === 'REDUCTION'
          ? 'Pengurangan Stok'
          : log.type === 'ADJUSTMENT'
          ? 'Koreksi Fisik'
          : log.type === 'RETURN'
          ? 'Retur Masuk'
          : log.type;

      return {
        'No': index + 1,
        'Tanggal': dateStr,
        'Jam (WIB)': timeStr,
        'SKU': log.products?.sku || '-',
        'Nama Barang': log.products?.name || 'Produk Tidak Ditemukan',
        'Kategori': log.products?.categories?.name || 'Lainnya',
        'Tipe Mutasi': typeLabel,
        'Arah Arus': isAdded ? 'MASUK (+)' : 'KELUAR (-)',
        'Jumlah (Pcs)': log.quantity,
        'Stok Sebelum': log.previous_stock,
        'Stok Sesudah': log.current_stock,
        'Keterangan / Catatan': log.notes || '-',
        'Diinput Oleh': log.created_by || 'Admin'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = [
      { wch: 6 },  // No
      { wch: 18 }, // Tanggal
      { wch: 12 }, // Jam
      { wch: 14 }, // SKU
      { wch: 35 }, // Nama Barang
      { wch: 20 }, // Kategori
      { wch: 25 }, // Tipe Mutasi
      { wch: 14 }, // Arah Arus
      { wch: 14 }, // Qty
      { wch: 14 }, // Sebelum
      { wch: 14 }, // Sesudah
      { wch: 35 }, // Keterangan
      { wch: 26 }  // Admin
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Mutasi Stok');

    const cleanTitle = periodLabel.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(workbook, `Laporan_Mutasi_Stok_${cleanTitle}.xlsx`);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  const currentYearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* TOP PERIOD SELECTOR & ACTIONS BAR                        */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Calendar size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Laporan Riwayat Mutasi & Perubahan Stok
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantau laporan seluruh barang yang dilakukan pengurangan & penambahan stok dalam periode terpilih.
            </p>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchStockLogs}
              disabled={isLoading}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              title="Perbarui Data Riwayat"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-emerald-600' : ''} />
              <span>Muat Ulang</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
            >
              <Download size={15} />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
            >
              <Printer size={15} />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* QUICK PERIOD CHIPS */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            PILIH PERIODE:
          </span>

          <button
            onClick={() => setPeriodType('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              periodType === 'THIS_MONTH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock size={13} />
            Bulan Ini ({MONTH_NAMES[now.getMonth()]})
          </button>

          <button
            onClick={() => setPeriodType('LAST_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              periodType === 'LAST_MONTH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Bulan Lalu
          </button>

          <button
            onClick={() => setPeriodType('7_DAYS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodType === '7_DAYS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            7 Hari Terakhir
          </button>

          <button
            onClick={() => setPeriodType('30_DAYS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodType === '30_DAYS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            30 Hari Terakhir
          </button>

          <button
            onClick={() => setPeriodType('CUSTOM_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodType === 'CUSTOM_MONTH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Pilih Bulan & Tahun
          </button>

          <button
            onClick={() => setPeriodType('CUSTOM_RANGE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodType === 'CUSTOM_RANGE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Rentang Tanggal
          </button>

          <button
            onClick={() => setPeriodType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              periodType === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua Waktu
          </button>
        </div>

        {/* SUB CONTROLS UNTUK PILIH BULAN ATAU RENTANG TANGGAL */}
        {periodType === 'CUSTOM_MONTH' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-slate-600">Pilih Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <span className="text-xs font-semibold text-slate-600">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {currentYearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}

        {periodType === 'CUSTOM_RANGE' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                Reset Tanggal
              </button>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STATISTIK RINGKAS PERIODE INI (METRIC CARDS)             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL DITAMBAHKAN (RESTOK) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Penambahan Stok
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              +{metrics.totalAdded.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-semibold text-slate-400">Pcs</span>
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} className="text-emerald-500" />
              {metrics.addCount} transaksi restok
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* TOTAL DIKURANGI (PENGURANGAN) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-100 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pengurangan Stok
            </p>
            <p className="text-2xl sm:text-3xl font-black text-red-600 mt-1">
              -{metrics.totalReduced.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-semibold text-slate-400">Pcs</span>
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <ArrowDownRight size={13} className="text-red-500" />
              {metrics.reduceCount} transaksi keluar
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <TrendingDown size={22} />
          </div>
        </div>

        {/* NET ARUS BERSIH STOK */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Arus Bersih (Net Flow)
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black mt-1 ${
                metrics.netFlow > 0
                  ? 'text-emerald-600'
                  : metrics.netFlow < 0
                  ? 'text-amber-600'
                  : 'text-slate-800'
              }`}
            >
              {metrics.netFlow > 0 ? `+${metrics.netFlow.toLocaleString('id-ID')}` : metrics.netFlow.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-semibold text-slate-400">Pcs</span>
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Selisih masuk vs keluar
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ArrowRightLeft size={22} />
          </div>
        </div>

        {/* TOTAL AKTIVITAS & SKU TERLIBAT */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Aktivitas Tercatat
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {metrics.totalActivities}{' '}
              <span className="text-xs font-semibold text-slate-400">Log</span>
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Dari <b>{metrics.affectedSkuCount}</b> SKU produk berbeda
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Boxes size={22} />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HIGHLIGHT REKAP: BARANG PALING BANYAK BERUBAH            */}
      {/* ======================================================== */}
      {(metrics.topAddedList.length > 0 || metrics.topReducedList.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TOP DITAMBAHKAN */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingUp size={15} /> Barang Terbanyak Ditambah (+)
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">{periodLabel}</span>
            </div>
            {metrics.topAddedList.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Tidak ada penambahan stok.</p>
            ) : (
              <div className="space-y-2">
                {metrics.topAddedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-emerald-50/40 rounded-xl flex items-center justify-between gap-3 border border-emerald-100/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <ProductImage src={item.thumb} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-semibold text-emerald-700">{item.sku}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                      +{item.qty} Pcs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOP DIKURANGI */}
          <div className="bg-white p-4 rounded-2xl border border-red-100/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-red-800 flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingDown size={15} /> Barang Terbanyak Dikurangi (-)
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">{periodLabel}</span>
            </div>
            {metrics.topReducedList.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Tidak ada pengurangan stok.</p>
            ) : (
              <div className="space-y-2">
                {metrics.topReducedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-red-50/40 rounded-xl flex items-center justify-between gap-3 border border-red-100/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <ProductImage src={item.thumb} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-semibold text-red-700">{item.sku}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-red-700 bg-white px-2 py-0.5 rounded-lg border border-red-200 shrink-0">
                      -{item.qty} Pcs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FILTER & PENCARIAN TABEL LAPORAN                         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari SKU, Nama Barang, Catatan, atau Admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* FILTER TIPE MUTASI */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <Filter size={15} className="text-slate-400 ml-1 hidden sm:block" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Tipe Mutasi</option>
              <option value="RESTOCK">➕ Penambahan (Restok Masuk)</option>
              <option value="REDUCTION">➖ Pengurangan Stok</option>
              <option value="ADJUSTMENT">🔄 Koreksi Stok Fisik</option>
              <option value="RETURN">🔁 Retur Masuk</option>
            </select>
          </div>

          {/* FILTER KATEGORI */}
          <div className="flex items-center gap-2 min-w-[210px]">
            <Folder size={15} className="text-emerald-600 ml-1 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Kategori ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATUS BAR PENJELASAN FILTER */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100 font-medium">
          <div>
            Menampilkan <b>{filteredLogs.length}</b> riwayat mutasi untuk <b>{periodLabel}</b>
          </div>
          {(searchQuery || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              (Reset Filter)
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TABEL DATA LAPORAN MUTASI STOK                           */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200/70">
                <th className="p-4 font-bold">Waktu & Tanggal</th>
                <th className="p-4 font-bold">Produk (SKU & Nama)</th>
                <th className="p-4 font-bold">Kategori</th>
                <th className="p-4 font-bold text-center">Jenis Mutasi</th>
                <th className="p-4 font-bold text-center">Jumlah Perubahan</th>
                <th className="p-4 font-bold text-center">Stok Awal ➔ Akhir</th>
                <th className="p-4 font-bold">Catatan / Keterangan</th>
                <th className="p-4 font-bold">Diinput Oleh</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 font-medium">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                    Mengambil seluruh data riwayat mutasi...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto">
                      <FileText size={40} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-base font-bold text-slate-800">
                        Tidak Ada Riwayat Stok Tercatat
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Tidak ada aktivitas penambahan atau pengurangan barang pada periode <b>{periodLabel}</b>.
                      </p>
                      <div className="mt-4 flex justify-center gap-2">
                        <button
                          onClick={() => setPeriodType('ALL')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                          Lihat Seluruh Riwayat
                        </button>
                        <button
                          onClick={() => setPeriodType('THIS_MONTH')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Kembali ke Bulan Ini
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPlus = log.type === 'RESTOCK' || log.type === 'RETURN';
                  const dateObj = new Date(log.created_at);
                  const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const thumb = (log.products?.image_urls && log.products.image_urls.length > 0)
                    ? log.products.image_urls[0]
                    : log.products?.image_url;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tanggal & Waktu */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800 text-xs">{dateFormatted}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeFormatted} WIB</p>
                      </td>

                      {/* Info Produk */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            <ProductImage
                              src={thumb}
                              alt={log.products?.name || 'Produk'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="max-w-[260px]">
                            <p className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                              {log.products?.name || 'Produk Dihapus / Tanpa Nama'}
                            </p>
                            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                              {log.products?.sku || 'Tanpa SKU'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.products?.categories?.name || 'Lainnya'}
                        </span>
                      </td>

                      {/* Jenis Mutasi Badge */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {log.type === 'RESTOCK' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ArrowUpRight size={13} strokeWidth={2.5} /> Restok Masuk
                          </span>
                        ) : log.type === 'REDUCTION' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <ArrowDownRight size={13} strokeWidth={2.5} /> Pengurangan
                          </span>
                        ) : log.type === 'RETURN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            🔁 Retur Barang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            🔄 Koreksi Stok
                          </span>
                        )}
                      </td>

                      {/* Jumlah Perubahan */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl font-black text-sm ${
                            isPlus
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isPlus ? `+${log.quantity}` : `-${log.quantity}`} Pcs
                        </span>
                      </td>

                      {/* Posisi Stok Awal -> Akhir */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200/80">
                          <span className="text-slate-500">{log.previous_stock}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-bold text-slate-900">{log.current_stock}</span>
                        </div>
                      </td>

                      {/* Catatan / Keterangan */}
                      <td className="p-4">
                        <p className="text-xs text-slate-700 font-medium max-w-[200px] truncate" title={log.notes || '-'}>
                          {log.notes || '-'}
                        </p>
                      </td>

                      {/* Admin Input */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-xs text-slate-600 font-semibold truncate max-w-[150px]" title={log.created_by || 'Admin'}>
                          {log.created_by || 'Admin'}
                        </p>
                      </td>

                      {/* Aksi */}
                      <td className="p-4 text-right whitespace-nowrap">
                        {onOpenProductHistory && log.products && (
                          <button
                            onClick={() => onOpenProductHistory(log.products)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                            title="Buka Kartu Riwayat Produk Ini"
                          >
                            <History size={12} /> Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
