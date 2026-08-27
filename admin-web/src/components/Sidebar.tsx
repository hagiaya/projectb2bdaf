import Link from 'next/link';
import { Home, Package, Users, Map, ShoppingCart, Archive, DollarSign, Activity, Gift, FileText, Settings, ArrowLeftRight, Lock } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Master Kategori', href: '/categories', icon: Package },
  { name: 'Master Produk', href: '/products', icon: Package },
  { name: 'Master Dealer', href: '/dealers', icon: Users },
  { name: 'Master Wilayah', href: '/regions', icon: Map },
  { name: 'Manajemen Order', href: '/orders', icon: ShoppingCart },
  { name: 'Manajemen Stok', href: '/inventory', icon: Archive },
  { name: 'Manajemen Retur', href: '/returns', icon: ArrowLeftRight },
  { name: 'Promo & Diskon', href: '/promo', icon: Gift },
  { name: 'Laporan', href: '/reports', icon: FileText },
  { name: 'Pengguna & Role', href: '/users', icon: Settings },
];

const proMenuItems = [
  { name: 'Master Sales', href: '/sales', icon: Users },
  { name: 'Target Sales', href: '/targets', icon: DollarSign },
  { name: 'Monitoring Sales', href: '/monitoring', icon: Activity },
  { name: 'CRM Dealer', href: '/crm', icon: Activity },
  { name: 'Peta Pelanggan', href: '/customers-map', icon: Map },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#064e3b] text-white min-h-screen flex flex-col shadow-xl z-10 relative">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-wider text-emerald-300 drop-shadow-sm flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
          2B RETAIL
        </h1>
        <p className="text-xs text-emerald-200/70 mt-1.5 font-medium tracking-wide">ADMIN DASHBOARD</p>
      </div>
      <nav className="flex-1 px-4 pb-4 space-y-1.5 overflow-y-auto">
        <div className="mb-2 px-3 text-[10px] font-bold text-emerald-300/50 tracking-widest uppercase">General</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white transition-all group"
            >
              <Icon size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold tracking-wide">{item.name}</span>
            </Link>
          );
        })}

        <div className="mt-8 mb-2 px-3 text-[10px] font-bold text-emerald-300/50 tracking-widest uppercase flex items-center gap-2">
          PRO FEATURES <Lock size={10} />
        </div>
        {proMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-emerald-100/60 hover:bg-emerald-900/30 hover:text-emerald-100 transition-all group border border-transparent hover:border-emerald-800/30"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className="group-hover:scale-110 transition-transform opacity-70" />
                <span className="text-sm font-medium tracking-wide">{item.name}</span>
              </div>
              <Lock size={14} className="text-emerald-400/50" />
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
