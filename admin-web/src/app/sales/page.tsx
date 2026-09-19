'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Store, 
  Shield, 
  Phone, 
  Edit2, 
  Check, 
  X, 
  Award, 
  Briefcase, 
  DollarSign,
  TrendingUp,
  Percent,
  Truck,
  UserCheck,
  UserPlus,
  Mail,
  Lock,
  Copy,
  FileCode
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesRep {
  id: string;
  profile_id: string;
  ktp_number?: string;
  region_id?: string;
  balance: number;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  is_spv?: boolean;
  spv_id?: string | null;
  base_salary?: number;
  direct_commission_pct?: number;
  team_bonus_pct?: number;
  transport_allowance?: number;
  daily_visit_target?: number;
  work_days_per_month?: number;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    phone_number: string;
    role: string;
    approval_status?: string;
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
  assignedDealersCount?: number;
}

interface Region {
  id: string;
  name: string;
}

interface Dealer {
  id: string;
  store_name: string;
  address: string;
  sales_id?: string | null;
}

export default function SalesPage() {
  const [salesList, setSalesList] = useState<SalesRep[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALES' | 'SPV'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');

  // Modal: Manage Assigned Dealers
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [activeSalesForDealers, setActiveSalesForDealers] = useState<SalesRep | null>(null);
  const [savingDealers, setSavingDealers] = useState(false);

  // Modal: Change Region
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [activeSalesForRegion, setActiveSalesForRegion] = useState<SalesRep | null>(null);
  const [selectedNewRegion, setSelectedNewRegion] = useState('');

  // Modal: Add/Assign New Sales or SPV
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'NEW_ACCOUNT' | 'EXISTING_USER'>('NEW_ACCOUNT');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('sales123');
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [newAccountType, setNewAccountType] = useState<'SALES' | 'SPV'>('SALES');
  const [newSalesRegion, setNewSalesRegion] = useState('');
  const [newSpvParent, setNewSpvParent] = useState('');
  const [newBaseSalary, setNewBaseSalary] = useState('4500000');
  const [newDirectCommission, setNewDirectCommission] = useState('1.00');
  const [newTeamBonus, setNewTeamBonus] = useState('0.25');
  const [newTransportAllowance, setNewTransportAllowance] = useState('500000');
  const [newDailyVisits, setNewDailyVisits] = useState('6');
  const [newWorkDays, setNewWorkDays] = useState('26');
  const [savingNewSales, setSavingNewSales] = useState(false);

  // Modal: Atur Jabatan & Standar Kompensasi
  const [spvModalOpen, setSpvModalOpen] = useState(false);
  const [activeSalesForSpv, setActiveSalesForSpv] = useState<SalesRep | null>(null);
  const [isSpvToggle, setIsSpvToggle] = useState(false);
  const [selectedSpvParent, setSelectedSpvParent] = useState('');
  const [baseSalaryInput, setBaseSalaryInput] = useState('4500000');
  const [directCommissionInput, setDirectCommissionInput] = useState('1.00');
  const [teamBonusInput, setTeamBonusInput] = useState('0.25');
  const [transportAllowanceInput, setTransportAllowanceInput] = useState('500000');
  const [dailyVisitsInput, setDailyVisitsInput] = useState('6');
  const [workDaysInput, setWorkDaysInput] = useState('26');
  const [savingSpv, setSavingSpv] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Regions
      const { data: regData } = await supabase.from('regions').select('id, name').order('name');
      if (regData) setRegions(regData);

      // 2. Fetch Dealers (including profile_id to exclude dealers from candidate list)
      const { data: dData } = await supabase.from('dealers').select('id, store_name, address, sales_id, profile_id').order('store_name');
      const dealersList = dData || [];
      setAllDealers(dealersList);

      // 3. Fetch Sales records with profiles and regions (explicit FK to avoid PGRST201)
      let sData: any = null;
      const { data: fullSalesData, error: sError } = await supabase
        .from('sales')
        .select(`
          id,
          profile_id,
          ktp_number,
          region_id,
          balance,
          status,
          is_spv,
          spv_id,
          base_salary,
          daily_visit_target,
          work_days_per_month,
          direct_commission_pct,
          team_bonus_pct,
          created_at,
          profiles (id, full_name, phone_number, role, approval_status),
          regions:regions!sales_region_id_fkey (id, name),
          spv:spv_id (
            profiles (full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (sError) {
        console.error('Fetch sales error with spv:', sError);
        // Fallback in case newly added columns aren't migrated yet in supabase
        const { data: fallbackData } = await supabase
          .from('sales')
          .select(`
            id,
            profile_id,
            ktp_number,
            region_id,
            balance,
            status,
            created_at,
            profiles (id, full_name, phone_number, role, approval_status),
            regions:regions!sales_region_id_fkey (id, name)
          `)
          .order('created_at', { ascending: false });
        sData = fallbackData;
      } else {
        sData = fullSalesData;
      }

      // Check for profiles with role 'SALES' or 'SPV' that don't have a sales row yet
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role, approval_status')
        .in('role', ['SALES', 'SPV']);

      // Deduplicate sales records by profile_id so each person has exactly 1 primary record
      const uniqueSalesMap = new Map<string, any>();
      (sData || []).forEach((s: any) => {
        if (!s.profile_id) return;
        const existing = uniqueSalesMap.get(s.profile_id);
        if (!existing) {
          uniqueSalesMap.set(s.profile_id, s);
        } else {
          // Prioritize ACTIVE record, or one with region, or higher balance
          if (s.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
            uniqueSalesMap.set(s.profile_id, s);
          } else if (s.status === existing.status && (s.region_id || s.balance > existing.balance)) {
            uniqueSalesMap.set(s.profile_id, s);
          }
        }
      });

      const unlinkedProfiles = (pData || []).filter((p) => !uniqueSalesMap.has(p.id));

      if (unlinkedProfiles.length > 0) {
        // Auto-heal: create corresponding sales record for any profile with role SALES or SPV
        const rowsToInsert = unlinkedProfiles.map((up) => ({
          profile_id: up.id,
          status: up.approval_status === 'APPROVED' ? 'ACTIVE' : 'PENDING',
          is_spv: up.role === 'SPV',
          base_salary: up.role === 'SPV' ? 0 : 4500000,
          direct_commission_pct: 1.0,
          team_bonus_pct: 0.25,
          balance: 0,
        }));
        await supabase.from('sales').insert(rowsToInsert);

        // Re-fetch sales
        const { data: refetchedSales } = await supabase
          .from('sales')
          .select(`
            id,
            profile_id,
            region_id,
            balance,
            status,
            created_at,
            is_spv,
            spv_id,
            base_salary,
            daily_visit_target,
            work_days_per_month,
            direct_commission_pct,
            team_bonus_pct,
            profiles (id, full_name, phone_number, role, approval_status),
            regions:regions!sales_region_id_fkey (id, name),
            spv:spv_id (
              profiles (full_name)
            )
          `)
          .order('created_at', { ascending: false });

        if (refetchedSales && refetchedSales.length > 0) {
          refetchedSales.forEach((s: any) => {
            if (!s.profile_id) return;
            const existing = uniqueSalesMap.get(s.profile_id);
            if (!existing || (s.status === 'ACTIVE' && existing.status !== 'ACTIVE')) {
              uniqueSalesMap.set(s.profile_id, s);
            }
          });
        }
      }

      const uniqueSalesList = Array.from(uniqueSalesMap.values());

      // Calculate assigned dealers count
      const enrichedSales: SalesRep[] = uniqueSalesList.map((s: any) => {
        const count = dealersList.filter((d) => d.sales_id === s.id).length;
        return {
          ...s,
          assignedDealersCount: count,
        };
      });

      setSalesList(enrichedSales);

      // Available profiles that are not yet SALES or SPV, strictly EXCLUDING DEALERS and ADMINS
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role')
        .order('full_name');

      const dealerProfIds = new Set(dealersList.map((d: any) => d.profile_id).filter(Boolean));
      const assignedProfIds = new Set(enrichedSales.map((s) => s.profile_id));
      const candidateProfiles = (allProfiles || []).filter((p) => {
        // Exclude profiles that are already assigned as Sales / SPV
        if (assignedProfIds.has(p.id)) return false;
        // Exclude Admins
        if (p.role === 'ADMIN') return false;
        // Exclude Dealers (by profile role)
        if (p.role === 'DEALER') return false;
        // Exclude Dealers (by linked record in dealers table)
        if (dealerProfIds.has(p.id)) return false;
        return true;
      });
      setAvailableProfiles(candidateProfiles);
    } catch (err) {
      console.error('Fetch error in sales page:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to ensure a real sales table UUID exists before updating
  const ensureRealSalesId = async (sales: SalesRep): Promise<string> => {
    if (sales.id && !sales.id.startsWith('unlinked-')) {
      return sales.id;
    }
    const profileId = sales.profile_id || sales.id.replace('unlinked-', '');

    const { data: existing } = await supabase
      .from('sales')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existing?.id) {
      sales.id = existing.id;
      return existing.id;
    }

    const { data: created, error: insErr } = await supabase
      .from('sales')
      .insert({
        profile_id: profileId,
        status: sales.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
        is_spv: sales.is_spv || false,
        balance: 0,
      })
      .select('id')
      .single();

    if (insErr) throw insErr;
    sales.id = created.id;
    return created.id;
  };

  const handleApprove = async (sales: SalesRep) => {
    const roleName = sales.is_spv ? 'SPV' : 'Sales';
    if (!confirm(`Setujui akun ${roleName} "${sales.profiles?.full_name}"?`)) return;

    try {
      // Optimistic update so UI responds immediately
      setSalesList((prev) =>
        prev.map((s) =>
          s.id === sales.id || s.profile_id === sales.profile_id
            ? {
                ...s,
                status: 'ACTIVE',
                profiles: s.profiles ? { ...s.profiles, approval_status: 'APPROVED' } : s.profiles,
              }
            : s
        )
      );

      const res = await fetch('/api/sales/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_id: sales.id,
          profile_id: sales.profile_id,
          status: 'ACTIVE',
          is_spv: sales.is_spv,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Gagal menyetujui');
      }

      alert(`Akun ${roleName} "${sales.profiles?.full_name}" berhasil disetujui & diaktifkan.`);
      fetchData();
    } catch (err: any) {
      alert(`Gagal menyetujui: ${err.message}`);
      fetchData();
    }
  };

  const handleToggleStatus = async (sales: SalesRep) => {
    const nextStatus = sales.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const roleName = sales.is_spv ? 'SPV' : 'Sales';
    if (!confirm(`Ubah status ${roleName} "${sales.profiles?.full_name}" menjadi ${nextStatus}?`)) return;

    try {
      setSalesList((prev) =>
        prev.map((s) =>
          s.id === sales.id || s.profile_id === sales.profile_id
            ? { ...s, status: nextStatus as any }
            : s
        )
      );

      const res = await fetch('/api/sales/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_id: sales.id,
          profile_id: sales.profile_id,
          status: nextStatus,
          is_spv: sales.is_spv,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Gagal mengubah status');
      }

      alert(`Status akun ${roleName} berhasil diubah menjadi ${nextStatus}.`);
      fetchData();
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message}`);
      fetchData();
    }
  };

  const handleSaveRegion = async () => {
    if (!activeSalesForRegion) return;
    try {
      const realSalesId = await ensureRealSalesId(activeSalesForRegion);
      const { error } = await supabase
        .from('sales')
        .update({ region_id: selectedNewRegion || null })
        .eq('id', realSalesId);

      if (error) throw error;

      alert('Wilayah kerja berhasil diperbarui.');
      setRegionModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Gagal memperbarui wilayah: ${err.message}`);
    }
  };

  const handleSaveSpvAndSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSalesForSpv) return;

    setSavingSpv(true);
    try {
      const realSalesId = await ensureRealSalesId(activeSalesForSpv);
      const isSpv = isSpvToggle;

      // Standar Kompensasi:
      // Sales: Gaji Pokok, Bonus (%), Insentif (%), Transport (Rp), Target Visit
      // SPV: Cuman Insentif (%) & Bonus (%) (Gaji Pokok & Transport = 0)
      const baseSalary = isSpv ? 0 : (Number(baseSalaryInput) || 0);
      const directComm = Number(directCommissionInput) || 0;
      const teamBonus = Number(teamBonusInput) || 0;
      const transport = isSpv ? 0 : (Number(transportAllowanceInput) || 0);
      const dailyVisits = isSpv ? 0 : (Number(dailyVisitsInput) || 6);
      const workDays = isSpv ? 0 : (Number(workDaysInput) || 26);
      const spvId = isSpv ? null : (selectedSpvParent || null);

      const payload: any = {
        is_spv: isSpv,
        spv_id: spvId,
        base_salary: baseSalary,
        direct_commission_pct: directComm,
        team_bonus_pct: teamBonus,
        daily_visit_target: dailyVisits,
        work_days_per_month: workDays,
      };

      // Try update with transport_allowance if the column exists in DB
      let { error } = await supabase
        .from('sales')
        .update({ ...payload, transport_allowance: transport })
        .eq('id', realSalesId);

      if (error && error.message.includes('transport_allowance')) {
        // Fallback without transport_allowance if column not created yet
        const retry = await supabase.from('sales').update(payload).eq('id', realSalesId);
        error = retry.error;
      }

      if (error) throw error;

      // Update role on profiles table
      const newRole = isSpv ? 'SPV' : 'SALES';
      await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', activeSalesForSpv.profile_id);

      alert(`Berhasil menyimpan pengaturan standar kompensasi untuk ${isSpv ? 'Supervisor (SPV)' : 'Sales Lapangan'}!`);
      setSpvModalOpen(false);
      setActiveSalesForSpv(null);
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingSpv(false);
    }
  };

  const handleToggleDealerAssignment = async (dealerId: string, currentSalesId?: string | null) => {
    if (!activeSalesForDealers) return;
    setSavingDealers(true);
    try {
      const realSalesId = await ensureRealSalesId(activeSalesForDealers);
      const newSalesId = currentSalesId === realSalesId ? null : realSalesId;

      const { error } = await supabase.from('dealers').update({ sales_id: newSalesId }).eq('id', dealerId);
      if (error) throw error;

      setAllDealers((prev) =>
        prev.map((d) => (d.id === dealerId ? { ...d, sales_id: newSalesId } : d))
      );

      setSalesList((prev) =>
        prev.map((s) => {
          if (s.id === activeSalesForDealers.id || s.id === realSalesId) {
            const count = (s.assignedDealersCount || 0) + (newSalesId ? 1 : -1);
            return { ...s, id: realSalesId, assignedDealersCount: Math.max(0, count) };
          }
          return s;
        })
      );
    } catch (err: any) {
      alert(`Gagal memperbarui toko binaan: ${err.message}`);
    } finally {
      setSavingDealers(false);
    }
  };

  const handleCreateSales = async () => {
    setSavingNewSales(true);
    try {
      const isSpv = newAccountType === 'SPV';
      const roleName = isSpv ? 'SPV' : 'SALES';

      if (addModalTab === 'NEW_ACCOUNT') {
        if (!newFullName.trim()) {
          alert('Nama lengkap wajib diisi.');
          return;
        }
        if (!newPhone.trim()) {
          alert('Nomor HP / WhatsApp wajib diisi.');
          return;
        }
        if (!newPassword.trim()) {
          alert('Kata sandi wajib diisi.');
          return;
        }

        const res = await fetch('/api/sales/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: newFullName.trim(),
            phone_number: newPhone.trim(),
            email: newEmail.trim() || undefined,
            password: newPassword.trim(),
            role: roleName,
            region_id: newSalesRegion || null,
            spv_id: isSpv ? null : (newSpvParent || null),
            base_salary: isSpv ? 0 : (Number(newBaseSalary) || 0),
            direct_commission_pct: Number(newDirectCommission) || 0,
            team_bonus_pct: Number(newTeamBonus) || 0,
            transport_allowance: isSpv ? 0 : (Number(newTransportAllowance) || 0),
            daily_visit_target: isSpv ? 0 : (Number(newDailyVisits) || 6),
            work_days_per_month: isSpv ? 0 : (Number(newWorkDays) || 26),
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          if (resData.requires_sql || res.status === 429 || (resData.error && resData.error.toLowerCase().includes('transport_allowance'))) {
            setSqlModalOpen(true);
            return;
          }
          throw new Error(resData.error || 'Gagal mendaftarkan akun baru.');
        }

        alert(resData.message || `Berhasil mendaftarkan akun ${isSpv ? 'Supervisor (SPV)' : 'Sales Lapangan'} baru!`);
        setAddModalOpen(false);
        setNewFullName('');
        setNewPhone('');
        setNewEmail('');
        setNewPassword('sales123');
        setNewSalesRegion('');
        setSelectedProfileId('');
        fetchData();
        return;
      }

      // Existing user assignment mode
      if (!selectedProfileId) {
        alert('Pilih akun pengguna terlebih dahulu.');
        return;
      }

      // 1. Update profile role to SALES or SPV
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ role: roleName, approval_status: 'APPROVED' })
        .eq('id', selectedProfileId);

      if (profErr) throw profErr;

      // 2. Prepare sales record with standard compensation
      const baseSalary = isSpv ? 0 : (Number(newBaseSalary) || 0);
      const directComm = Number(newDirectCommission) || 1.0;
      const teamBonus = Number(newTeamBonus) || 0.25;
      const transport = isSpv ? 0 : (Number(newTransportAllowance) || 0);
      const dailyVisits = isSpv ? 0 : (Number(newDailyVisits) || 6);
      const workDays = isSpv ? 0 : (Number(newWorkDays) || 26);
      const spvId = isSpv ? null : (newSpvParent || null);

      const payload: any = {
        profile_id: selectedProfileId,
        status: 'ACTIVE',
        is_spv: isSpv,
        spv_id: spvId,
        base_salary: baseSalary,
        direct_commission_pct: directComm,
        team_bonus_pct: teamBonus,
        daily_visit_target: dailyVisits,
        work_days_per_month: workDays,
        balance: 0,
      };
      if (newSalesRegion) payload.region_id = newSalesRegion;

      // Check if sales record exists for this profile
      const { data: existingSales } = await supabase
        .from('sales')
        .select('id')
        .eq('profile_id', selectedProfileId)
        .maybeSingle();

      let salesErr: any = null;
      if (existingSales?.id) {
        const { error } = await supabase
          .from('sales')
          .update({ ...payload, transport_allowance: transport })
          .eq('id', existingSales.id);
        salesErr = error;
        if (salesErr && salesErr.message.toLowerCase().includes('transport_allowance')) {
          const retry = await supabase.from('sales').update(payload).eq('id', existingSales.id);
          salesErr = retry.error;
        }
      } else {
        const { error } = await supabase
          .from('sales')
          .insert({ ...payload, transport_allowance: transport });
        salesErr = error;
        if (salesErr && salesErr.message.toLowerCase().includes('transport_allowance')) {
          const retry = await supabase.from('sales').insert(payload);
          salesErr = retry.error;
        }
      }

      if (salesErr) throw salesErr;

      alert(`Berhasil menetapkan akun ${isSpv ? 'Supervisor (SPV)' : 'Sales Lapangan'}!`);
      setAddModalOpen(false);
      setSelectedProfileId('');
      setNewSalesRegion('');
      setNewAccountType('SALES');
      fetchData();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setSavingNewSales(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Filter logic
  const filteredSales = salesList.filter((s) => {
    const name = s.profiles?.full_name || '';
    const phone = s.profiles?.phone_number || '';
    const matchQuery =
      name.toLowerCase().includes(searchQuery.toLowerCase()) || phone.includes(searchQuery);

    const matchRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'SPV' && s.is_spv) ||
      (roleFilter === 'SALES' && !s.is_spv);

    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchRegion = regionFilter === 'ALL' || s.region_id === regionFilter;

    return matchQuery && matchRole && matchStatus && matchRegion;
  });

  const totalSalesCount = salesList.filter((s) => !s.is_spv).length;
  const totalSpvCount = salesList.filter((s) => s.is_spv).length;
  const activeCount = salesList.filter((s) => s.status === 'ACTIVE').length;
  const totalBalance = salesList.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Sales & SPV</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Kelola personil Sales Lapangan & Supervisor (SPV), standar persentase kompensasi, penugasan wilayah, dan toko binaan.
          </p>
        </div>

        <button
          onClick={() => {
            setNewAccountType('SALES');
            setAddModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <UserPlus size={18} strokeWidth={2.5} /> Tambah Sales / SPV Baru
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Personil</span>
            <Users size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-800">{salesList.length}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold">
            <span className="text-emerald-700 font-bold">{totalSalesCount} Sales</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">{totalSpvCount} SPV</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervisor (SPV)</span>
            <Award size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{totalSpvCount}</p>
          <p className="text-xs text-slate-500 mt-1">Insentif & Bonus Tim</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akun Aktif</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">{activeCount}</p>
          <p className="text-xs text-slate-500 mt-1">Dari total {salesList.length} personil terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Akumulasi Saldo</span>
            <DollarSign size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800">{formatRupiah(totalBalance)}</p>
          <p className="text-xs text-slate-500 mt-1">Saldo komisi personil berjalan</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
        {/* Role Tabs */}
        <div className="flex border-b border-gray-100 bg-slate-50/70 p-2 gap-2">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'ALL'
                ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Personil ({salesList.length})
          </button>
          <button
            onClick={() => setRoleFilter('SALES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'SALES'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Users size={14} />
            Sales Lapangan ({totalSalesCount})
          </button>
          <button
            onClick={() => setRoleFilter('SPV')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              roleFilter === 'SPV'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Award size={14} />
            Supervisor / SPV ({totalSpvCount})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama personil, nomor telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PENDING">Pending Approval</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">Semua Wilayah</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="p-5 font-semibold">Personil & Jabatan</th>
              <th className="p-5 font-semibold">Standar Kompensasi</th>
              <th className="p-5 font-semibold">Wilayah Kerja</th>
              <th className="p-5 font-semibold">Toko Binaan</th>
              <th className="p-5 font-semibold">Saldo Komisi</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400 font-medium">
                  Memuat data tim sales & SPV...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-slate-600">Tidak ada personil ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter tab.</p>
                </td>
              </tr>
            ) : (
              filteredSales.map((sales) => {
                const isActive = sales.status === 'ACTIVE';
                const isPending = sales.status === 'PENDING';
                const isSpv = Boolean(sales.is_spv);

                return (
                  <tr key={sales.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Personil Profile */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm ${
                          isSpv ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sales.profiles?.full_name?.[0]?.toUpperCase() || (isSpv ? 'SPV' : 'S')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900">{sales.profiles?.full_name || 'Tanpa Nama'}</p>
                            {isSpv ? (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 text-[10px] font-black rounded-md border border-amber-300 flex items-center gap-1 shadow-2xs">
                                <Award size={10} /> SPV SUPERVISOR
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                                SALES
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {sales.profiles?.phone_number || '-'}
                          </p>
                          {sales.spv?.profiles?.full_name && !isSpv && (
                            <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                              SPV: {sales.spv.profiles.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Standar Kompensasi */}
                    <td className="p-5">
                      {isSpv ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-bold text-xs border border-amber-200">
                              Insentif: {Number(sales.direct_commission_pct || 1.0)}%
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-bold text-xs border border-indigo-200">
                              Bonus Tim: {Number(sales.team_bonus_pct || 0.25)}%
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            (SPV murni Insentif & Bonus)
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">
                              {formatRupiah(sales.base_salary ?? 4500000)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">/bln</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap text-[11px]">
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-100">
                              Ins: {Number(sales.direct_commission_pct || 1.0)}%
                            </span>
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-800 rounded font-semibold border border-blue-100">
                              Bns: {Number(sales.team_bonus_pct || 0.25)}%
                            </span>
                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-800 rounded font-semibold border border-purple-100">
                              Trp: {formatRupiah(sales.transport_allowance ?? 500000)}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Region */}
                    <td className="p-5">
                      <button
                        onClick={() => {
                          setActiveSalesForRegion(sales);
                          setSelectedNewRegion(sales.region_id || '');
                          setRegionModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all group cursor-pointer"
                      >
                        <MapPin size={12} className="text-emerald-600" />
                        <span>{sales.regions?.name || 'Belum diatur'}</span>
                        <Edit2 size={11} className="opacity-0 group-hover:opacity-100 text-slate-400 ml-1" />
                      </button>
                    </td>

                    {/* Assigned Dealers */}
                    <td className="p-5">
                      <button
                        onClick={() => {
                          setActiveSalesForDealers(sales);
                          setDealerModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Store size={13} />
                        <span>{sales.assignedDealersCount || 0} Toko</span>
                      </button>
                    </td>

                    {/* Balance */}
                    <td className="p-5 font-bold text-slate-800">
                      {formatRupiah(sales.balance || 0)}
                    </td>

                    {/* Status */}
                    <td className="p-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-600' : isPending ? 'bg-amber-600' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'Aktif' : isPending ? 'Pending' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveSalesForSpv(sales);
                            setIsSpvToggle(Boolean(sales.is_spv));
                            setSelectedSpvParent(sales.spv_id || '');
                            setBaseSalaryInput(String(sales.base_salary ?? 4500000));
                            setDirectCommissionInput(String(sales.direct_commission_pct ?? 1.0));
                            setTeamBonusInput(String(sales.team_bonus_pct ?? 0.25));
                            setTransportAllowanceInput(String(sales.transport_allowance ?? 500000));
                            setDailyVisitsInput(String(sales.daily_visit_target ?? 6));
                            setWorkDaysInput(String(sales.work_days_per_month ?? 26));
                            setSpvModalOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                            isSpv 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                          title="Atur Jabatan & Standar Kompensasi (Gaji, Bonus, Insentif, Transport)"
                        >
                          <Briefcase size={13} />
                          <span>Atur Kompensasi</span>
                        </button>

                        {isPending ? (
                          <button
                            onClick={() => handleApprove(sales)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <Check size={14} /> Setujui
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(sales)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Manage Assigned Dealers */}
      {dealerModalOpen && activeSalesForDealers && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Alokasi Toko Binaan</h3>
                <p className="text-xs text-slate-500">
                  Pilih toko-toko yang menjadi binaan bagi personil: <b className="text-slate-800">{activeSalesForDealers.profiles?.full_name}</b>
                </p>
              </div>
              <button
                onClick={() => setDealerModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl mb-4">
              {allDealers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Belum ada dealer/toko terdaftar.</div>
              ) : (
                allDealers.map((dealer) => {
                  const isAssignedToThis = dealer.sales_id === activeSalesForDealers.id;
                  const isAssignedToOther = dealer.sales_id && dealer.sales_id !== activeSalesForDealers.id;
                  const otherSales = isAssignedToOther ? salesList.find((s) => s.id === dealer.sales_id) : null;

                  return (
                    <div
                      key={dealer.id}
                      className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                        isAssignedToThis ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm truncate">{dealer.store_name}</p>
                          {isAssignedToThis && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              Binaan Personil Ini
                            </span>
                          )}
                          {isAssignedToOther && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">
                              Binaan: {otherSales?.profiles?.full_name || 'Sales Lain'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{dealer.address || 'Tanpa alamat lengkap'}</p>
                      </div>

                      <button
                        onClick={() => handleToggleDealerAssignment(dealer.id, dealer.sales_id)}
                        disabled={savingDealers}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAssignedToThis
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isAssignedToThis ? 'Lepaskan' : 'Pilih Toko'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setDealerModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Region */}
      {regionModalOpen && activeSalesForRegion && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Pilih Wilayah Kerja</h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur wilayah operasional untuk: <b className="text-slate-800">{activeSalesForRegion.profiles?.full_name}</b>
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Daftar Wilayah</label>
              <select
                value={selectedNewRegion}
                onChange={(e) => setSelectedNewRegion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">-- Belum Ditugaskan / Wilayah Bebas --</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRegionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRegion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm"
              >
                Simpan Wilayah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add / Assign New Sales or SPV */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Tambah Personil Sales / SPV</h3>
                  <p className="text-[11px] text-slate-500">Daftarkan akun baru atau tetapkan dari pengguna non-dealer</p>
                </div>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Pilihan Mode: Daftar Akun Baru vs Pilih Akun Terdaftar */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setAddModalTab('NEW_ACCOUNT')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  addModalTab === 'NEW_ACCOUNT'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus size={14} />
                Daftar Akun Baru (Langsung)
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('EXISTING_USER')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  addModalTab === 'EXISTING_USER'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck size={14} />
                Pilih Akun Terdaftar ({availableProfiles.length})
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* TAB 1: FORM PENDAFTARAN AKUN BARU */}
              {addModalTab === 'NEW_ACCOUNT' ? (
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3">
                  <p className="text-xs font-bold text-emerald-900 uppercase">Informasi Akun Personil Baru</p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Contoh: Rian Hidayat"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nomor HP / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kata Sandi Login *
                      </label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="sales123"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Login (Opsional)
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Otomatis dibuat dari nomor HP jika kosong"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Default: {newPhone ? `${newPhone.replace(/\D/g, '')}@sales.b2b.app` : 'nomorhp@sales.b2b.app'}
                    </span>
                  </div>
                </div>
              ) : (
                /* TAB 2: PILIH DARI PENGGUNA TERDAFTAR */
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Pilih Pengguna Terdaftar (Non-Dealer) *
                  </label>
                  {availableProfiles.length === 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                      📌 <b>Info Filter Dealer:</b> Seluruh akun terdaftar saat ini bertipe <b>Dealer</b> atau sudah terdaftar sebagai <b>Sales/SPV</b>. Akun dealer secara otomatis <u>tidak ditampilkan</u> agar tidak salah ditugaskan.
                      <br />
                      Silakan gunakan tab <b>"Daftar Akun Baru (Langsung)"</b> di atas untuk mendaftarkan personil baru.
                    </div>
                  ) : (
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- Pilih Pengguna --</option>
                      {availableProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.phone_number || 'Tanpa HP'}) - Role: {p.role}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* 2. Pilihan Jenis Akun / Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Jenis Akun / Jabatan *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAccountType('SALES')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      newAccountType === 'SALES'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={16} className={newAccountType === 'SALES' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="font-bold text-sm">Sales Lapangan</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Gaji Pokok, Bonus Tim, Insentif Omzet & Uang Transport.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAccountType('SPV')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      newAccountType === 'SPV'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={16} className={newAccountType === 'SPV' ? 'text-amber-600' : 'text-slate-400'} />
                      <span className="font-bold text-sm">Supervisor (SPV)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Hanya Insentif (%) & Bonus Tim (%), tanpa Gaji & Transport.
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Wilayah Kerja */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Wilayah Kerja</label>
                <select
                  value={newSalesRegion}
                  onChange={(e) => setNewSalesRegion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Wilayah (Opsional) --</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Standar Kompensasi Berdasarkan Tipe Akun */}
              {newAccountType === 'SALES' ? (
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3">
                  <p className="text-xs font-bold text-emerald-900 uppercase">Standar Kompensasi Sales Lapangan</p>
                  
                  {/* SPV Pembimbing */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Supervisor (SPV) Pembimbing</label>
                    <select
                      value={newSpvParent}
                      onChange={(e) => setNewSpvParent(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="">-- Tanpa SPV (Langsung Pusat) --</option>
                      {salesList
                        .filter((s) => s.is_spv)
                        .map((spv) => (
                          <option key={spv.id} value={spv.id}>
                            SPV {spv.profiles?.full_name} ({spv.regions?.name || 'Seluruh Area'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Gaji Pokok (Rp)</label>
                      <input
                        type="number"
                        value={newBaseSalary}
                        onChange={(e) => setNewBaseSalary(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        placeholder="4500000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Uang Transport (Rp)</label>
                      <input
                        type="number"
                        value={newTransportAllowance}
                        onChange={(e) => setNewTransportAllowance(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        placeholder="500000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Insentif Omzet (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={newDirectCommission}
                        onChange={(e) => setNewDirectCommission(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        placeholder="1.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Bonus Tim (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={newTeamBonus}
                        onChange={(e) => setNewTeamBonus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        placeholder="0.25"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Visit / Hari</label>
                      <input
                        type="number"
                        value={newDailyVisits}
                        onChange={(e) => setNewDailyVisits(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Hari Kerja / Bulan</label>
                      <input
                        type="number"
                        value={newWorkDays}
                        onChange={(e) => setNewWorkDays(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                        placeholder="26"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Award size={16} className="text-amber-600" />
                    <p className="text-xs font-bold text-amber-900 uppercase">Standar Kompensasi Supervisor (SPV)</p>
                  </div>
                  
                  <div className="p-2.5 bg-amber-100/60 rounded-lg text-[11px] text-amber-950 font-medium">
                    ⚠️ <b>Sesuai Kebijakan:</b> Supervisor (SPV) hanya menerima <b>Insentif (%)</b> dan <b>Bonus Tim (%)</b>. Gaji Pokok dan Transport otomatis Rp 0.
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Insentif Direct (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={newDirectCommission}
                        onChange={(e) => setNewDirectCommission(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950"
                        placeholder="1.00"
                      />
                      <span className="text-[10px] text-amber-700 mt-0.5 block">Komisi penjualan wilayah uncovered</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">Bonus Override Tim (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={newTeamBonus}
                        onChange={(e) => setNewTeamBonus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950"
                        placeholder="0.25"
                      />
                      <span className="text-[10px] text-amber-700 mt-0.5 block">Bonus dari akumulasi penjualan tim</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleCreateSales}
                disabled={savingNewSales}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
              >
                {savingNewSales
                  ? 'Memproses...'
                  : addModalTab === 'NEW_ACCOUNT'
                  ? (newAccountType === 'SPV' ? 'Daftarkan Akun SPV' : 'Daftarkan Akun Sales')
                  : (newAccountType === 'SPV' ? 'Jadikan SPV' : 'Jadikan Sales')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HELPER: SQL Activation for Bypass Email Rate Limit */}
      {sqlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <FileCode size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Aktivasi Fungsi Pembuatan Akun Otomatis</h3>
                  <p className="text-[11px] text-slate-500">Supabase Email Rate Limit terdeteksi</p>
                </div>
              </div>
              <button onClick={() => setSqlModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed mb-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                ⚡ <b>Sistem Rate Limit Supabase:</b> Kuota pengiriman email otomatis dari Supabase Free Tier telah mencapai batas per jam. 
                <br /><br />
                Agar pendaftaran akun Sales & SPV dari panel admin dapat berjalan <b>secara instan tanpa kuota/limitasi email</b>, jalankan skrip SQL <code>create_admin_sales_function.sql</code> di Supabase SQL Editor sekali saja.
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-800 block mb-1">Langkah Mudah:</span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Buka <b>Supabase Dashboard &gt; SQL Editor</b></li>
                  <li>Klik tombol <b>"Salin Skrip SQL"</b> di bawah</li>
                  <li>Paste di SQL Editor dan klik <b>Run</b></li>
                  <li>Kembali ke sini dan klik <b>"Daftarkan Akun"</b> lagi</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`-- 1. Tambahkan kolom kompensasi ke tabel sales & sales_payrolls jika belum ada
ALTER TABLE IF EXISTS public.sales 
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(15, 2) DEFAULT 500000.00,
ADD COLUMN IF NOT EXISTS is_spv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spv_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(15, 2) DEFAULT 4500000.00,
ADD COLUMN IF NOT EXISTS direct_commission_pct DECIMAL(5, 2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS team_bonus_pct DECIMAL(5, 2) DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS daily_visit_target INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS work_days_per_month INTEGER DEFAULT 26;

ALTER TABLE IF EXISTS public.sales_payrolls 
ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(15, 2) DEFAULT 500000.00;

-- 2. Fungsi pembuatan akun Sales & SPV langsung dari admin
CREATE OR REPLACE FUNCTION public.admin_create_sales_account(
  p_full_name text,
  p_phone_number text,
  p_email text,
  p_password text,
  p_role text DEFAULT 'SALES',
  p_region_id uuid DEFAULT NULL,
  p_spv_id uuid DEFAULT NULL,
  p_base_salary numeric DEFAULT 4500000,
  p_direct_commission_pct numeric DEFAULT 1.0,
  p_team_bonus_pct numeric DEFAULT 0.25,
  p_transport_allowance numeric DEFAULT 500000,
  p_daily_visit_target integer DEFAULT 6,
  p_work_days_per_month integer DEFAULT 26
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  v_email text;
  v_clean_phone text;
  v_is_spv boolean;
  new_sales_id uuid;
BEGIN
  v_clean_phone := regexp_replace(p_phone_number, '\\D', '', 'g');
  IF v_clean_phone LIKE '62%' THEN v_clean_phone := '0' || substring(v_clean_phone from 3); END IF;
  IF NOT v_clean_phone LIKE '0%' THEN v_clean_phone := '0' || v_clean_phone; END IF;

  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    v_email := lower(trim(p_email));
  ELSE
    v_email := v_clean_phone || '@sales.b2b.app';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone_number = v_clean_phone) THEN
    SELECT id INTO new_user_id FROM public.profiles WHERE phone_number = v_clean_phone LIMIT 1;
  ELSE
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      SELECT id INTO new_user_id FROM auth.users WHERE email = v_email LIMIT 1;
    ELSE
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
      VALUES (new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email, crypt(p_password, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, json_build_object('role', upper(p_role), 'full_name', p_full_name, 'phone_number', v_clean_phone)::jsonb, FALSE);

      INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, id)
      VALUES (new_user_id::text, new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, v_email)::jsonb, 'email', now(), now(), gen_random_uuid());
    END IF;
  END IF;

  v_is_spv := (upper(p_role) = 'SPV');

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
    UPDATE public.profiles SET role = upper(p_role), full_name = p_full_name, phone_number = v_clean_phone, approval_status = 'APPROVED' WHERE id = new_user_id;
  ELSE
    INSERT INTO public.profiles (id, role, full_name, phone_number, approval_status, created_at) VALUES (new_user_id, upper(p_role), p_full_name, v_clean_phone, 'APPROVED', now());
  END IF;

  SELECT id INTO new_sales_id FROM public.sales WHERE profile_id = new_user_id LIMIT 1;

  IF new_sales_id IS NOT NULL THEN
    UPDATE public.sales
    SET region_id = p_region_id, spv_id = CASE WHEN v_is_spv THEN NULL ELSE p_spv_id END, status = 'ACTIVE', is_spv = v_is_spv, base_salary = CASE WHEN v_is_spv THEN 0 ELSE p_base_salary END, direct_commission_pct = p_direct_commission_pct, team_bonus_pct = p_team_bonus_pct, transport_allowance = CASE WHEN v_is_spv THEN 0 ELSE p_transport_allowance END, daily_visit_target = CASE WHEN v_is_spv THEN 0 ELSE p_daily_visit_target END, work_days_per_month = CASE WHEN v_is_spv THEN 0 ELSE p_work_days_per_month END
    WHERE id = new_sales_id;
  ELSE
    INSERT INTO public.sales (profile_id, region_id, spv_id, status, is_spv, base_salary, direct_commission_pct, team_bonus_pct, transport_allowance, daily_visit_target, work_days_per_month, balance, created_at)
    VALUES (new_user_id, p_region_id, CASE WHEN v_is_spv THEN NULL ELSE p_spv_id END, 'ACTIVE', v_is_spv, CASE WHEN v_is_spv THEN 0 ELSE p_base_salary END, p_direct_commission_pct, p_team_bonus_pct, CASE WHEN v_is_spv THEN 0 ELSE p_transport_allowance END, CASE WHEN v_is_spv THEN 0 ELSE p_daily_visit_target END, CASE WHEN v_is_spv THEN 0 ELSE p_work_days_per_month END, 0, now())
    RETURNING id INTO new_sales_id;
  END IF;

  RETURN json_build_object('success', true, 'user_id', new_user_id, 'sales_id', new_sales_id, 'email', v_email, 'role', upper(p_role));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_sales_account TO anon, authenticated, service_role;

-- 3. Perbaikan RLS Promos & Returns
ALTER TABLE IF EXISTS public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to promos" ON public.promos;
DROP POLICY IF EXISTS "Allow authenticated full access to promos" ON public.promos;
DROP POLICY IF EXISTS "Allow all for promos" ON public.promos;
CREATE POLICY "Allow public read access to promos" ON public.promos FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to promos" ON public.promos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for promos" ON public.promos FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to returns" ON public.returns;
DROP POLICY IF EXISTS "Allow authenticated full access to returns" ON public.returns;
CREATE POLICY "Allow public read access to returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to returns" ON public.returns FOR ALL USING (true) WITH CHECK (true);`);
                  alert('Skrip SQL berhasil disalin ke clipboard! Silakan paste di Supabase SQL Editor.');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-1.5"
              >
                <Copy size={16} />
                Salin Skrip SQL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Atur Jabatan & Standar Kompensasi */}
      {spvModalOpen && activeSalesForSpv && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">Atur Jabatan & Standar Kompensasi</h3>
              </div>
              <button
                onClick={() => setSpvModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSpvAndSalary} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                Personil: <b className="text-slate-900">{activeSalesForSpv.profiles?.full_name}</b> ({activeSalesForSpv.regions?.name || 'Tanpa Wilayah'})
              </div>

              {/* Pilihan Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Penetapan Jabatan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSpvToggle(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !isSpvToggle
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm block mb-0.5">Sales Lapangan</span>
                    <span className="text-[11px] text-slate-500">Gaji, Bonus, Insentif, Transport</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSpvToggle(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSpvToggle
                        ? 'border-amber-500 bg-amber-50/60 text-amber-950 ring-2 ring-amber-500/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm block mb-0.5">Supervisor (SPV)</span>
                    <span className="text-[11px] text-slate-500">Hanya Insentif & Bonus Tim</span>
                  </button>
                </div>
              </div>

              {/* JIKA SALES LAPANGAN */}
              {!isSpvToggle ? (
                <div className="space-y-3 p-4 bg-emerald-50/30 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-900 uppercase">Standar Kompensasi Sales Lapangan</p>

                  {/* SPV Pembimbing */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Supervisor (SPV) Pembimbing
                    </label>
                    <select
                      value={selectedSpvParent}
                      onChange={(e) => setSelectedSpvParent(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="">-- Tanpa SPV (Langsung ke Pusat) --</option>
                      {salesList
                        .filter((s) => s.is_spv && s.id !== activeSalesForSpv.id)
                        .map((spv) => (
                          <option key={spv.id} value={spv.id}>
                            SPV {spv.profiles?.full_name} ({spv.regions?.name || 'Seluruh Area'})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Gaji Pokok & Transport */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gaji Pokok (Rp)
                      </label>
                      <input
                        type="number"
                        value={baseSalaryInput}
                        onChange={(e) => setBaseSalaryInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                        placeholder="4500000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Uang Transport (Rp)
                      </label>
                      <input
                        type="number"
                        value={transportAllowanceInput}
                        onChange={(e) => setTransportAllowanceInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                        placeholder="500000"
                        required
                      />
                    </div>
                  </div>

                  {/* Insentif & Bonus */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Insentif Omzet (%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={directCommissionInput}
                        onChange={(e) => setDirectCommissionInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                        placeholder="1.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bonus Tim (%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={teamBonusInput}
                        onChange={(e) => setTeamBonusInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                        placeholder="0.25"
                        required
                      />
                    </div>
                  </div>

                  {/* Target Visit Harian & Hari Kerja */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Visit / Hari
                      </label>
                      <input
                        type="number"
                        value={dailyVisitsInput}
                        onChange={(e) => setDailyVisitsInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="6"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hari Kerja / Bulan
                      </label>
                      <input
                        type="number"
                        value={workDaysInput}
                        onChange={(e) => setWorkDaysInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="26"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900">
                    <span className="font-bold">Formula Gaji Visit Sales:</span> Total {(Number(dailyVisitsInput) || 6) * (Number(workDaysInput) || 26)} visit/bulan. Nilai per visit: <b className="text-blue-950">Rp {Math.round((Number(baseSalaryInput) || 4500000) / ((Number(dailyVisitsInput) || 6) * (Number(workDaysInput) || 26))).toLocaleString('id-ID')}</b>.
                  </div>
                </div>
              ) : (
                /* JIKA SUPERVISOR (SPV) */
                <div className="space-y-3 p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-1.5">
                    <Award size={16} className="text-amber-600" />
                    <p className="text-xs font-bold text-amber-900 uppercase">Standar Kompensasi Supervisor (SPV)</p>
                  </div>

                  <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-lg text-xs text-amber-950">
                    📌 <b>Ketentuan Khusus SPV:</b> SPV <u>hanya menerima Insentif & Bonus</u>. Gaji Pokok dan Uang Transport otomatis diset <b>Rp 0</b>.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Insentif Direct (%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={directCommissionInput}
                        onChange={(e) => setDirectCommissionInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm font-bold text-amber-950"
                        placeholder="1.00"
                        required
                      />
                      <span className="text-[11px] text-amber-700 mt-1 block">
                        Insentif direct sales di wilayah uncovered
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Bonus Tim (%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={teamBonusInput}
                        onChange={(e) => setTeamBonusInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm font-bold text-amber-950"
                        placeholder="0.25"
                        required
                      />
                      <span className="text-[11px] text-amber-700 mt-1 block">
                        Bonus override dari omzet seluruh sales binaan
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSpvModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSpv}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50"
                >
                  {savingSpv ? 'Menyimpan...' : 'Simpan Standar Kompensasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
