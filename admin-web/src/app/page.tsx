import { Search, Plus, TrendingUp, Users, ShoppingBag, Package, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <header className="bg-white border-b border-emerald-100/50 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Pantau performa bisnis dan penjualan Anda hari ini.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari transaksi, produk..." 
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white text-sm transition-all w-64"
            />
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2 text-sm hover:shadow-md active:scale-95">
            <Plus size={18} strokeWidth={2.5} /> Order Baru
          </button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* KPI Cards */}
          {[
            { title: 'Total Penjualan', value: 'Rp 145.2M', increase: '12%', icon: TrendingUp },
            { title: 'Total Dealer', value: '1,240', increase: '13%', icon: Users },
            { title: 'Sales Aktif', value: '45', increase: '14%', icon: ShoppingBag },
            { title: 'Order Hari Ini', value: '128', increase: '15%', icon: Package }
          ].map((item, i) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-emerald-100/50 shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,78,59,0.1)] transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${i === 0 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors'}`}>
                  <item.icon size={22} strokeWidth={2} />
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/80 flex items-center gap-1">
                  <TrendingUp size={12} strokeWidth={3} /> {item.increase}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">{item.title}</h3>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 p-6 h-96 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Grafik Penjualan</h3>
              <button className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center">
                Lihat Detail <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex-1 bg-slate-50/50 border border-slate-100 border-dashed rounded-xl flex items-center justify-center text-slate-400 font-medium">
              [Area Grafik]
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 p-6 h-96 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Top Produk</h3>
              <button className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center">
                Semua Produk <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex-1 bg-slate-50/50 border border-slate-100 border-dashed rounded-xl flex items-center justify-center text-slate-400 font-medium">
              [Area Daftar Produk]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
