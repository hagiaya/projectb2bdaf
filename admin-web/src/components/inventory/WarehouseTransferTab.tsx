'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Calendar, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Boxes, 
  X, 
  Trash2, 
  Eye, 
  FileText,
  Building2,
  PackageCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

export interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  type: string;
}

export const DEFAULT_WAREHOUSES: WarehouseItem[] = [
  { id: 'wh-main', code: 'WH-01', name: 'Gudang Utama / Pusat (Jakarta)', type: 'PUSAT' },
  { id: 'wh-store', code: 'WH-02', name: 'Gudang Toko / Display (Showroom)', type: 'DISPLAY' },
  { id: 'wh-transit', code: 'WH-03', name: 'Gudang Transit & Ekspedisi', type: 'TRANSIT' },
  { id: 'wh-return', code: 'WH-04', name: 'Gudang Retur & Barang Reject', type: 'RETUR' },
  { id: 'wh-branch', code: 'WH-05', name: 'Gudang Cabang / Area', type: 'CABANG' },
];

export interface TransferLineItem {
  product_id: string;
  sku: string;
  name: string;
  current_stock: number;
  qty: number;
  notes?: string;
}

export interface WarehouseTransferDoc {
  id: string;
  transfer_number: string;
  transfer_date: string;
  from_warehouse: string;
  to_warehouse: string;
  status: 'COMPLETED' | 'IN_TRANSIT' | 'DRAFT';
  driver_name: string;
  vehicle_number?: string;
  notes: string;
  created_by: string;
  created_at: string;
  items: TransferLineItem[];
  total_qty: number;
  total_items: number;
}

interface WarehouseTransferTabProps {
  products: any[];
  adminEmail: string;
  onRefreshStock: () => void;
}

const STORAGE_KEY = 'erp_warehouse_transfers_v1';

export default function WarehouseTransferTab({
  products,
  adminEmail,
  onRefreshStock,
}: WarehouseTransferTabProps) {
  const [transfers, setTransfers] = useState<WarehouseTransferDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_TRANSIT'>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');

  // Modal Create Transfer
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromWarehouse, setFromWarehouse] = useState(DEFAULT_WAREHOUSES[0].name);
  const [toWarehouse, setToWarehouse] = useState(DEFAULT_WAREHOUSES[1].name);
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferStatus, setTransferStatus] = useState<'COMPLETED' | 'IN_TRANSIT'>('COMPLETED');
  const [selectedLines, setSelectedLines] = useState<TransferLineItem[]>([]);

  // Picker Row state
  const [pickerProductId, setPickerProductId] = useState('');
  const [pickerQty, setPickerQty] = useState('');

  // Modal View & Print Detail
  const [selectedDocForView, setSelectedDocForView] = useState<WarehouseTransferDoc | null>(null);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTransfers(JSON.parse(saved));
      } else {
        // Sample seed if empty
        const sample: WarehouseTransferDoc[] = [
          {
            id: 'trf-sample-1',
            transfer_number: 'TRF-20261014-001',
            transfer_date: new Date().toISOString().slice(0, 10),
            from_warehouse: 'Gudang Utama / Pusat (Jakarta)',
            to_warehouse: 'Gudang Toko / Display (Showroom)',
            status: 'COMPLETED',
            driver_name: 'Budi Kurir',
            vehicle_number: 'B 9283 DAP',
            notes: 'Pemindahan restok display toko mingguan',
            created_by: adminEmail || 'Admin',
            created_at: new Date().toISOString(),
            items: (products || []).slice(0, 2).map(p => ({
              product_id: p.id,
              sku: p.sku || 'SKU-001',
              name: p.name,
              current_stock: p.stock,
              qty: 5,
              notes: 'Pajangan Showroom',
            })),
            total_qty: 10,
            total_items: 2,
          }
        ];
        setTransfers(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      }
    } catch (e) {
      console.error('Error loading transfers:', e);
    }
  };

  const saveTransfersToStorage = (updated: WarehouseTransferDoc[]) => {
    setTransfers(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving transfers to storage:', e);
    }
  };

  // Add Item to Transfer Lines
  const handleAddLineItem = () => {
    if (!pickerProductId) {
      alert('Pilih produk terlebih dahulu.');
      return;
    }
    const qtyNum = parseInt(pickerQty, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      alert('Masukkan jumlah kuantitas transfer yang valid (> 0).');
      return;
    }

    const prod = products.find(p => p.id === pickerProductId);
    if (!prod) return;

    if (qtyNum > prod.stock) {
      alert(`Stok produk "${prod.name}" hanya tersisa ${prod.stock} unit. Jumlah transfer tidak boleh melebihi stok.`);
      return;
    }

    const existingIndex = selectedLines.findIndex(l => l.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...selectedLines];
      const newQty = updated[existingIndex].qty + qtyNum;
      if (newQty > prod.stock) {
        alert(`Total transfer produk ini (${newQty}) melebihi stok tersedia (${prod.stock}).`);
        return;
      }
      updated[existingIndex].qty = newQty;
      setSelectedLines(updated);
    } else {
      setSelectedLines(prev => [
        ...prev,
        {
          product_id: prod.id,
          sku: prod.sku || '-',
          name: prod.name,
          current_stock: prod.stock,
          qty: qtyNum,
        }
      ]);
    }

    setPickerProductId('');
    setPickerQty('');
  };

  const handleRemoveLineItem = (index: number) => {
    setSelectedLines(prev => prev.filter((_, idx) => idx !== index));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (fromWarehouse === toWarehouse) {
      setToWarehouse(DEFAULT_WAREHOUSES[1].name);
    }
    setSelectedLines([]);
    setDriverName('');
    setVehicleNumber('');
    setTransferNotes('');
    setTransferStatus('COMPLETED');
    setPickerProductId('');
    setPickerQty('');
    setIsCreateModalOpen(true);
  };

  // Submit New Transfer
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWarehouse === toWarehouse) {
      alert('Gudang Asal dan Gudang Tujuan tidak boleh sama.');
      return;
    }
    if (selectedLines.length === 0) {
      alert('Tambahkan minimal 1 item barang yang akan ditransfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const transferNumber = `TRF-${dateStr}-${randomSuffix}`;
      const nowIso = new Date().toISOString();

      const totalQty = selectedLines.reduce((sum, item) => sum + item.qty, 0);

      const newDoc: WarehouseTransferDoc = {
        id: `trf-${Date.now()}`,
        transfer_number: transferNumber,
        transfer_date: new Date().toISOString().slice(0, 10),
        from_warehouse: fromWarehouse,
        to_warehouse: toWarehouse,
        status: transferStatus,
        driver_name: driverName.trim() || 'Ekspedisi Internal DAP',
        vehicle_number: vehicleNumber.trim() || '-',
        notes: transferNotes.trim() || 'Transfer stok barang antar gudang',
        created_by: adminEmail || 'Admin',
        created_at: nowIso,
        items: selectedLines,
        total_qty: totalQty,
        total_items: selectedLines.length,
      };

      // If status is COMPLETED or from_warehouse is Pusat, we log the stock movement into Supabase
      for (const line of selectedLines) {
        const prod = products.find(p => p.id === line.product_id);
        const prevStock = prod ? prod.stock : line.current_stock;

        // Log into Supabase stock_logs
        await supabase.from('stock_logs').insert([{
          product_id: line.product_id,
          type: 'TRANSFER',
          quantity: line.qty,
          previous_stock: prevStock,
          current_stock: prevStock, // Overall total stock remains, but location shifts
          notes: `[TRANSFER:${transferNumber}] ${fromWarehouse} ➔ ${toWarehouse} | Supir: ${driverName || '-'}`,
          created_by: adminEmail || 'Admin',
        }]);
      }

      const updatedTransfers = [newDoc, ...transfers];
      saveTransfersToStorage(updatedTransfers);

      alert(`Surat Jalan Transfer "${transferNumber}" berhasil dibuat dan dicatat!`);
      setIsCreateModalOpen(false);
      onRefreshStock();
    } catch (err: any) {
      alert('Gagal menyimpan transfer: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (warehouseFilter !== 'ALL') {
        if (t.from_warehouse !== warehouseFilter && t.to_warehouse !== warehouseFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNo = t.transfer_number.toLowerCase().includes(q);
        const matchesDriver = t.driver_name.toLowerCase().includes(q);
        const matchesNotes = t.notes.toLowerCase().includes(q);
        const matchesItem = t.items.some(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
        if (!matchesNo && !matchesDriver && !matchesNotes && !matchesItem) return false;
      }
      return true;
    });
  }, [transfers, statusFilter, warehouseFilter, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCount = transfers.length;
    const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
    const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
    const totalVolumeQty = transfers.reduce((sum, t) => sum + (t.total_qty || 0), 0);
    return { totalCount, completedCount, inTransitCount, totalVolumeQty };
  }, [transfers]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredTransfers.length === 0) {
      alert('Tidak ada data transfer untuk diekspor.');
      return;
    }

    const flatRows: any[] = [];
    filteredTransfers.forEach(t => {
      t.items.forEach(item => {
        flatRows.push({
          'No. Transfer': t.transfer_number,
          'Tanggal': t.transfer_date,
          'Gudang Asal': t.from_warehouse,
          'Gudang Tujuan': t.to_warehouse,
          'SKU': item.sku,
          'Nama Barang': item.name,
          'Qty Transfer': item.qty,
          'Penanggung Jawab / Supir': t.driver_name,
          'No. Kendaraan': t.vehicle_number || '-',
          'Status': t.status === 'COMPLETED' ? 'Selesai' : 'Dalam Perjalanan',
          'Catatan': t.notes,
          'Dibuat Oleh': t.created_by,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transfer_Gudang');
    XLSX.writeFile(wb, `Laporan_Transfer_Gudang_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print Surat Jalan
  const handlePrintDeliverySlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Metrics Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Truck size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transfer Antar Gudang</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Kelola perpindahan stok antar lokasi: Gudang Pusat, Display Showroom, Transit, dan Retur.
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
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} /> Buat Transfer Gudang
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dokumen</span>
            <FileText size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{summaryMetrics.totalCount}</p>
          <p className="text-xs text-slate-500 mt-1">Surat jalan perpindahan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume Qty</span>
            <Boxes size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700">{summaryMetrics.totalVolumeQty.toLocaleString('id-ID')} unit</p>
          <p className="text-xs text-slate-500 mt-1">Barang telah ditransfer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transfer Selesai</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{summaryMetrics.completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Telah diterima di gudang tujuan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dalam Perjalanan</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{summaryMetrics.inTransitCount}</p>
          <p className="text-xs text-slate-500 mt-1">Sedang dikirim armada kurir</p>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari No. Transfer, Nama Sopir, SKU, atau Nama Barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETED">Selesai (Completed)</option>
            <option value="IN_TRANSIT">Dalam Pengiriman</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 max-w-[220px]"
          >
            <option value="ALL">Semua Lokasi Gudang</option>
            {DEFAULT_WAREHOUSES.map((wh) => (
              <option key={wh.id} value={wh.name}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Dokumen Transfer */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="p-4 font-semibold">No. Transfer & Tanggal</th>
                <th className="p-4 font-semibold">Rute Perpindahan Gudang</th>
                <th className="p-4 font-semibold text-center">Item & Qty</th>
                <th className="p-4 font-semibold">Penanggung Jawab</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <Truck size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Belum ada dokumen transfer gudang</p>
                    <p className="text-[11px] text-slate-400 mt-1">Klik tombol "+ Buat Transfer Gudang" untuk memindahkan stok antar lokasi.</p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-slate-900">{t.transfer_number}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {t.transfer_date}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{t.from_warehouse}</span>
                        <ArrowRightLeft size={12} className="text-emerald-600 shrink-0" />
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">{t.to_warehouse}</span>
                      </div>
                      {t.notes && <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">"{t.notes}"</p>}
                    </td>

                    <td className="p-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs">
                        {t.total_items} Produk ({t.total_qty} unit)
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{t.driver_name}</p>
                      <p className="text-[11px] text-slate-400">Kendaraan: {t.vehicle_number || '-'}</p>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {t.status === 'COMPLETED' ? 'Selesai' : 'Dalam Pengiriman'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedDocForView(t)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} /> Detail & Surat Jalan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Buat Transfer Gudang Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ArrowRightLeft size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Buat Dokumen Transfer Gudang</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-4 mt-4 text-xs">
              {/* Gudang Asal & Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gudang Asal (Pengirim):</label>
                  <select
                    value={fromWarehouse}
                    onChange={(e) => setFromWarehouse(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {DEFAULT_WAREHOUSES.map((wh) => (
                      <option key={`from-${wh.id}`} value={wh.name}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gudang Tujuan (Penerima):</label>
                  <select
                    value={toWarehouse}
                    onChange={(e) => setToWarehouse(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {DEFAULT_WAREHOUSES.map((wh) => (
                      <option key={`to-${wh.id}`} value={wh.name} disabled={wh.name === fromWarehouse}>
                        {wh.name} {wh.name === fromWarehouse ? '(Asal)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kurir & Supir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Supir / Petugas Ekspedisi:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Pratama / Kurir Internal"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Kendaraan / Plat Mobil:</label>
                  <input
                    type="text"
                    placeholder="Contoh: B 1234 DAP / Motor Box"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Tambah Item Produk ke List */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <span className="font-bold text-emerald-900 block">Pilih Barang yang Ditransfer:</span>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={pickerProductId}
                    onChange={(e) => setPickerProductId(e.target.value)}
                    className="flex-1 p-2 bg-white border border-emerald-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="">-- Pilih Produk dari Master --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku || '-'} | Stok Tersedia: {p.stock})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={pickerQty}
                    onChange={(e) => setPickerQty(e.target.value)}
                    className="w-24 p-2 bg-white border border-emerald-200 rounded-xl font-bold text-center"
                  />

                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl whitespace-nowrap cursor-pointer"
                  >
                    + Tambah Item
                  </button>
                </div>

                {/* Table Selected Items */}
                {selectedLines.length > 0 && (
                  <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden mt-3">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-emerald-100/60 text-emerald-900 text-[11px] font-bold">
                          <th className="p-2.5">Produk</th>
                          <th className="p-2.5 text-center">Stok Gudang</th>
                          <th className="p-2.5 text-center">Qty Ditransfer</th>
                          <th className="p-2.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {selectedLines.map((line, idx) => (
                          <tr key={`line-${idx}`}>
                            <td className="p-2.5 font-semibold text-slate-800">
                              <p>{line.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">SKU: {line.sku}</span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-600">{line.current_stock}</td>
                            <td className="p-2.5 text-center font-black text-emerald-700">{line.qty}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Status & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Pengiriman:</label>
                  <select
                    value={transferStatus}
                    onChange={(e) => setTransferStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="COMPLETED">Selesai (Langsung Diterima)</option>
                    <option value="IN_TRANSIT">Dalam Pengiriman (In Transit)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catatan / Keperluan:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pemenuhan restok display cabang"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Proses Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detail & Cetak Surat Jalan Transfer */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackageCheck size={20} className="text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">Surat Jalan Transfer Gudang</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDeliverySlip}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Printer size={13} /> Cetak Slip
                </button>
                <button onClick={() => setSelectedDocForView(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Paper Preview */}
            <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-inner space-y-4 my-4 text-xs">
              {/* Header Surat */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm tracking-wide">PT DISTRIBUSI AKSESORIS PRIMA</h4>
                  <p className="text-[10px] text-slate-500">Sistem Manajemen Logistik & Distribusi B2B</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded text-[11px] block w-fit ml-auto">
                    {selectedDocForView.transfer_number}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tanggal: {selectedDocForView.transfer_date}</span>
                </div>
              </div>

              {/* Rincian Rute & Kurir */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gudang Asal:</p>
                  <p className="font-bold text-slate-800">{selectedDocForView.from_warehouse}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gudang Tujuan:</p>
                  <p className="font-bold text-emerald-700">{selectedDocForView.to_warehouse}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Supir / Ekspedisi:</p>
                  <p className="font-semibold text-slate-700">{selectedDocForView.driver_name} ({selectedDocForView.vehicle_number || '-'})</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status:</p>
                  <p className="font-semibold text-slate-700">{selectedDocForView.status === 'COMPLETED' ? 'Selesai Diterima' : 'Sedang Dikirim'}</p>
                </div>
              </div>

              {/* Tabel Barang */}
              <table className="w-full text-left border-collapse border border-slate-200 mt-2">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                    <th className="p-2 border border-slate-200 text-center">No</th>
                    <th className="p-2 border border-slate-200">SKU</th>
                    <th className="p-2 border border-slate-200">Nama Barang</th>
                    <th className="p-2 border border-slate-200 text-center">Qty Ditransfer</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDocForView.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-200 font-mono text-[10px]">{item.sku}</td>
                      <td className="p-2 border border-slate-200 font-medium">{item.name}</td>
                      <td className="p-2 border border-slate-200 text-center font-bold text-emerald-800">{item.qty} pcs</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={3} className="p-2 text-right border border-slate-200">TOTAL UNIT:</td>
                    <td className="p-2 text-center border border-slate-200 text-emerald-800">{selectedDocForView.total_qty} pcs</td>
                  </tr>
                </tbody>
              </table>

              {selectedDocForView.notes && (
                <p className="text-[11px] text-slate-500 italic">Catatan: "{selectedDocForView.notes}"</p>
              )}

              {/* Kolom Tanda Tangan */}
              <div className="grid grid-cols-3 gap-2 text-center pt-6 text-[10px]">
                <div>
                  <p className="font-bold text-slate-700">Yang Menyerahkan,</p>
                  <p className="text-slate-400 mt-0.5">(Gudang Asal)</p>
                  <div className="h-12 border-b border-slate-300 w-24 mx-auto"></div>
                  <p className="mt-1 text-slate-500">( ......................... )</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Petugas / Supir,</p>
                  <p className="text-slate-400 mt-0.5">(Ekspedisi / Kurir)</p>
                  <div className="h-12 border-b border-slate-300 w-24 mx-auto"></div>
                  <p className="mt-1 text-slate-500">( {selectedDocForView.driver_name} )</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Yang Menerima,</p>
                  <p className="text-slate-400 mt-0.5">(Gudang Tujuan)</p>
                  <div className="h-12 border-b border-slate-300 w-24 mx-auto"></div>
                  <p className="mt-1 text-slate-500">( ......................... )</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDocForView(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
