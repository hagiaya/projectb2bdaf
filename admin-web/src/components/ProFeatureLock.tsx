import { Lock, Sparkles, ChevronRight } from 'lucide-react';
import React from 'react';

export default function ProFeatureLock({ children, featureName }: { children: React.ReactNode, featureName: string }) {
  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 flex flex-col bg-slate-50/50">
      {/* Blurred background content */}
      <div className="absolute inset-0 blur-md opacity-40 pointer-events-none select-none overflow-hidden">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm z-10">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-emerald-100 flex flex-col items-center text-center transform transition-all animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-6 rotate-3">
            <Lock size={32} strokeWidth={2.5} className="-rotate-3" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">Fitur Terkunci</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Modul <span className="text-slate-900 font-bold">{featureName}</span> adalah fitur khusus untuk paket DAP APP Pro. Tingkatkan paket Anda untuk membuka fitur ini.
          </p>
          
          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 px-6 font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 group">
            <Sparkles size={18} className="text-emerald-400" />
            Upgrade to Pro
            <ChevronRight size={18} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="mt-4 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            Pelajari Lebih Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}
