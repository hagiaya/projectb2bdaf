'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Plus, Trash2, Edit2, CheckCircle2, 
  TrendingUp, Users, Target, X, RefreshCw, Calendar, 
  MapPin, Shield, Award, AlertCircle, Percent, Eye, ChevronRight,
  Briefcase, Check, ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesProfile {
  id: string; // sales.id
  profile_id: string;
  is_spv?: boolean;
  spv_id?: string | null;
  base_salary?: number;
  daily_visit_target?: number;
  work_days_per_month?: number;
  profiles?: {
    full_name: string;
    phone_number: string;
  };
  regions?: {
    id: string;
    name: string;
  };
}

interface SalesTarget {
  id: string;
  sales_id: string;
  spv_id?: string | null;
  period_month: string;
  period_year: number;
  daily_visit_target: number;
  work_days: number;
  target_visits: number;
  achieved_visits: number;
  visit_achievement_pct: number;
  target_amount: number;
  achieved_amount: number;
  sales_achievement_pct: number;
  is_spv_target?: boolean;
  spv_direct_target_amount?: number;
  spv_direct_achieved_amount?: number;
  notes?: string;
  created_at?: string;
  sales?: {
    id: string;
    is_spv?: boolean;
    spv_id?: string;
    profiles?: {
      full_name: string;
      phone_number: string;
    };
    regions?: {
      id: string;
      name: string;
    };
    spv?: {
      profiles?: {
        full_name: string;
      };
    };
  };
}

interface RegionCoverage {
  id: string;
  code: string;
  name: string;
  manager_name?: string;
  assigned_sales_id?: string | null;
  coverage_status: 'COVERED' | 'UNCOVERED';
  assigned_sales?: {
    id: string;
    profiles?: {
      full_name: string;
    };
  };
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function TargetsPage() {
  const [activeTab, setActiveTab] = useState<'sales_targets' | 'spv_dashboard' | 'coverage_management'>('sales_targets');
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [salesList, setSalesList] = useState<SalesProfile[]>([]);
  const [regions, setRegions] = useState<RegionCoverage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [periodMonth, setPeriodMonth] = useState('September');
  const [periodYear, setPeriodYear] = useState(2026);
  const [selectedSpvFilter, setSelectedSpvFilter] = useState('ALL');

  // Modal: Create/Edit Sales Target
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null);

  // Form Fields for Sales Target
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [targetAmount, setTargetAmount] = useState('100000000');
  const [targetDailyVisits, setTargetDailyVisits] = useState('6');
  const [targetWorkDays, setTargetWorkDays] = useState('26');
  const [notes, setNotes] = useState('');

  // Modal: Assign Coverage Region
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionCoverage | null>(null);
  const [assignSalesId, setAssignSalesId] = useState<string>('');
  const [savingAssign, setSavingAssign] = useState(false);

  useEffect(() => {
    fetchData();
  }, [periodMonth, periodYear]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Sales List with Profiles and SPV info
      const { data: sData } = await supabase
        .from('sales')
        .select(`
          id,
          profile_id,
          is_spv,
          spv_id,
          base_salary,
          daily_visit_target,
          work_days_per_month,
          profiles (full_name, phone_number),
          regions (id, name)
        `)
        .eq('status', 'ACTIVE');

      if (sData) {
        setSalesList(sData as any);
        if (sData.length > 0 && !selectedSalesId) {
          setSelectedSalesId(sData[0].id);
        }
      }

      // 2. Fetch Targets for Month & Year
      const { data: tData, error: tError } = await supabase
        .from('sales_targets')
        .select(`
          *,
          sales:sales_id (
            id,
            is_spv,
            spv_id,
            profiles (full_name, phone_number),
            regions (id, name),
            spv:spv_id (
              profiles (full_name)
            )
          )
        `)
        .eq('period_month', periodMonth)
        .eq('period_year', periodYear)
        .order('created_at', { ascending: false });

      if (!tError && tData) {
        setTargets(tData as any);
      }

      // 3. Fetch Regions for Coverage Management
      const { data: rData } = await supabase
        .from('regions')
        .select(`
          id,
          code,
          name,
          manager_name,
          assigned_sales_id,
          coverage_status,
          assigned_sales:assigned_sales_id (
            id,
            profiles (full_name)
          )
        `)
        .order('name', { ascending: true });

      if (rData) {
        setRegions(rData as any);
      }
    } catch (err) {
      console.error('Fetch target data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sinkronisasi Otomatis Realisasi Penjualan & Realisasi Visit dari DB
  const handleSyncRealization = async () => {
    setIsSyncing(true);
    try {
      const monthIndex = MONTHS.indexOf(periodMonth);
      const startDate = new Date(periodYear, monthIndex, 1).toISOString();
      const endDate = new Date(periodYear, monthIndex + 1, 0, 23, 59, 59).toISOString();

      // Loop semua target yang ada
      for (const t of targets) {
        // A. Hitung check-in visit aktual
        const { count: actualVisits } = await supabase
          .from('sales_visits')
          .select('id', { count: 'exact', head: true })
          .eq('sales_id', t.sales_id)
          .eq('status', 'COMPLETED')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const realVisits = actualVisits || 0;
        const visitPct = t.target_visits > 0 ? (realVisits / t.target_visits) * 100 : 0;

        // B. Hitung realisasi omzet pesanan aktual
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, final_amount, total_amount, status, is_spv_direct_sale')
          .or(`sales_id.eq.${t.sales_id},dealer_id.in.(select id from dealers where sales_id = '${t.sales_id}')`)
          .neq('status', 'CANCELLED')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        let realOmzet = 0;
        let realDirectSpv = 0;

        (orderData || []).forEach((ord: any) => {
          const val = Number(ord.final_amount || ord.total_amount || 0);
          if (ord.is_spv_direct_sale) {
            realDirectSpv += val;
          } else {
            realOmzet += val;
          }
        });

        const salesPct = t.target_amount > 0 ? (realOmzet / t.target_amount) * 100 : 0;

        await supabase
          .from('sales_targets')
          .update({
            achieved_visits: realVisits,
            visit_achievement_pct: Number(visitPct.toFixed(2)),
            achieved_amount: realOmzet,
            sales_achievement_pct: Number(salesPct.toFixed(2)),
            spv_direct_achieved_amount: realDirectSpv,
            updated_at: new Date().toISOString(),
          })
          .eq('id', t.id);
      }

      alert('Sinkronisasi realisasi omzet pesanan & check-in visit berhasil diperbarui!');
      fetchData();
    } catch (err: any) {
      console.error('Sync error:', err);
      alert('Gagal sinkronisasi: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTarget(null);
    if (salesList.length > 0) setSelectedSalesId(salesList[0].id);
    setTargetAmount('100000000');
    setTargetDailyVisits('6');
    setTargetWorkDays('26');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: SalesTarget) => {
    setEditingTarget(t);
    setSelectedSalesId(t.sales_id);
    setTargetAmount(String(t.target_amount || 100000000));
    setTargetDailyVisits(String(t.daily_visit_target || 6));
    setTargetWorkDays(String(t.work_days || 26));
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalesId) {
      alert('Pilih personil sales terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    try {
      const salesObj = salesList.find(s => s.id === selectedSalesId);
      const dVisits = Number(targetDailyVisits) || 6;
      const wDays = Number(targetWorkDays) || 26;
      const monthlyVisits = dVisits * wDays;
      const tAmount = Number(targetAmount) || 100000000;

      const payload = {
        sales_id: selectedSalesId,
        spv_id: salesObj?.spv_id || null,
        period_month: periodMonth,
        period_year: periodYear,
        daily_visit_target: dVisits,
        work_days: wDays,
        target_visits: monthlyVisits,
        target_amount: tAmount,
        is_spv_target: Boolean(salesObj?.is_spv),
        notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (editingTarget) {
        const { error } = await supabase
          .from('sales_targets')
          .update(payload)
          .eq('id', editingTarget.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales_targets')
          .upsert([payload], { onConflict: 'sales_id,period_month,period_year' });

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan target: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data target ini?')) return;
    try {
      const { error } = await supabase.from('sales_targets').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Assign Coverage
  const handleOpenAssignCoverage = (r: RegionCoverage) => {
    setSelectedRegion(r);
    setAssignSalesId(r.assigned_sales_id || '');
    setAssignModalOpen(true);
  };

  const handleSaveAssignCoverage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegion) return;

    setSavingAssign(true);
    try {
      const hasSales = Boolean(assignSalesId && assignSalesId.trim() !== '');
      const { error } = await supabase
        .from('regions')
        .update({
          assigned_sales_id: hasSales ? assignSalesId : null,
          coverage_status: hasSales ? 'COVERED' : 'UNCOVERED',
        })
        .eq('id', selectedRegion.id);

      if (error) throw error;

      setAssignModalOpen(false);
      setSelectedRegion(null);
      fetchData();
    } catch (err: any) {
      alert('Gagal menetapkan coverage wilayah: ' + err.message);
    } finally {
      setSavingAssign(false);
    }
  };

  // Calculation helpers
  const getIncentiveTier = (pct: number) => {
    if (pct >= 90) return { pct: 1.0, label: '1% dari omzet', color: 'text-emerald-700 bg-emerald-100' };
    if (pct >= 80) return { pct: 0.75, label: '0.75% dari omzet', color: 'text-blue-700 bg-blue-100' };
    if (pct >= 70) return { pct: 0.25, label: '0.25% dari omzet', color: 'text-amber-700 bg-amber-100' };
    return { pct: 0, label: '0% (Di bawah 70%)', color: 'text-slate-600 bg-slate-100' };
  };

  // SPV Summary Calculations
  const spvList = salesList.filter(s => s.is_spv);

  // Filtered Targets
  const filteredTargets = targets.filter(t => {
    const sName = t.sales?.profiles?.full_name?.toLowerCase() || '';
    const sRegion = t.sales?.regions?.name?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch = sName.includes(q) || sRegion.includes(q);
    const matchesSpv = selectedSpvFilter === 'ALL' || t.spv_id === selectedSpvFilter || (selectedSpvFilter === 'NONE' && !t.spv_id);

    return matchesSearch && matchesSpv;
  });

  // Aggregate stats
  const totalTargetAll = targets.reduce((sum, t) => sum + Number(t.target_amount || 0), 0);
  const totalAchievedAll = targets.reduce((sum, t) => sum + Number(t.achieved_amount || 0), 0);
  const totalRemainingAll = Math.max(0, totalTargetAll - totalAchievedAll);
  const overallPctAll = totalTargetAll > 0 ? ((totalAchievedAll / totalTargetAll) * 100).toFixed(1) : '0';

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Target size={24} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Target & Pencapaian Sales & SPV
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pantau perbandingan Target vs Realisasi Penjualan, Target Visit Toko, serta Penjualan Langsung SPV di Wilayah Non-Coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncRealization}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm rounded-xl transition-all border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Realisasi'}
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Plus size={16} />
            Tetapkan Target Bulanan
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('sales_targets')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'sales_targets'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Target size={16} />
          Target & Pencapaian Sales
        </button>

        <button
          onClick={() => setActiveTab('spv_dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'spv_dashboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase size={16} />
          Target & Penjualan Tim SPV
          <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full">
            POIN 21 & 23
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coverage_management')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
            activeTab === 'coverage_management'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin size={16} />
          Coverage Wilayah & Area Non-Cover
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
            {regions.filter(r => r.coverage_status === 'UNCOVERED').length} Area Bebas
          </span>
        </button>
      </div>

      {/* TAB 1: TARGET & PENCAPAIAN SALES */}
      {activeTab === 'sales_targets' && (
        <div className="space-y-6">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Target Penjualan</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Rp {totalTargetAll.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{targets.length} sales terdaftar</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realisasi Penjualan</p>
              <h3 className="text-xl font-black text-blue-600 mt-1">
                Rp {totalAchievedAll.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">{overallPctAll}% dari target total</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sisa Target Penjualan</p>
              <h3 className="text-xl font-black text-amber-600 mt-1">
                Rp {totalRemainingAll.toLocaleString('id-ID')}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Selisih menuju 100%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Kunjungan (Visit)</p>
              <h3 className="text-xl font-black text-purple-600 mt-1">
                6 Toko / Hari
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">156 visit/bulan (@ Rp 28.846)</p>
            </div>
          </div>

          {/* FILTER TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Bulan */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <Calendar size={16} className="text-slate-500" />
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Tahun */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <select
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              {/* Filter SPV */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">SPV:</span>
                <select
                  value={selectedSpvFilter}
                  onChange={(e) => setSelectedSpvFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua SPV / Tim</option>
                  {spvList.map(s => (
                    <option key={s.id} value={s.id}>
                      SPV {s.profiles?.full_name}
                    </option>
                  ))}
                  <option value="NONE">Tanpa SPV</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Sales atau Wilayah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* TABEL TARGET VS REALISASI PENJUALAN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Sales & Wilayah</th>
                    <th className="py-3.5 px-4">SPV Atasan</th>
                    <th className="py-3.5 px-4">Target Penjualan</th>
                    <th className="py-3.5 px-4">Realisasi Penjualan</th>
                    <th className="py-3.5 px-4">Sisa Target</th>
                    <th className="py-3.5 px-4">% Capai & Tier Insentif</th>
                    <th className="py-3.5 px-4">Target vs Realisasi Visit</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="animate-spin inline mr-2 text-blue-600" size={18} />
                        Memuat data target sales...
                      </td>
                    </tr>
                  ) : filteredTargets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Target size={40} className="mx-auto mb-2 text-slate-300" />
                        Belum ada target yang diatur untuk periode <span className="font-bold text-slate-600">{periodMonth} {periodYear}</span>.
                        <p className="text-xs text-slate-400 mt-1">
                          Klik tombol <b>"Tetapkan Target Bulanan"</b> di atas untuk membuat target baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTargets.map((t) => {
                      const sName = t.sales?.profiles?.full_name || 'Sales DAP';
                      const sRegion = t.sales?.regions?.name || 'Tanpa Wilayah';
                      const isSpv = Boolean(t.sales?.is_spv);
                      const spvName = t.sales?.spv?.profiles?.full_name || '-';

                      const remainingAmount = Math.max(0, t.target_amount - t.achieved_amount);
                      const tier = getIncentiveTier(t.sales_achievement_pct);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Sales & Wilayah */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              {sName}
                              {isSpv && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded">
                                  SPV
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} /> {sRegion}
                            </div>
                          </td>

                          {/* SPV Atasan */}
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {isSpv ? (
                              <span className="text-amber-700 font-bold">Koordinator Tim</span>
                            ) : (
                              spvName
                            )}
                          </td>

                          {/* Target Penjualan */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">
                              Rp {t.target_amount.toLocaleString('id-ID')}
                            </div>
                          </td>

                          {/* Realisasi Penjualan */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-blue-700 text-sm">
                              Rp {t.achieved_amount.toLocaleString('id-ID')}
                            </div>
                            {t.spv_direct_achieved_amount && t.spv_direct_achieved_amount > 0 ? (
                              <div className="text-[10px] font-semibold text-purple-600">
                                + Rp {t.spv_direct_achieved_amount.toLocaleString('id-ID')} (Direct SPV)
                              </div>
                            ) : null}
                          </td>

                          {/* Sisa Target */}
                          <td className="py-3.5 px-4">
                            <div className={`font-bold ${remainingAmount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {remainingAmount === 0 ? 'Tercapai Penuh!' : `Rp ${remainingAmount.toLocaleString('id-ID')}`}
                            </div>
                          </td>

                          {/* % Pencapaian & Tier Insentif */}
                          <td className="py-3.5 px-4 min-w-[160px]">
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className={`${t.sales_achievement_pct >= 90 ? 'text-blue-700' : 'text-slate-700'}`}>
                                {t.sales_achievement_pct}%
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tier.color}`}>
                                {tier.label}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${t.sales_achievement_pct >= 90 ? 'bg-blue-600' : t.sales_achievement_pct >= 70 ? 'bg-amber-500' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(100, t.sales_achievement_pct)}%` }}
                              />
                            </div>
                          </td>

                          {/* Target vs Realisasi Visit */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {t.achieved_visits} / {t.target_visits} visit ({t.visit_achievement_pct}%)
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Target harian: {t.daily_visit_target} toko/hari ({t.work_days} hari)
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors"
                                title="Edit Target"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTarget(t.id)}
                                className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg transition-colors"
                                title="Hapus Target"
                              >
                                <Trash2 size={14} />
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
        </div>
      )}

      {/* TAB 2: MONITORING & TARGET TIM SPV (POIN 21 & 23) */}
      {activeTab === 'spv_dashboard' && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-400 text-slate-900 text-xs font-black rounded-lg">
                  POIN 21 & 23
                </span>
                <h2 className="text-xl font-black">Pencapaian Akumulasi Tim & Penjualan Langsung SPV</h2>
              </div>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                Target SPV merupakan akumulasi target seluruh Sales di bawah tanggung jawabnya ditambah target penjualan langsung SPV di wilayah non-coverage.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/20">
                Periode: {periodMonth} {periodYear}
              </div>
            </div>
          </div>

          {/* DAFTAR SPV DENGAN AKUMULASI TIM */}
          {spvList.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
              <Users size={40} className="mx-auto mb-2 text-slate-300" />
              Belum ada personil Sales yang diset sebagai <b>Supervisor (SPV)</b>.
              <p className="text-xs text-slate-400 mt-1">
                Buka menu <b>Master Sales</b> untuk menetapkan personil sebagai SPV.
              </p>
            </div>
          ) : (
            spvList.map((spv) => {
              // Cari tim sales di bawah SPV ini
              const teamSales = salesList.filter(s => s.spv_id === spv.id);
              const teamTargets = targets.filter(t => t.spv_id === spv.id || teamSales.some(ts => ts.id === t.sales_id));
              
              // Target milik SPV sendiri
              const spvSelfTarget = targets.find(t => t.sales_id === spv.id);

              const teamTargetAmount = teamTargets.reduce((sum, t) => sum + Number(t.target_amount || 0), 0);
              const teamAchievedAmount = teamTargets.reduce((sum, t) => sum + Number(t.achieved_amount || 0), 0);
              const teamPct = teamTargetAmount > 0 ? ((teamAchievedAmount / teamTargetAmount) * 100).toFixed(1) : '0';

              const spvDirectSalesAchieved = Number(spvSelfTarget?.spv_direct_achieved_amount || 0);
              const spvDirectCommission = Math.round(spvDirectSalesAchieved * 0.01); // 1% komisi direct sales

              const totalSpvCombinedAchieved = teamAchievedAmount + spvDirectSalesAchieved;

              return (
                <div key={spv.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                  {/* Header SPV Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20">
                        SPV
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {spv.profiles?.full_name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Supervisor Wilayah {spv.regions?.name || 'Seluruh Area'} • {teamSales.length} Sales di Bawah Tanggung Jawab
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                        Komisi Penjualan Langsung: Rp {spvDirectCommission.toLocaleString('id-ID')} (1%)
                      </span>
                    </div>
                  </div>

                  {/* 3 KOTAK METRIK SPV (POIN 23: Sistem Memisahkan Target Tim, Penjualan Langsung, Total Pencapaian) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Kotak 1: Akumulasi Target Tim Sales */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        1. Akumulasi Target Tim Sales
                      </span>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        Rp {teamAchievedAmount.toLocaleString('id-ID')} / {teamTargetAmount.toLocaleString('id-ID')}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs font-bold">
                        <span className="text-blue-700">{teamPct}% Tercapai</span>
                        <span className="text-slate-400">{teamSales.length} Sales Aktif</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="h-full bg-blue-600" 
                          style={{ width: `${Math.min(100, Number(teamPct))}%` }}
                        />
                      </div>
                    </div>

                    {/* Kotak 2: Penjualan Langsung SPV (Area Uncovered) */}
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                        2. Penjualan Langsung SPV (Area Uncovered)
                      </span>
                      <div className="text-lg font-black text-purple-900 mt-1">
                        Rp {spvDirectSalesAchieved.toLocaleString('id-ID')}
                      </div>
                      <p className="text-xs text-purple-700 font-semibold mt-1">
                        Hak khusus SPV di luar coverage tim (1% komisi)
                      </p>
                    </div>

                    {/* Kotak 3: Total Pencapaian SPV */}
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                        3. Total Akumulasi Pencapaian SPV
                      </span>
                      <div className="text-lg font-black text-emerald-800 mt-1">
                        Rp {totalSpvCombinedAchieved.toLocaleString('id-ID')}
                      </div>
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        Gabungan Omzet Tim ({teamPct}%) + Direct Sales SPV
                      </p>
                    </div>
                  </div>

                  {/* TABEL SALES DI BAWAH SPV INI */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-700 mb-3 tracking-wider flex items-center gap-1.5">
                      <Users size={14} className="text-blue-600" />
                      Daftar Sales Tim Binaan ({teamSales.length} Personil)
                    </h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Nama Sales</th>
                            <th className="py-2.5 px-4">Wilayah Coverage</th>
                            <th className="py-2.5 px-4">Target Penjualan</th>
                            <th className="py-2.5 px-4">Realisasi Penjualan</th>
                            <th className="py-2.5 px-4">Sisa Target</th>
                            <th className="py-2.5 px-4">% Pencapaian</th>
                            <th className="py-2.5 px-4">Visit Toko</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teamSales.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-slate-400">
                                Belum ada Sales yang dialokasikan di bawah SPV ini.
                              </td>
                            </tr>
                          ) : (
                            teamSales.map((ts) => {
                              const targetItem = targets.find(t => t.sales_id === ts.id);
                              const tAmt = Number(targetItem?.target_amount || 0);
                              const aAmt = Number(targetItem?.achieved_amount || 0);
                              const remAmt = Math.max(0, tAmt - aAmt);
                              const pct = targetItem?.sales_achievement_pct || 0;

                              return (
                                <tr key={ts.id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-4 font-bold text-slate-900">{ts.profiles?.full_name}</td>
                                  <td className="py-2.5 px-4 text-slate-600">{ts.regions?.name || 'Tanpa Wilayah'}</td>
                                  <td className="py-2.5 px-4 font-semibold">Rp {tAmt.toLocaleString('id-ID')}</td>
                                  <td className="py-2.5 px-4 font-bold text-blue-700">Rp {aAmt.toLocaleString('id-ID')}</td>
                                  <td className="py-2.5 px-4 font-semibold text-amber-600">Rp {remAmt.toLocaleString('id-ID')}</td>
                                  <td className="py-2.5 px-4 font-bold">
                                    <span className={`${pct >= 90 ? 'text-blue-700' : 'text-slate-700'}`}>
                                      {pct}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-600">
                                    {targetItem ? `${targetItem.achieved_visits} / ${targetItem.target_visits} visit` : '-'}
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
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: COVERAGE WILAYAH & AREA NON-COVERAGE (POIN 23) */}
      {activeTab === 'coverage_management' && (
        <div className="space-y-6">
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">
                Aturan Penjualan Wilayah Non-Coverage (Poin 23)
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Wilayah dengan status <b>UNCOVERED</b> adalah wilayah yang belum memiliki Sales. SPV memiliki hak istimewa melakukan penjualan langsung di wilayah ini dan omzetnya dicatat eksklusif sebagai <b>Penjualan Langsung SPV</b> (berhak atas komisi 1% dan tidak masuk ke pencapaian Sales lain).
              </p>
            </div>
          </div>

          {/* TABEL COVERAGE WILAYAH */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Status Coverage Master Wilayah</h3>
              <span className="text-xs text-slate-400">Total {regions.length} Wilayah Terdaftar</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Kode & Nama Wilayah</th>
                    <th className="py-3.5 px-4">Manajer Regional</th>
                    <th className="py-3.5 px-4">Status Coverage</th>
                    <th className="py-3.5 px-4">Sales PIC yang Ditugaskan</th>
                    <th className="py-3.5 px-4">Hak Penjualan</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regions.map((r) => {
                    const isCovered = Boolean(r.assigned_sales_id);
                    const salesName = r.assigned_sales?.profiles?.full_name || 'Belum Ada Sales';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] font-bold text-slate-400 block">{r.code}</span>
                          <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {r.manager_name || '-'}
                        </td>

                        <td className="py-3.5 px-4">
                          {isCovered ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 size={12} /> COVERED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-extrabold rounded-full inline-flex items-center gap-1">
                              <AlertCircle size={12} /> UNCOVERED (BEBAS)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {isCovered ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Users size={12} /> {salesName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Kosong (Belum Di-assign)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {isCovered ? (
                            <span>Pencapaian Sales PIC ({salesName})</span>
                          ) : (
                            <span className="font-bold text-purple-700">Hak Penjualan Langsung SPV (1% Komisi)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenAssignCoverage(r)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            {isCovered ? 'Ubah Sales PIC' : 'Assign Sales PIC'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREATE / EDIT SALES TARGET */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Target size={18} className="text-blue-400" />
                  {editingTarget ? 'Edit Target Bulanan Sales' : 'Tetapkan Target Bulanan Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Periode: {periodMonth} {periodYear}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Personil Sales
                </label>
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  disabled={Boolean(editingTarget)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  {salesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.profiles?.full_name} ({s.regions?.name || 'Tanpa Wilayah'}{s.is_spv ? ' • SPV' : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Penjualan / Omzet (Rp)
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
                  placeholder="100000000"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Contoh: Rp 100.000.000 (Target omzet menjadi dasar perhitungan insentif).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Visit Harian (Toko)
                  </label>
                  <input
                    type="number"
                    value={targetDailyVisits}
                    onChange={(e) => setTargetDailyVisits(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                    placeholder="6"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Hari Kerja
                  </label>
                  <input
                    type="number"
                    value={targetWorkDays}
                    onChange={(e) => setTargetWorkDays(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                    placeholder="26"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <span className="font-bold block">Kalkulasi Visit Bulanan:</span>
                {Number(targetDailyVisits) || 6} toko/hari × {Number(targetWorkDays) || 26} hari = <b className="text-blue-900">{(Number(targetDailyVisits) || 6) * (Number(targetWorkDays) || 26)} visit</b>.
                <span className="block mt-1 text-[11px] text-blue-700">
                  Nilai per visit = Gaji Pokok ÷ Target Visit Bulanan (±Rp 28.846/visit).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Target (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                  rows={2}
                  placeholder="Target fokus produk aksesoris baru, prioritas toko bintang..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASSIGN COVERAGE REGION */}
      {assignModalOpen && selectedRegion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-400" />
                  Tetapkan Coverage Wilayah
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wilayah: {selectedRegion.name} ({selectedRegion.code})
                </p>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignCoverage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Sales Penanggung Jawab (PIC)
                </label>
                <select
                  value={assignSalesId}
                  onChange={(e) => setAssignSalesId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="">-- KOSONGKAN (Jadikan Wilayah Bebas / UNCOVERED) --</option>
                  {salesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.profiles?.full_name} ({s.regions?.name || 'Tanpa Wilayah'}{s.is_spv ? ' • SPV' : ''})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Jika dikosongkan, wilayah ini berstatus <b>UNCOVERED</b>. Penjualan di wilayah ini otomatis menjadi hak penjualan langsung SPV.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
                >
                  {savingAssign ? 'Menyimpan...' : 'Simpan Coverage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
