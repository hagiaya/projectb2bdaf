'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeftRight, 
  Check, 
  X, 
  Truck, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  Upload, 
  Plus, 
  Trash2, 
  FileText, 
  ExternalLink, 
  Image as ImageIcon, 
  RefreshCw, 
  Filter,
  ShieldCheck,
  Send,
  Building2,
  Phone,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReturnItem {
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  reason?: string;
  condition?: string;
  photo_url?: string;
}

interface ReplacementItem {
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface ReturnReq {
  id: string;
  return_number: string;
  reason: string;
  status: string;
  dealer_id?: string;
  order_id?: string;
  created_at: string;
  dealers?: { store_name: string; phone?: string; address?: string };
  orders?: { order_number: string };
  return_items?: ReturnItem[];
  dealer_courier?: string;
  dealer_shipping_receipt_no?: string;
  dealer_shipping_photo_url?: string;
  dealer_shipped_at?: string;
  admin_received_at?: string;
  admin_notes?: string;
  replacement_items?: ReplacementItem[];
  replacement_courier?: string;
  replacement_shipping_receipt_no?: string;
  replacement_shipping_photo_url?: string;
  replacement_shipped_at?: string;
  dealer_received_at?: string;
  completed_at?: string;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnReq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Modals state
  const [selectedReturn, setSelectedReturn] = useState<ReturnReq | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form state: Konfirmasi Barang Diterima (Step 3)
  const [receiveNotes, setReceiveNotes] = useState('Barang fisik telah tiba di Gudang Pusat DAP dalam kondisi sesuai nota retur.');
  const [isProcessingReceive, setIsProcessingReceive] = useState(false);

  // Form state: Kirim Barang Pengganti (Step 4 & 5)
  const [replacementCourier, setReplacementCourier] = useState('J&T Express');
  const [replacementReceiptNo, setReplacementReceiptNo] = useState('');
  const [replacementPhotoUrl, setReplacementPhotoUrl] = useState('');
  const [replacementItems, setReplacementItems] = useState<ReplacementItem[]>([]);
  const [isProcessingReplacement, setIsProcessingReplacement] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchData();
    fetchProducts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-returns-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, price, image_url')
        .limit(200);
      if (data) setAllProducts(data);
    } catch (e) {
      console.error('Fetch products error:', e);
    }
  };

  // Helper normalizer to handle both native DB columns & JSON payload in reason
  const normalizeReturn = (row: any): ReturnReq => {
    let parsedMetadata: any = {};
    if (typeof row.reason === 'string' && row.reason.trim().startsWith('{')) {
      try {
        parsedMetadata = JSON.parse(row.reason);
      } catch (e) {
        parsedMetadata = {};
      }
    }

    const returnItems = row.return_items && Array.isArray(row.return_items) && row.return_items.length > 0
      ? row.return_items
      : parsedMetadata.return_items || [];

    const replacementItems = row.replacement_items && Array.isArray(row.replacement_items) && row.replacement_items.length > 0
      ? row.replacement_items
      : parsedMetadata.replacement_items || [];

    return {
      ...row,
      status: row.status || 'REQUESTED',
      reason: parsedMetadata.summary || row.reason || 'Klaim Retur Produk',
      return_items: returnItems,
      dealer_courier: row.dealer_courier || parsedMetadata.dealer_courier,
      dealer_shipping_receipt_no: row.dealer_shipping_receipt_no || parsedMetadata.dealer_shipping_receipt_no,
      dealer_shipping_photo_url: row.dealer_shipping_photo_url || parsedMetadata.dealer_shipping_photo_url,
      dealer_shipped_at: row.dealer_shipped_at || parsedMetadata.dealer_shipped_at,
      admin_received_at: row.admin_received_at || parsedMetadata.admin_received_at,
      admin_notes: row.admin_notes || parsedMetadata.admin_notes,
      replacement_items: replacementItems,
      replacement_courier: row.replacement_courier || parsedMetadata.replacement_courier,
      replacement_shipping_receipt_no: row.replacement_shipping_receipt_no || parsedMetadata.replacement_shipping_receipt_no,
      replacement_shipping_photo_url: row.replacement_shipping_photo_url || parsedMetadata.replacement_shipping_photo_url,
      replacement_shipped_at: row.replacement_shipped_at || parsedMetadata.replacement_shipped_at,
      dealer_received_at: row.dealer_received_at || parsedMetadata.dealer_received_at,
      completed_at: row.completed_at || parsedMetadata.completed_at,
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*, dealers(store_name, phone, address), orders(order_number)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReturns(data.map(normalizeReturn));
      }
    } catch (err) {
      console.error('Fetch returns error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Admin konfirmasi barang retur tiba di gudang
  const handleConfirmReceived = async () => {
    if (!selectedReturn) return;
    setIsProcessingReceive(true);

    const now = new Date().toISOString();
    const updatePayload: any = {
      status: 'RECEIVED_BY_ADMIN',
      admin_received_at: now,
      admin_notes: receiveNotes.trim()
    };

    // Also prepare fallback json in case columns haven't migrated yet
    const fallbackMeta = {
      summary: selectedReturn.reason,
      return_items: selectedReturn.return_items,
      dealer_courier: selectedReturn.dealer_courier,
      dealer_shipping_receipt_no: selectedReturn.dealer_shipping_receipt_no,
      dealer_shipping_photo_url: selectedReturn.dealer_shipping_photo_url,
      dealer_shipped_at: selectedReturn.dealer_shipped_at,
      admin_received_at: now,
      admin_notes: receiveNotes.trim(),
      replacement_items: selectedReturn.replacement_items,
      status_step: 'RECEIVED_BY_ADMIN'
    };

    try {
      const { error } = await supabase
        .from('returns')
        .update(updatePayload)
        .eq('id', selectedReturn.id);

      if (error) {
        // Fallback for missing column: encode in reason
        console.warn('Column update error, applying fallback:', error);
        await supabase
          .from('returns')
          .update({
            status: 'RECEIVED_BY_ADMIN',
            reason: JSON.stringify(fallbackMeta)
          })
          .eq('id', selectedReturn.id);
      }

      // Record notification
      try {
        await supabase.from('notifications').insert([{
          title: `Barang Retur Diterima di Gudang (${selectedReturn.return_number})`,
          description: `Admin gudang telah mengonfirmasi penerimaan fisik barang retur dari dealer ${selectedReturn.dealers?.store_name || ''}.`,
          type: 'RETURN',
          target_role: 'DEALER',
          reference_id: selectedReturn.id
        }]);
      } catch (notifErr) {
        // Ignore if notifications table doesn't exist
      }

      setReceiveModalOpen(false);
      fetchData();
      alert('Berhasil! Fisik barang retur telah dikonfirmasi diterima di Gudang Pusat.');
    } catch (err: any) {
      alert('Gagal konfirmasi: ' + err.message);
    } finally {
      setIsProcessingReceive(false);
    }
  };

  // Step 4 & 5: Admin input barang pengganti & kirim balik resi
  const handleOpenReplacementModal = (item: ReturnReq) => {
    setSelectedReturn(item);
    // Initialize replacement items: default to matching returned items
    if (item.replacement_items && item.replacement_items.length > 0) {
      setReplacementItems(item.replacement_items);
    } else if (item.return_items && item.return_items.length > 0) {
      setReplacementItems(item.return_items.map(ri => ({
        product_id: ri.product_id,
        sku: ri.sku,
        name: ri.name + ' (Unit Baru)',
        quantity: ri.quantity,
        notes: 'Penggantian unit gres baru bergaransi resmi'
      })));
    } else {
      setReplacementItems([{
        sku: 'DAP-REP-01',
        name: 'Unit Pengganti Baru',
        quantity: 1,
        notes: 'Gres Baru Bergaransi'
      }]);
    }

    setReplacementCourier('J&T Express');
    setReplacementReceiptNo(item.replacement_shipping_receipt_no || `JT${Date.now().toString().slice(-8)}`);
    setReplacementPhotoUrl(item.replacement_shipping_photo_url || '');
    setReplacementModalOpen(true);
  };

  const handleAddReplacementRow = () => {
    setReplacementItems([...replacementItems, {
      sku: '',
      name: '',
      quantity: 1,
      notes: 'Unit baru pengganti'
    }]);
  };

  const handleRemoveReplacementRow = (index: number) => {
    setReplacementItems(replacementItems.filter((_, i) => i !== index));
  };

  const handleSelectProductForReplacement = (product: any, index: number) => {
    const updated = [...replacementItems];
    updated[index] = {
      product_id: product.id,
      sku: product.sku || 'SKU-' + product.id.slice(0, 5),
      name: product.name,
      quantity: updated[index]?.quantity || 1,
      notes: 'Unit baru gres segel'
    };
    setReplacementItems(updated);
  };

  const handleUseDemoReplacementProof = () => {
    const demoPhotos = [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80'
    ];
    setReplacementPhotoUrl(demoPhotos[Math.floor(Math.random() * demoPhotos.length)]);
    if (!replacementReceiptNo) {
      setReplacementReceiptNo(`DAP-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
    }
  };

  const handleConfirmReplacementShipped = async () => {
    if (!selectedReturn) return;
    if (!replacementReceiptNo.trim()) {
      alert('Harap isi nomor resi pengiriman barang pengganti.');
      return;
    }
    if (replacementItems.length === 0) {
      alert('Harap isi minimal 1 barang pengganti.');
      return;
    }

    setIsProcessingReplacement(true);
    const now = new Date().toISOString();

    const updatePayload: any = {
      status: 'REPLACEMENT_SHIPPED',
      replacement_items: replacementItems,
      replacement_courier: replacementCourier,
      replacement_shipping_receipt_no: replacementReceiptNo.trim(),
      replacement_shipping_photo_url: replacementPhotoUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      replacement_shipped_at: now
    };

    const fallbackMeta = {
      summary: selectedReturn.reason,
      return_items: selectedReturn.return_items,
      dealer_courier: selectedReturn.dealer_courier,
      dealer_shipping_receipt_no: selectedReturn.dealer_shipping_receipt_no,
      dealer_shipping_photo_url: selectedReturn.dealer_shipping_photo_url,
      dealer_shipped_at: selectedReturn.dealer_shipped_at,
      admin_received_at: selectedReturn.admin_received_at,
      admin_notes: selectedReturn.admin_notes,
      replacement_items: replacementItems,
      replacement_courier: replacementCourier,
      replacement_shipping_receipt_no: replacementReceiptNo.trim(),
      replacement_shipping_photo_url: replacementPhotoUrl,
      replacement_shipped_at: now,
      status_step: 'REPLACEMENT_SHIPPED'
    };

    try {
      const { error } = await supabase
        .from('returns')
        .update(updatePayload)
        .eq('id', selectedReturn.id);

      if (error) {
        console.warn('Column update error, fallback to JSON:', error);
        await supabase
          .from('returns')
          .update({
            status: 'REPLACEMENT_SHIPPED',
            reason: JSON.stringify(fallbackMeta)
          })
          .eq('id', selectedReturn.id);
      }

      // Record notification
      try {
        await supabase.from('notifications').insert([{
          title: `Barang Pengganti Retur Dikirim (${selectedReturn.return_number})`,
          description: `Barang pengganti telah dikirimkan via ${replacementCourier} (Resi: ${replacementReceiptNo.trim()}) ke dealer ${selectedReturn.dealers?.store_name || ''}.`,
          type: 'RETURN',
          target_role: 'DEALER',
          reference_id: selectedReturn.id
        }]);
      } catch (e) {}

      setReplacementModalOpen(false);
      fetchData();
      alert('Berhasil! Barang pengganti & resi kirim balik berhasil disimpan. Menunggu dealer menerima & klik selesai.');
    } catch (err: any) {
      alert('Gagal update: ' + err.message);
    } finally {
      setIsProcessingReplacement(false);
    }
  };

  // Rejection option
  const handleRejectReturn = async (id: string) => {
    const reason = prompt('Masukkan alasan penolakan retur (misal: Masa garansi habis / cacat segel):');
    if (!reason) return;

    try {
      await supabase.from('returns').update({
        status: 'REJECTED',
        admin_notes: 'Ditolak: ' + reason
      }).eq('id', id);
      fetchData();
      alert('Pengajuan retur telah ditolak.');
    } catch (e: any) {
      alert('Gagal tolak retur: ' + e.message);
    }
  };

  // Get status details & badges
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'PENDING':
        return {
          step: 1,
          label: '1. Pengajuan Masuk',
          sub: 'Menunggu dealer upload resi kirim barang',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          dotBg: 'bg-amber-500'
        };
      case 'SHIPPED_BY_DEALER':
        return {
          step: 2,
          label: '2. Dikirim Dealer',
          sub: 'Barang sedang menuju gudang DAP (Ada Resi)',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          dotBg: 'bg-blue-500'
        };
      case 'RECEIVED_BY_ADMIN':
        return {
          step: 3,
          label: '3. Diterima di Gudang',
          sub: 'Fisik barang tiba, perlu kirim barang pengganti',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
          dotBg: 'bg-purple-500'
        };
      case 'REPLACEMENT_SHIPPED':
        return {
          step: 5,
          label: '5. Pengganti Dikirim',
          sub: 'Resi kirim balik tersedia, menunggu dealer terima',
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
          dotBg: 'bg-teal-500'
        };
      case 'COMPLETED':
      case 'PROCESSED':
        return {
          step: 7,
          label: '7. Retur Selesai',
          sub: 'Barang pengganti sudah diterima oleh pemilik dealer',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotBg: 'bg-emerald-500'
        };
      case 'REJECTED':
        return {
          step: 0,
          label: 'Ditolak',
          sub: 'Klaim tidak memenuhi syarat garansi',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          dotBg: 'bg-rose-500'
        };
      case 'APPROVED':
        return {
          step: 2,
          label: 'Disetujui',
          sub: 'Menunggu proses kirim fisik',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          dotBg: 'bg-blue-500'
        };
      default:
        return {
          step: 1,
          label: status,
          sub: 'Status pengajuan retur',
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
          dotBg: 'bg-slate-500'
        };
    }
  };

  // Filter list
  const filteredReturns = returns.filter((r) => {
    const matchSearch = 
      r.return_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (r.dealers?.store_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.dealer_shipping_receipt_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.replacement_shipping_receipt_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.return_items?.some(i => i.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || i.name?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);

    if (!matchSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTION_NEEDED') {
      return r.status === 'REQUESTED' || r.status === 'PENDING' || r.status === 'SHIPPED_BY_DEALER' || r.status === 'RECEIVED_BY_ADMIN';
    }
    if (statusFilter === 'SHIPPED_BY_DEALER') return r.status === 'SHIPPED_BY_DEALER';
    if (statusFilter === 'RECEIVED_BY_ADMIN') return r.status === 'RECEIVED_BY_ADMIN';
    if (statusFilter === 'REPLACEMENT_SHIPPED') return r.status === 'REPLACEMENT_SHIPPED';
    if (statusFilter === 'COMPLETED') return r.status === 'COMPLETED' || r.status === 'PROCESSED';

    return true;
  });

  // Counters for badges & stat cards
  const stats = {
    total: returns.length,
    waitingDealerShipping: returns.filter(r => r.status === 'REQUESTED' || r.status === 'PENDING').length,
    shippedByDealer: returns.filter(r => r.status === 'SHIPPED_BY_DEALER').length,
    receivedAtWarehouse: returns.filter(r => r.status === 'RECEIVED_BY_ADMIN').length,
    replacementShipped: returns.filter(r => r.status === 'REPLACEMENT_SHIPPED').length,
    completed: returns.filter(r => r.status === 'COMPLETED' || r.status === 'PROCESSED').length
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
              <ArrowLeftRight size={26} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Retur & Klaim</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Garansi Resmi DAP B2B Enterprise</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium max-w-2xl">
            Pantau alur retur 7 tahapan: dari pengajuan dealer, pengiriman fisik & resi retur, konfirmasi penerimaan gudang, hingga pengiriman unit pengganti dan penyelesaian akhir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all text-sm"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-emerald-600' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Pengajuan</span>
            <Package size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          <span className="text-[11px] font-semibold text-slate-400">Seluruh tiket</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase">1. Tunggu Resi</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-800">{stats.waitingDealerShipping}</p>
          <span className="text-[11px] font-semibold text-amber-600">Dealer siapkan paket</span>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-700 uppercase">2. Kirim Dealer</span>
            <Truck size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-800">{stats.shippedByDealer}</p>
          <span className="text-[11px] font-semibold text-blue-600">Perlu cek fisik tiba</span>
        </div>

        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-700 uppercase">3. Tiba Gudang</span>
            <Building2 size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-800">{stats.receivedAtWarehouse}</p>
          <span className="text-[11px] font-semibold text-purple-600">Perlu kirim pengganti</span>
        </div>

        <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-700 uppercase">5. Pengganti Jalan</span>
            <Send size={16} className="text-teal-500" />
          </div>
          <p className="text-2xl font-black text-teal-800">{stats.replacementShipped}</p>
          <span className="text-[11px] font-semibold text-teal-600">Menuju toko dealer</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase">7. Selesai</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{stats.completed}</p>
          <span className="text-[11px] font-semibold text-emerald-600">Tuntas diterima dealer</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filter bar & Tabs */}
        <div className="p-5 border-b border-slate-100 bg-white space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari No. Retur, Toko Dealer, SKU Produk, No. Resi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all"
              />
            </div>

            {/* Quick action notice */}
            <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Realtime Sync Aktif
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tiket ({returns.length})
            </button>

            <button
              onClick={() => setStatusFilter('ACTION_NEEDED')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'ACTION_NEEDED'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <AlertCircle size={14} />
              Perlu Tindakan ({stats.shippedByDealer + stats.receivedAtWarehouse})
            </button>

            <button
              onClick={() => setStatusFilter('SHIPPED_BY_DEALER')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'SHIPPED_BY_DEALER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Sedang Dikirim Dealer ({stats.shippedByDealer})
            </button>

            <button
              onClick={() => setStatusFilter('RECEIVED_BY_ADMIN')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'RECEIVED_BY_ADMIN'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Diterima Gudang ({stats.receivedAtWarehouse})
            </button>

            <button
              onClick={() => setStatusFilter('REPLACEMENT_SHIPPED')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'REPLACEMENT_SHIPPED'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
            >
              Pengganti Dikirim ({stats.replacementShipped})
            </button>

            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Selesai ({stats.completed})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6">No. Retur & Tanggal</th>
                <th className="p-4">Toko Dealer</th>
                <th className="p-4">Barang Yang Diretur</th>
                <th className="p-4">Pengiriman Fisik Dealer</th>
                <th className="p-4">Status & Tahap</th>
                <th className="p-4">Barang Pengganti</th>
                <th className="p-4 pr-6 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 font-medium">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data retur...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    <Package size={32} className="mx-auto mb-2 text-slate-300" />
                    Tidak ada tiket retur yang sesuai kriteria pencarian / filter.
                  </td>
                </tr>
              ) : filteredReturns.map((req) => {
                const info = getStatusInfo(req.status);
                const totalReturnedUnits = (req.return_items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
                const totalReplacementUnits = (req.replacement_items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* No Retur */}
                    <td className="p-4 pl-6 align-top">
                      <p className="font-extrabold text-slate-900 tracking-tight font-mono">{req.return_number}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {new Date(req.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      {req.orders?.order_number && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Inv: {req.orders.order_number}
                        </span>
                      )}
                    </td>

                    {/* Dealer */}
                    <td className="p-4 align-top">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 size={15} className="text-slate-400" />
                        {req.dealers?.store_name || 'Dealer B2B'}
                      </p>
                      {req.dealers?.phone && (
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-slate-400" />
                          {req.dealers.phone}
                        </p>
                      )}
                      {req.dealers?.address && (
                        <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-[180px] mt-0.5">
                          {req.dealers.address}
                        </p>
                      )}
                    </td>

                    {/* Barang Diretur */}
                    <td className="p-4 align-top max-w-[220px]">
                      {req.return_items && req.return_items.length > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mb-1.5">
                            <Package size={12} /> {req.return_items.length} SKU ({totalReturnedUnits} unit)
                          </span>
                          <div className="space-y-1">
                            {req.return_items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-xs text-slate-700 font-medium">
                                <span className="font-bold text-emerald-700">[{item.sku}]</span> {item.name} 
                                <span className="font-bold text-slate-900 ml-1">x{item.quantity}</span>
                              </div>
                            ))}
                            {req.return_items.length > 2 && (
                              <p className="text-[11px] font-semibold text-slate-400">
                                +{req.return_items.length - 2} item lainnya...
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-700 font-semibold line-clamp-2">{req.reason}</p>
                          <span className="text-[11px] text-slate-400">Detail SKU umum</span>
                        </div>
                      )}
                    </td>

                    {/* Resi Kirim Dealer */}
                    <td className="p-4 align-top">
                      {req.dealer_shipping_receipt_no ? (
                        <div>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 inline-block mb-1">
                            {req.dealer_courier || 'Ekspedisi'}
                          </span>
                          <p className="font-mono text-xs font-bold text-slate-800">
                            {req.dealer_shipping_receipt_no}
                          </p>
                          {req.dealer_shipping_photo_url && (
                            <button
                              onClick={() => setPreviewImageUrl(req.dealer_shipping_photo_url!)}
                              className="mt-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              <ImageIcon size={12} /> Lihat Foto Resi
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          Belum upload resi
                        </div>
                      )}
                    </td>

                    {/* Status & Step */}
                    <td className="p-4 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${info.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${info.dotBg}`}></span>
                        {info.label}
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 max-w-[160px]">
                        {info.sub}
                      </p>
                    </td>

                    {/* Barang Pengganti */}
                    <td className="p-4 align-top max-w-[200px]">
                      {req.replacement_items && req.replacement_items.length > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded mb-1">
                            {req.replacement_items.length} SKU ({totalReplacementUnits} unit)
                          </span>
                          {req.replacement_shipping_receipt_no && (
                            <div className="mt-1">
                              <p className="text-[11px] text-slate-500 font-medium">Resi Balik:</p>
                              <p className="font-mono text-xs font-bold text-teal-700">
                                {req.replacement_courier} - {req.replacement_shipping_receipt_no}
                              </p>
                              {req.replacement_shipping_photo_url && (
                                <button
                                  onClick={() => setPreviewImageUrl(req.replacement_shipping_photo_url!)}
                                  className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <ImageIcon size={11} /> Foto Kirim Balik
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Aksi Operasional */}
                    <td className="p-4 pr-6 align-top text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {/* Step 3 Action: Confirm physical arrival */}
                        {(req.status === 'SHIPPED_BY_DEALER' || (req.status === 'REQUESTED' && req.dealer_shipping_receipt_no)) && (
                          <button
                            onClick={() => {
                              setSelectedReturn(req);
                              setReceiveNotes(`Barang retur dari ${req.dealers?.store_name || 'dealer'} telah tiba di gudang dan diperiksa.`);
                              setReceiveModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                            title="Konfirmasi barang fisik telah tiba di gudang"
                          >
                            <Building2 size={13} />
                            Konfirmasi Tiba Gudang
                          </button>
                        )}

                        {/* Step 4 & 5 Action: Input Replacement SKU & Ship Receipt */}
                        {req.status === 'RECEIVED_BY_ADMIN' && (
                          <button
                            onClick={() => handleOpenReplacementModal(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                            title="Input SKU pengganti & kirim nomor resi balik"
                          >
                            <Send size={13} />
                            Kirim Barang Pengganti
                          </button>
                        )}

                        {/* Detail Modal button */}
                        <button
                          onClick={() => {
                            setSelectedReturn(req);
                            setDetailModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                          <Eye size={13} />
                          Lihat Detail (7 Tahap)
                        </button>

                        {/* Reject button for pending */}
                        {(req.status === 'REQUESTED' || req.status === 'PENDING') && (
                          <button
                            onClick={() => handleRejectReturn(req.id)}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            Tolak Retur
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DETAIL LENGKAP & TRACKER 7 TAHAPAN RETUR */}
      {/* ========================================================================= */}
      {detailModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Tiket Retur
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedReturn.return_number}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Dealer: <strong className="text-slate-800">{selectedReturn.dealers?.store_name}</strong> • {new Date(selectedReturn.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Visual 7-Step Pipeline */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <p className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-4">
                  Alur & Progres Mekanisme Retur
                </p>
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      selectedReturn.status !== 'REJECTED' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}>
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Owner Dealer Ajukan Detail SKU & Qty</p>
                      <p className="text-xs text-slate-500">Tiket retur dibuat, notifikasi muncul di panel admin & sales.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">✓ Selesai</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      selectedReturn.dealer_shipping_receipt_no || selectedReturn.status === 'SHIPPED_BY_DEALER' || selectedReturn.status === 'RECEIVED_BY_ADMIN' || selectedReturn.status === 'REPLACEMENT_SHIPPED' || selectedReturn.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Menunggu Bukti Resi Pengiriman Dealer</p>
                      {selectedReturn.dealer_shipping_receipt_no ? (
                        <div className="mt-1 bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                          <p><strong>Ekspedisi:</strong> {selectedReturn.dealer_courier || 'Kurir'}</p>
                          <p><strong>No. Resi:</strong> <span className="font-mono font-bold text-blue-700">{selectedReturn.dealer_shipping_receipt_no}</span></p>
                          {selectedReturn.dealer_shipping_photo_url && (
                            <button
                              onClick={() => setPreviewImageUrl(selectedReturn.dealer_shipping_photo_url!)}
                              className="mt-1 font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <ImageIcon size={13} /> Lihat Foto Resi Dealer
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-700 font-medium">Belum diunggah oleh dealer.</p>
                      )}
                    </div>
                    {selectedReturn.dealer_shipping_receipt_no && (
                      <span className="text-xs font-bold text-emerald-600">✓ Selesai</span>
                    )}
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      selectedReturn.admin_received_at || selectedReturn.status === 'RECEIVED_BY_ADMIN' || selectedReturn.status === 'REPLACEMENT_SHIPPED' || selectedReturn.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Barang Returan Sudah Diterima di Gudang</p>
                      {selectedReturn.admin_received_at ? (
                        <div className="mt-1 text-xs text-slate-600">
                          <p>Dikonfirmasi pada: {new Date(selectedReturn.admin_received_at).toLocaleString('id-ID')}</p>
                          {selectedReturn.admin_notes && (
                            <p className="italic text-slate-500 mt-0.5">Catatan Gudang: "{selectedReturn.admin_notes}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Menunggu konfirmasi admin setelah paket tiba.</p>
                      )}
                    </div>
                    {selectedReturn.admin_received_at && (
                      <span className="text-xs font-bold text-emerald-600">✓ Diterima</span>
                    )}
                  </div>

                  {/* Step 4 & 5 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      selectedReturn.replacement_shipping_receipt_no || selectedReturn.status === 'REPLACEMENT_SHIPPED' || selectedReturn.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      4-5
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Admin Input SKU Pengganti & Upload Resi Kirim Balik</p>
                      {selectedReturn.replacement_shipping_receipt_no ? (
                        <div className="mt-1 bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                          <p><strong>Ekspedisi:</strong> {selectedReturn.replacement_courier || 'Kurir'}</p>
                          <p><strong>No. Resi Kirim Balik:</strong> <span className="font-mono font-bold text-teal-700">{selectedReturn.replacement_shipping_receipt_no}</span></p>
                          {selectedReturn.replacement_shipping_photo_url && (
                            <button
                              onClick={() => setPreviewImageUrl(selectedReturn.replacement_shipping_photo_url!)}
                              className="mt-1 font-bold text-teal-600 hover:underline flex items-center gap-1"
                            >
                              <ImageIcon size={13} /> Lihat Bukti Resi Kirim Balik
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Admin menyiapkan unit baru & resi balik.</p>
                      )}
                    </div>
                    {selectedReturn.replacement_shipping_receipt_no && (
                      <span className="text-xs font-bold text-emerald-600">✓ Terkirim</span>
                    )}
                  </div>

                  {/* Step 6 & 7 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PROCESSED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      6-7
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Sudah Diterima Dealer & Pemilik Klik Selesai</p>
                      {selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PROCESSED' ? (
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          Tuntas! Pemilik dealer telah mengonfirmasi penerimaan barang pengganti pada {selectedReturn.completed_at ? new Date(selectedReturn.completed_at).toLocaleString('id-ID') : 'hari ini'}.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">Menunggu pemilik dealer menekan tombol "Selesai" di aplikasi mobile.</p>
                      )}
                    </div>
                    {(selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PROCESSED') && (
                      <span className="text-xs font-bold text-emerald-600">✓ Selesai</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Barang Yang Diretur */}
              <div>
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                  Daftar SKU & Barang Yang Diretur:
                </h4>
                {selectedReturn.return_items && selectedReturn.return_items.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedReturn.return_items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500 font-mono">SKU: <span className="text-emerald-700 font-bold">{item.sku}</span> • Kondisi: {item.condition || 'Rusak/Cacat'}</p>
                          {item.reason && <p className="text-xs text-slate-600 italic mt-0.5">Kendala: "{item.reason}"</p>}
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-800 text-sm">
                            {item.quantity} Unit
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
                    {selectedReturn.reason}
                  </div>
                )}
              </div>

              {/* Barang Pengganti */}
              {selectedReturn.replacement_items && selectedReturn.replacement_items.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-teal-700 tracking-wider mb-2">
                    Daftar SKU Barang Pengganti Yang Dikirimkan Admin:
                  </h4>
                  <div className="border border-teal-200 bg-teal-50/30 rounded-xl overflow-hidden divide-y divide-teal-100">
                    {selectedReturn.replacement_items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500 font-mono">SKU: <span className="text-teal-700 font-bold">{item.sku}</span></p>
                          {item.notes && <p className="text-xs text-teal-800 italic mt-0.5">{item.notes}</p>}
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-teal-100 text-teal-900 rounded-lg font-black text-sm">
                            {item.quantity} Unit
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI BARANG RETUR TIBA DI GUDANG (STEP 3) */}
      {/* ========================================================================= */}
      {receiveModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Konfirmasi Barang Diterima di Gudang</h3>
                  <p className="text-xs text-slate-500 font-medium">Tiket Retur: {selectedReturn.return_number}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <p className="font-bold text-slate-800">Informasi Pengiriman Dari Dealer:</p>
                <p className="text-xs text-slate-600 mt-1">
                  Ekspedisi: <strong>{selectedReturn.dealer_courier || 'Ekspedisi'}</strong> • Resi: <span className="font-mono font-bold text-blue-700">{selectedReturn.dealer_shipping_receipt_no || '-'}</span>
                </p>
                {selectedReturn.dealer_shipping_photo_url && (
                  <button
                    onClick={() => setPreviewImageUrl(selectedReturn.dealer_shipping_photo_url!)}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <ImageIcon size={13} /> Lihat Foto Bukti Resi Dealer
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Penerimaan / Pemeriksaan Fisik Gudang
                </label>
                <textarea
                  rows={3}
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="Contoh: Paket diterima utuh, jumlah unit fisik cocok dengan tiket pengajuan."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200/60 rounded-xl text-xs text-purple-900 font-medium">
                Setelah konfirmasi, status akan berganti ke <strong>RECEIVED_BY_ADMIN</strong>, dan dealer akan melihat status bahwa barang sudah tiba di gudang. Langkah selanjutnya adalah menyiapkan barang pengganti.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setReceiveModalOpen(false)}
                disabled={isProcessingReceive}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm"
              >
                Batal
              </button>

              <button
                onClick={handleConfirmReceived}
                disabled={isProcessingReceive}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md shadow-purple-600/20 flex items-center gap-2"
              >
                {isProcessingReceive ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                Verifikasi & Simpan Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INPUT BARANG PENGGANTI & RESI KIRIM BALIK (STEP 4 & 5) */}
      {/* ========================================================================= */}
      {replacementModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-emerald-50/60 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                  <Send size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Kirim Barang Pengganti & Input Resi</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tujuan: Dealer {selectedReturn.dealers?.store_name} ({selectedReturn.return_number})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setReplacementModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Bagian 1: Detail SKU Pengganti */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    1. Detail SKU & Quantity Barang Pengganti *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddReplacementRow}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Tambah SKU
                  </button>
                </div>

                <div className="space-y-3">
                  {replacementItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex gap-2">
                        <div className="w-1/3">
                          <label className="text-[11px] font-bold text-slate-500">SKU Barang</label>
                          <input
                            type="text"
                            placeholder="Contoh: DCZ16"
                            value={item.sku}
                            onChange={(e) => {
                              const updated = [...replacementItems];
                              updated[idx].sku = e.target.value;
                              setReplacementItems(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-500">Nama Produk Pengganti</label>
                          <input
                            type="text"
                            placeholder="Contoh: Kabel Data Type-C DAP D-10"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...replacementItems];
                              updated[idx].name = e.target.value;
                              setReplacementItems(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div className="w-20">
                          <label className="text-[11px] font-bold text-slate-500">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...replacementItems];
                              updated[idx].quantity = parseInt(e.target.value) || 1;
                              setReplacementItems(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-center"
                          />
                        </div>
                        {replacementItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveReplacementRow(idx)}
                            className="p-2 text-rose-500 hover:text-rose-700 self-end"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Optional notes */}
                      <input
                        type="text"
                        placeholder="Catatan garansi pengganti (opsional)"
                        value={item.notes || ''}
                        onChange={(e) => {
                          const updated = [...replacementItems];
                          updated[idx].notes = e.target.value;
                          setReplacementItems(updated);
                        }}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                      />
                    </div>
                  ))}
                </div>

                {/* Quick picker from products */}
                {allProducts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Atau pilih dari master produk DAP:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-100 rounded-lg">
                      {allProducts.slice(0, 15).map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSelectProductForReplacement(prod, 0)}
                          className="text-[11px] font-medium bg-white px-2 py-1 rounded border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700"
                        >
                          [{prod.sku}] {prod.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bagian 2: Ekspedisi & Resi Kirim Balik */}
              <div className="pt-4 border-t border-slate-200/80 space-y-4">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                  2. Ekspedisi & Resi Pengiriman Balik ke Dealer *
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Pilih Ekspedisi</label>
                    <select
                      value={replacementCourier}
                      onChange={(e) => setReplacementCourier(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="J&T Express">J&T Express</option>
                      <option value="JNE Express">JNE Express</option>
                      <option value="SiCepat Express">SiCepat Express</option>
                      <option value="Anteraja">Anteraja</option>
                      <option value="Wahana Express">Wahana Express</option>
                      <option value="Kargo / Ekspedisi Toko">Kargo / Ekspedisi Toko</option>
                      <option value="Kurir Internal DAP">Kurir Internal DAP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">Nomor Resi / AWB *</label>
                    <input
                      type="text"
                      placeholder="Masukkan No. Resi Kirim Balik"
                      value={replacementReceiptNo}
                      onChange={(e) => setReplacementReceiptNo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Upload Foto Resi Balik */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-600">Foto Bukti Resi Pengiriman Balik</label>
                    <button
                      type="button"
                      onClick={handleUseDemoReplacementProof}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      ⚡ Gunakan Bukti Demo Resi
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="URL foto bukti resi atau klik tombol demo di kanan atas"
                    value={replacementPhotoUrl}
                    onChange={(e) => setReplacementPhotoUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />

                  {replacementPhotoUrl ? (
                    <div className="mt-2 relative inline-block">
                      <img 
                        src={replacementPhotoUrl} 
                        alt="Preview Resi" 
                        className="w-32 h-20 object-cover rounded-lg border border-slate-200 shadow-sm" 
                      />
                      <button
                        type="button"
                        onClick={() => setReplacementPhotoUrl('')}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReplacementModalOpen(false)}
                disabled={isProcessingReplacement}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmReplacementShipped}
                disabled={isProcessingReplacement}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {isProcessingReplacement ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                Kirim Barang Pengganti & Simpan Resi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PREVIEW IMAGE ZOOM */}
      {/* ========================================================================= */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80"
            >
              <X size={18} />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Foto Bukti Resi" 
              className="max-h-[80vh] w-auto object-contain rounded-xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
