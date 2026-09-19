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
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  { name: 'Promo & Diskon', href: '/promo', icon: Gift },
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

  useEffect(() => {
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
    <div className="w-64 bg-[#064e3b] text-white min-h-screen flex flex-col shadow-xl z-10 relative">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-wider text-emerald-300 drop-shadow-sm flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
          DAP APP
        </h1>
        <p className="text-xs text-emerald-200/70 mt-1.5 font-medium tracking-wide">ADMIN DASHBOARD</p>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-1.5 overflow-y-auto">
        <div className="mb-2 px-3 text-[10px] font-bold text-emerald-300/50 tracking-widest uppercase">General</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const hasReturnBadge = item.badgeKey === 'returns' && activeReturnsCount > 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-emerald-800 text-white font-bold shadow-sm' 
                  : 'text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white'
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

        <div className="mt-8 mb-2 px-3 text-[10px] font-bold text-emerald-300/50 tracking-widest uppercase flex items-center gap-2">
          ADVANCED FEATURES
        </div>
        {proMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-emerald-800 text-white font-bold shadow-sm' 
                  : 'text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white'
              }`}
            >
              <Icon size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-emerald-800/50 bg-[#022c22]/30 m-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[#064e3b] shadow-inner shadow-emerald-200/50">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-white">Admin User</p>
            <p className="text-xs text-emerald-200/80 font-medium">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
