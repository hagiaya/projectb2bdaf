'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Filter, Eye, Check, X, Clock, 
  Package, Truck, DollarSign, CreditCard, ChevronRight,
  AlertCircle, CheckCircle2, User, MapPin, Phone, RefreshCw, ZoomIn,
  PackageCheck, FileText, UploadCloud, Calendar, CheckSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: {
    name: string;
    sku: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  dealer_id: string;
  total_amount: number;
  discount_amount?: number;
  shipping_cost?: number;
  status: string;
  payment_method?: string;
  unique_code?: number;
  payment_proof_url?: string;
  payment_status?: string;
  received_at?: string;
  receiver_name?: string;
  receiving_notes?: string;
  receiving_proof_url?: string;
  receiving_status?: string;
  created_at: string;
  dealers?: {
    store_name: string;
    address: string;
    profiles?: { full_name: string; phone_number: string; email: string };
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'PENDING' | 'PACKING' | 'SHIPPED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<{ number: string; total: number } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Receiving Modal State
  const [receivingOrder, setReceivingOrder] = useState<Order | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receivingNotes, setReceivingNotes] = useState('');
  const [receivingProofFile, setReceivingProofFile] = useState<File | null>(null);
  const [receivingProofPreview, setReceivingProofPreview] = useState<string | null>(null);
  const [isSubmittingReceiving, setIsSubmittingReceiving] = useState(false);

  useEffect(() => {
    fetchData();

    // 1. Setup Supabase Realtime Channel
    const ordersSub = supabase
      .channel('admin-orders-pipeline-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          setLastSyncTime(new Date());
          if (payload.eventType === 'INSERT') {
            const newOrd = payload.new;
            setNewOrderAlert({
              number: newOrd.order_number || 'Pesanan Baru',
              total: Number(newOrd.final_amount || newOrd.total_amount || 0),
            });
            // Auto dismiss alert after 6 seconds
            setTimeout(() => setNewOrderAlert(null), 6000);
          }
          fetchData();
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    // 2. Safety interval polling (sync every 25s in case WebSocket drops)
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 25000);

    return () => {
      supabase.removeChannel(ordersSub);
      clearInterval(pollInterval);
    };
  }, []);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    setFetchError(null);

    try {
      // Tier 1: Query with joined dealers and profiles
      let { data, error } = await supabase
        .from('orders')
        .select('*, dealers(store_name, address, profiles:profile_id(full_name, phone_number))')
        .order('created_at', { ascending: false });

      // Tier 2: Fallback if profiles relation causes schema mismatch
      if (error) {
        console.warn('Tier 1 query failed, trying Tier 2 (dealers without nested profiles):', error.message);
        const fb1 = await supabase
          .from('orders')
          .select('*, dealers(store_name, address)')
          .order('created_at', { ascending: false });
        data = fb1.data;
        error = fb1.error;
      }

      // Tier 3: Fallback if dealers relation causes mismatch
      if (error) {
        console.warn('Tier 2 query failed, trying Tier 3 (raw orders table):', error.message);
        const fb2 = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        data = fb2.data;
        error = fb2.error;
      }

      if (error) {
        throw error;
      }

      if (data) {
        setOrders(data as any);
        setLastSyncTime(new Date());
      }
    } catch (err: any) {
      console.error('Fetch orders critical error:', err);
      setFetchError(err.message || 'Gagal memuat pesanan dari Supabase');
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder(order);
    setIsLoadingItems(true);
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name, sku, image_url)')
      .eq('order_id', order.id);

    if (!error && data) {
      setOrderItems(data as any);
    } else {
      setOrderItems([]);
    }
    setIsLoadingItems(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string, newPaymentStatus?: string) => {
    setIsUpdating(true);
    const updatePayload: any = { status: newStatus };
    if (newPaymentStatus) {
      updatePayload.payment_status = newPaymentStatus;
    }

    const orderToUpdate = orders.find(o => o.id === id);
    if (newStatus === 'RECEIVED' && orderToUpdate?.payment_method === 'KREDIT') {
      const { data: dData } = await supabase.from('dealers').select('credit_term_days').eq('id', orderToUpdate.dealer_id).single();
      if (dData?.credit_term_days) {
         const dueDate = new Date();
         dueDate.setDate(dueDate.getDate() + dData.credit_term_days);
         updatePayload.payment_due_date = dueDate.toISOString();
      }
    }

    const { error } = await supabase.from('orders').update(updatePayload).eq('id', id);
    setIsUpdating(false);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updatePayload } : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, ...updatePayload });
      }
    } else {
      alert("Gagal mengubah status: " + error.message);
    }
  };

  const handleOpenReceivingModal = (order: Order) => {
    setReceivingOrder(order);
    setReceiverName(order.receiver_name || order.dealers?.profiles?.full_name || order.dealers?.store_name || '');
    setReceivingNotes(order.receiving_notes || 'Barang telah diterima dalam kondisi lengkap dan baik.');
    setReceivingProofFile(null);
    setReceivingProofPreview(order.receiving_proof_url || null);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceivingProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceivingProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReceiving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;
    setIsSubmittingReceiving(true);

    try {
      let finalProofUrl = receivingProofPreview?.startsWith('http') ? receivingProofPreview : (receivingOrder.receiving_proof_url || null);

      if (receivingProofFile) {
        const fileExt = receivingProofFile.name.split('.').pop() || 'jpg';
        const filePath = `receiving/${receivingOrder.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('promo-banners')
          .upload(filePath, receivingProofFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('promo-banners')
            .getPublicUrl(filePath);
          finalProofUrl = publicUrl;
        } else {
          console.warn('Storage upload error, using local/data url fallback:', uploadError);
          // If storage fails, we can still use the data url preview if reasonable size or null
          if (receivingProofPreview && receivingProofPreview.length < 50000) {
            finalProofUrl = receivingProofPreview;
          }
        }
      }

      const updatePayload: any = {
        status: 'RECEIVED',
        received_at: new Date().toISOString(),
        receiver_name: receiverName.trim() || receivingOrder.dealers?.store_name || 'Penerima Toko',
        receiving_notes: receivingNotes.trim() || 'Barang telah diterima lengkap dan baik',
        receiving_proof_url: finalProofUrl,
        receiving_status: 'RECEIVED',
      };

      if (receivingOrder.payment_method === 'KREDIT') {
        const { data: dData } = await supabase.from('dealers').select('credit_term_days').eq('id', receivingOrder.dealer_id).single();
        if (dData?.credit_term_days) {
           const dueDate = new Date();
           dueDate.setDate(dueDate.getDate() + dData.credit_term_days);
           updatePayload.payment_due_date = dueDate.toISOString();
        }
      }

      let { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', receivingOrder.id);

      // Graceful fallback if database columns have not been migrated yet
      if (error && error.message?.includes('column')) {
        console.warn('Receiving columns might not exist yet, updating status only:', error.message);
        const fbRes = await supabase
          .from('orders')
          .update({ status: 'RECEIVED' })
          .eq('id', receivingOrder.id);
        error = fbRes.error;
      }

      if (error) {
        throw error;
      }

      // Update state locally
      setOrders(prev => prev.map(o => o.id === receivingOrder.id ? { ...o, ...updatePayload } : o));
      if (selectedOrder && selectedOrder.id === receivingOrder.id) {
        setSelectedOrder(prev => prev ? { ...prev, ...updatePayload } : null);
      }

      setReceivingOrder(null);
      alert('Konfirmasi penerimaan barang berhasil disimpan! Status pesanan kini: 4. Penerimaan (Diterima)');
    } catch (err: any) {
      console.error('Failed to submit receiving:', err);
      alert('Gagal mengonfirmasi penerimaan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmittingReceiving(false);
    }
  };

  // Pipeline filter
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      order.order_number.toLowerCase().includes(query) || 
      (order.dealers?.store_name || '').toLowerCase().includes(query) ||
      (order.dealers?.profiles?.full_name || '').toLowerCase().includes(query);

    let matchesStage = true;
    if (stageFilter === 'PENDING') {
      matchesStage = order.status === 'PENDING';
    } else if (stageFilter === 'PACKING') {
      matchesStage = order.status === 'PACKING' || order.status === 'PROCESSING';
    } else if (stageFilter === 'SHIPPED') {
      matchesStage = order.status === 'SHIPPED';
    } else if (stageFilter === 'RECEIVED') {
      matchesStage = order.status === 'RECEIVED';
    } else if (stageFilter === 'COMPLETED') {
      matchesStage = order.status === 'COMPLETED';
    } else if (stageFilter === 'CANCELLED') {
      matchesStage = order.status === 'CANCELLED';
    }

    return matchesSearch && matchesStage;
  });

  const getStageBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: '1. Pesan Baru', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'PACKING':
      case 'PROCESSING':
        return { label: '2. Pengemasan', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package };
      case 'SHIPPED':
        return { label: '3. Pengiriman', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck };
      case 'RECEIVED':
        return { label: '4. Penerimaan (Diterima)', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: PackageCheck };
      case 'COMPLETED':
        return { label: '5. Selesai / COD Bayar', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Dibatalkan', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: X };
      default:
        return { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock };
    }
  };

  const countByStage = (stage: string) => {
    if (stage === 'PENDING') return orders.filter(o => o.status === 'PENDING').length;
    if (stage === 'PACKING') return orders.filter(o => o.status === 'PACKING' || o.status === 'PROCESSING').length;
    if (stage === 'SHIPPED') return orders.filter(o => o.status === 'SHIPPED').length;
    if (stage === 'RECEIVED') return orders.filter(o => o.status === 'RECEIVED').length;
    if (stage === 'COMPLETED') return orders.filter(o => o.status === 'COMPLETED').length;
    if (stage === 'CANCELLED') return orders.filter(o => o.status === 'CANCELLED').length;
    return orders.length;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
      {/* Real-time Order Alert Toast */}
      {newOrderAlert && (
        <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Pesanan Baru Masuk Real-Time!</p>
              <p className="text-xs text-emerald-100">
                Nomor: <span className="font-mono font-bold">{newOrderAlert.number}</span> • Total: Rp {newOrderAlert.total.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setNewOrderAlert(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Alert if Database Connection Issue */}
      {fetchError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="font-bold text-sm">Kendala Sinkronisasi Data Pesanan</p>
              <p className="text-xs text-amber-700 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <button 
            onClick={() => fetchData()} 
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <ShoppingCart size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Order & Pipeline</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-500 font-medium">
            <span>Alur: <span className="font-semibold text-slate-700">Pesan ➔ Pengemasan ➔ Pengiriman ➔ Penerimaan ➔ COD Bayar / Selesai</span></span>
            <span className="text-slate-300">•</span>
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-bold text-emerald-700">
              <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span>{isRealtimeConnected ? 'Real-time Live' : 'Terhubung'}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              (Update: {lastSyncTime.toLocaleTimeString('id-ID')})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchData()} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      {/* 5 Pipeline Stage Stepper Tabs + All + Cancelled */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {[
          { key: 'ALL', label: 'Semua Order', desc: 'Total pesanan', icon: ShoppingCart },
          { key: 'PENDING', label: '1. Pesan', desc: 'Menunggu konfirmasi', icon: Clock },
          { key: 'PACKING', label: '2. Pengemasan', desc: 'Sedang disiapkan', icon: Package },
          { key: 'SHIPPED', label: '3. Pengiriman', desc: 'Dalam perjalanan', icon: Truck },
          { key: 'RECEIVED', label: '4. Penerimaan', desc: 'Barang telah sampai', icon: PackageCheck },
          { key: 'COMPLETED', label: '5. COD Bayar', desc: 'Selesai / Lunas', icon: CheckCircle2 },
          { key: 'CANCELLED', label: 'Batal', desc: 'Pesanan batal', icon: X },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = stageFilter === tab.key;
          const count = countByStage(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setStageFilter(tab.key as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isActive 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
                  : 'bg-white text-slate-600 border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={16} />
                </div>
                <span className={`text-base font-bold px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </div>
              <p className={`font-bold text-sm tracking-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {tab.label}
              </p>
              <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(6,78,59,0.06)] border border-slate-200/80 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Order ID, Nama Toko Dealer, Pelanggan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/70">
                <th className="p-4 pl-6">Order ID & Tanggal</th>
                <th className="p-4">Toko Dealer</th>
                <th className="p-4">Metode Bayar</th>
                <th className="p-4">Total Akhir</th>
                <th className="p-4">Tahap / Status</th>
                <th className="p-4 pr-6 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Memuat daftar order...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    Tidak ada pesanan pada tahap ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const stage = getStageBadge(order.status);
                  const StageIcon = stage.icon;
                  const isCOD = (order.payment_method || '').toUpperCase() === 'COD';
                  const isKredit = (order.payment_method || '').toUpperCase() === 'KREDIT';
                  const hasProof = !!order.payment_proof_url;

                  return (
                    <tr key={order.id} className="hover:bg-emerald-50/20 transition-colors group">
                      {/* Order ID & Date */}
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900 mb-0.5">{order.order_number}</p>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                          <Clock size={12} /> {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>

                      {/* Store & Customer */}
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{order.dealers?.store_name || '-'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">
                          {order.dealers?.profiles?.full_name || 'Dealer'} • {order.dealers?.profiles?.phone_number || ''}
                        </p>
                      </td>

                      {/* Payment Method & Proof */}
                      <td className="p-4">
                        {isCOD ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">
                            <DollarSign size={13} />
                            COD (Bayar di Tempat)
                          </div>
                        ) : isKredit ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold">
                            <CreditCard size={13} />
                            Kredit / Tempo (TOP)
                          </div>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold mb-1">
                              <CreditCard size={13} />
                              Transfer Bank
                              {order.unique_code ? (
                                <span className="text-[10px] bg-sky-200 text-sky-800 px-1 py-0.2 rounded">
                                  +{order.unique_code}
                                </span>
                              ) : null}
                            </div>
                            <div>
                              {hasProof ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                  <CheckCircle2 size={12} /> Bukti Transfer Ada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                  <AlertCircle size={12} /> Belum Ada Bukti
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="p-4">
                        <p className="text-emerald-700 font-extrabold text-base tracking-tight">
                          Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                        </p>
                        {order.unique_code ? (
                          <p className="text-[11px] text-slate-400 font-medium">Termasuk kode unik Rp {order.unique_code}</p>
                        ) : null}
                      </td>

                      {/* Stage Badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${stage.color}`}>
                          <StageIcon size={13} strokeWidth={2.5} />
                          {stage.label}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Fast Pipeline Advance Buttons */}
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'PACKING')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              title="Terima & Masuk Pengemasan"
                            >
                              <Package size={13} /> Kemas
                            </button>
                          )}
                          {(order.status === 'PACKING' || order.status === 'PROCESSING') && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              title="Kirim Pesanan"
                            >
                              <Truck size={13} /> Kirim
                            </button>
                          )}
                          {order.status === 'SHIPPED' && (
                            <button 
                              onClick={() => handleOpenReceivingModal(order)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              title="Catat Konfirmasi Penerimaan Barang"
                            >
                              <PackageCheck size={13} /> Terima
                            </button>
                          )}
                          {order.status === 'RECEIVED' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'COMPLETED', 'paid')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              title="Selesaikan & Konfirmasi Bayar / COD Lunas"
                            >
                              <Check size={13} strokeWidth={3} /> Selesai
                            </button>
                          )}

                          {/* View Details */}
                          <button 
                            onClick={() => handleOpenDetail(order)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
                            title="Lihat Detail Lengkap & Bukti Bayar"
                          >
                            <Eye size={16} />
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900">Detail Order {selectedOrder.order_number}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getStageBadge(selectedOrder.status).color}`}>
                    {getStageBadge(selectedOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Dibuat pada: {new Date(selectedOrder.created_at).toLocaleString('id-ID')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Dealer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-600" /> Informasi Toko & Kontak
                  </p>
                  <p className="font-bold text-slate-800">{selectedOrder.dealers?.store_name || '-'}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.dealers?.profiles?.full_name || 'Pemilik Toko'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone size={12} /> {selectedOrder.dealers?.profiles?.phone_number || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-600" /> Alamat Pengiriman
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedOrder.dealers?.address || 'Alamat tidak dicantumkan'}
                  </p>
                </div>
              </div>

              {/* FITUR PENERIMAAN BARANG (Goods Receipt Info) */}
              <div className="border border-teal-200 bg-teal-50/40 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PackageCheck size={16} className="text-teal-600" /> Tahap 4: Konfirmasi Penerimaan Barang
                  </p>
                  <button
                    onClick={() => handleOpenReceivingModal(selectedOrder)}
                    className="text-xs font-bold text-teal-700 bg-white hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <CheckSquare size={13} /> {selectedOrder.status === 'RECEIVED' || selectedOrder.status === 'COMPLETED' ? 'Edit Data Penerimaan' : 'Input Penerimaan'}
                  </button>
                </div>

                {selectedOrder.status === 'RECEIVED' || selectedOrder.status === 'COMPLETED' || selectedOrder.receiver_name ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3.5 rounded-xl border border-teal-100">
                    <div>
                      <span className="text-slate-400 font-semibold block mb-0.5">Nama Penerima Barang:</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedOrder.receiver_name || selectedOrder.dealers?.store_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block mb-0.5">Waktu Konfirmasi Diterima:</span>
                      <span className="font-bold text-teal-800">
                        {selectedOrder.received_at ? new Date(selectedOrder.received_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Telah Diterima'}
                      </span>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-teal-50">
                      <span className="text-slate-400 font-semibold block mb-1">Catatan Kondisi Barang:</span>
                      <p className="text-slate-700 font-medium italic bg-teal-50/50 p-2 rounded-lg">
                        {selectedOrder.receiving_notes || 'Barang telah diterima dalam kondisi lengkap dan baik.'}
                      </p>
                    </div>

                    {selectedOrder.receiving_proof_url && (
                      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                        <div 
                          onClick={() => setZoomImage(selectedOrder.receiving_proof_url || null)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-teal-200 cursor-pointer shadow-xs bg-white shrink-0 group relative"
                        >
                          <img 
                            src={selectedOrder.receiving_proof_url} 
                            alt="Bukti Penerimaan" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <ZoomIn size={14} />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-teal-800">Foto Surat Jalan / Tanda Terima Terlampir</p>
                          <button
                            onClick={() => setZoomImage(selectedOrder.receiving_proof_url || null)}
                            className="text-teal-600 underline text-[11px] hover:text-teal-700"
                          >
                            Klik untuk memperbesar foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-white/70 rounded-xl border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <p className="text-xs text-teal-700">
                      Barang belum dikonfirmasi sampai/diterima oleh pihak toko dealer.
                    </p>
                    <button
                      onClick={() => handleOpenReceivingModal(selectedOrder)}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                    >
                      Konfirmasi Terima
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Info & Proof */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600" /> Pembayaran & Bukti Transfer
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Metode: <span className="font-bold text-slate-900">
                        {(selectedOrder.payment_method || '').toUpperCase() === 'COD' 
                          ? 'COD (Bayar di Tempat)' 
                          : (selectedOrder.payment_method || '').toUpperCase() === 'KREDIT'
                          ? 'Kredit / Tempo (TOP)'
                          : 'Transfer Bank Manual'}
                      </span>
                    </p>
                    {selectedOrder.unique_code ? (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kode Unik 3 Angka: <span className="font-mono font-bold text-emerald-700">Rp {selectedOrder.unique_code}</span>
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Status Bayar: <span className="font-bold capitalize text-slate-800">{selectedOrder.payment_status || 'Pending'}</span>
                    </p>
                  </div>

                  {selectedOrder.payment_proof_url ? (
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => setZoomImage(selectedOrder.payment_proof_url || null)}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-sm bg-slate-100 flex-shrink-0"
                      >
                        <img 
                          src={selectedOrder.payment_proof_url} 
                          alt="Bukti Transfer" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn size={18} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-700">Bukti Transfer Terlampir</p>
                        <button 
                          onClick={() => setZoomImage(selectedOrder.payment_proof_url || null)}
                          className="text-xs text-emerald-600 underline hover:text-emerald-700 mt-1 block"
                        >
                          Klik untuk memperbesar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-medium">
                      {(selectedOrder.payment_method || '').toUpperCase() === 'COD' 
                        ? 'Pembayaran akan diselesaikan saat barang tiba (COD).' 
                        : 'Dealer belum mengunggah foto struk / bukti transfer.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daftar Produk yang Dipesan</p>
                {isLoadingItems ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Memuat detail produk...</div>
                ) : orderItems.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">Tidak ada rincian item produk.</div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Produk</th>
                          <th className="p-3 text-center">Jumlah</th>
                          <th className="p-3 text-right">Harga Satuan</th>
                          <th className="p-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 font-medium text-slate-800">
                              <p className="font-bold">{item.products?.name || 'Produk'}</p>
                              <p className="text-[10px] text-slate-400">{item.products?.sku || '-'}</p>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700">{item.quantity} unit</td>
                            <td className="p-3 text-right text-slate-600">Rp {Number(item.unit_price).toLocaleString('id-ID')}</td>
                            <td className="p-3 text-right font-bold text-slate-900">Rp {Number(item.total_price).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary Calculations */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal Produk:</span>
                  <span>Rp {Number(selectedOrder.total_amount - (selectedOrder.unique_code || 0)).toLocaleString('id-ID')}</span>
                </div>
                {selectedOrder.unique_code ? (
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>Kode Unik Transaksi:</span>
                    <span className="font-mono font-bold text-emerald-700">+ Rp {selectedOrder.unique_code}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-emerald-100">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-700">Rp {Number(selectedOrder.total_amount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Ubah Tahap Pipeline:</span>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  disabled={isUpdating}
                  className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="PENDING">1. Pesan (Pending)</option>
                  <option value="PACKING">2. Pengemasan (Packing)</option>
                  <option value="SHIPPED">3. Pengiriman (Shipped)</option>
                  <option value="RECEIVED">4. Penerimaan (Received)</option>
                  <option value="COMPLETED">5. Selesai / COD Bayar (Completed)</option>
                  <option value="CANCELLED">Dibatalkan (Cancelled)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.payment_status !== 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'paid')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Check size={14} /> Konfirmasi Lunas
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT / KONFIRMASI PENERIMAAN BARANG */}
      {receivingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-teal-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                  <PackageCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Konfirmasi Penerimaan Barang</h3>
                  <p className="text-xs text-slate-500 font-medium">Order #{receivingOrder.order_number}</p>
                </div>
              </div>
              <button 
                onClick={() => setReceivingOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReceiving} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Penerima Barang (PIC / Pemilik Toko) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Contoh: Budi Santoso (Pemilik Toko)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Kondisi Barang Saat Diterima
                </label>
                <textarea
                  rows={3}
                  value={receivingNotes}
                  onChange={(e) => setReceivingNotes(e.target.value)}
                  placeholder="Contoh: Barang diterima lengkap 10 dus, kondisi segel aman."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto Surat Jalan / Bukti Tanda Terima (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofFileChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>
                {receivingProofPreview && (
                  <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-teal-200">
                    <img src={receivingProofPreview} alt="Preview Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setReceivingProofFile(null);
                        setReceivingProofPreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceivingOrder(null)}
                  disabled={isSubmittingReceiving}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceiving}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                >
                  {isSubmittingReceiving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={2.5} /> Konfirmasi Diterima
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bukti Transfer Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white p-3 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition-colors"
            >
              <X size={18} />
            </button>
            <img 
              src={zoomImage} 
              alt="Bukti Penuh" 
              className="max-h-[80vh] w-auto object-contain rounded-xl" 
            />
            <p className="text-center text-xs text-slate-500 mt-2 font-medium">
              Bukti Pembayaran / Surat Jalan Penerimaan Pesanan
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

