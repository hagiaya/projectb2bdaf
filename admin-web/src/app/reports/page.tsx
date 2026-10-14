'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Box, 
  XCircle,
  ArrowRight,
  ShieldCheck,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatusSummary {
  key: string;
  label: string;
  step: string;
  count: number;
  amount: number;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  icon: any;
}

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCompletedOrders: 0,
    totalPipelineAmount: 0,
    totalPipelineOrders: 0,
    totalGrossAmount: 0,
    totalGrossOrders: 0,
    totalDealers: 0,
    totalProducts: 0,
    statusBreakdown: [] as StatusSummary[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const [
        { data: allOrders },
        { count: dealerCount },
        { count: productCount }
      ] = await Promise.all([
        supabase.from('orders').select('id, total_amount, final_amount, status, created_at'),
        supabase.from('dealers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true })
      ]);

      let totalRevenue = 0;
      let totalCompletedOrders = 0;
      let totalPipelineAmount = 0;
      let totalPipelineOrders = 0;
      let totalGrossAmount = 0;
      let totalGrossOrders = 0;

      const countMap: Record<string, number> = {};
      const amountMap: Record<string, number> = {};

      if (allOrders) {
        allOrders.forEach(o => {
          const amt = Number(o.total_amount) || 0;
          const status = o.status || 'PENDING';
          
          countMap[status] = (countMap[status] || 0) + 1;
          amountMap[status] = (amountMap[status] || 0) + amt;

          if (status === 'COMPLETED') {
            totalRevenue += amt;
            totalCompletedOrders++;
            totalGrossAmount += amt;
            totalGrossOrders++;
          } else if (status !== 'CANCELLED') {
            totalPipelineAmount += amt;
            totalPipelineOrders++;
            totalGrossAmount += amt;
            totalGrossOrders++;
          }
        });
      }

      const breakdown: StatusSummary[] = [
        {
          key: 'COMPLETED',
          label: 'Selesai / Lunas (COD Bayar)',
          step: 'Tahap 5',
          count: countMap['COMPLETED'] || 0,
          amount: amountMap['COMPLETED'] || 0,
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          icon: CheckCircle2,
        },
        {
          key: 'RECEIVED',
          label: 'Diterima Toko / Dealer',
          step: 'Tahap 4',
          count: countMap['RECEIVED'] || 0,
          amount: amountMap['RECEIVED'] || 0,
          badgeBg: 'bg-teal-50',
          badgeText: 'text-teal-700',
          borderColor: 'border-teal-200',
          icon: Box,
        },
        {
          key: 'SHIPPED',
          label: 'Sedang Dikirim (Ekspedisi/Kurir)',
          step: 'Tahap 3',
          count: countMap['SHIPPED'] || 0,
          amount: amountMap['SHIPPED'] || 0,
          badgeBg: 'bg-indigo-50',
          badgeText: 'text-indigo-700',
          borderColor: 'border-indigo-200',
          icon: Truck,
        },
        {
          key: 'PACKING',
          label: 'Siap Kirim / Packing Gudang',
          step: 'Tahap 2',
          count: countMap['PACKING'] || 0,
          amount: amountMap['PACKING'] || 0,
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: Package,
        },
        {
          key: 'PENDING',
          label: 'Pesan Baru (Menunggu Konfirmasi)',
          step: 'Tahap 1',
          count: countMap['PENDING'] || 0,
          amount: amountMap['PENDING'] || 0,
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-700',
          borderColor: 'border-amber-200',
          icon: Clock,
        },
        {
          key: 'CANCELLED',
          label: 'Pesanan Dibatalkan',
          step: 'Batal',
          count: countMap['CANCELLED'] || 0,
          amount: amountMap['CANCELLED'] || 0,
          badgeBg: 'bg-slate-100',
          badgeText: 'text-slate-600',
          borderColor: 'border-slate-200',
          icon: XCircle,
        },
      ];

      setStats({
        totalRevenue,
        totalCompletedOrders,
        totalPipelineAmount,
        totalPipelineOrders,
        totalGrossAmount,
        totalGrossOrders,
        totalDealers: dealerCount || 0,
        totalProducts: productCount || 0,
        statusBreakdown: breakdown,
      });
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Laporan & Analitik</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Ringkasan performa penjualan riil, pipeline pesanan, dan analitik bisnis secara real-time.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20 text-slate-500 font-medium">
          Menghitung analitik dari database...
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 1. Total Pendapatan Selesai (Synchronized with Dashboard) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100/70 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
                  <DollarSign size={24} />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Lunas & Selesai
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">TOTAL PENDAPATAN</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {formatRupiah(stats.totalRevenue)}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {stats.totalCompletedOrders} pesanan selesai
              </p>
            </div>

            {/* 2. Pipeline Berjalan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100/70 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Dalam Proses
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">PIPELINE BERJALAN</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {formatRupiah(stats.totalPipelineAmount)}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {stats.totalPipelineOrders} pesanan aktif berjalan
              </p>
            </div>

            {/* 3. Total Omzet Semua Order Aktif */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100/70 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <FileText size={24} />
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Gross Sales
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">TOTAL SEMUA ORDER AKTIF</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {formatRupiah(stats.totalGrossAmount)}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {stats.totalGrossOrders} total transaksi (non-batal)
              </p>
            </div>

            {/* 4. Total Dealer & Produk */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100/70 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Users size={24} />
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Jaringan Toko
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">TOTAL DEALER & KATALOG</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.totalDealers} <span className="text-sm font-semibold text-slate-500">Dealer</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {stats.totalProducts} produk aktif di sistem
              </p>
            </div>
          </div>

          {/* Breakdown Section: Status Pesanan & Nilai Transaksi */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Rincian Penjualan Berdasarkan Status Pesanan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi nilai pesanan dari tahap pemesanan baru, pengiriman gudang, hingga selesai lunas.
                </p>
              </div>
              <Link 
                href="/orders" 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group self-start sm:self-auto"
              >
                Kelola Semua Pesanan 
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Status & Tahap</th>
                    <th className="pb-3 px-3 text-center">Jumlah Pesanan</th>
                    <th className="pb-3 px-3 text-right">Total Nilai (Rupiah)</th>
                    <th className="pb-3 px-3 text-right">Porsi Omzet</th>
                    <th className="pb-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.statusBreakdown.map((item) => {
                    const ItemIcon = item.icon;
                    const pct = stats.totalGrossAmount > 0 && item.key !== 'CANCELLED'
                      ? ((item.amount / stats.totalGrossAmount) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <tr key={item.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.badgeBg} ${item.badgeText}`}>
                              <ItemIcon size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{item.label}</p>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {item.step}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center font-bold text-slate-700">
                          {item.count} pesanan
                        </td>
                        <td className="py-4 px-3 text-right font-black text-slate-900 text-base">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="py-4 px-3 text-right">
                          {item.key === 'CANCELLED' ? (
                            <span className="text-xs text-slate-400 font-medium">-</span>
                          ) : (
                            <div className="inline-flex flex-col items-end">
                              <span className="text-xs font-bold text-slate-700">{pct}%</span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${item.key === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, Number(pct)))}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <Link
                            href={`/orders?stage=${item.key}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                          >
                            Buka Order ➔
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Report Modules Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link 
              href="/inventory?tab=report"
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Laporan Mutasi & Riwayat Stok
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lihat rincian barang yang dilakukan pengurangan & penambahan stok bulan ini, filter periode, dan ekspor Excel.
                  </p>
                </div>
              </div>
              <span className="p-2 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                ➔
              </span>
            </Link>

            <Link 
              href="/targets"
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Target size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    Laporan Target & Kinerja Sales
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pantau pencapaian omzet penjualan dan kunjungan toko aktual oleh tim sales & SPV lapangan.
                  </p>
                </div>
              </div>
              <span className="p-2 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                ➔
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
