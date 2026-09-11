'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Trash2, Edit2, CheckCircle2, TrendingUp, Users, Target, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesProfile {
  id: string;
  full_name: string;
  phone_number: string;
}

interface SalesTarget {
  id: string;
  sales_id: string;
  period_month: string;
  period_year: number;
  target_amount: number;
  achieved_amount: number;
  target_visits: number;
  achieved_visits: number;
  created_at: string;
  profiles?: {
    full_name: string;
    phone_number: string;
  };
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function TargetsPage() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [salesList, setSalesList] = useState<SalesProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);

  // Form Fields
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [periodMonth, setPeriodMonth] = useState('September');
  const [periodYear, setPeriodYear] = useState(2026);
  const [targetAmount, setTargetAmount] = useState('50000000');
  const [achievedAmount, setAchievedAmount] = useState('0');
  const [targetVisits, setTargetVisits] = useState('30');
  const [achievedVisits, setAchievedVisits] = useState('0');

  useEffect(() => {
    fetchData();

    const sub = supabase
      .channel('public:sales_targets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_targets' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // 1. Fetch sales profiles
    const { data: salesData } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('role', 'SALES');

    if (salesData) {
      setSalesList(salesData as any);
      if (salesData.length > 0 && !selectedSalesId) {
        setSelectedSalesId(salesData[0].id);
      }
    }

    // 2. Fetch targets joined with profiles
    const { data: targetData, error } = await supabase
      .from('sales_targets')
      .select('*, profiles:sales_id(full_name, phone_number)')
      .order('period_year', { ascending: false });

    if (!error && targetData) {
      setTargets(targetData as any);
    }
    setIsLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingTarget(null);
    if (salesList.length > 0) setSelectedSalesId(salesList[0].id);
    setPeriodMonth('September');
    setPeriodYear(2026);
    setTargetAmount('50000000');
    setAchievedAmount('0');
    setTargetVisits('30');
    setAchievedVisits('0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: SalesTarget) => {
    setEditingTarget(t);
    setSelectedSalesId(t.sales_id);
    setPeriodMonth(t.period_month);
    setPeriodYear(t.period_year);
    setTargetAmount(String(t.target_amount || 0));
    setAchievedAmount(String(t.achieved_amount || 0));
    setTargetVisits(String(t.target_visits || 0));
    setAchievedVisits(String(t.achieved_visits || 0));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalesId) {
      alert('Pilih personil sales terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    const payload = {
      sales_id: selectedSalesId,
      period_month: periodMonth,
      period_year: Number(periodYear),
      target_amount: Number(targetAmount) || 0,
      achieved_amount: Number(achievedAmount) || 0,
      target_visits: Number(targetVisits) || 0,
      achieved_visits: Number(achievedVisits) || 0,
    };

    if (editingTarget) {
      const { error } = await supabase
        .from('sales_targets')
        .update(payload)
        .eq('id', editingTarget.id);

      if (error) alert('Gagal memperbarui target: ' + error.message);
    } else {
      const { error } = await supabase
        .from('sales_targets')
        .insert([payload]);

      if (error) alert('Gagal membuat target baru: ' + error.message);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus target sales ini?')) return;
    const { error } = await supabase.from('sales_targets').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setTargets(targets.filter(t => t.id !== id));
    }
  };

  const filteredTargets = targets.filter(t => {
    const q = searchQuery.toLowerCase();
    const name = t.profiles?.full_name?.toLowerCase() || '';
    const month = t.period_month?.toLowerCase() || '';
    const year = String(t.period_year);
    return name.includes(q) || month.includes(q) || year.includes(q);
  });

  const totalTargetOmset = targets.reduce((acc, t) => acc + Number(t.target_amount || 0), 0);
  const totalAchievedOmset = targets.reduce((acc, t) => acc + Number(t.achieved_amount || 0), 0);
  const overallPercentage = totalTargetOmset > 0 ? Math.round((totalAchievedOmset / totalTargetOmset) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Target & KPI Sales</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Tetapkan dan pantau KPI bulanan omset serta kunjungan toko tim sales.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Set Target Baru
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100/60 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <Target size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Target Omset</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            Rp {totalTargetOmset.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">{targets.length} Target Sales Terdaftar</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/60 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <TrendingUp size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Omset Tercapai</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            Rp {totalAchievedOmset.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{overallPercentage}% dari seluruh target</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-emerald-100/60 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <Users size={18} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Personil Sales</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {salesList.length} Sales
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Tim aktif di lapangan</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="p-4 md:p-5 border-b border-slate-100 flex gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama sales, periode bulan, tahun..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="p-4 pl-6">Sales Representative</th>
                <th className="p-4">Periode</th>
                <th className="p-4">Pencapaian Omset</th>
                <th className="p-4">Pencapaian Kunjungan</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Memuat data target sales...
                  </td>
                </tr>
              ) : filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    Belum ada target sales yang ditetapkan. Klik "Set Target Baru" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredTargets.map((item) => {
                  const omsetPct = item.target_amount > 0 
                    ? Math.round((item.achieved_amount / item.target_amount) * 100) 
                    : 0;
                  const visitPct = item.target_visits > 0 
                    ? Math.round((item.achieved_visits / item.target_visits) * 100) 
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900">{item.profiles?.full_name || 'Sales Representative'}</p>
                        <p className="text-xs text-slate-400">{item.profiles?.phone_number || '-'}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          {item.period_month} {item.period_year}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="w-56">
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-emerald-700">Rp {Number(item.achieved_amount || 0).toLocaleString('id-ID')}</span>
                            <span className="text-slate-400">/ Rp {Number(item.target_amount || 0).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all ${omsetPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                              style={{ width: `${Math.min(omsetPct, 100)}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">{omsetPct}% tercapai</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-40">
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-800">{item.achieved_visits} Toko</span>
                            <span className="text-slate-400">/ {item.target_visits} Toko</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-2 rounded-full transition-all" 
                              style={{ width: `${Math.min(visitPct, 100)}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">{visitPct}% tercapai</span>
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                            title="Edit Target"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                            title="Hapus Target"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Target Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTarget ? 'Edit Target Sales' : 'Set Target Sales Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sales Personil</label>
                <select 
                  value={selectedSalesId} 
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  {salesList.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.phone_number || 'Sales'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bulan</label>
                  <select 
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white"
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tahun</label>
                  <input 
                    type="number" 
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Omset (Rp)</label>
                  <input 
                    type="number" 
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Contoh: 50000000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tercapai Omset (Rp)</label>
                  <input 
                    type="number" 
                    value={achievedAmount}
                    onChange={(e) => setAchievedAmount(e.target.value)}
                    placeholder="Contoh: 15000000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Kunjungan</label>
                  <input 
                    type="number" 
                    value={targetVisits}
                    onChange={(e) => setTargetVisits(e.target.value)}
                    placeholder="Contoh: 30"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tercapai Kunjungan</label>
                  <input 
                    type="number" 
                    value={achievedVisits}
                    onChange={(e) => setAchievedVisits(e.target.value)}
                    placeholder="Contoh: 12"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
