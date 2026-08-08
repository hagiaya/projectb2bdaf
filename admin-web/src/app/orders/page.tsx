'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Filter, Eye, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  order_number: string;
  dealer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  dealers?: { store_name: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, dealers(store_name)')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setOrders(data as any);
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } else {
      alert("Gagal mengupdate status pesanan.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (order.dealers?.store_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Semua Status' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100/50 text-amber-700 border-amber-200/50';
      case 'PROCESSING': return 'bg-blue-100/50 text-blue-700 border-blue-200/50';
      case 'SHIPPED': return 'bg-indigo-100/50 text-indigo-700 border-indigo-200/50';
      case 'COMPLETED': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50';
      case 'CANCELLED': return 'bg-red-100/50 text-red-700 border-red-200/50';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <ShoppingCart size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Order</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Proses, pantau, dan kelola pesanan terhubung Supabase.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Order ID, Nama Dealer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white font-medium text-gray-700 transition-all appearance-none cursor-pointer"
            >
              <option>Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Diproses</option>
              <option value="SHIPPED">Dikirim</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">Order ID & Waktu</th>
              <th className="p-5 font-semibold border-b border-gray-100">Nama Dealer</th>
              <th className="p-5 font-semibold border-b border-gray-100">Total Nominal</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Memuat data pesanan...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">Tidak ada order yang ditemukan.</td>
              </tr>
            ) : filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5">
                  <p className="font-bold text-slate-900 mb-0.5">{order.order_number}</p>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                    <Clock size={12} /> {new Date(order.created_at).toLocaleString('id-ID')}
                  </div>
                </td>
                <td className="p-5 font-bold text-slate-700">{order.dealers?.store_name || '-'}</td>
                <td className="p-5 text-emerald-700 font-bold tracking-tight">
                  Rp {order.total_amount.toLocaleString('id-ID')}
                </td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'PROCESSING')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Proses Pesanan">
                          <Check size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Batalkan">
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Lihat Detail">
                      <Eye size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
