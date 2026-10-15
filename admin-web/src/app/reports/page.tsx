'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Target,
  Award,
  Search,
  Send,
  MessageCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Store,
  Filter,
  Check
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

export interface DealerPurchaseStat {
  id: string;
  store_name: string;
  address: string;
  pic_name: string;
  phone_number: string;
  region_name: string;
  total_spend: number;
  order_count: number;
  completed_order_count: number;
  last_order_date?: string;
  last_order_number?: string;
  last_order_status?: string;
  rank: number;
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
  const [dealerStats, setDealerStats] = useState<DealerPurchaseStat[]>([]);
  const [dealerFilterTab, setDealerFilterTab] = useState<'ALL' | 'TOP5' | 'ACTIVE' | 'ZERO'>('ALL');
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  
  // Modal Notifikasi & Promo
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [selectedDealerForPromo, setSelectedDealerForPromo] = useState<DealerPurchaseStat | null>(null);
  const [promoTemplateType, setPromoTemplateType] = useState<'PROMO' | 'REMINDER' | 'LOYALTY' | 'CUSTOM'>('PROMO');
  const [customPromoMessage, setCustomPromoMessage] = useState('');
  const [promoSuccessToast, setPromoSuccessToast] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const [
        { data: allOrders },
        { data: allDealersData },
        { count: productCount }
      ] = await Promise.all([
        supabase.from('orders').select('id, dealer_id, total_amount, status, created_at, order_number'),
        supabase.from('dealers').select(`
          id,
          store_name,
          address,
          status,
          sales_id,
          created_at,
          profiles:profile_id (id, full_name, phone_number, email),
          regions:region_id (name)
        `),
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

      // Process Dealer Purchase Stats
      const dealerStatsMap: Record<string, {
        totalSpend: number;
        orderCount: number;
        completedCount: number;
        lastOrderDate?: string;
        lastOrderNumber?: string;
        lastOrderStatus?: string;
      }> = {};

      if (allOrders) {
        allOrders.forEach(o => {
          if (!o.dealer_id || o.status === 'CANCELLED') return;
          const amt = Number(o.total_amount) || 0;
          if (!dealerStatsMap[o.dealer_id]) {
            dealerStatsMap[o.dealer_id] = {
              totalSpend: 0,
              orderCount: 0,
              completedCount: 0,
            };
          }
          const stat = dealerStatsMap[o.dealer_id];
          stat.totalSpend += amt;
          stat.orderCount += 1;
          if (o.status === 'COMPLETED' || o.status === 'RECEIVED') {
            stat.completedCount += 1;
          }
          if (!stat.lastOrderDate || new Date(o.created_at) > new Date(stat.lastOrderDate)) {
            stat.lastOrderDate = o.created_at;
            stat.lastOrderNumber = o.order_number;
            stat.lastOrderStatus = o.status;
          }
        });
      }

      const parsedDealers: DealerPurchaseStat[] = (allDealersData || []).map((d: any) => {
        const stat = dealerStatsMap[d.id] || { totalSpend: 0, orderCount: 0, completedCount: 0 };
        return {
          id: d.id,
          store_name: d.store_name || 'Toko',
          address: d.address || '-',
          pic_name: d.profiles?.full_name || '-',
          phone_number: d.profiles?.phone_number || '',
          region_name: d.regions?.name || '-',
          total_spend: stat.totalSpend,
          order_count: stat.orderCount,
          completed_order_count: stat.completedCount,
          last_order_date: stat.lastOrderDate,
          last_order_number: stat.lastOrderNumber,
          last_order_status: stat.lastOrderStatus,
          rank: 0,
        };
      });

      // Sort: dari yang terbesar pembelian sampai yang terkecil
      parsedDealers.sort((a, b) => {
        if (b.total_spend !== a.total_spend) return b.total_spend - a.total_spend;
        if (b.order_count !== a.order_count) return b.order_count - a.order_count;
        return a.store_name.localeCompare(b.store_name);
      });

      // Assign ranking numbers
      parsedDealers.forEach((d, idx) => {
        d.rank = idx + 1;
      });

      setDealerStats(parsedDealers);

      setStats({
        totalRevenue,
        totalCompletedOrders,
        totalPipelineAmount,
        totalPipelineOrders,
        totalGrossAmount,
        totalGrossOrders,
        totalDealers: allDealersData?.length || 0,
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

  const top5Dealers = useMemo(() => {
    return dealerStats.filter(d => d.total_spend > 0).slice(0, 5);
  }, [dealerStats]);

  const zeroOrderDealersCount = useMemo(() => {
    return dealerStats.filter(d => d.order_count === 0).length;
  }, [dealerStats]);

  const activeOrderDealersCount = useMemo(() => {
    return dealerStats.filter(d => d.order_count > 0).length;
  }, [dealerStats]);

  const filteredDealers = useMemo(() => {
    let list = [...dealerStats];

    if (dealerFilterTab === 'TOP5') {
      list = list.filter(d => d.total_spend > 0).slice(0, 5);
    } else if (dealerFilterTab === 'ACTIVE') {
      list = list.filter(d => d.order_count > 0);
    } else if (dealerFilterTab === 'ZERO') {
      list = list.filter(d => d.order_count === 0);
    }

    if (dealerSearchQuery.trim()) {
      const q = dealerSearchQuery.toLowerCase();
      list = list.filter(d =>
        d.store_name.toLowerCase().includes(q) ||
        d.pic_name.toLowerCase().includes(q) ||
        d.region_name.toLowerCase().includes(q) ||
        d.phone_number.includes(q)
      );
    }

    return list;
  }, [dealerStats, dealerFilterTab, dealerSearchQuery]);

  const generatePromoMessage = (dealer: DealerPurchaseStat, type: string) => {
    const store = dealer.store_name;
    const pic = dealer.pic_name;
    const spend = `Rp ${dealer.total_spend.toLocaleString('id-ID')}`;

    if (type === 'REMINDER') {
      return `Halo Toko ${store} (Bpk/Ibu ${pic}),\n\nKami dari *PT DISTRIBUSI AKSESORIS PRIMA (DAP B2B)* menginformasikan bahwa akun kemitraan toko Anda telah aktif dan terverifikasi di aplikasi kami.\n\nSaat ini tersedia berbagai produk aksesoris smartphone unggulan dengan harga grosir resmi & promo spesial pembelanjaan perdana.\n\nSilakan buka aplikasi DAP B2B Anda untuk melakukan pemesanan pertama atau hubungi kami jika memerlukan bantuan katalog produk.\n\nTerima kasih dan salam sukses selalu!\n*Tim Operasional DAP B2B*`;
    }

    if (type === 'LOYALTY') {
      return `Halo Toko ${store} (Bpk/Ibu ${pic}),\n\nTerima kasih atas kepercayaan dan loyalitas Anda menjadi salah satu *Mitra Prioritas DAP B2B* dengan total akumulasi belanja ${spend} (${dealer.order_count} transaksi).\n\nSebagai apresiasi, Anda berhak mendapatkan prioritas alokasi barang baru, diskon harga grosir khusus, dan fasilitas program reward DAP.\n\nHubungi kami jika ada kebutuhan restok produk untuk outlet Anda hari ini.\n\nSalam hangat,\n*PT DISTRIBUSI AKSESORIS PRIMA*`;
    }

    // Default: PROMO
    return `Halo Toko ${store} (Bpk/Ibu ${pic}),\n\nKabar gembira! DAP B2B sedang menghadirkan *Promo Spesial & Flash Sale Grosir Aksesoris* dengan diskon khusus dan subsidi ongkir untuk outlet Anda.\n\nCek produk terlaris kami langsung di aplikasi DAP B2B dan dapatkan penawaran terbaik sebelum kehabisan stok!\n\nInformasi lebih lanjut hubungi admin DAP di sini.\n\nSalam sukses,\n*PT DISTRIBUSI AKSESORIS PRIMA*`;
  };

  const handleOpenPromoModal = (dealer: DealerPurchaseStat) => {
    setSelectedDealerForPromo(dealer);
    const initialType = dealer.order_count === 0 ? 'REMINDER' : dealer.rank <= 5 ? 'LOYALTY' : 'PROMO';
    setPromoTemplateType(initialType);
    setCustomPromoMessage(generatePromoMessage(dealer, initialType));
    setPromoModalOpen(true);
  };

  const handleTemplateChange = (type: 'PROMO' | 'REMINDER' | 'LOYALTY' | 'CUSTOM') => {
    setPromoTemplateType(type);
    if (selectedDealerForPromo && type !== 'CUSTOM') {
      setCustomPromoMessage(generatePromoMessage(selectedDealerForPromo, type));
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!selectedDealerForPromo) return;
    const text = customPromoMessage || generatePromoMessage(selectedDealerForPromo, promoTemplateType);
    const cleanPhone = selectedDealerForPromo.phone_number.replace(/\D/g, '').replace(/^0/, '62');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setPromoSuccessToast(true);
    setTimeout(() => setPromoSuccessToast(false), 3000);
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

          {/* ============================================================== */}
          {/* LAPORAN PEMBELIAN DEALER (POIN 3)                             */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 mb-8 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={13} className="text-amber-600" />
                    Laporan Pembelian Dealer
                  </span>
                  <span className="text-xs text-slate-400 font-medium">• Diurutkan Akumulasi Tertinggi</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Peringkat & Analitik Pembelian Dealer
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau dealer paling banyak order, ranking 1-5 dealer besar pembelian, dan kirim notifikasi/promo langsung ke dealer dari panel admin.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                  Total: <b>{dealerStats.length} Toko Terdaftar</b>
                </span>
                <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                  Aktif Belanja: <b>{activeOrderDealersCount} Toko</b>
                </span>
                <span className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-700 rounded-xl border border-red-200">
                  Belum Order: <b>{zeroOrderDealersCount} Toko</b>
                </span>
              </div>
            </div>

            {/* TOP 1 - 5 DEALER BESAR PEMBELIAN */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Top 1 - 5 Dealer Besar Pembelian (Big Buyers)
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  Mitra dengan kontribusi omzet pembelian tertinggi
                </span>
              </div>

              {top5Dealers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Belum ada dealer dengan transaksi belanja tercatat.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {top5Dealers.map((d, index) => {
                    const rankBadge = 
                      index === 0 ? { bg: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-amber-950', ring: 'ring-2 ring-amber-400/40', title: '👑 #1 BIGGEST BUYER' } :
                      index === 1 ? { bg: 'bg-gradient-to-br from-slate-300 to-slate-500', text: 'text-slate-950', ring: 'ring-2 ring-slate-300/40', title: '🥈 #2 TOP BUYER' } :
                      index === 2 ? { bg: 'bg-gradient-to-br from-amber-600 to-amber-800', text: 'text-amber-100', ring: 'ring-2 ring-amber-600/40', title: '🥉 #3 TOP BUYER' } :
                      index === 3 ? { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', text: 'text-white', ring: 'ring-2 ring-blue-400/30', title: '⭐ #4 TOP PARTNER' } :
                      { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white', ring: 'ring-2 ring-emerald-400/30', title: '⭐ #5 TOP PARTNER' };

                    return (
                      <div
                        key={d.id}
                        className={`bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden ${rankBadge.ring}`}
                      >
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase ${rankBadge.bg} ${rankBadge.text} shadow-sm`}>
                              {rankBadge.title}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1" title={d.store_name}>
                            {d.store_name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            PIC: {d.pic_name} • {d.region_name}
                          </p>

                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Total Belanja:
                            </span>
                            <div className="text-base font-black text-blue-700 mt-0.5">
                              {formatRupiah(d.total_spend)}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              {d.order_count} Transaksi
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenPromoModal(d)}
                          className="w-full mt-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Send size={12} className="text-amber-700" />
                          Kirim Promo / Reward
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TABEL SELURUH DEALER TERURUT */}
            <div className="space-y-4">
              {/* Filter Toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setDealerFilterTab('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dealerFilterTab === 'ALL'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Toko ({dealerStats.length})
                  </button>
                  <button
                    onClick={() => setDealerFilterTab('TOP5')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      dealerFilterTab === 'TOP5'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <Award size={13} />
                    1-5 Terbesar ({top5Dealers.length})
                  </button>
                  <button
                    onClick={() => setDealerFilterTab('ACTIVE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      dealerFilterTab === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    Aktif Order ({activeOrderDealersCount})
                  </button>
                  <button
                    onClick={() => setDealerFilterTab('ZERO')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      dealerFilterTab === 'ZERO'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    <AlertCircle size={13} />
                    Belum Pernah Order ({zeroOrderDealersCount})
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Toko, PIC, Wilayah, No HP..."
                    value={dealerSearchQuery}
                    onChange={(e) => setDealerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4 text-center">Rank</th>
                        <th className="py-3 px-4">Toko & PIC</th>
                        <th className="py-3 px-4">Wilayah</th>
                        <th className="py-3 px-4 text-right">Total Pembelian</th>
                        <th className="py-3 px-4 text-center">Jumlah Order</th>
                        <th className="py-3 px-4">Order Terakhir</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Kirim Notif / Promo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDealers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            Tidak ditemukan data dealer yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDealers.map((d) => {
                          const isTop5 = d.rank <= 5 && d.total_spend > 0;
                          const hasOrdered = d.order_count > 0;

                          return (
                            <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Rank */}
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-[11px] ${
                                    d.rank === 1 && d.total_spend > 0 ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300' :
                                    d.rank === 2 && d.total_spend > 0 ? 'bg-slate-300 text-slate-900' :
                                    d.rank === 3 && d.total_spend > 0 ? 'bg-amber-700 text-amber-100' :
                                    isTop5 ? 'bg-blue-100 text-blue-800' :
                                    'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {d.rank}
                                </span>
                              </td>

                              {/* Toko & PIC */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  {d.store_name}
                                  {isTop5 && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded">
                                      TOP {d.rank}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  PIC: <span className="text-slate-600 font-semibold">{d.pic_name}</span>
                                  {d.phone_number ? ` • ${d.phone_number}` : ''}
                                </div>
                              </td>

                              {/* Wilayah */}
                              <td className="py-3 px-4 text-slate-600 font-medium">
                                {d.region_name}
                              </td>

                              {/* Total Pembelian */}
                              <td className="py-3 px-4 text-right">
                                <div className={`font-black text-sm ${hasOrdered ? 'text-blue-700' : 'text-slate-400'}`}>
                                  {formatRupiah(d.total_spend)}
                                </div>
                              </td>

                              {/* Jumlah Order */}
                              <td className="py-3 px-4 text-center">
                                <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                  hasOrdered ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {d.order_count} Order
                                </span>
                              </td>

                              {/* Order Terakhir */}
                              <td className="py-3 px-4">
                                {d.last_order_date ? (
                                  <div>
                                    <div className="font-semibold text-slate-700">
                                      {new Date(d.last_order_date).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {d.last_order_number || '-'} ({d.last_order_status})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Belum ada transaksi</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 text-center">
                                {hasOrdered ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                    <Check size={10} /> Aktif Belanja
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1">
                                    <AlertCircle size={10} /> Belum Order
                                  </span>
                                )}
                              </td>

                              {/* Aksi Kirim Promo / Notif */}
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleOpenPromoModal(d)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm ${
                                    !hasOrdered
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                  title={!hasOrdered ? 'Kirim Peringatan / Promo Ajakan Belanja' : 'Kirim Promo / Katalog ke Dealer'}
                                >
                                  <Send size={12} />
                                  {!hasOrdered ? 'Peringatan / Promo' : 'Kirim Promo'}
                                </button>
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

      {/* MODAL: KIRIM NOTIFIKASI PERINGATAN / PROMO KE DEALER (POIN 3) */}
      {promoModalOpen && selectedDealerForPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded text-[10px] font-extrabold uppercase tracking-wider">
                  Panel Admin Notifikasi & Promo
                </span>
                <h3 className="text-lg font-black mt-1">
                  Kirim Promo / Notifikasi ke {selectedDealerForPromo.store_name}
                </h3>
                <p className="text-xs text-slate-400">
                  PIC: {selectedDealerForPromo.pic_name} • HP/WA: {selectedDealerForPromo.phone_number || '-'} • Wilayah: {selectedDealerForPromo.region_name}
                </p>
              </div>
              <button
                onClick={() => setPromoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Status Toko Box */}
              <div className={`p-4 rounded-2xl border ${
                selectedDealerForPromo.order_count === 0 
                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>
                    {selectedDealerForPromo.order_count === 0 
                      ? '⚠️ Status: Toko Belum Pernah Order (0 Transaksi)' 
                      : `✅ Status: Dealer Aktif Belanja (Total ${formatRupiah(selectedDealerForPromo.total_spend)})`}
                  </span>
                  <span>Rank #{selectedDealerForPromo.rank}</span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {selectedDealerForPromo.order_count === 0
                    ? 'Kirimkan notifikasi peringatan/ajakan selamat datang agar pemilik toko segera melakukan checkout pertama di aplikasi DAP.'
                    : 'Kirimkan penawaran katalog flash sale, diskon grosir, atau info program reward DAP langsung ke WhatsApp pemilik toko.'}
                </p>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Format / Template Pesan:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTemplateChange('PROMO')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      promoTemplateType === 'PROMO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🎁 Promo Spesial
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTemplateChange('REMINDER')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      promoTemplateType === 'REMINDER'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠️ Ajakan Belanja
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTemplateChange('LOYALTY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      promoTemplateType === 'LOYALTY'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    👑 Apresiasi Mitra
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTemplateChange('CUSTOM')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      promoTemplateType === 'CUSTOM'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✏️ Ketik Kustom
                  </button>
                </div>
              </div>

              {/* Message Text Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Isi Pesan Notifikasi & Promo (Dapat Diedit):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Diterima langsung oleh pemilik toko</span>
                </label>
                <textarea
                  rows={6}
                  value={customPromoMessage}
                  onChange={(e) => setCustomPromoMessage(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Ketik pesan promosi atau peringatan di sini..."
                />
              </div>

              {promoSuccessToast && (
                <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check size={16} className="text-emerald-600" />
                  WhatsApp terbuka dan pesan promo siap dikirim ke dealer!
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle size={15} />
                  Kirim via WhatsApp Dealer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
