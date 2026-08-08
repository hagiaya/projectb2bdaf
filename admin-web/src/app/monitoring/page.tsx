import React from 'react';
import ProFeatureLock from '@/components/ProFeatureLock';
import { Activity, Search, Download } from 'lucide-react';

export default function MonitoringPage() {
  return (
    <ProFeatureLock featureName="Monitoring Sales">
      <div className="p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                <Activity size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Monitoring Sales</h1>
            </div>
            <p className="text-sm text-gray-500 font-medium">Lacak pencapaian dan aktivitas harian tim sales secara real-time.</p>
          </div>
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm">
            <Download size={18} strokeWidth={2.5} /> Ekspor Data
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari data monitoring..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl" />
            </div>
          </div>
          <div className="p-10 flex flex-col items-center justify-center text-gray-400">
            <Activity size={48} className="mb-4 text-gray-200" />
            <p>Data monitoring akan muncul di sini</p>
          </div>
        </div>
      </div>
    </ProFeatureLock>
  );
}
