'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Filter, Eye, Check, X, Clock, 
  Package, Truck, DollarSign, CreditCard, ChevronRight,
  AlertCircle, CheckCircle2, User, MapPin, Phone, RefreshCw, ZoomIn
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
  const [stageFilter, setStageFilter] = useState<'ALL' | 'PENDING' | 'PACKING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();

    const ordersSub = supabase
      .channel('public:orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSub);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, dealers(store_name, address, profiles:profile_id(full_name, phone_number, email))')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setOrders(data as any);
    }
    setIsLoading(false);
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
      case 'COMPLETED':
        return { label: '4. Selesai / COD Bayar', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
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
    if (stage === 'COMPLETED') return orders.filter(o => o.status === 'COMPLETED').length;
    if (stage === 'CANCELLED') return orders.filter(o => o.status === 'CANCELLED').length;
    return orders.length;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
              <ShoppingCart size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Order & Pipeline</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Alur 4 Tahap: <span className="font-semibold text-slate-700">Pesan ➔ Pengemasan ➔ Pengiriman ➔ COD Bayar / Selesai</span>. Real-time Supabase.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* 4 Pipeline Stage Stepper Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: 'ALL', label: 'Semua Order', desc: 'Total pesanan', icon: ShoppingCart },
          { key: 'PENDING', label: '1. Pesan', desc: 'Menunggu konfirmasi', icon: Clock },
          { key: 'PACKING', label: '2. Pengemasan', desc: 'Sedang disiapkan', icon: Package },
          { key: 'SHIPPED', label: '3. Pengiriman', desc: 'Dalam perjalanan', icon: Truck },
          { key: 'COMPLETED', label: '4. COD Bayar', desc: 'Selesai / Lunas', icon: CheckCircle2 },
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
                  <option value="COMPLETED">4. Selesai / COD Bayar (Completed)</option>
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
              alt="Bukti Transfer Penuh" 
              className="max-h-[80vh] w-auto object-contain rounded-xl" 
            />
            <p className="text-center text-xs text-slate-500 mt-2 font-medium">
              Bukti Transfer / Struk Pembayaran Pesanan
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
