'use client';

import { Search, Plus, TrendingUp, Users, ShoppingBag, Package, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  dealers?: { store_name: string };
}

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image_url: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalDealers: 0,
    activeSales: 0,
    ordersToday: 0,
    totalProducts: 0,
    syncedProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentData();
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { data: orders } = await supabase.from('orders').select('final_amount, total_amount, created_at');
      
      let totalSales = 0;
      let ordersToday = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (orders) {
        orders.forEach(order => {
          totalSales += Number(order.final_amount || order.total_amount) || 0;
          const orderDate = new Date(order.created_at);
          if (orderDate >= today) {
            ordersToday++;
          }
        });
      }

      const { count: totalDealers } = await supabase.from('dealers').select('*', { count: 'exact', head: true });
      const { count: activeSales } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'SALES');
      const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: syncedProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('image_url', 'is', null);

      setStats({
        totalSales,
        totalDealers: totalDealers || 0,
        activeSales: activeSales || 0,
        ordersToday,
        totalProducts: totalProducts || 0,
        syncedProducts: syncedProducts || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentData = async () => {
    try {
      // Recent 5 orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at, dealers(store_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersData) {
        setRecentOrders(ordersData as any);
      }

      // Top 5 products
      const { data: prodsData } = await supabase
        .from('products')
        .select('id, name, sku, price, stock, image_url')
        .order('stock', { ascending: false })
        .limit(5);

      if (prodsData) {
        setTopProducts(prodsData as any);
      }
    } catch (err) {
      console.error('Error fetching recent data:', err);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PACKING':
      case 'PROCESSING': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHIPPED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RECEIVED': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <header className="bg-white border-b border-emerald-100/50 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo DAP" className="h-12 w-auto object-contain" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Pantau performa bisnis dan penjualan Anda hari ini secara real-time.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/orders')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Order & Pipeline
          </button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* KPI Cards */}
          {[
            { title: 'Total Penjualan', value: loading ? '...' : formatCurrency(stats.totalSales), icon: TrendingUp, href: '/reports' },
            { title: 'Total Dealer', value: loading ? '...' : stats.totalDealers.toString(), icon: Users, href: '/dealers' },
            { title: 'Sales Aktif', value: loading ? '...' : stats.activeSales.toString(), icon: ShoppingBag, href: '/sales' },
            { title: 'Order Hari Ini', value: loading ? '...' : stats.ordersToday.toString(), icon: Package, href: '/orders' }
          ].map((item, i) => (
            <div 
              key={item.title} 
              onClick={() => router.push(item.href)}
              className="bg-white rounded-2xl p-6 border border-emerald-100/50 shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,78,59,0.1)] transition-all duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${i === 0 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors'}`}>
                  <item.icon size={22} strokeWidth={2} />
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">{item.title}</h3>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Sync Progress Bar */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-100/50 shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] mb-8">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Status Foto Produk Online</h3>
              <p className="text-sm text-slate-500 font-medium">Memantau produk dengan foto yang terhubung online dan aktif.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600">{stats.syncedProducts}</span>
              <span className="text-slate-400 font-medium text-sm ml-1">/ {stats.totalProducts} Produk</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 mb-2 overflow-hidden border border-slate-200">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3.5 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
              style={{ width: `${stats.totalProducts > 0 ? Math.round((stats.syncedProducts / stats.totalProducts) * 100) : 0}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
            </div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{stats.totalProducts > 0 ? Math.round((stats.syncedProducts / stats.totalProducts) * 100) : 0}% Terhubung</span>
            <button onClick={fetchStats} className="text-emerald-600 hover:text-emerald-700 underline decoration-emerald-600/30 underline-offset-2 transition-colors cursor-pointer">
              Refresh Status
            </button>
          </div>
        </div>

        {/* Recent Orders & Top Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Recent Orders */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pesanan Terbaru</h3>
                <p className="text-xs text-slate-400 font-medium">5 pesanan terakhir masuk secara real-time</p>
              </div>
              <button 
                onClick={() => router.push('/orders')} 
                className="text-emerald-600 text-sm font-bold hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Belum ada pesanan terbaru.
                </div>
              ) : (
                recentOrders.map((ord) => (
                  <div 
                    key={ord.id} 
                    onClick={() => router.push('/orders')}
                    className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-emerald-50/30 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">{ord.order_number}</p>
                      <p className="text-xs text-slate-500 font-medium">{ord.dealers?.store_name || 'Toko Dealer'}</p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {new Date(ord.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-700">Rp {Number(ord.total_amount).toLocaleString('id-ID')}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getStatusColor(ord.status)}`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products Inventory */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Katalog Produk</h3>
                <p className="text-xs text-slate-400 font-medium">Stok dan produk unggulan di sistem</p>
              </div>
              <button 
                onClick={() => router.push('/products')} 
                className="text-emerald-600 text-sm font-bold hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                Semua Produk <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3">
              {topProducts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Memuat data produk...
                </div>
              ) : (
                topProducts.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => router.push('/products')}
                    className="flex items-center gap-3 p-3 bg-slate-50/70 hover:bg-emerald-50/30 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {prod.image_url ? (
                        <img src={`/api/image?url=${encodeURIComponent(prod.image_url)}`} alt={prod.sku} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{prod.sku || prod.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{prod.name || 'Produk'}</p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">Rp {Number(prod.price).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {prod.stock} unit
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
