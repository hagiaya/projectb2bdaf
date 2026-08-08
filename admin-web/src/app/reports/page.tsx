'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalDealers: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [
      { data: orders },
      { count: dealerCount },
      { count: productCount }
    ] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('status', 'COMPLETED'),
      supabase.from('dealers').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true })
    ]);

    const revenue = orders ? orders.reduce((sum, o) => sum + Number(o.total_amount), 0) : 0;

    setStats({
      totalRevenue: revenue,
      totalOrders: orders?.length || 0,
      totalDealers: dealerCount || 0,
      totalProducts: productCount || 0,
    });
    
    setIsLoading(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Laporan & Analitik</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Ringkasan performa bisnis dari data real-time Supabase.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20 text-slate-500 font-medium">
          Menghitung analitik dari database...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">TOTAL PENDAPATAN</p>
              <h3 className="text-2xl font-bold text-slate-900">Rp {stats.totalRevenue.toLocaleString('id-ID')}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">PESANAN SELESAI</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalOrders}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">TOTAL DEALER</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalDealers}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">KATALOG PRODUK</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalProducts}</h3>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500 font-medium">
        Modul visualisasi grafik (Chart.js / Recharts) dapat ditambahkan di sini berdasarkan request.
      </div>
    </div>
  );
}
