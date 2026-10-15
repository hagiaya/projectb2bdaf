'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Boxes,
  ArrowRightLeft,
  Sliders,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Package,
  Building2,
  Eye,
  Hash,
  Activity,
  History,
  QrCode,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { DEFAULT_WAREHOUSES, WarehouseTransferDoc } from './WarehouseTransferTab';
import { StockAdjustmentDoc } from './StockAdjustmentTab';
import { PriceAdjustmentDoc } from './PriceAdjustmentTab';

export type ERPReportType =
  | 'LAPORAN_PERSEDIAAN_AWAL'
  | 'LAPORAN_PERSEDIAAN_BARANG'
  | 'LAPORAN_MUTASI_PERSEDIAAN'
  | 'LAPORAN_KARTU_STOCK'
  | 'LAPORAN_HISTORIS_BARANG'
  | 'LAPORAN_STATUS_SN'
  | 'LAPORAN_TRANSFER_GUDANG'
  | 'LAPORAN_REKAP_TRANSFER'
  | 'LAPORAN_PENYESUAIAN_PERSEDIAAN'
  | 'LAPORAN_PENYESUAIAN_HARGA';

interface ReportOption {
  id: ERPReportType;
  title: string;
  category: 'STOK' | 'MUTASI' | 'AUDIT' | 'TRANSFER' | 'PENYESUAIAN';
  description: string;
}

export const ERP_REPORTS_LIST: ReportOption[] = [
  {
    id: 'LAPORAN_PERSEDIAAN_AWAL',
    title: 'Laporan Persediaan Awal',
    category: 'STOK',
    description: 'Saldo awal persediaan barang per periode pembukuan beserta nilai valuasi awal.',
  },
  {
    id: 'LAPORAN_PERSEDIAAN_BARANG',
    title: 'Laporan Persediaan Barang',
    category: 'STOK',
    description: 'Posisi persediaan fisik saat ini, status stok (Aman/Menipis/Kosong), dan total nilai aset gudang.',
  },
  {
    id: 'LAPORAN_MUTASI_PERSEDIAAN',
    title: 'Laporan Mutasi Persediaan',
    category: 'MUTASI',
    description: 'Rekapitulasi perpindahan barang (Saldo Awal, Masuk, Keluar, Penyesuaian, Transfer, dan Saldo Akhir).',
  },
  {
    id: 'LAPORAN_KARTU_STOCK',
    title: 'Laporan Kartu Stock',
    category: 'MUTASI',
    description: 'Buku besar kartu stok interaktif per produk dengan riwayat kronologis debit, kredit, dan sisa saldo.',
  },
  {
    id: 'LAPORAN_HISTORIS_BARANG',
    title: 'Laporan Historis Barang',
    category: 'AUDIT',
    description: 'Riwayat lengkap seluruh perubahan, audit log, dan pergerakan produk sejak pertama kali dicatat.',
  },
  {
    id: 'LAPORAN_STATUS_SN',
    title: 'Laporan Status S/N & SKU',
    category: 'AUDIT',
    description: 'Status pelacakan Serial Number, SKU, dan ketersediaan barang di gudang atau peredaran.',
  },
  {
    id: 'LAPORAN_TRANSFER_GUDANG',
    title: 'Laporan Transfer Gudang',
    category: 'TRANSFER',
    description: 'Daftar rinci seluruh dokumen transfer antar gudang, surat jalan, driver, dan status pengiriman.',
  },
  {
    id: 'LAPORAN_REKAP_TRANSFER',
    title: 'Laporan Rekap Transfer Gudang',
    category: 'TRANSFER',
    description: 'Rekapitulasi total perpindahan barang antar gudang per rute dan total volume barang.',
  },
  {
    id: 'LAPORAN_PENYESUAIAN_PERSEDIAAN',
    title: 'Laporan Penyesuaian Persediaan',
    category: 'PENYESUAIAN',
    description: 'Rekap stock opname fisik vs buku, selisih kuantitas (+/-), nilai rupiah selisih, dan alasan.',
  },
  {
    id: 'LAPORAN_PENYESUAIAN_HARGA',
    title: 'Laporan Penyesuaian Harga',
    category: 'PENYESUAIAN',
    description: 'Rekapitulasi perubahan harga jual, selisih nominal Rp, persentase margin, dan alasan perubahan.',
  },
];

interface InventoryReportsTabProps {
  products: any[];
  categories: { id: string; name: string }[];
  adminEmail: string;
  selectedReport?: ERPReportType;
  onReportChange?: (report: ERPReportType) => void;
}

export default function InventoryReportsTab({
  products,
  categories,
  adminEmail,
  selectedReport,
  onReportChange,
}: InventoryReportsTabProps) {
  // Active Report View
  const [activeReport, setActiveReport] = useState<ERPReportType>(
    selectedReport || 'LAPORAN_PERSEDIAAN_BARANG'
  );

  useEffect(() => {
    if (selectedReport) {
      setActiveReport(selectedReport);
    }
  }, [selectedReport]);

  const handleSelectReport = (rep: ERPReportType) => {
    setActiveReport(rep);
    if (onReportChange) onReportChange(rep);
  };

  // Filters
  const [periodType, setPeriodType] = useState<
    'THIS_MONTH' | 'LAST_MONTH' | '7_DAYS' | '30_DAYS' | 'CUSTOM_RANGE' | 'ALL'
  >('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Product for Kartu Stock
  const [kartuStockProductId, setKartuStockProductId] = useState<string>('');

  // Raw Database Data
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [transferDocs, setTransferDocs] = useState<WarehouseTransferDoc[]>([]);
  const [adjustmentDocs, setAdjustmentDocs] = useState<StockAdjustmentDoc[]>([]);
  const [priceDocs, setPriceDocs] = useState<PriceAdjustmentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize selected product for Kartu Stock
  useEffect(() => {
    if (products.length > 0 && !kartuStockProductId) {
      setKartuStockProductId(products[0].id);
    }
  }, [products, kartuStockProductId]);

  // Load database and local docs
  useEffect(() => {
    loadAllReportData();
  }, []);

  const loadAllReportData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch stock logs from Supabase
      const { data: logsData, error: logsErr } = await supabase
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
            stock,
            category_id,
            categories (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (logsErr) {
        console.error('Error fetching stock logs:', logsErr);
      } else if (logsData) {
        setStockLogs(logsData);
      }

      // 2. Load Transfers
      try {
        const trSaved = localStorage.getItem('erp_warehouse_transfers_v1');
        if (trSaved) setTransferDocs(JSON.parse(trSaved));
      } catch (e) {
        console.error('Error loading transfer docs:', e);
      }

      // 3. Load Adjustments
      try {
        const adjSaved = localStorage.getItem('erp_stock_adjustments_v1');
        if (adjSaved) setAdjustmentDocs(JSON.parse(adjSaved));
      } catch (e) {
        console.error('Error loading adjustment docs:', e);
      }

      // 4. Load Price Adjustments
      try {
        const prcSaved = localStorage.getItem('erp_price_adjustments_v1');
        if (prcSaved) setPriceDocs(JSON.parse(prcSaved));
      } catch (e) {
        console.error('Error loading price docs:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper Date Filter Check
  const isDateInFilter = (dateStr: string) => {
    if (periodType === 'ALL') return true;
    const d = new Date(dateStr);
    const now = new Date();

    if (periodType === 'THIS_MONTH') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (periodType === 'LAST_MONTH') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
    }
    if (periodType === '7_DAYS') {
      const sevenDays = new Date(now.getTime() - 7 * 86400000);
      return d >= sevenDays;
    }
    if (periodType === '30_DAYS') {
      const thirtyDays = new Date(now.getTime() - 30 * 86400000);
      return d >= thirtyDays;
    }
    if (periodType === 'CUSTOM_RANGE') {
      if (startDate) {
        const s = new Date(startDate + 'T00:00:00');
        if (d < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate + 'T23:59:59');
        if (d > e) return false;
      }
      return true;
    }
    return true;
  };

  // Filtered Products helper
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'ALL') {
        const catId = p.category_id || p.categories?.id;
        const catName = p.categories?.name;
        if (catId !== categoryFilter && catName !== categoryFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        if (!sku.includes(q) && !name.includes(q)) return false;
      }
      return true;
    });
  }, [products, categoryFilter, searchQuery]);

  // 1. Data Laporan Persediaan Awal (Beginning Stock)
  const beginningInventoryData = useMemo(() => {
    return filteredProducts.map((p) => {
      // Find all logs for this product that happened during or after the cutoff
      // Saldo Awal = current_stock - (semua mutasi masuk - semua mutasi keluar dalam periode)
      const prodLogs = stockLogs.filter((l) => l.product_id === p.id && isDateInFilter(l.created_at));
      
      let netMovement = 0;
      prodLogs.forEach((l) => {
        const change = (l.current_stock ?? 0) - (l.previous_stock ?? 0);
        netMovement += change;
      });

      // Beginning stock estimate
      const beginningQty = Math.max(0, (p.stock || 0) - netMovement);
      const unitPrice = p.price || 0;
      const initialValuation = beginningQty * unitPrice;

      return {
        id: p.id,
        sku: p.sku || '-',
        name: p.name,
        category: p.categories?.name || 'Umum',
        unit: 'Pcs / Unit',
        beginningQty,
        unitPrice,
        initialValuation,
        currentStock: p.stock || 0,
      };
    });
  }, [filteredProducts, stockLogs, periodType, startDate, endDate]);

  // 2. Data Laporan Persediaan Barang (Current Stock & Valuation)
  const currentInventoryData = useMemo(() => {
    return filteredProducts.map((p) => {
      const stock = p.stock || 0;
      const price = p.price || 0;
      const totalValuation = stock * price;
      let status: 'SAFE' | 'LOW' | 'EMPTY' = 'SAFE';
      if (stock === 0) status = 'EMPTY';
      else if (stock < 10) status = 'LOW';

      return {
        id: p.id,
        sku: p.sku || '-',
        name: p.name,
        category: p.categories?.name || 'Umum',
        warehouse: warehouseFilter === 'ALL' ? 'Semua Gudang / Pusat' : warehouseFilter,
        stock,
        minStock: 10,
        status,
        price,
        totalValuation,
      };
    });
  }, [filteredProducts, warehouseFilter]);

  // 3. Data Laporan Mutasi Persediaan (Movement In, Out, Adjust, Transfer)
  const mutasiInventoryData = useMemo(() => {
    return filteredProducts.map((p) => {
      const prodLogs = stockLogs.filter((l) => l.product_id === p.id && isDateInFilter(l.created_at));

      let totalIn = 0;
      let totalOut = 0;
      let totalAdjust = 0;
      let totalTransfer = 0;

      prodLogs.forEach((l) => {
        const change = (l.current_stock ?? 0) - (l.previous_stock ?? 0);
        const notes = (l.notes || '').toUpperCase();

        if (notes.includes('TRANSFER') || l.type === 'TRANSFER') {
          totalTransfer += change;
        } else if (l.type === 'RESTOCK' || change > 0) {
          totalIn += Math.abs(change);
        } else if (l.type === 'REDUCTION' || l.type === 'SALE' || change < 0) {
          totalOut += Math.abs(change);
        } else if (l.type === 'ADJUSTMENT') {
          totalAdjust += change;
        }
      });

      const currentStock = p.stock || 0;
      const netMovement = (totalIn - totalOut + totalAdjust + totalTransfer);
      const beginningStock = Math.max(0, currentStock - netMovement);
      const endingStock = currentStock;
      const valuation = endingStock * (p.price || 0);

      return {
        id: p.id,
        sku: p.sku || '-',
        name: p.name,
        category: p.categories?.name || 'Umum',
        beginningStock,
        totalIn,
        totalOut,
        totalAdjust,
        totalTransfer,
        endingStock,
        unitPrice: p.price || 0,
        valuation,
      };
    });
  }, [filteredProducts, stockLogs, periodType, startDate, endDate]);

  // 4. Data Laporan Kartu Stock (Interactive per Product)
  const activeKartuProduct = products.find((p) => p.id === kartuStockProductId);
  const kartuStockLedger = useMemo(() => {
    if (!activeKartuProduct) return [];

    const prodLogs = stockLogs
      .filter((l) => l.product_id === activeKartuProduct.id && isDateInFilter(l.created_at))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // chronological

    let runningStock = prodLogs.length > 0 ? (prodLogs[0].previous_stock ?? 0) : (activeKartuProduct.stock || 0);

    return prodLogs.map((log, index) => {
      const diff = (log.current_stock ?? 0) - (log.previous_stock ?? 0);
      const inQty = diff > 0 ? diff : 0;
      const outQty = diff < 0 ? Math.abs(diff) : 0;
      runningStock = log.current_stock ?? runningStock;

      let docRef = `LOG-${log.id.slice(0, 8).toUpperCase()}`;
      let transType = log.type;

      if ((log.notes || '').includes('TRANSFER')) {
        transType = 'TRANSFER GUDANG';
      } else if ((log.notes || '').includes('OPNAME') || (log.notes || '').includes('PENYESUAIAN')) {
        transType = 'PENYESUAIAN FISIK';
      } else if (log.type === 'RESTOCK') {
        transType = 'PENERIMAAN BARANG (RESTOK)';
      } else if (log.type === 'REDUCTION') {
        transType = 'PENGELUARAN (SURAT JALAN / ORDER)';
      }

      return {
        id: log.id,
        date: new Date(log.created_at).toLocaleString('id-ID'),
        docRef,
        transType,
        description: log.notes || 'Penyesuaian stok sistem',
        warehouse: 'Gudang Pusat (Jakarta)',
        inQty,
        outQty,
        balance: log.current_stock,
        officer: log.created_by || 'Admin Persediaan',
      };
    });
  }, [activeKartuProduct, stockLogs, periodType, startDate, endDate]);

  // 5. Data Laporan Historis Barang (Audit Trail)
  const historisBarangData = useMemo(() => {
    return stockLogs
      .filter((log) => {
        if (!isDateInFilter(log.created_at)) return false;
        if (categoryFilter !== 'ALL') {
          const catId = log.products?.category_id || log.products?.categories?.id;
          const catName = log.products?.categories?.name;
          if (catId !== categoryFilter && catName !== categoryFilter) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const sku = (log.products?.sku || '').toLowerCase();
          const name = (log.products?.name || '').toLowerCase();
          const notes = (log.notes || '').toLowerCase();
          if (!sku.includes(q) && !name.includes(q) && !notes.includes(q)) return false;
        }
        return true;
      })
      .map((log) => ({
        id: log.id,
        date: new Date(log.created_at).toLocaleString('id-ID'),
        sku: log.products?.sku || '-',
        name: log.products?.name || 'Produk Tidak Dikenal',
        category: log.products?.categories?.name || 'Umum',
        type: log.type,
        prevStock: log.previous_stock ?? 0,
        currentStock: log.current_stock ?? 0,
        delta: (log.current_stock ?? 0) - (log.previous_stock ?? 0),
        notes: log.notes || '-',
        officer: log.created_by || 'Admin',
      }));
  }, [stockLogs, categoryFilter, searchQuery, periodType, startDate, endDate]);

  // 6. Data Laporan Status S/N & SKU
  const statusSNData = useMemo(() => {
    return filteredProducts.map((p, idx) => {
      const stock = p.stock || 0;
      let snPrefix = (p.sku || 'SN').replace(/[^a-zA-Z0-9]/g, '');
      const batchCode = `BTH-${new Date().getFullYear()}${(idx + 1).toString().padStart(3, '0')}`;
      
      let statusLabel = 'Tersedia di Gudang';
      let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
      if (stock === 0) {
        statusLabel = 'Habis / Out of Stock';
        statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
      } else if (stock < 10) {
        statusLabel = 'Kritis / Menipis';
        statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
      }

      return {
        id: p.id,
        sku: p.sku || '-',
        name: p.name,
        category: p.categories?.name || 'Umum',
        batchCode,
        snRange: stock > 0 ? `${snPrefix}-0001 s/d ${snPrefix}-${stock.toString().padStart(4, '0')}` : 'Tidak Ada Unit',
        availableQty: stock,
        location: 'Gudang Utama (Rak A-01)',
        statusLabel,
        statusColor,
      };
    });
  }, [filteredProducts]);

  // 7. Data Laporan Transfer Gudang
  const transferLogData = useMemo(() => {
    return transferDocs.filter((doc) => {
      if (!isDateInFilter(doc.created_at)) return false;
      if (warehouseFilter !== 'ALL') {
        if (doc.from_warehouse !== warehouseFilter && doc.to_warehouse !== warehouseFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = doc.transfer_number.toLowerCase();
        const driver = (doc.driver_name || '').toLowerCase();
        const itemsMatch = doc.items.some(
          (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
        if (!num.includes(q) && !driver.includes(q) && !itemsMatch) return false;
      }
      return true;
    });
  }, [transferDocs, warehouseFilter, searchQuery, periodType, startDate, endDate]);

  // 8. Data Laporan Rekap Transfer Gudang (Summary Matrix)
  const rekapTransferData = useMemo(() => {
    const recapMap: Record<string, { route: string; from: string; to: string; docCount: number; totalQty: number; itemsMap: Record<string, number> }> = {};

    transferLogData.forEach((doc) => {
      const routeKey = `${doc.from_warehouse} -> ${doc.to_warehouse}`;
      if (!recapMap[routeKey]) {
        recapMap[routeKey] = {
          route: routeKey,
          from: doc.from_warehouse,
          to: doc.to_warehouse,
          docCount: 0,
          totalQty: 0,
          itemsMap: {},
        };
      }
      recapMap[routeKey].docCount += 1;
      recapMap[routeKey].totalQty += doc.total_qty;

      doc.items.forEach((it) => {
        recapMap[routeKey].itemsMap[it.name] = (recapMap[routeKey].itemsMap[it.name] || 0) + it.qty;
      });
    });

    return Object.values(recapMap);
  }, [transferLogData]);

  // 9. Data Laporan Penyesuaian Persediaan (Stock Opname)
  const adjustmentReportData = useMemo(() => {
    return adjustmentDocs.filter((doc) => {
      if (!isDateInFilter(doc.created_at)) return false;
      if (warehouseFilter !== 'ALL' && doc.warehouse !== warehouseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = doc.adjustment_number.toLowerCase();
        const prod = doc.product_name.toLowerCase();
        const sku = doc.sku.toLowerCase();
        const reason = doc.reason.toLowerCase();
        if (!num.includes(q) && !prod.includes(q) && !sku.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [adjustmentDocs, warehouseFilter, searchQuery, periodType, startDate, endDate]);

  // 10. Data Laporan Penyesuaian Harga
  const priceAdjustmentReportData = useMemo(() => {
    return priceDocs.filter((doc) => {
      if (!isDateInFilter(doc.created_at)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = doc.adjustment_number.toLowerCase();
        const reason = doc.reason.toLowerCase();
        const itemMatch = doc.items.some(
          (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
        if (!num.includes(q) && !reason.includes(q) && !itemMatch) return false;
      }
      return true;
    });
  }, [priceDocs, searchQuery, periodType, startDate, endDate]);

  // Export to Excel dynamically based on active report
  const handleExportExcel = () => {
    const reportMeta = ERP_REPORTS_LIST.find((r) => r.id === activeReport);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${reportMeta?.title.replace(/\s+/g, '_')}_${dateStr}.xlsx`;

    let dataToExport: any[] = [];

    switch (activeReport) {
      case 'LAPORAN_PERSEDIAAN_AWAL':
        dataToExport = beginningInventoryData.map((d, i) => ({
          'No': i + 1,
          'SKU': d.sku,
          'Nama Barang': d.name,
          'Kategori': d.category,
          'Satuan': d.unit,
          'Saldo Kuantitas Awal': d.beginningQty,
          'Harga Pokok (Rp)': d.unitPrice,
          'Total Valuasi Awal (Rp)': d.initialValuation,
        }));
        break;

      case 'LAPORAN_PERSEDIAAN_BARANG':
        dataToExport = currentInventoryData.map((d, i) => ({
          'No': i + 1,
          'SKU': d.sku,
          'Nama Barang': d.name,
          'Kategori': d.category,
          'Gudang': d.warehouse,
          'Stok Fisik Saat Ini': d.stock,
          'Min. Stok': d.minStock,
          'Status': d.status === 'EMPTY' ? 'KOSONG' : d.status === 'LOW' ? 'MENIPIS' : 'AMAN',
          'Harga Satuan (Rp)': d.price,
          'Total Nilai Persediaan (Rp)': d.totalValuation,
        }));
        break;

      case 'LAPORAN_MUTASI_PERSEDIAAN':
        dataToExport = mutasiInventoryData.map((d, i) => ({
          'No': i + 1,
          'SKU': d.sku,
          'Nama Barang': d.name,
          'Kategori': d.category,
          'Saldo Awal': d.beginningStock,
          'Total Masuk (+ Restok)': d.totalIn,
          'Total Keluar (- Penjualan)': d.totalOut,
          'Penyesuaian (+/-)': d.totalAdjust,
          'Transfer Antar Gudang': d.totalTransfer,
          'Saldo Akhir': d.endingStock,
          'Harga Satuan (Rp)': d.unitPrice,
          'Valuasi Akhir (Rp)': d.valuation,
        }));
        break;

      case 'LAPORAN_KARTU_STOCK':
        dataToExport = kartuStockLedger.map((d, i) => ({
          'No': i + 1,
          'Tanggal': d.date,
          'No. Bukti / Referensi': d.docRef,
          'Jenis Transaksi': d.transType,
          'Keterangan Transaksi': d.description,
          'Gudang': d.warehouse,
          'Masuk (Qty)': d.inQty,
          'Keluar (Qty)': d.outQty,
          'Sisa Saldo (Qty)': d.balance,
          'Petugas / Admin': d.officer,
        }));
        break;

      case 'LAPORAN_HISTORIS_BARANG':
        dataToExport = historisBarangData.map((d, i) => ({
          'No': i + 1,
          'Waktu': d.date,
          'SKU': d.sku,
          'Nama Produk': d.name,
          'Kategori': d.category,
          'Tipe Perubahan': d.type,
          'Stok Sebelum': d.prevStock,
          'Stok Sesudah': d.currentStock,
          'Selisih (+/-)': d.delta,
          'Catatan / Audit': d.notes,
          'Petugas': d.officer,
        }));
        break;

      case 'LAPORAN_STATUS_SN':
        dataToExport = statusSNData.map((d, i) => ({
          'No': i + 1,
          'SKU': d.sku,
          'Nama Barang': d.name,
          'Kategori': d.category,
          'Kode Batch': d.batchCode,
          'Rentang Serial Number': d.snRange,
          'Qty Tersedia': d.availableQty,
          'Lokasi Penyimpanan': d.location,
          'Status Operasional': d.statusLabel,
        }));
        break;

      case 'LAPORAN_TRANSFER_GUDANG':
        dataToExport = transferLogData.map((d, i) => ({
          'No': i + 1,
          'No. Transfer': d.transfer_number,
          'Tanggal': d.transfer_date,
          'Gudang Asal': d.from_warehouse,
          'Gudang Tujuan': d.to_warehouse,
          'Total Qty': d.total_qty,
          'Total Macam SKU': d.total_items,
          'Driver & Armada': `${d.driver_name} (${d.vehicle_number || '-'})`,
          'Status': d.status,
          'Catatan': d.notes,
          'Petugas': d.created_by,
        }));
        break;

      case 'LAPORAN_REKAP_TRANSFER':
        dataToExport = rekapTransferData.map((d, i) => ({
          'No': i + 1,
          'Rute Pemindahan': d.route,
          'Gudang Pengirim': d.from,
          'Gudang Penerima': d.to,
          'Frekuensi Transfer': `${d.docCount} Kali Pengiriman`,
          'Total Unit Dipindahkan': d.totalQty,
        }));
        break;

      case 'LAPORAN_PENYESUAIAN_PERSEDIAAN':
        dataToExport = adjustmentReportData.map((d, i) => ({
          'No': i + 1,
          'No. Dokumen': d.adjustment_number,
          'Tanggal': d.adjustment_date,
          'Gudang': d.warehouse,
          'SKU': d.sku,
          'Nama Barang': d.product_name,
          'Stok Komputer (Buku)': d.system_stock,
          'Stok Nyata (Fisik)': d.physical_stock,
          'Selisih Qty (+/-)': d.diff_qty,
          'Nilai Selisih (Rp)': d.diff_amount,
          'Alasan': d.reason,
          'Catatan': d.notes,
          'Petugas': d.created_by,
        }));
        break;

      case 'LAPORAN_PENYESUAIAN_HARGA':
        dataToExport = [];
        priceAdjustmentReportData.forEach((doc) => {
          doc.items.forEach((item) => {
            dataToExport.push({
              'No. Dokumen': doc.adjustment_number,
              'Tanggal Berlaku': doc.effective_date,
              'SKU': item.sku,
              'Nama Produk': item.name,
              'Kategori': item.category_name || '-',
              'Harga Lama (Rp)': item.old_price,
              'Harga Baru (Rp)': item.new_price,
              'Selisih (Rp)': item.diff_amount,
              'Perubahan (%)': `${item.diff_percent.toFixed(2)}%`,
              'Alasan': doc.reason,
              'Dibuat Oleh': doc.created_by,
            });
          });
        });
        break;
    }

    if (dataToExport.length === 0) {
      alert('Tidak ada data pada laporan ini untuk diekspor.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan ERP');
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentReportMeta = ERP_REPORTS_LIST.find((r) => r.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Top Banner / ERP Report Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wider uppercase">
                Pusat Laporan Persediaan ERP
              </span>
              <span className="text-emerald-200 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Sesuai Standar Akuntansi Persediaan
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
              <FileText className="p-1.5 bg-white/10 rounded-2xl" size={36} />
              {currentReportMeta?.title}
            </h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-3xl">
              {currentReportMeta?.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition border border-white/20 shadow-sm"
            >
              <Printer size={16} />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#a3e635] text-black hover:bg-[#bef264] rounded-xl text-sm font-extrabold transition shadow-md hover:scale-105 transform active:scale-95"
            >
              <Download size={16} />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector Dropdown / Menu Bar for all 10 ERP Reports */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">
              Pilih Jenis Laporan:
            </label>
            <div className="relative flex-1 max-w-xl">
              <select
                value={activeReport}
                onChange={(e) => handleSelectReport(e.target.value as ERPReportType)}
                className="w-full px-4 py-3 bg-emerald-50/70 dark:bg-zinc-800/90 border border-emerald-300 dark:border-zinc-700 rounded-xl text-sm font-black text-emerald-950 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
              >
                <optgroup label="📋 Laporan Saldo Persediaan">
                  <option value="LAPORAN_PERSEDIAAN_AWAL">1. Laporan Persediaan Awal</option>
                  <option value="LAPORAN_PERSEDIAAN_BARANG">2. Laporan Persediaan Barang</option>
                </optgroup>
                <optgroup label="🔄 Laporan Mutasi & Kartu Stok">
                  <option value="LAPORAN_MUTASI_PERSEDIAAN">3. Laporan Mutasi Persediaan</option>
                  <option value="LAPORAN_KARTU_STOCK">4. Laporan Kartu Stock (Interactive Buku Besar)</option>
                </optgroup>
                <optgroup label="🔍 Audit & Status Barang">
                  <option value="LAPORAN_HISTORIS_BARANG">5. Laporan Historis Barang</option>
                  <option value="LAPORAN_STATUS_SN">6. Laporan Status S/N & SKU</option>
                </optgroup>
                <optgroup label="🚚 Laporan Transfer Antar Gudang">
                  <option value="LAPORAN_TRANSFER_GUDANG">7. Laporan Transfer Gudang</option>
                  <option value="LAPORAN_REKAP_TRANSFER">8. Laporan Rekap Transfer Gudang</option>
                </optgroup>
                <optgroup label="⚖️ Laporan Penyesuaian (Opname & Harga)">
                  <option value="LAPORAN_PENYESUAIAN_PERSEDIAAN">9. Laporan Penyesuaian Persediaan (Opname)</option>
                  <option value="LAPORAN_PENYESUAIAN_HARGA">10. Laporan Penyesuaian Harga</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllReportData}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* Quick Tabs Ribbon for fast switching */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ERP_REPORTS_LIST.map((r) => {
            const isSelected = activeReport === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectReport(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {r.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Universal Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SKU, nama produk, nomor bukti dokumen..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter */}
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as any)}
            className="px-3 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="LAST_MONTH">Bulan Lalu</option>
            <option value="7_DAYS">7 Hari Terakhir</option>
            <option value="30_DAYS">30 Hari Terakhir</option>
            <option value="CUSTOM_RANGE">Rentang Tanggal Khusus</option>
            <option value="ALL">Semua Periode</option>
          </select>

          {/* Custom Date Range Pickers */}
          {periodType === 'CUSTOM_RANGE' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
              <span className="text-gray-400 text-xs">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Warehouse Filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Gudang</option>
            {DEFAULT_WAREHOUSES.map((w) => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REPORT 1: LAPORAN PERSEDIAAN AWAL */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_PERSEDIAAN_AWAL' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Total Item Barang</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {beginningInventoryData.length} SKU
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Total Saldo Kuantitas Awal</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {beginningInventoryData.reduce((acc, curr) => acc + curr.beginningQty, 0).toLocaleString('id-ID')} Unit
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Valuasi Persediaan Awal</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                Rp {beginningInventoryData.reduce((acc, curr) => acc + curr.initialValuation, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode SKU</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Satuan</th>
                    <th className="py-3 px-4 text-right">Saldo Qty Awal</th>
                    <th className="py-3 px-4 text-right">Harga Pokok (Rp)</th>
                    <th className="py-3 px-4 text-right">Valuasi Awal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {beginningInventoryData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">{item.sku}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">{item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category}</td>
                      <td className="py-3 px-4 text-center text-gray-500">{item.unit}</td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                        {item.beginningQty.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-zinc-300">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {item.initialValuation.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: LAPORAN PERSEDIAAN BARANG (Current Stock & Valuation) */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_PERSEDIAAN_BARANG' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Total SKU</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {currentInventoryData.length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Total Fisik Unit</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {currentInventoryData.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Status Menipis/Kosong</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {currentInventoryData.filter((i) => i.status !== 'SAFE').length} SKU
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-gray-500 font-bold uppercase">Total Valuasi Aset Gudang</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                Rp {currentInventoryData.reduce((acc, curr) => acc + curr.totalValuation, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode SKU</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Lokasi / Gudang</th>
                    <th className="py-3 px-4 text-right">Stok Fisik</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Harga Satuan</th>
                    <th className="py-3 px-4 text-right">Valuasi Persediaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {currentInventoryData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">{item.sku}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">{item.name}</td>
                      <td className="py-3 px-4 text-gray-500">{item.category}</td>
                      <td className="py-3 px-4 text-gray-500">{item.warehouse}</td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                        {item.stock.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.status === 'SAFE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : item.status === 'LOW'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          {item.status === 'SAFE' ? 'AMAN' : item.status === 'LOW' ? 'MENIPIS' : 'HABIS'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-zinc-300">
                        Rp {item.price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        Rp {item.totalValuation.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: LAPORAN MUTASI PERSEDIAAN */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_MUTASI_PERSEDIAAN' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Nama Barang</th>
                    <th className="py-3 px-3 text-right">Saldo Awal</th>
                    <th className="py-3 px-3 text-right text-emerald-600">Masuk (+)</th>
                    <th className="py-3 px-3 text-right text-rose-600">Keluar (-)</th>
                    <th className="py-3 px-3 text-right">Opname (+/-)</th>
                    <th className="py-3 px-3 text-right">Transfer (+/-)</th>
                    <th className="py-3 px-3 text-right font-black">Saldo Akhir</th>
                    <th className="py-3 px-3 text-right">Nilai Akhir (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {mutasiInventoryData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">{item.sku}</td>
                      <td className="py-3 px-3 font-semibold text-gray-800 dark:text-zinc-200">{item.name}</td>
                      <td className="py-3 px-3 text-right font-medium">{item.beginningStock}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">+{item.totalIn}</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">-{item.totalOut}</td>
                      <td className={`py-3 px-3 text-right font-bold ${item.totalAdjust >= 0 ? 'text-gray-700 dark:text-zinc-300' : 'text-rose-500'}`}>
                        {item.totalAdjust >= 0 ? `+${item.totalAdjust}` : item.totalAdjust}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-indigo-600">
                        {item.totalTransfer >= 0 ? `+${item.totalTransfer}` : item.totalTransfer}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                        {item.endingStock}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {item.valuation.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 4: LAPORAN KARTU STOCK (INTERAKTIF BUKU BESAR) */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_KARTU_STOCK' && (
        <div className="space-y-4">
          {/* Header Card Selection for Product */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Boxes size={24} className="text-emerald-600" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Pilih Produk untuk Buku Besar Kartu Stok:
                </span>
                <select
                  value={kartuStockProductId}
                  onChange={(e) => setKartuStockProductId(e.target.value)}
                  className="mt-1 block px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku || 'SKU'}] {p.name} (Stok Saat Ini: {p.stock || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeKartuProduct && (
              <div className="flex items-center gap-6 text-xs bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                <div>
                  <span className="text-gray-500 block">Kategori:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {activeKartuProduct.categories?.name || 'Umum'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Harga Satuan:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Rp {(activeKartuProduct.price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Sisa Saldo Terkini:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {activeKartuProduct.stock || 0} Unit
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Kartu Stock Table */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Tgl & Jam</th>
                    <th className="py-3 px-3">No. Bukti / Ref</th>
                    <th className="py-3 px-3">Transaksi</th>
                    <th className="py-3 px-3">Keterangan</th>
                    <th className="py-3 px-3 text-right text-emerald-600">Masuk (In)</th>
                    <th className="py-3 px-3 text-right text-rose-600">Keluar (Out)</th>
                    <th className="py-3 px-3 text-right font-black">Sisa Saldo</th>
                    <th className="py-3 px-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {kartuStockLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        Belum ada riwayat mutasi untuk produk ini pada periode terpilih.
                      </td>
                    </tr>
                  ) : (
                    kartuStockLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-3 font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">
                          {row.docRef}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200">
                            {row.transType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 max-w-xs truncate">{row.description}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {row.inQty > 0 ? `+${row.inQty}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600">
                          {row.outQty > 0 ? `-${row.outQty}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white bg-gray-50/50 dark:bg-zinc-800/20">
                          {row.balance}
                        </td>
                        <td className="py-3 px-3 text-gray-500">{row.officer}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 5: LAPORAN HISTORIS BARANG (AUDIT LOG) */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_HISTORIS_BARANG' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Tipe Aksi</th>
                    <th className="py-3 px-4 text-center">Stok Sblm → Ssdh</th>
                    <th className="py-3 px-4 text-center">Delta (+/-)</th>
                    <th className="py-3 px-4">Catatan Perubahan</th>
                    <th className="py-3 px-4">Otorisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {historisBarangData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{item.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">{item.sku}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.prevStock} → <strong className="text-gray-900 dark:text-white">{item.currentStock}</strong>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                          item.delta > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.delta < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.delta > 0 ? `+${item.delta}` : item.delta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-zinc-400 max-w-sm truncate">{item.notes}</td>
                      <td className="py-3 px-4 text-gray-500">{item.officer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 6: LAPORAN STATUS S/N & SKU */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_STATUS_SN' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode SKU</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Kode Batch</th>
                    <th className="py-3 px-4">Rentang Serial Number (S/N)</th>
                    <th className="py-3 px-4 text-right">Qty Tersedia</th>
                    <th className="py-3 px-4">Lokasi Rak</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {statusSNData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">{item.sku}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">{item.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-300">{item.batchCode}</td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                        {item.snRange}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                        {item.availableQty}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{item.location}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.statusColor}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 7: LAPORAN TRANSFER GUDANG */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_TRANSFER_GUDANG' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. Transfer</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Gudang Asal</th>
                    <th className="py-3 px-4">Gudang Tujuan</th>
                    <th className="py-3 px-4 text-right">Total Qty</th>
                    <th className="py-3 px-4">Driver & Armada</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {transferLogData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        Belum ada dokumen transfer gudang yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    transferLogData.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                          {doc.transfer_number}
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{doc.transfer_date}</td>
                        <td className="py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">
                          {doc.from_warehouse}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                          {doc.to_warehouse}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                          {doc.total_qty} Unit ({doc.total_items} SKU)
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-zinc-400">
                          {doc.driver_name} {doc.vehicle_number ? `(${doc.vehicle_number})` : ''}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{doc.created_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 8: LAPORAN REKAP TRANSFER GUDANG */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_REKAP_TRANSFER' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Gudang Pengirim</th>
                    <th className="py-3 px-4">Gudang Penerima</th>
                    <th className="py-3 px-4 text-center">Frekuensi Transfer</th>
                    <th className="py-3 px-4 text-right">Total Unit Dipindahkan</th>
                    <th className="py-3 px-4">Ringkasan Barang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {rekapTransferData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Tidak ada rekapitulasi transfer pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    rekapTransferData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">{item.from}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">{item.to}</td>
                        <td className="py-3 px-4 text-center font-black text-gray-900 dark:text-white">
                          {item.docCount} Kali
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                          {item.totalQty.toLocaleString('id-ID')} Unit
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-zinc-400 text-[11px]">
                          {Object.entries(item.itemsMap).slice(0, 3).map(([name, qty]) => (
                            <span key={name} className="mr-2 inline-block">
                              {name}: <strong>{qty} pcs</strong>;
                            </span>
                          ))}
                          {Object.keys(item.itemsMap).length > 3 && (
                            <span className="text-gray-400 italic">
                              +{Object.keys(item.itemsMap).length - 3} item lainnya
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 9: LAPORAN PENYESUAIAN PERSEDIAAN (OPNAME) */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_PENYESUAIAN_PERSEDIAAN' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. Dokumen</th>
                    <th className="py-3 px-4">Tgl & Gudang</th>
                    <th className="py-3 px-4">Produk (SKU)</th>
                    <th className="py-3 px-4 text-right">Stok Komputer</th>
                    <th className="py-3 px-4 text-right">Stok Nyata</th>
                    <th className="py-3 px-4 text-right">Selisih Unit</th>
                    <th className="py-3 px-4 text-right">Nilai Selisih (Rp)</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {adjustmentReportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        Belum ada dokumen penyesuaian persediaan opname yang cocok.
                      </td>
                    </tr>
                  ) : (
                    adjustmentReportData.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                          {doc.adjustment_number}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          <div>{doc.adjustment_date}</div>
                          <span className="text-[10px] text-gray-400">{doc.warehouse}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-800 dark:text-zinc-200">{doc.product_name}</p>
                          <span className="font-mono text-gray-400 text-[10px]">{doc.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">{doc.system_stock}</td>
                        <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                          {doc.physical_stock}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-black px-1.5 py-0.5 rounded ${
                            doc.diff_qty > 0
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                              : doc.diff_qty < 0
                              ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40'
                              : 'text-gray-500'
                          }`}>
                            {doc.diff_qty > 0 ? `+${doc.diff_qty}` : doc.diff_qty}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          doc.diff_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {doc.diff_amount >= 0 ? '+' : ''}Rp {doc.diff_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-zinc-400 text-[11px]">{doc.reason}</td>
                        <td className="py-3 px-4 text-gray-500">{doc.created_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 10: LAPORAN PENYESUAIAN HARGA */}
      {/* ========================================================================= */}
      {activeReport === 'LAPORAN_PENYESUAIAN_HARGA' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-zinc-800/60 uppercase font-black tracking-wider text-gray-600 dark:text-zinc-400 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. Dokumen</th>
                    <th className="py-3 px-4">Tgl Berlaku</th>
                    <th className="py-3 px-4">Produk (SKU)</th>
                    <th className="py-3 px-4 text-right">Harga Lama</th>
                    <th className="py-3 px-4 text-right">Harga Baru</th>
                    <th className="py-3 px-4 text-right">Selisih (Rp)</th>
                    <th className="py-3 px-4 text-right">% Perubahan</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {priceAdjustmentReportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        Belum ada dokumen penyesuaian harga pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    priceAdjustmentReportData.map((doc) =>
                      doc.items.map((it, idx) => (
                        <tr key={`${doc.id}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                            {doc.adjustment_number}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{doc.effective_date}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-800 dark:text-zinc-200">{it.name}</p>
                            <span className="font-mono text-gray-400 text-[10px]">{it.sku}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-400 line-through">
                            Rp {it.old_price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                            Rp {it.new_price.toLocaleString('id-ID')}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${
                            it.diff_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {it.diff_amount >= 0 ? '+' : ''}Rp {it.diff_amount.toLocaleString('id-ID')}
                          </td>
                          <td className={`py-3 px-4 text-right font-black ${
                            it.diff_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {it.diff_amount >= 0 ? '+' : ''}{it.diff_percent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-zinc-400 text-[11px]">{doc.reason}</td>
                          <td className="py-3 px-4 text-gray-500">{doc.created_by}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
