'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  Users, 
  Map, 
  ShoppingCart, 
  Archive, 
  DollarSign, 
  Activity, 
  Gift, 
  FileText, 
  Settings, 
  ArrowLeftRight, 
  Award, 
  Target, 
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Master Kategori', href: '/categories', icon: Package },
  { name: 'Master Produk', href: '/products', icon: Package },
  { name: 'Manajemen Stok', href: '/inventory', icon: Archive },
  { name: 'Master Dealer', href: '/dealers', icon: Users },
  { name: 'Program Dealer', href: '/programs', icon: Award },
  { name: 'Master Sales & SPV', href: '/sales', icon: Users },
  { name: 'Monitoring Sales', href: '/monitoring', icon: Activity },
  { name: 'Penggajian Sales', href: '/payroll', icon: DollarSign },
  { name: 'Master Wilayah', href: '/regions', icon: Map },
  { name: 'Manajemen Order', href: '/orders', icon: ShoppingCart },
  { name: 'Manajemen Retur', href: '/returns', icon: ArrowLeftRight, badgeKey: 'returns' },
  { name: 'Informasi & Promo', href: '/promo', icon: Gift },
  { name: 'Pengaturan Pembayaran', href: '/payment', icon: CreditCard },
  { name: 'Laporan', href: '/reports', icon: FileText },
  { name: 'Pengguna & Role', href: '/users', icon: Settings },
];

const proMenuItems = [
  { name: 'Target & SPV', href: '/targets', icon: Target },
  { name: 'CRM Dealer', href: '/crm', icon: Activity },
  { name: 'Peta Pelanggan', href: '/customers-map', icon: Map },
  { name: 'Reset Data', href: '/reset-data', icon: AlertTriangle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [activeReturnsCount, setActiveReturnsCount] = useState(0);
  const [adminRole, setAdminRole] = useState('SUPER_ADMIN');

  useEffect(() => {
    setAdminRole(localStorage.getItem('adminRole') || 'SUPER_ADMIN');
    fetchActiveReturns();

    // Realtime subscription for returns table
    const channel = supabase
      .channel('sidebar-returns-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        fetchActiveReturns();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveReturns = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('id, status');

      if (!error && data) {
        // Count returns that require action (not completed or rejected)
        const pendingCount = data.filter(
          (r: any) => r.status !== 'COMPLETED' && r.status !== 'REJECTED' && r.status !== 'PROCESSED'
        ).length;
        setActiveReturnsCount(pendingCount);
      }
    } catch (e) {
      console.error('Fetch returns count error:', e);
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-black text-gray-900 dark:text-white min-h-screen flex flex-col shadow-xl z-10 relative border-r border-gray-200 dark:border-zinc-800">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-wider text-emerald-600 dark:text-emerald-300 drop-shadow-sm flex items-center gap-2">
          <img src="/LOGO%20DAP.svg" alt="Logo" className="h-8 object-contain" />
          DAP APP
        </h1>
        <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70 mt-1.5 font-medium tracking-wide">
          {adminRole === 'SUPER_ADMIN' ? 'SUPER ADMIN DASHBOARD' : 'ADMIN DASHBOARD'}
        </p>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-1.5 overflow-y-auto">
        <div className="mb-2 px-3 text-[10px] font-bold text-gray-500 dark:text-white/40 tracking-widest uppercase">General</div>
        {menuItems.filter(item => {
          if (adminRole === 'SUPER_ADMIN') return true;
          // Restricted ADMIN role access
          return ['/', '/programs', '/monitoring', '/orders', '/returns'].includes(item.href);
        }).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const hasReturnBadge = item.badgeKey === 'returns' && activeReturnsCount > 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[#a3e635] text-black font-extrabold shadow-sm' 
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold tracking-wide">{item.name}</span>
              </div>

              {hasReturnBadge && (
                <span className="px-2 py-0.5 text-[11px] font-black bg-amber-400 text-amber-950 rounded-full shadow-sm animate-pulse">
                  {activeReturnsCount}
                </span>
              )}
            </Link>
          );
        })}

        {adminRole === 'SUPER_ADMIN' && (
          <div className="mt-8 mb-2 px-3 text-[10px] font-bold text-gray-500 dark:text-white/40 tracking-widest uppercase flex items-center gap-2">
            ADVANCED FEATURES
          </div>
        )}
        {adminRole === 'SUPER_ADMIN' && proMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-[#a3e635] text-black font-extrabold shadow-sm' 
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              <Icon size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-800/50 bg-gray-50 dark:bg-zinc-900 m-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center font-black text-black shadow-inner shadow-white/20">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Operasional'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-[#a3e635] font-medium">{adminRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
