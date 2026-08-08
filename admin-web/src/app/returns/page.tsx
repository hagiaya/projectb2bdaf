'use client';

import React, { useState, useEffect } from 'react';
import { Search, ArrowLeftRight, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ReturnReq {
  id: string;
  return_number: string;
  reason: string;
  status: string;
  dealers?: { store_name: string };
  orders?: { order_number: string };
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnReq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('returns')
      .select('*, dealers(store_name), orders(order_number)')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setReturns(data as any);
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('returns').update({ status }).eq('id', id);
    if (!error) {
      setReturns(returns.map(r => r.id === id ? { ...r, status } : r));
    } else {
      alert("Gagal update status retur.");
    }
  };

  const filteredReturns = returns.filter((r) => 
    r.return_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.dealers?.store_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <ArrowLeftRight size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Retur</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Kelola pengembalian barang secara langsung dari Supabase.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Retur ID, Nama Dealer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">Retur ID</th>
              <th className="p-5 font-semibold border-b border-gray-100">Dealer & Order</th>
              <th className="p-5 font-semibold border-b border-gray-100">Alasan</th>
              <th className="p-5 font-semibold border-b border-gray-100">Status</th>
              <th className="p-5 font-semibold border-b border-gray-100 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Memuat data retur...</td>
              </tr>
            ) : filteredReturns.length === 0 ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Belum ada data retur.</td>
              </tr>
            ) : filteredReturns.map((req) => (
              <tr key={req.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5 font-bold text-slate-900">{req.return_number}</td>
                <td className="p-5">
                  <p className="font-bold text-slate-700 mb-0.5">{req.dealers?.store_name}</p>
                  <p className="text-xs font-semibold text-slate-500">Order: {req.orders?.order_number}</p>
                </td>
                <td className="p-5 text-slate-600 font-medium">{req.reason}</td>
                <td className="p-5">
                  <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    req.status === 'PENDING' ? 'bg-amber-100/50 text-amber-700 border-amber-200/50' :
                    req.status === 'APPROVED' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50' :
                    'bg-red-100/50 text-red-700 border-red-200/50'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-5 text-right">
                  {req.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdateStatus(req.id, 'APPROVED')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Setujui">
                        <Check size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleUpdateStatus(req.id, 'REJECTED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Tolak">
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
