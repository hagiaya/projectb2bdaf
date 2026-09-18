'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Calendar, Award, Printer, CheckCircle, 
  Clock, AlertTriangle, FileText, Download, ChevronRight, 
  TrendingUp, Users, RefreshCw, Edit3, X, Check, Eye, Percent, 
  ShieldAlert, Sparkles, Building, Phone, MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesPayroll {
  id: string;
  payroll_number: string;
  sales_id: string;
  spv_id?: string | null;
  period_month: string;
  period_year: number;
  nominal_base_salary: number;
  daily_visit_target: number;
  work_days: number;
  target_visits: number;
  achieved_visits: number;
  visit_achievement_pct: number;
  value_per_visit: number;
  earned_visit_salary: number;
  target_sales_amount: number;
  achieved_sales_amount: number;
  sales_achievement_pct: number;
  incentive_percentage: number;
  earned_incentive_amount: number;
  spv_direct_sales_amount?: number;
  spv_direct_sales_commission?: number;
  team_bonus_amount?: number;
  other_bonus: number;
  bonus_notes?: string;
  deductions_amount: number;
  deduction_notes?: string;
  net_salary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  payment_date?: string;
  payment_method?: string;
  created_at: string;
  sales?: {
    id: string;
    profile_id: string;
    ktp_number?: string;
    is_spv?: boolean;
    base_salary?: number;
    profiles?: {
      full_name: string;
      phone_number: string;
    };
    regions?: {
      name: string;
    };
    spv?: {
      profiles?: {
        full_name: string;
      };
    };
  };
}

interface SalesPerson {
  id: string;
  profile_id: string;
  ktp_number?: string;
  is_spv?: boolean;
  spv_id?: string;
  base_salary?: number;
  daily_visit_target?: number;
  work_days_per_month?: number;
  direct_commission_pct?: number;
  profiles?: {
    full_name: string;
    phone_number: string;
  };
  regions?: {
    name: string;
  };
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<SalesPayroll[]>([]);
  const [salesList, setSalesList] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Detail / Slip Gaji
  const [selectedSlip, setSelectedSlip] = useState<SalesPayroll | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Modal Edit Bonus & Potongan
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<SalesPayroll | null>(null);
  const [editBonus, setEditBonus] = useState('0');
  const [editBonusNotes, setEditBonusNotes] = useState('');
  const [editDeductions, setEditDeductions] = useState('0');
  const [editDeductionNotes, setEditDeductionNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'APPROVED' | 'PAID'>('DRAFT');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sales List
      const { data: sData } = await supabase
        .from('sales')
        .select(`
          id,
          profile_id,
          ktp_number,
          is_spv,
          spv_id,
          base_salary,
          daily_visit_target,
          work_days_per_month,
          direct_commission_pct,
          profiles (full_name, phone_number),
          regions (name)
        `)
        .eq('status', 'ACTIVE');

      if (sData) setSalesList(sData as any);

      // 2. Fetch Payrolls for current month & year
      const { data: pData, error: pError } = await supabase
        .from('sales_payrolls')
        .select(`
          *,
          sales:sales_id (
            id,
            profile_id,
            ktp_number,
            is_spv,
            base_salary,
            profiles (full_name, phone_number),
            regions (name),
            spv:spv_id (
              profiles (full_name)
            )
          )
        `)
        .eq('period_month', selectedMonth)
        .eq('period_year', selectedYear)
        .order('created_at', { ascending: false });

      if (pError) {
        console.warn('Error fetching payrolls (table might be empty or newly created):', pError);
      } else if (pData) {
        setPayrolls(pData as any);
      }
    } catch (err) {
      console.error('Fetch payroll data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi Otomatis Berdasarkan Aturan Bisnis Resmi DAP
  const handleAutoGeneratePayroll = async () => {
    if (salesList.length === 0) {
      alert('Tidak ada personil Sales aktif yang terdaftar.');
      return;
    }

    const confirmMsg = `Hitung dan perbarui gaji seluruh Sales aktif untuk periode ${selectedMonth} ${selectedYear}?\nSistem akan mengambil data kunjungan (visit) dan realisasi omzet aktual.`;
    if (!confirm(confirmMsg)) return;

    setIsCalculating(true);
    try {
      // Dapatkan range tanggal untuk bulan & tahun terpilih
      const monthIndex = MONTHS.indexOf(selectedMonth);
      const startDate = new Date(selectedYear, monthIndex, 1).toISOString();
      const endDate = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59).toISOString();

      // Loop setiap sales
      for (const s of salesList) {
        // 1. Ambil target penjualan dan target visit dari sales_targets jika ada
        const { data: targetRow } = await supabase
          .from('sales_targets')
          .select('*')
          .eq('sales_id', s.id)
          .in('period_month', [selectedMonth, selectedMonth.slice(0, 3)])
          .eq('period_year', selectedYear)
          .maybeSingle();

        const baseSalary = Number(s.base_salary || 4500000);
        const dailyVisitTarget = Number(targetRow?.daily_visit_target || s.daily_visit_target || 6);
        const workDays = Number(targetRow?.work_days || s.work_days_per_month || 26);
        const targetVisits = Number(targetRow?.target_visits || (dailyVisitTarget * workDays));
        const targetSalesAmount = Number(targetRow?.target_amount || 100000000);

        // 2. Hitung realisasi check-in visit (status = COMPLETED) pada periode ini
        const { count: actualVisits } = await supabase
          .from('sales_visits')
          .select('id', { count: 'exact', head: true })
          .eq('sales_id', s.id)
          .eq('status', 'COMPLETED')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const achievedVisits = targetRow?.achieved_visits && targetRow.achieved_visits > 0 
          ? targetRow.achieved_visits 
          : (actualVisits || 0);

        // 3. Hitung realisasi omzet pesanan (status != CANCELLED)
        // Order dari dealer yang dibina oleh sales ini ATAU yang tercatat sales_id = s.id
        const { data: salesOrders } = await supabase
          .from('orders')
          .select('id, total_amount, discount_amount, final_amount, status, is_spv_direct_sale')
          .or(`sales_id.eq.${s.id},dealer_id.in.(select id from dealers where sales_id = '${s.id}')`)
          .neq('status', 'CANCELLED')
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        let achievedSalesAmount = 0;
        let spvDirectSalesAmount = 0;

        (salesOrders || []).forEach((ord: any) => {
          const val = Number(ord.final_amount || ord.total_amount || 0);
          if (ord.is_spv_direct_sale && s.is_spv) {
            spvDirectSalesAmount += val;
          } else {
            achievedSalesAmount += val;
          }
        });

        if (targetRow?.achieved_amount && targetRow.achieved_amount > 0 && achievedSalesAmount === 0) {
          achievedSalesAmount = Number(targetRow.achieved_amount);
        }

        // 4. Hitung Komponen Gaji Berdasarkan Formula Resmi:
        // A. Nilai per visit = Gaji Pokok ÷ Target Visit Bulanan
        const valuePerVisit = targetVisits > 0 ? baseSalary / targetVisits : 0;
        const visitAchievementPct = targetVisits > 0 ? (achievedVisits / targetVisits) * 100 : 0;
        // Gaji Pokok visit dihitung proporsional terhadap realisasi visit
        const earnedVisitSalary = Math.round(achievedVisits * valuePerVisit);

        // B. Insentif Penjualan Omzet
        const salesAchievementPct = targetSalesAmount > 0 ? (achievedSalesAmount / targetSalesAmount) * 100 : 0;
        let incentivePercentage = 0;
        if (salesAchievementPct >= 90) {
          incentivePercentage = 1.0; // 1%
        } else if (salesAchievementPct >= 80) {
          incentivePercentage = 0.75; // 0.75%
        } else if (salesAchievementPct >= 70) {
          incentivePercentage = 0.25; // 0.25%
        } else {
          incentivePercentage = 0.0; // 0%
        }

        const earnedIncentiveAmount = Math.round(achievedSalesAmount * (incentivePercentage / 100));

        // C. Penjualan Langsung SPV (1% komisi dari direct sales non-coverage)
        const directCommissionPct = Number(s.direct_commission_pct || 1.0);
        const spvDirectSalesCommission = s.is_spv 
          ? Math.round(spvDirectSalesAmount * (directCommissionPct / 100)) 
          : 0;

        // D. Cek apakah sudah ada record payroll tersimpan sebelumnya untuk menjaga bonus & potongan manual
        const { data: existingPayroll } = await supabase
          .from('sales_payrolls')
          .select('*')
          .eq('sales_id', s.id)
          .eq('period_month', selectedMonth)
          .eq('period_year', selectedYear)
          .maybeSingle();

        const currentOtherBonus = Number(existingPayroll?.other_bonus || 0);
        const currentBonusNotes = existingPayroll?.bonus_notes || '';
        const currentDeductions = Number(existingPayroll?.deductions_amount || 0);
        const currentDeductionNotes = existingPayroll?.deduction_notes || '';
        const currentStatus = existingPayroll?.status || 'DRAFT';

        // E. Total Gaji Bersih = Gaji Visit + Insentif Omzet + Komisi Direct SPV + Bonus Lainnya - Potongan
        const netSalary = Math.max(
          0,
          earnedVisitSalary + earnedIncentiveAmount + spvDirectSalesCommission + currentOtherBonus - currentDeductions
        );

        const payrollNumber = existingPayroll?.payroll_number || `SLIP/DAP/${selectedYear}${String(monthIndex + 1).padStart(2, '0')}/${s.id.slice(0, 4).toUpperCase()}`;

        const payrollPayload = {
          payroll_number: payrollNumber,
          sales_id: s.id,
          spv_id: s.spv_id || null,
          period_month: selectedMonth,
          period_year: selectedYear,
          nominal_base_salary: baseSalary,
          daily_visit_target: dailyVisitTarget,
          work_days: workDays,
          target_visits: targetVisits,
          achieved_visits: achievedVisits,
          visit_achievement_pct: Number(visitAchievementPct.toFixed(2)),
          value_per_visit: Math.round(valuePerVisit),
          earned_visit_salary: earnedVisitSalary,
          target_sales_amount: targetSalesAmount,
          achieved_sales_amount: achievedSalesAmount,
          sales_achievement_pct: Number(salesAchievementPct.toFixed(2)),
          incentive_percentage: incentivePercentage,
          earned_incentive_amount: earnedIncentiveAmount,
          spv_direct_sales_amount: spvDirectSalesAmount,
          spv_direct_sales_commission: spvDirectSalesCommission,
          other_bonus: currentOtherBonus,
          bonus_notes: currentBonusNotes,
          deductions_amount: currentDeductions,
          deduction_notes: currentDeductionNotes,
          net_salary: netSalary,
          status: currentStatus,
          updated_at: new Date().toISOString(),
        };

        if (existingPayroll) {
          await supabase
            .from('sales_payrolls')
            .update(payrollPayload)
            .eq('id', existingPayroll.id);
        } else {
          await supabase
            .from('sales_payrolls')
            .insert([payrollPayload]);
        }
      }

      alert('Berhasil mengkalkulasi dan memperbarui penggajian Sales periode ini!');
      fetchData();
    } catch (err: any) {
      console.error('Auto generate payroll error:', err);
      alert('Gagal mengkalkulasi payroll: ' + (err.message || err));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleOpenEdit = (p: SalesPayroll) => {
    setEditingPayroll(p);
    setEditBonus(String(p.other_bonus || 0));
    setEditBonusNotes(p.bonus_notes || '');
    setEditDeductions(String(p.deductions_amount || 0));
    setEditDeductionNotes(p.deduction_notes || '');
    setEditStatus(p.status || 'DRAFT');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

    setSavingEdit(true);
    try {
      const bonusNum = Number(editBonus) || 0;
      const deductNum = Number(editDeductions) || 0;
      const baseEarned = Number(editingPayroll.earned_visit_salary || 0);
      const incEarned = Number(editingPayroll.earned_incentive_amount || 0);
      const spvDirect = Number(editingPayroll.spv_direct_sales_commission || 0);

      const newNet = Math.max(0, baseEarned + incEarned + spvDirect + bonusNum - deductNum);

      const { error } = await supabase
        .from('sales_payrolls')
        .update({
          other_bonus: bonusNum,
          bonus_notes: editBonusNotes,
          deductions_amount: deductNum,
          deduction_notes: editDeductionNotes,
          net_salary: newNet,
          status: editStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPayroll.id);

      if (error) throw error;

      setEditModalOpen(false);
      setEditingPayroll(null);
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenSlip = (p: SalesPayroll) => {
    setSelectedSlip(p);
    setSlipModalOpen(true);
  };

  // Quick Status Update
  const handleQuickStatusChange = async (p: SalesPayroll, newStatus: 'DRAFT' | 'APPROVED' | 'PAID') => {
    try {
      const { error } = await supabase
        .from('sales_payrolls')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', p.id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Filtered List
  const filteredPayrolls = payrolls.filter((p) => {
    const sName = p.sales?.profiles?.full_name?.toLowerCase() || '';
    const sPhone = p.sales?.profiles?.phone_number?.toLowerCase() || '';
    const sRegion = p.sales?.regions?.name?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    const matchesSearch = sName.includes(q) || sPhone.includes(q) || sRegion.includes(q) || p.payroll_number.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Aggregate Stats
  const totalNetPaid = payrolls.reduce((acc, p) => acc + (p.net_salary || 0), 0);
  const totalIncentivePaid = payrolls.reduce((acc, p) => acc + (p.earned_incentive_amount || 0), 0);
  const avgVisitAchievement = payrolls.length > 0 
    ? (payrolls.reduce((acc, p) => acc + (p.visit_achievement_pct || 0), 0) / payrolls.length).toFixed(1)
    : '0';

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <DollarSign size={24} />
              </span>
              Penggajian Sales & Slip Gaji
            </h1>
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded-full shadow-sm">
              SISTEM RESMI DAP
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Perhitungan gaji berbasis target visit harian & insentif omzet penjualan terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoGeneratePayroll}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isCalculating ? 'animate-spin' : ''} />
            {isCalculating ? 'Menghitung Gaji...' : '⚡ Hitung Otomatis (Generate Payroll)'}
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gaji Dibayarkan</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Rp {totalNetPaid.toLocaleString('id-ID')}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <CheckCircle size={12} /> {payrolls.length} personil terhitung
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Insentif Omzet</p>
            <h3 className="text-xl font-black text-blue-600 mt-1">
              Rp {totalIncentivePaid.toLocaleString('id-ID')}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Skema 0.25% - 1.00% omzet
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Visit</p>
            <h3 className="text-xl font-black text-purple-600 mt-1">
              {avgVisitAchievement}%
            </h3>
            <span className="text-[11px] font-semibold text-purple-700 mt-0.5">
              Target 6 visit/hari (26 hari)
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Periode Aktif</p>
            <h3 className="text-xl font-black text-amber-600 mt-1">
              {selectedMonth} {selectedYear}
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Standar Gaji Rp 4.500.000
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* FILTER & PERIODE TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Period Month */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar size={16} className="text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Period Year */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED (Disetujui)</option>
              <option value="PAID">PAID (Lunas)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Sales, NIK, atau Wilayah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* TABEL DATA PENGGAJIAN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Slip & Sales</th>
                <th className="py-3.5 px-4">Wilayah & SPV</th>
                <th className="py-3.5 px-4">Target vs Visit (Gaji Pokok)</th>
                <th className="py-3.5 px-4">Omzet vs Insentif (Sales)</th>
                <th className="py-3.5 px-4">Bonus / Potongan</th>
                <th className="py-3.5 px-4">Total Gaji Bersih</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi & Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="animate-spin inline mr-2 text-emerald-600" size={18} />
                    Memuat data penggajian...
                  </td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <DollarSign size={40} className="mx-auto mb-2 text-slate-300" />
                    Belum ada data penggajian untuk periode <span className="font-bold text-slate-600">{selectedMonth} {selectedYear}</span>.
                    <p className="text-xs text-slate-400 mt-1">
                      Klik tombol <b>"⚡ Hitung Otomatis (Generate Payroll)"</b> di atas untuk menghasilkan kalkulasi otomatis.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => {
                  const sName = p.sales?.profiles?.full_name || 'Sales DAP';
                  const sPhone = p.sales?.profiles?.phone_number || '-';
                  const sRegion = p.sales?.regions?.name || 'Tanpa Wilayah';
                  const isSpv = Boolean(p.sales?.is_spv);
                  const spvName = p.sales?.spv?.profiles?.full_name || '-';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* No Slip & Sales */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-slate-500">
                          {p.payroll_number}
                        </div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                          {sName}
                          {isSpv && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded">
                              SPV
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{sPhone}</div>
                      </td>

                      {/* Wilayah & SPV */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {sRegion}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          SPV: <span className="text-slate-600 font-medium">{isSpv ? 'Koordinator' : spvName}</span>
                        </div>
                      </td>

                      {/* Target vs Visit (Gaji Pokok) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between font-semibold text-slate-700">
                          <span>{p.achieved_visits} / {p.target_visits} visit</span>
                          <span className={`font-bold ${p.visit_achievement_pct >= 100 ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {p.visit_achievement_pct}%
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-1">
                          <div 
                            className={`h-full ${p.visit_achievement_pct >= 100 ? 'bg-emerald-500' : p.visit_achievement_pct >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, p.visit_achievement_pct)}%` }}
                          />
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700">
                          Rp {p.earned_visit_salary.toLocaleString('id-ID')}
                          <span className="text-[10px] text-slate-400 font-normal"> (@ Rp {p.value_per_visit.toLocaleString('id-ID')})</span>
                        </div>
                      </td>

                      {/* Omzet vs Insentif */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between font-semibold text-slate-700">
                          <span>Rp {(p.achieved_sales_amount / 1000000).toFixed(1)}jt / {(p.target_sales_amount / 1000000).toFixed(0)}jt</span>
                          <span className="font-bold text-blue-600">{p.sales_achievement_pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-1">
                          <div 
                            className={`h-full ${p.sales_achievement_pct >= 90 ? 'bg-blue-600' : p.sales_achievement_pct >= 70 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${Math.min(100, p.sales_achievement_pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-blue-700">
                            + Rp {p.earned_incentive_amount.toLocaleString('id-ID')}
                          </span>
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                            {p.incentive_percentage}% omzet
                          </span>
                        </div>
                        {isSpv && (p.spv_direct_sales_commission || 0) > 0 && (
                          <div className="text-[10px] font-semibold text-purple-700 mt-0.5">
                            + Rp {(p.spv_direct_sales_commission || 0).toLocaleString('id-ID')} (SPV Direct 1%)
                          </div>
                        )}
                      </td>

                      {/* Bonus / Potongan */}
                      <td className="py-3.5 px-4">
                        {p.other_bonus > 0 && (
                          <div className="text-emerald-600 font-semibold">
                            + Rp {p.other_bonus.toLocaleString('id-ID')}
                            {p.bonus_notes && <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{p.bonus_notes}</span>}
                          </div>
                        )}
                        {p.deductions_amount > 0 && (
                          <div className="text-red-600 font-semibold">
                            - Rp {p.deductions_amount.toLocaleString('id-ID')}
                            {p.deduction_notes && <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{p.deduction_notes}</span>}
                          </div>
                        )}
                        {p.other_bonus === 0 && p.deductions_amount === 0 && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Total Gaji Bersih */}
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black text-slate-900">
                          Rp {p.net_salary.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600">Take Home Pay</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full text-center w-fit ${
                            p.status === 'PAID' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : p.status === 'APPROVED' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>

                          <div className="flex items-center gap-1">
                            {p.status === 'DRAFT' && (
                              <button
                                onClick={() => handleQuickStatusChange(p, 'APPROVED')}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                Setujui
                              </button>
                            )}
                            {p.status === 'APPROVED' && (
                              <button
                                onClick={() => handleQuickStatusChange(p, 'PAID')}
                                className="text-[10px] font-bold text-emerald-600 hover:underline"
                              >
                                Bayarkan
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenSlip(p)}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors title='Lihat Slip Gaji'"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg transition-colors title='Edit Komponen'"
                          >
                            <Edit3 size={15} />
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

      {/* MODAL EDIT BONUS & POTONGAN */}
      {editModalOpen && editingPayroll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Edit3 size={18} className="text-emerald-400" />
                  Sesuaikan Komponen Gaji
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingPayroll.sales?.profiles?.full_name} • {editingPayroll.period_month} {editingPayroll.period_year}
                </p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Gaji Pokok Visit:</span>
                  <span className="font-bold text-slate-800">Rp {editingPayroll.earned_visit_salary.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Insentif Omzet:</span>
                  <span className="font-bold text-blue-700">Rp {editingPayroll.earned_incentive_amount.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Bersih:</span>
                  <span className="font-extrabold text-emerald-700">Rp {editingPayroll.net_salary.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Bonus Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bonus / Komisi Tambahan (Rp)
                </label>
                <input
                  type="number"
                  value={editBonus}
                  onChange={(e) => setEditBonus(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Bonus
                </label>
                <input
                  type="text"
                  value={editBonusNotes}
                  onChange={(e) => setEditBonusNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Misal: Bonus loyalitas, THR, atau reward pencapaian..."
                />
              </div>

              {/* Potongan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Potongan (Rp)
                </label>
                <input
                  type="number"
                  value={editDeductions}
                  onChange={(e) => setEditDeductions(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Potongan
                </label>
                <input
                  type="text"
                  value={editDeductionNotes}
                  onChange={(e) => setEditDeductionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="Misal: Cicilan kasbon, potongan denda keterlambatan..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Penggajian
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="APPROVED">APPROVED (Disetujui)</option>
                  <option value="PAID">PAID (Telah Ditransfer/Lunas)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SLIP GAJI DIGITAL RESMI DAP */}
      {slipModalOpen && selectedSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-h-full print:rounded-none">
            {/* Modal Header (Hidden on Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                <span className="text-sm font-bold">Pratinjau Slip Gaji Digital Sales DAP</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Printer size={14} /> Cetak Slip (PDF)
                </button>
                <button onClick={() => setSlipModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP GAJI BODY */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 print:p-6 print:overflow-visible print:text-black">
              {/* Kop Surat Resmi */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl">
                    DAP
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                      PT DISTRIBUSI AKSESORIS PRIMA
                    </h2>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Distributor Resmi Aksesoris Smartphone & Gadget Indonesia
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Office: Jl. Raya B2B DAP Trade Center • Email: finance@dapdistribusi.co.id
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-xs font-bold text-slate-800 inline-block">
                    {selectedSlip.payroll_number}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">
                    SLIP GAJI RESMI
                  </p>
                </div>
              </div>

              {/* Data Karyawan & Periode */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Nama Sales</span>
                    <span className="col-span-2 font-bold text-slate-900">
                      : {selectedSlip.sales?.profiles?.full_name || 'Sales DAP'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <span className="text-slate-500">Jabatan</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      : {selectedSlip.sales?.is_spv ? 'Supervisor Sales (SPV)' : 'Sales Representative'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <span className="text-slate-500">No. HP / Kontak</span>
                    <span className="col-span-2 font-medium text-slate-700">
                      : {selectedSlip.sales?.profiles?.phone_number || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-slate-500">Periode</span>
                    <span className="col-span-2 font-bold text-emerald-700">
                      : {selectedSlip.period_month} {selectedSlip.period_year}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <span className="text-slate-500">Wilayah Coverage</span>
                    <span className="col-span-2 font-semibold text-slate-800">
                      : {selectedSlip.sales?.regions?.name || 'Seluruh Wilayah'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <span className="text-slate-500">Status Bayar</span>
                    <span className="col-span-2 font-bold text-slate-900">
                      : <span className="underline">{selectedSlip.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* TABEL RINCIAN KOMPONEN PENERIMAAN */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-700 mb-2 tracking-wider flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" />
                  Rincian Penerimaan (Earnings)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Komponen Gaji</th>
                        <th className="py-2.5 px-3 text-center">Target</th>
                        <th className="py-2.5 px-3 text-center">Realisasi</th>
                        <th className="py-2.5 px-3 text-center">% Capai</th>
                        <th className="py-2.5 px-3 text-right">Jumlah (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* 1. Gaji Pokok Berdasarkan Visit */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">
                          Gaji Pokok Kunjungan (Visit Toko)
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Target harian: {selectedSlip.daily_visit_target} visit × {selectedSlip.work_days} hari kerja (@ Rp {selectedSlip.value_per_visit.toLocaleString('id-ID')})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">{selectedSlip.target_visits} visit</td>
                        <td className="py-2.5 px-3 text-center font-bold">{selectedSlip.achieved_visits} visit</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{selectedSlip.visit_achievement_pct}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          Rp {selectedSlip.earned_visit_salary.toLocaleString('id-ID')}
                        </td>
                      </tr>

                      {/* 2. Insentif Penjualan Omzet */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold">
                          Insentif Target Omzet Penjualan
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Skema tier: {selectedSlip.incentive_percentage}% dari total omzet realisasi
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">Rp {selectedSlip.target_sales_amount.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-center font-bold">Rp {selectedSlip.achieved_sales_amount.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">{selectedSlip.sales_achievement_pct}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          Rp {selectedSlip.earned_incentive_amount.toLocaleString('id-ID')}
                        </td>
                      </tr>

                      {/* 3. Khusus SPV Direct Sales Non-Coverage */}
                      {Boolean(selectedSlip.sales?.is_spv) && (
                        <tr>
                          <td className="py-2.5 px-3 font-semibold">
                            Komisi Penjualan Langsung SPV (Area Uncovered)
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Omzet langsung: Rp {(selectedSlip.spv_direct_sales_amount || 0).toLocaleString('id-ID')} (1% komisi)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">-</td>
                          <td className="py-2.5 px-3 text-center font-bold">Rp {(selectedSlip.spv_direct_sales_amount || 0).toLocaleString('id-ID')}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-purple-700">1.0%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                            Rp {(selectedSlip.spv_direct_sales_commission || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )}

                      {/* 4. Bonus Tambahan */}
                      {selectedSlip.other_bonus > 0 && (
                        <tr>
                          <td className="py-2.5 px-3 font-semibold" colSpan={4}>
                            Bonus Tambahan / Reward
                            {selectedSlip.bonus_notes && (
                              <span className="block text-[10px] text-slate-400 font-normal">{selectedSlip.bonus_notes}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            Rp {selectedSlip.other_bonus.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABEL POTONGAN (JIKA ADA) */}
              {selectedSlip.deductions_amount > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase text-red-600 mb-2 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Rincian Potongan (Deductions)
                  </h4>
                  <div className="border border-red-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-red-50 text-red-700 font-bold border-b border-red-200">
                        <tr>
                          <th className="py-2 px-3 text-left">Deskripsi Potongan</th>
                          <th className="py-2 px-3 text-right">Jumlah (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {selectedSlip.deduction_notes || 'Potongan keterlambatan / kasbon'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-red-600">
                            - Rp {selectedSlip.deductions_amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOTAL DITERIMA BOX */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total Gaji Diterima (Take Home Pay)
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Ditransfer via Rekening Bank Resmi Karyawan
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-2xl font-black text-emerald-700">
                    Rp {selectedSlip.net_salary.toLocaleString('id-ID')}
                  </h3>
                </div>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-14">Diterima oleh Karyawan,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[160px]">
                    {selectedSlip.sales?.profiles?.full_name || 'Sales DAP'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-14">Finance & HRD PT DAP,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[160px]">
                    Finance Payroll Manager
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
