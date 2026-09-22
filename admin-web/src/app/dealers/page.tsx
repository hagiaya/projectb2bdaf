'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  MapPin, 
  Store, 
  CheckCircle2, 
  XCircle, 
  X, 
  Clock, 
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Sliders,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Truck,
  Check,
  History,
  AlertTriangle,
  Info,
  Star,
  Award,
  Sparkles,
  Percent,
  Tag,
  Calendar,
  Crown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Dealer {
  id: string;
  profile_id: string;
  store_name: string;
  address: string;
  credit_limit: number;
  outstanding_balance?: number;
  is_credit_eligible?: boolean;
  credit_term_days?: number;
  credit_status?: string;
  credit_notes?: string;
  // Ketentuan Khusus Dealer (Dealer Khusus, Harga Khusus, Akses Tertentu)
  is_special_dealer?: boolean;
  special_dealer_tier?: string;
  special_discount_percentage?: number;
  special_pricing_notes?: string;
  special_access_permissions?: {
    priority_stock?: boolean;
    waive_min_order?: boolean;
    exclusive_catalog?: boolean;
    vip_support?: boolean;
  };
  special_dealer_notes?: string;
  status: string;
  created_at: string;
  sales_id?: string | null;
  sales?: { id: string; profiles?: { full_name: string } };
  profiles?: { full_name: string; approval_status?: string; phone_number?: string };
  regions?: { name: string };
}

interface PendingProfile {
  id: string;
  full_name: string;
  phone_number: string;
  company_name: string;
  address: string;
  approval_status: string;
  ktp_url: string;
  npwp_url: string;
  created_at: string;
}

interface Region {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface PaymentSettings {
  id: string;
  // CBD (Cash Before Delivery / Transfer Bank Manual)
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  cbd_enabled?: boolean;
  cbd_term_label?: string;
  cbd_instructions?: string;
  // COD (Cash On Delivery)
  cod_enabled: boolean;
  cod_term_days: number;
  cod_term_label: string;
  cod_max_amount: number;
  cod_policy_terms: string;
}

interface CreditLimitLog {
  id: string;
  dealer_id: string;
  action: 'INCREASE' | 'DECREASE' | 'SET' | 'ENABLE' | 'DISABLE';
  amount_changed: number;
  previous_limit: number;
  current_limit: number;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [salesList, setSalesList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('Admin');

  // Tabs: 'pending' | 'active' | 'cod_settings'
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'cod_settings'>('active');

  // Filters for Active Dealers
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('Semua Wilayah');
  const [selectedCreditFilter, setSelectedCreditFilter] = useState('ALL'); // 'ALL' | 'CREDIT_ONLY' | 'REGULAR_ONLY'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL'); // 'ALL' | 'SPECIAL_ONLY' | 'REGULAR_ONLY'

  // Add Dealer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newRegionId, setNewRegionId] = useState('');
  const [newSalesId, setNewSalesId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('0');
  const [newIsCreditEligible, setNewIsCreditEligible] = useState(false);
  const [newCreditTermDays, setNewCreditTermDays] = useState('15');
  const [newIsSpecialDealer, setNewIsSpecialDealer] = useState(false);
  const [newSpecialTier, setNewSpecialTier] = useState('VIP');
  const [newSpecialDiscount, setNewSpecialDiscount] = useState('0');

  // Dealer Khusus & Credit Limit Management Modal State
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [modalSubTab, setModalSubTab] = useState<'special' | 'credit' | 'logs'>('special');
  const [selectedDealerCredit, setSelectedDealerCredit] = useState<Dealer | null>(null);
  const [creditAction, setCreditAction] = useState<'keep' | 'increase' | 'decrease' | 'set' | 'disable'>('keep');
  const [creditAmountInput, setCreditAmountInput] = useState('');
  const [creditTermDaysInput, setCreditTermDaysInput] = useState('15');
  const [creditNotesInput, setCreditNotesInput] = useState('');
  const [isSavingCredit, setIsSavingCredit] = useState(false);
  const [creditLogs, setCreditLogs] = useState<CreditLimitLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Special Dealer specific modal state
  const [isSpecialDealerInput, setIsSpecialDealerInput] = useState(false);
  const [specialTierInput, setSpecialTierInput] = useState('VIP');
  const [specialDiscountInput, setSpecialDiscountInput] = useState('0');
  const [specialPricingNotesInput, setSpecialPricingNotesInput] = useState('');
  const [specialPermissions, setSpecialPermissions] = useState({
    priority_stock: true,
    waive_min_order: true,
    exclusive_catalog: false,
    vip_support: true,
  });
  const [specialDealerNotesInput, setSpecialDealerNotesInput] = useState('');

  // Payment & Bank CBD / COD Settings State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    id: 'default',
    bank_name: 'BCA (Bank Central Asia)',
    bank_account_number: '829-019-8821',
    bank_account_name: 'PT DISTRIBUSI AKSESORIS PRIMA',
    cbd_enabled: true,
    cbd_term_label: 'Transfer Bank Manual (CBD - Cash Before Delivery)',
    cbd_instructions: 'Transfer ke rekening resmi perusahaan + 3 digit kode unik acak sebelum pesanan diproses dan dikirimkan.',
    cod_enabled: true,
    cod_term_days: 0,
    cod_term_label: 'Bayar Saat Terima Barang (H+0)',
    cod_max_amount: 10000000,
    cod_policy_terms: `Ketentuan Pembayaran COD (Cash on Delivery):\n1. Pembayaran wajib diserahkan kepada kurir pengantar saat barang tiba di alamat toko/outlet.\n2. Pembayaran dapat berupa uang tunai pas atau konfirmasi transfer langsung ke rekening resmi kurir/perusahaan.\n3. Maksimal nilai transaksi per pesanan COD disesuaikan dengan limit kebijakan perusahaan.\n4. Jika pembayaran belum siap saat kurir tiba, pihak DAP berhak menunda serah terima barang atau menjadwalkan pengantaran ulang.`,
  });
  const [isSavingCodSettings, setIsSavingCodSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setAdminEmail(user.email);
    
    // Fetch regions
    const { data: regData } = await supabase.from('regions').select('id, name');
    if (regData) {
      setRegions(regData);
      if (regData.length > 0) setNewRegionId(regData[0].id);
    }

    // Fetch profiles for dropdown
    const { data: profData } = await supabase.from('profiles').select('id, full_name');
    if (profData) {
      setProfiles(profData);
      if (profData.length > 0) setNewOwnerId(profData[0].id);
    }

    // Fetch active sales for dropdown
    const { data: sData } = await supabase
      .from('sales')
      .select('id, profiles(full_name)')
      .eq('status', 'ACTIVE');
    if (sData) {
      setSalesList(sData.map((s: any) => ({ id: s.id, name: s.profiles?.full_name || 'Sales' })));
    }

    // Fetch dealers (APPROVED) with sales relation
    const { data: dlrData, error } = await supabase
      .from('dealers')
      .select('*, profiles(full_name, approval_status, phone_number), regions(name), sales(id, profiles(full_name))')
      .order('created_at', { ascending: false });
      
    if (!error && dlrData) {
      setDealers(dlrData as any);
    }

    // Fetch pending profiles
    const { data: pendingData } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, company_name, address, approval_status, ktp_url, npwp_url, created_at')
      .eq('approval_status', 'PENDING')
      .order('created_at', { ascending: false });
    
    if (pendingData) {
      setPendingProfiles(pendingData as PendingProfile[]);
    }

    // Fetch payment settings
    try {
      const { data: pSetts } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (pSetts) {
        setPaymentSettings(pSetts);
      }
    } catch (e) {
      console.warn("Payment settings not found or table pending migration:", e);
    }
    
    setIsLoading(false);
  };

  // Open Credit & Special Dealer Modal
  const openCreditModal = async (dealer: Dealer, initialTab: 'special' | 'credit' | 'logs' = 'special') => {
    setSelectedDealerCredit(dealer);
    setIsCreditModalOpen(true);
    setModalSubTab(initialTab);
    setCreditAction('keep');
    setCreditAmountInput('');
    setCreditTermDaysInput((dealer.credit_term_days || 15).toString());
    setCreditNotesInput('');

    // Load special dealer settings
    setIsSpecialDealerInput(Boolean(dealer.is_special_dealer));
    setSpecialTierInput(dealer.special_dealer_tier || 'VIP');
    setSpecialDiscountInput((dealer.special_discount_percentage || 0).toString());
    setSpecialPricingNotesInput(dealer.special_pricing_notes || '');
    setSpecialPermissions({
      priority_stock: dealer.special_access_permissions?.priority_stock ?? true,
      waive_min_order: dealer.special_access_permissions?.waive_min_order ?? true,
      exclusive_catalog: dealer.special_access_permissions?.exclusive_catalog ?? false,
      vip_support: dealer.special_access_permissions?.vip_support ?? true,
    });
    setSpecialDealerNotesInput(dealer.special_dealer_notes || '');

    setIsLoadingLogs(true);
    try {
      const { data: logs } = await supabase
        .from('credit_limit_logs')
        .select('*')
        .eq('dealer_id', dealer.id)
        .order('created_at', { ascending: false });

      if (logs) {
        setCreditLogs(logs as CreditLimitLog[]);
      } else {
        setCreditLogs([]);
      }
    } catch (e) {
      setCreditLogs([]);
    }
    setIsLoadingLogs(false);
  };

  // Submit Credit Limit & Special Dealer Adjustment
  const handleSaveCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerCredit) return;

    const currentLimit = Number(selectedDealerCredit.credit_limit || 0);
    let newLimit = currentLimit;
    const amount = parseFloat(creditAmountInput) || 0;

    if (creditAction === 'keep') {
      newLimit = currentLimit;
    } else if (creditAction === 'increase') {
      if (amount <= 0) {
        alert("Masukkan nominal kenaikan limit yang valid.");
        return;
      }
      newLimit = currentLimit + amount;
    } else if (creditAction === 'decrease') {
      if (amount <= 0) {
        alert("Masukkan nominal pengurangan limit yang valid.");
        return;
      }
      newLimit = Math.max(0, currentLimit - amount);
    } else if (creditAction === 'set') {
      if (amount < 0) {
        alert("Plafon limit tidak boleh negatif.");
        return;
      }
      newLimit = amount;
    } else if (creditAction === 'disable') {
      if (!confirm(`Yakin ingin menonaktifkan dan menghapus hak akses kredit untuk toko "${selectedDealerCredit.store_name}"? Dealer akan kembali berstatus reguler tanpa akses tempo.`)) {
        return;
      }
      newLimit = 0;
    }

    setIsSavingCredit(true);
    const isEligible = creditAction !== 'disable' && (newLimit > 0 || selectedDealerCredit.is_credit_eligible);
    const termDays = parseInt(creditTermDaysInput, 10) || 15;
    const specialDiscount = parseFloat(specialDiscountInput) || 0;

    const updatePayload: any = {
      credit_limit: newLimit,
      is_credit_eligible: isEligible,
      credit_status: isEligible ? 'ACTIVE' : 'DISABLED',
      credit_term_days: termDays,
      credit_notes: creditNotesInput.trim() || (creditAction === 'disable' ? 'Fasilitas kredit dinonaktifkan' : 'Disetujui Admin'),
      // Dealer Khusus
      is_special_dealer: isSpecialDealerInput,
      special_dealer_tier: isSpecialDealerInput ? specialTierInput : 'REGULAR',
      special_discount_percentage: isSpecialDealerInput ? specialDiscount : 0,
      special_pricing_notes: isSpecialDealerInput ? specialPricingNotesInput.trim() : null,
      special_access_permissions: isSpecialDealerInput ? specialPermissions : null,
      special_dealer_notes: isSpecialDealerInput ? specialDealerNotesInput.trim() : null,
    };

    // 1. Update ke tabel dealers
    let { error: updateError } = await supabase
      .from('dealers')
      .update(updatePayload)
      .eq('id', selectedDealerCredit.id);

    // Fallback if newly added columns don't exist yet in Supabase
    if (updateError && (updateError.message?.includes('is_special_dealer') || updateError.message?.includes('is_credit_eligible') || updateError.code === '42703')) {
      const fallbackPayload: any = { credit_limit: newLimit };
      if (!updateError.message?.includes('credit_term_days')) fallbackPayload.credit_term_days = termDays;
      const fallback = await supabase
        .from('dealers')
        .update(fallbackPayload)
        .eq('id', selectedDealerCredit.id);
      updateError = fallback.error;
    }

    if (updateError) {
      alert("Gagal memperbarui data dealer: " + updateError.message);
      setIsSavingCredit(false);
      return;
    }

    // 2. Insert ke credit_limit_logs jika limit berubah atau ada mutasi
    if (creditAction !== 'keep' || newLimit !== currentLimit) {
      try {
        await supabase.from('credit_limit_logs').insert([{
          dealer_id: selectedDealerCredit.id,
          action: creditAction === 'increase' ? 'INCREASE' : creditAction === 'decrease' ? 'DECREASE' : creditAction === 'set' ? 'SET' : creditAction === 'disable' ? 'DISABLE' : 'SET',
          amount_changed: creditAction === 'disable' ? currentLimit : amount,
          previous_limit: currentLimit,
          current_limit: newLimit,
          notes: creditNotesInput.trim() || (creditAction === 'increase' ? 'Kenaikan Limit Kredit' : creditAction === 'decrease' ? 'Pengurangan Limit Kredit' : creditAction === 'disable' ? 'Penonaktifan Hak Akses Kredit' : `Pengaturan Termin ${termDays} Hari & Plafon`),
          changed_by: adminEmail,
        }]);
      } catch (logErr) {
        console.warn("Log credit failed:", logErr);
      }
    }

    // 3. Update local state
    const updatedDealer: Dealer = {
      ...selectedDealerCredit,
      credit_limit: newLimit,
      is_credit_eligible: isEligible,
      credit_status: isEligible ? 'ACTIVE' : 'DISABLED',
      credit_term_days: termDays,
      credit_notes: creditNotesInput.trim(),
      is_special_dealer: isSpecialDealerInput,
      special_dealer_tier: isSpecialDealerInput ? specialTierInput : 'REGULAR',
      special_discount_percentage: isSpecialDealerInput ? specialDiscount : 0,
      special_pricing_notes: isSpecialDealerInput ? specialPricingNotesInput.trim() : undefined,
      special_access_permissions: isSpecialDealerInput ? specialPermissions : undefined,
      special_dealer_notes: isSpecialDealerInput ? specialDealerNotesInput.trim() : undefined,
    };

    setDealers(prev => prev.map(d => d.id === selectedDealerCredit.id ? updatedDealer : d));
    setSelectedDealerCredit(updatedDealer);
    setIsSavingCredit(false);
    setIsCreditModalOpen(false);

    alert(`Pengaturan toko "${selectedDealerCredit.store_name}" berhasil disimpan! ${isSpecialDealerInput ? '⭐ Status: Dealer Khusus (' + specialTierInput + ')' : '⚪ Status: Dealer Reguler'}. Termin Kredit: ${termDays} Hari.`);
  };

  // Save Payment & COD Settings Handler
  const handleSaveCodSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCodSettings(true);

    try {
      const payload: any = {
        id: 'default',
        bank_name: paymentSettings.bank_name || 'BCA (Bank Central Asia)',
        bank_account_number: paymentSettings.bank_account_number || '829-019-8821',
        bank_account_name: paymentSettings.bank_account_name || 'PT DISTRIBUSI AKSESORIS PRIMA',
        cbd_enabled: paymentSettings.cbd_enabled ?? true,
        cbd_term_label: paymentSettings.cbd_term_label || 'Transfer Bank Manual (CBD - Cash Before Delivery)',
        cbd_instructions: paymentSettings.cbd_instructions || '',
        cod_enabled: paymentSettings.cod_enabled,
        cod_term_days: paymentSettings.cod_term_days,
        cod_term_label: paymentSettings.cod_term_label,
        cod_max_amount: paymentSettings.cod_max_amount,
        cod_policy_terms: paymentSettings.cod_policy_terms,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase
        .from('payment_settings')
        .upsert(payload);

      if (error && (error.message?.includes('bank_') || error.message?.includes('cbd_'))) {
        console.warn('Retrying payment_settings upsert without bank columns pending migration...');
        delete payload.bank_name;
        delete payload.bank_account_number;
        delete payload.bank_account_name;
        delete payload.cbd_enabled;
        delete payload.cbd_term_label;
        delete payload.cbd_instructions;
        const retry = await supabase.from('payment_settings').upsert(payload);
        error = retry.error;
        if (!error) {
          alert("Pengaturan COD berhasil disimpan!\n\nCatatan: Kolom rekening bank CBD belum ada di database Supabase Anda. Jalankan skrip SQL 'update_promo_and_payment_bank.sql' di Supabase SQL Editor.");
          return;
        }
      }

      if (error) throw error;
      alert("Pengaturan Pembayaran, Rekening Bank (CBD), dan Termin COD berhasil disimpan ke database!");
    } catch (err: any) {
      alert("Gagal menyimpan pengaturan: " + (err.message || 'Pastikan skrip SQL update_promo_and_payment_bank.sql sudah dijalankan di Supabase.'));
    } finally {
      setIsSavingCodSettings(false);
    }
  };

  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newOwnerId || !newRegionId) return;

    const parsedLimit = parseFloat(newCreditLimit) || 0;
    const newDlr: any = {
      store_name: newStoreName,
      profile_id: newOwnerId,
      region_id: newRegionId,
      address: newAddress,
      credit_limit: parsedLimit,
      is_credit_eligible: newIsCreditEligible,
      credit_status: newIsCreditEligible ? 'ACTIVE' : 'DISABLED',
      credit_term_days: parseInt(newCreditTermDays, 10) || 15,
      is_special_dealer: newIsSpecialDealer,
      special_dealer_tier: newIsSpecialDealer ? newSpecialTier : 'REGULAR',
      special_discount_percentage: newIsSpecialDealer ? parseFloat(newSpecialDiscount) || 0 : 0,
      status: 'ACTIVE',
    };
    if (newSalesId) newDlr.sales_id = newSalesId;

    let { data, error } = await supabase.from('dealers').insert([newDlr]).select('*, profiles(full_name), regions(name), sales(id, profiles(full_name))');

    if (error && (error.message?.includes('is_credit_eligible') || error.message?.includes('is_special_dealer') || error.code === '42703')) {
      delete newDlr.is_credit_eligible;
      delete newDlr.credit_status;
      delete newDlr.credit_term_days;
      delete newDlr.is_special_dealer;
      delete newDlr.special_dealer_tier;
      delete newDlr.special_discount_percentage;
      const fb = await supabase.from('dealers').insert([newDlr]).select('*, profiles(full_name), regions(name), sales(id, profiles(full_name))');
      data = fb.data;
      error = fb.error;
    }

    if (!error && data) {
      setDealers([data[0] as any, ...dealers]);
      setIsModalOpen(false);
      setNewStoreName('');
      setNewAddress('');
      setNewCreditLimit('0');
      setNewIsCreditEligible(false);
      setNewIsSpecialDealer(false);
      setNewSalesId('');
      alert("Dealer baru berhasil ditambahkan.");
    } else {
      alert("Gagal menambahkan dealer: " + (error?.message || 'Error'));
    }
  };

  const handleDeleteDealer = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus dealer ini?")) {
      const { error } = await supabase.from('dealers').delete().eq('id', id);
      if (!error) {
        setDealers(dealers.filter(d => d.id !== id));
      } else {
        alert("Gagal menghapus dealer.");
      }
    }
  };

  // Approve dealer registration
  const handleApproveProfile = async (profileId: string, storeName: string) => {
    if (!confirm(`Setujui pendaftaran "${storeName}"?`)) return;
    
    await supabase.from('profiles').update({ approval_status: 'APPROVED', role: 'DEALER' }).eq('id', profileId);
    
    const { data: existingDealer } = await supabase.from('dealers').select('id').eq('profile_id', profileId).maybeSingle();
    
    if (existingDealer) {
      await supabase.from('dealers').update({ status: 'ACTIVE' }).eq('profile_id', profileId);
    } else {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single();
      await supabase.from('dealers').insert({
        profile_id: profileId,
        store_name: profile?.company_name || storeName || 'Toko Baru',
        address: profile?.address || '',
        credit_limit: 0,
        is_credit_eligible: false,
        status: 'ACTIVE',
      });
    }
    
    fetchData();
  };

  // Filtered dealers calculation
  // Filtered dealers calculation
  const filteredDealers = dealers.filter((d) => {
    const regName = d.regions?.name || '';
    const matchesRegion = selectedRegionFilter === 'Semua Wilayah' || regName === selectedRegionFilter;
    const matchesSearch = d.store_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCredit = true;
    const hasCredit = Boolean(d.is_credit_eligible || d.credit_status === 'ACTIVE' || (d.credit_limit && d.credit_limit > 0));
    if (selectedCreditFilter === 'CREDIT_ONLY') {
      matchesCredit = hasCredit;
    } else if (selectedCreditFilter === 'REGULAR_ONLY') {
      matchesCredit = !hasCredit;
    }

    let matchesType = true;
    if (selectedTypeFilter === 'SPECIAL_ONLY') {
      matchesType = Boolean(d.is_special_dealer);
    } else if (selectedTypeFilter === 'REGULAR_ONLY') {
      matchesType = !d.is_special_dealer;
    }

    return matchesRegion && matchesSearch && matchesCredit && matchesType;
  });

  const totalActiveDealers = dealers.filter(d => d.status === 'ACTIVE').length;
  const totalSpecialDealers = dealers.filter(d => d.is_special_dealer).length;
  const totalCreditEligible = dealers.filter(d => d.is_credit_eligible || d.credit_status === 'ACTIVE' || (d.credit_limit && d.credit_limit > 0)).length;
  const totalPlafonKredit = dealers.reduce((sum, d) => sum + (d.credit_limit || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm">
              <Store size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Dealer & Kredit</h1>
              <p className="text-xs text-slate-500 font-medium">Kelola Dealer Khusus (VIP), harga & diskon khusus, termin kredit (15/30 hari), serta kebijakan COD.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Tambah Dealer
          </button>
        </div>
      </div>

      {/* STATISTIK RINGKAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Store size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dealer</p>
            <p className="text-xl font-black text-slate-900">{totalActiveDealers} <span className="text-xs font-semibold text-slate-400">Toko</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex items-center gap-3 bg-gradient-to-br from-white to-amber-50/30">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Star size={20} className="fill-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Dealer Khusus</p>
            <p className="text-xl font-black text-amber-700">{totalSpecialDealers} <span className="text-xs font-semibold text-amber-500">VIP</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mitra Kredit</p>
            <p className="text-xl font-black text-purple-600">{totalCreditEligible} <span className="text-xs font-semibold text-slate-400">Dealer</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Plafon</p>
            <p className="text-lg font-black text-slate-900">Rp {(totalPlafonKredit / 1000000).toFixed(1)}M</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Termin COD</p>
            <p className="text-xs font-black text-orange-700 leading-tight mt-0.5 line-clamp-1">{paymentSettings.cod_term_label}</p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGASI */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 size={16} />
          Dealer Aktif & Limit Kredit
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${
            activeTab === 'active' ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {filteredDealers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cod_settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'cod_settings'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CreditCard size={16} />
          Pengaturan Bank (CBD) & COD
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50 hover:text-amber-700'
          }`}
        >
          <Clock size={16} />
          Menunggu Persetujuan
          {pendingProfiles.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === 'pending' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'
            }`}>
              {pendingProfiles.length}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DEALER AKTIF & LIMIT KREDIT                       */}
      {/* ======================================================== */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input 
                type="text" 
                placeholder="Cari dealer (Nama Toko, Pemilik)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
              />
            </div>

            {/* Filter Wilayah */}
            <div className="relative min-w-[200px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select 
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option>Semua Wilayah</option>
                {regions.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Status Dealer Khusus */}
            <div className="relative min-w-[210px]">
              <Star className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={16} />
              <select 
                value={selectedTypeFilter}
                onChange={(e: any) => setSelectedTypeFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Kemitraan</option>
                <option value="SPECIAL_ONLY">⭐ Dealer Khusus Saja ({totalSpecialDealers})</option>
                <option value="REGULAR_ONLY">⚪ Dealer Reguler Saja</option>
              </select>
            </div>

            {/* Filter Hak Akses Kredit */}
            <div className="relative min-w-[210px]">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select 
                value={selectedCreditFilter}
                onChange={(e) => setSelectedCreditFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="ALL">Semua Tipe Akses</option>
                <option value="CREDIT_ONLY">💎 Berhak Kredit Saja ({totalCreditEligible})</option>
                <option value="REGULAR_ONLY">⚪ Dealer Reguler (Biasa)</option>
              </select>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200/70">
                  <th className="p-4 pl-6">ID / Toko</th>
                  <th className="p-4">Pemilik & Wilayah</th>
                  <th className="p-4">Ketentuan Khusus</th>
                  <th className="p-4">Termin Kredit (TOP)</th>
                  <th className="p-4">Plafon & Sisa Limit</th>
                  <th className="p-4 pr-6 text-right">Aksi Pengaturan</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">Memuat data dealer...</td></tr>
                ) : filteredDealers.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400">Tidak ada dealer yang sesuai kriteria.</td></tr>
                ) : filteredDealers.map((dealer) => {
                  const isSpecial = Boolean(dealer.is_special_dealer);
                  const hasCredit = Boolean(dealer.is_credit_eligible || dealer.credit_status === 'ACTIVE' || (dealer.credit_limit && dealer.credit_limit > 0));
                  const limit = Number(dealer.credit_limit || 0);
                  const used = Number(dealer.outstanding_balance || 0);
                  const remaining = Math.max(0, limit - used);
                  const termDays = dealer.credit_term_days || 15;

                  return (
                    <tr key={dealer.id} className="hover:bg-emerald-50/20 transition-colors group">
                      {/* Toko & Badge Kemitraan */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{dealer.store_name}</p>
                          {isSpecial && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs">
                              <Star size={10} className="fill-white" /> {dealer.special_dealer_tier || 'VIP'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{dealer.id.substring(0, 8)}...</p>
                        {isSpecial && Number(dealer.special_discount_percentage || 0) > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Percent size={9} /> Diskon Khusus {dealer.special_discount_percentage}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Pemilik & Wilayah */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-0.5">
                          <Users size={14} className="text-slate-400" /> {dealer.profiles?.full_name || 'Tanpa Pemilik'}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                          <MapPin size={12} className="text-emerald-500" /> {dealer.regions?.name || 'Belum Diatur'}
                        </div>
                        {dealer.sales?.profiles?.full_name && (
                          <span className="inline-block mt-1 text-[11px] font-semibold text-blue-700">
                            PIC: {dealer.sales.profiles.full_name}
                          </span>
                        )}
                      </td>

                      {/* Ketentuan Khusus & Akses */}
                      <td className="p-4">
                        {isSpecial ? (
                          <div className="space-y-1">
                            {dealer.special_pricing_notes ? (
                              <p className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 inline-block">
                                🏷️ {dealer.special_pricing_notes}
                              </p>
                            ) : (
                              <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                                <Award size={13} /> Hak Istimewa Aktif
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {dealer.special_access_permissions?.priority_stock && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">⚡ Prioritas Stok</span>
                              )}
                              {dealer.special_access_permissions?.waive_min_order && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">✨ Bebas Min Order</span>
                              )}
                              {dealer.special_access_permissions?.exclusive_catalog && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">🎁 Akses Eksklusif</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">⚪ Dealer Reguler</span>
                        )}
                      </td>

                      {/* Termin Kredit (15 Hari / 30 Hari) */}
                      <td className="p-4">
                        {hasCredit ? (
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                              termDays === 15 
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                                : termDays === 30 
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}>
                              <Calendar size={12} />
                              Termin {termDays} Hari {termDays === 15 ? '(15H)' : termDays === 30 ? '(1 Bulan)' : ''}
                            </span>
                            <p className="text-[11px] text-slate-500 font-semibold pl-0.5">Tempo Berjalan (TOP)</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
                            Non-Kredit (Reguler)
                          </span>
                        )}
                      </td>

                      {/* Plafon & Sisa Limit */}
                      <td className="p-4">
                        {hasCredit ? (
                          <div>
                            <p className="text-slate-900 font-bold text-xs">Plafon: Rp {limit.toLocaleString('id-ID')}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-semibold text-slate-400">Sisa:</span>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                                remaining === 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : remaining < (limit * 0.3)
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                Rp {remaining.toLocaleString('id-ID')}
                              </span>
                            </div>
                            {used > 0 && (
                              <p className="text-[10px] text-red-500 font-medium mt-0.5">Terpakai: Rp {used.toLocaleString('id-ID')}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Rp 0 (Non-Kredit)</span>
                        )}
                      </td>

                      {/* Aksi Kelola Dealer Khusus & Kredit */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openCreditModal(dealer, 'special')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all hover:shadow-xs cursor-pointer"
                            title="Atur Ketentuan Dealer Khusus, Harga, Termin & Kredit"
                          >
                            <Star size={13} className="fill-amber-500 text-amber-500" />
                            Atur Khusus & Limit
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteDealer(dealer.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Toko"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center bg-white">
            <span>Menampilkan <b>{filteredDealers.length}</b> dari total {dealers.length} dealer</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PENGATURAN PEMBAYARAN BANK (CBD) & TERMIN COD     */}
      {/* ======================================================== */}
      {activeTab === 'cod_settings' && (
        <div className="space-y-6 max-w-4xl">
          <form onSubmit={handleSaveCodSettings} className="space-y-6">
            {/* KARTU 1: REKENING BANK & CBD (CASH BEFORE DELIVERY) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Rekening Resmi & Transfer Bank Manual (CBD)</h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasi nomor rekening dan instruksi Cash Before Delivery (CBD) yang ditampilkan kepada dealer di checkout mobile app.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 1. Toggle Status CBD */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Aktifkan Metode Transfer Bank Manual (CBD)</p>
                    <p className="text-xs text-slate-500 mt-0.5">Dealer mentransfer pembayaran lunas sebelum pesanan dikirimkan.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.cbd_enabled ?? true}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cbd_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 2. Informasi Bank & Rekening */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      NAMA BANK <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: BCA (Bank Central Asia)"
                      value={paymentSettings.bank_name || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Nama bank penerima transfer resmi perusahaan.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      NOMOR REKENING <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: 829-019-8821"
                      value={paymentSettings.bank_account_number || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_account_number: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Nomor rekening tujuan transfer yang dapat disalin dealer.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ATAS NAMA REKENING (BENEFICIARY) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: PT DISTRIBUSI AKSESORIS PRIMA"
                      value={paymentSettings.bank_account_name || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_account_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Nama resmi pemegang rekening perusahaan.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      LABEL TERMIN CBD DI APLIKASI
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Transfer Bank Manual (CBD - Cash Before Delivery)"
                      value={paymentSettings.cbd_term_label || ''}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cbd_term_label: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Nama metode pembayaran pada pilihan checkout mobile app.</p>
                  </div>
                </div>

                {/* 3. Instruksi Transfer CBD */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    PETUNJUK & INSTRUKSI TRANSFER CBD
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Instruksi transfer yang ditampilkan kepada dealer..."
                    value={paymentSettings.cbd_instructions || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, cbd_instructions: e.target.value })}
                    className="w-full p-4 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Instruksi langkah transfer dan panduan konfirmasi pembayaran.</p>
                </div>
              </div>
            </div>

            {/* KARTU 2: PENGATURAN TERMIN COD (CASH ON DELIVERY) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                  <Truck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Ketentuan & Pengaturan Termin Pembayaran COD</h2>
                  <p className="text-xs text-slate-500">Tentukan kebijakan pembayaran Cash on Delivery (COD) yang berlaku bagi dealer saat checkout.</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 1. Toggle Status COD */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Aktifkan Metode Pembayaran COD</p>
                    <p className="text-xs text-slate-500 mt-0.5">Jika dinonaktifkan, dealer tidak dapat memilih metode COD saat checkout.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.cod_enabled}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* 2. Pilihan Termin COD & Jatuh Tempo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      LABEL TERMIN PEMBAYARAN COD <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Bayar Saat Terima Barang (H+0)"
                      value={paymentSettings.cod_term_label}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_term_label: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Label ini akan tampil di layar pemilihan metode pembayaran mobile app.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      JATUH TEMPO HARI (TENOR COD) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select 
                        value={paymentSettings.cod_term_days}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_term_days: parseInt(e.target.value, 10) })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value={0}>0 Hari (Langsung Bayar Saat Barang Tiba)</option>
                        <option value={1}>1 Hari (Tempo 24 Jam)</option>
                        <option value={3}>3 Hari (Tempo 3 Hari Kerja)</option>
                        <option value={7}>7 Hari (Tempo 1 Minggu)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Waktu batas toleransi pelunasan setelah kurir menyerahkan pesanan.</p>
                  </div>
                </div>

                {/* 3. Batas Maksimal Order COD */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    BATAS MAKSIMAL NOMINAL PESANAN COD (LIMIT COD)
                  </label>
                  <div className="relative max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                    <input 
                      type="number" 
                      min="0"
                      step="100000"
                      value={paymentSettings.cod_max_amount}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_max_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Pesanan di atas nominal ini tidak dapat menggunakan COD (wajib Transfer Bank atau Kredit).</p>
                </div>

                {/* 4. Teks Kebijakan & Ketentuan Tertulis COD */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    KETENTUAN & KEBIJAKAN TERTULIS COD PERUSAHAAN <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    rows={5}
                    required
                    value={paymentSettings.cod_policy_terms}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, cod_policy_terms: e.target.value })}
                    className="w-full p-4 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Teks ini akan ditampilkan secara transparan di popup dan kotak rincian checkout mobile app.</p>
                </div>
              </div>
            </div>

            {/* TOMBOL SIMPAN */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingCodSettings}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check size={18} /> {isSavingCodSettings ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan Pembayaran (CBD & COD)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PENDING APPROVAL REGISTRATIONS                    */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Memuat data...</div>
          ) : pendingProfiles.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-300 mb-3" />
              <p className="text-slate-600 font-bold">Tidak ada pendaftaran yang menunggu persetujuan.</p>
              <p className="text-xs text-slate-400 mt-1">Semua pendaftar dealer telah diproses.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200/70">
                  <th className="p-4 pl-6">Nama & Kontak</th>
                  <th className="p-4">Nama Toko</th>
                  <th className="p-4">Alamat</th>
                  <th className="p-4">Tgl Daftar</th>
                  <th className="p-4 pr-6 text-right">Persetujuan</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {pendingProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-900">{p.full_name}</p>
                      <p className="text-xs text-slate-500">{p.phone_number}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{p.company_name || 'Toko Baru'}</td>
                    <td className="p-4 text-xs text-slate-500 max-w-[250px] truncate">{p.address || '-'}</td>
                    <td className="p-4 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleApproveProfile(p.id, p.company_name)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        Setujui Dealer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PENGATURAN DEALER KHUSUS, TERMIN & KREDIT          */}
      {/* ======================================================== */}
      {isCreditModalOpen && selectedDealerCredit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-xl shadow-xs">
                  <Star size={20} className="fill-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pengaturan Dealer Khusus & Kredit</h2>
                  <p className="text-xs text-slate-500">{selectedDealerCredit.store_name} ({selectedDealerCredit.profiles?.full_name || 'Dealer'})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreditModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Sub-Tabs Navigasi Modal */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setModalSubTab('special')}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalSubTab === 'special'
                    ? 'border-amber-500 text-amber-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Star size={14} className={isSpecialDealerInput ? 'fill-amber-500 text-amber-500' : ''} />
                ⭐ Dealer Khusus & Harga
                {isSpecialDealerInput && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black">Aktif</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalSubTab('credit')}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalSubTab === 'credit'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard size={14} />
                💳 Termin & Limit Kredit
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px] font-black">
                  {creditTermDaysInput} Hari
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalSubTab('logs')}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  modalSubTab === 'logs'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History size={14} />
                📜 Riwayat Mutasi ({creditLogs.length})
              </button>
            </div>

            <form onSubmit={handleSaveCreditLimit} className="flex-1 overflow-y-auto flex flex-col">
              {/* TAB 1: DEALER KHUSUS & KETENTUAN */}
              {modalSubTab === 'special' && (
                <div className="p-6 space-y-4">
                  {/* Toggle Card Status Dealer Khusus */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isSpecialDealerInput 
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-50/70 border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${isSpecialDealerInput ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          <Star size={20} className={isSpecialDealerInput ? 'fill-white' : ''} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">Status Dealer Khusus</p>
                          <p className="text-xs text-slate-500">
                            {isSpecialDealerInput 
                              ? 'Dealer ini diberikan ketentuan khusus terkait harga, kredit, limit, dan hak akses.'
                              : 'Dealer ini berstatus reguler/biasa (ketentuan standar).'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isSpecialDealerInput} 
                          onChange={(e) => setIsSpecialDealerInput(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {isSpecialDealerInput && (
                      <div className="mt-4 pt-3 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                            TINGKAT / TIER MITRA KHUSUS
                          </label>
                          <select
                            value={specialTierInput}
                            onChange={(e) => setSpecialTierInput(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                          >
                            <option value="VIP">⭐ VIP Partner</option>
                            <option value="PRIORITY">💎 Mitra Prioritas</option>
                            <option value="DISTRIBUTOR">👑 Distributor Utama</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                            DISKON HARGA KHUSUS DEALER (%)
                          </label>
                          <div className="relative">
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                            <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              step="0.5" 
                              placeholder="Contoh: 5 atau 10" 
                              value={specialDiscountInput}
                              onChange={(e) => setSpecialDiscountInput(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ketentuan Harga Khusus */}
                  {isSpecialDealerInput && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Tag size={14} className="text-amber-600" /> KETENTUAN HARGA KHUSUS DEALER
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Diskon 5% All Item, subsidi ongkir 50%, garansi retur diperpanjang"
                        value={specialPricingNotesInput}
                        onChange={(e) => setSpecialPricingNotesInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Ketentuan Hak Akses Tertentu */}
                  {isSpecialDealerInput && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Award size={14} className="text-amber-600" /> HAK AKSES TERTENTU (PRIVILEGE)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-200 cursor-pointer text-xs transition-colors">
                          <input 
                            type="checkbox"
                            checked={specialPermissions.priority_stock}
                            onChange={(e) => setSpecialPermissions({...specialPermissions, priority_stock: e.target.checked})}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <div>
                            <p className="font-bold text-slate-900">⚡ Prioritas Alokasi Stok</p>
                            <p className="text-[10px] text-slate-500">Order toko diprioritaskan gudang saat stok terbatas</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-200 cursor-pointer text-xs transition-colors">
                          <input 
                            type="checkbox"
                            checked={specialPermissions.waive_min_order}
                            onChange={(e) => setSpecialPermissions({...specialPermissions, waive_min_order: e.target.checked})}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <div>
                            <p className="font-bold text-slate-900">✨ Bebas Syarat Min. Order</p>
                            <p className="text-[10px] text-slate-500">Bebas belanja berapapun tanpa batasan kuantiti MOQ</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-200 cursor-pointer text-xs transition-colors">
                          <input 
                            type="checkbox"
                            checked={specialPermissions.exclusive_catalog}
                            onChange={(e) => setSpecialPermissions({...specialPermissions, exclusive_catalog: e.target.checked})}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <div>
                            <p className="font-bold text-slate-900">🎁 Akses Produk Eksklusif</p>
                            <p className="text-[10px] text-slate-500">Katalog promo edisi khusus & pre-order produk baru</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-200 cursor-pointer text-xs transition-colors">
                          <input 
                            type="checkbox"
                            checked={specialPermissions.vip_support}
                            onChange={(e) => setSpecialPermissions({...specialPermissions, vip_support: e.target.checked})}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <div>
                            <p className="font-bold text-slate-900">⭐ Dedicated VIP Support</p>
                            <p className="text-[10px] text-slate-500">Pelayanan prioritas fast-track sales PIC</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Catatan Khusus Perjanjian */}
                  {isSpecialDealerInput && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        CATATAN / NOMOR KONTRAK KESEPAKATAN
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: MoU Kemitraan Khusus No. 082/DAP-VIP/2026"
                        value={specialDealerNotesInput}
                        onChange={(e) => setSpecialDealerNotesInput(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIMIT KREDIT & PILIHAN TERMIN (15 HARI / 30 HARI) */}
              {modalSubTab === 'credit' && (
                <div className="p-6 space-y-4">
                  {/* Info Status Plafon Saat Ini */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Plafon Saat Ini</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        Rp {Number(selectedDealerCredit.credit_limit || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Terpakai (Hutang)</p>
                      <p className="text-base font-black text-red-600 mt-0.5">
                        Rp {Number(selectedDealerCredit.outstanding_balance || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sisa Tersedia</p>
                      <p className="text-base font-black text-emerald-600 mt-0.5">
                        Rp {Math.max(0, (selectedDealerCredit.credit_limit || 0) - (selectedDealerCredit.outstanding_balance || 0)).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* PILIHAN TERMIN KREDIT (15 HARI / 30 HARI) */}
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <label className="block text-xs font-black text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-600" />
                      PILIHAN TERMIN KREDIT JATUH TEMPO (TOP) BERDASARKAN DEALER
                    </label>
                    <p className="text-xs text-indigo-800/80 mb-3">
                      Tentukan termin pembayaran tempo untuk toko ini saat memesan dengan metode Kredit.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-2.5">
                      {/* Pilihan 15 Hari */}
                      <button
                        type="button"
                        onClick={() => setCreditTermDaysInput('15')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          creditTermDaysInput === '15'
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900">⏱️ Termin 15 Hari</span>
                          {creditTermDaysInput === '15' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">Jatuh tempo 15 hari setelah pesanan diproses.</p>
                      </button>

                      {/* Pilihan 30 Hari */}
                      <button
                        type="button"
                        onClick={() => setCreditTermDaysInput('30')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          creditTermDaysInput === '30'
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900">📅 Termin 30 Hari</span>
                          {creditTermDaysInput === '30' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">Jatuh tempo 30 hari (1 bulan) setelah pesanan.</p>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="text-slate-600 font-semibold">Atau pilihan termin lain:</span>
                      <select
                        value={creditTermDaysInput}
                        onChange={(e) => setCreditTermDaysInput(e.target.value)}
                        className="px-2.5 py-1 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 bg-white outline-none cursor-pointer"
                      >
                        <option value="15">15 Hari (Termin 15 Hari)</option>
                        <option value="30">30 Hari (Termin 30 Hari - 1 Bulan)</option>
                        <option value="7">7 Hari (1 Minggu)</option>
                        <option value="45">45 Hari (1.5 Bulan)</option>
                        <option value="60">60 Hari (2 Bulan)</option>
                      </select>
                    </div>
                  </div>

                  {/* Pilihan Aksi Limit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      PILIH AKSI PENGATURAN PLAFON LIMIT
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => setCreditAction('keep')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          creditAction === 'keep'
                            ? 'bg-slate-100 border-slate-500 text-slate-900 ring-2 ring-slate-400/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Check size={16} className="text-slate-600" />
                        Tetap Plafon
                      </button>

                      <button
                        type="button"
                        onClick={() => setCreditAction('increase')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          creditAction === 'increase'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <TrendingUp size={16} className="text-emerald-600" />
                        Naikkan (+)
                      </button>

                      <button
                        type="button"
                        onClick={() => setCreditAction('decrease')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          creditAction === 'decrease'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <TrendingDown size={16} className="text-amber-600" />
                        Kurangi (-)
                      </button>

                      <button
                        type="button"
                        onClick={() => setCreditAction('set')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          creditAction === 'set'
                            ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Sliders size={16} className="text-blue-600" />
                        Set Plafon
                      </button>

                      <button
                        type="button"
                        onClick={() => setCreditAction('disable')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          creditAction === 'disable'
                            ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-500/20'
                            : 'border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        <ShieldAlert size={16} className="text-red-600" />
                        Hapus Akses
                      </button>
                    </div>
                  </div>

                  {/* Input Jumlah Nominal (jika bukan keep atau disable) */}
                  {creditAction !== 'keep' && creditAction !== 'disable' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {creditAction === 'increase' ? 'NOMINAL PENAMBAHAN (+)' : creditAction === 'decrease' ? 'NOMINAL PENGURANGAN (-)' : 'NOMINAL PLAFON BARU'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                        <input 
                          type="number" 
                          required
                          min="0"
                          step="500000"
                          placeholder="Contoh: 5000000"
                          value={creditAmountInput}
                          onChange={(e) => setCreditAmountInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {creditAction === 'disable' && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Akses Kredit Akan Dicabut</p>
                        <p className="mt-0.5">Dealer ini tidak akan lagi dapat memesan dengan Kredit/Tempo saat checkout dan hanya bertransaksi secara reguler.</p>
                      </div>
                    </div>
                  )}

                  {/* Catatan / Alasan Mutasi Limit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      ALASAN / CATATAN PERSETUJUAN
                    </label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Pengaturan termin kredit & kesepakatan plafon belanja"
                      value={creditNotesInput}
                      onChange={(e) => setCreditNotesInput(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: RIWAYAT MUTASI */}
              {modalSubTab === 'logs' && (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    RIWAYAT MUTASI LIMIT & TERMIN TOKO INI
                  </h4>

                  {isLoadingLogs ? (
                    <div className="text-center py-6 text-slate-400 text-xs">Memuat riwayat mutasi...</div>
                  ) : creditLogs.length === 0 ? (
                    <div className="text-center py-6 bg-white rounded-xl border border-slate-200/80 p-4">
                      <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Perubahan Limit</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Setiap perubahan limit kredit dealer akan tercatat kronologis di sini.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {creditLogs.map((log) => {
                        const isInc = log.action === 'INCREASE';
                        const isDec = log.action === 'DECREASE';
                        const isDis = log.action === 'DISABLE';

                        return (
                          <div key={log.id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={isInc ? 'text-emerald-700' : isDec ? 'text-amber-700' : isDis ? 'text-red-700' : 'text-blue-700'}>
                                  {isInc ? '▲ Naik Limit' : isDec ? '▼ Turun Limit' : isDis ? '✖ Nonaktif' : '● Set Plafon'}
                                </span>
                                <span className="text-slate-700">Rp {Number(log.current_limit).toLocaleString('id-ID')}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">{log.notes || '-'} • Oleh: {log.changed_by || 'Admin'}</p>
                            </div>
                            <div className="text-right text-slate-400 text-[11px]">
                              {new Date(log.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Footer Modal Action */}
              <div className="p-4 px-6 border-t border-slate-200 bg-white flex justify-between items-center mt-auto">
                <div className="text-xs text-slate-500">
                  Status: {isSpecialDealerInput ? <b className="text-amber-700">⭐ Dealer Khusus</b> : <b>⚪ Dealer Reguler</b>}
                  {' • '}Termin: <b className="text-indigo-700">{creditTermDaysInput} Hari</b>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreditModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCredit}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingCredit ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH DEALER                                      */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Dealer Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors cursor-pointer">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleAddDealer} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide">NAMA TOKO <span className="text-red-500">*</span></label>
                <input 
                  type="text" required value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide">PEMILIK (PROFILE) <span className="text-red-500">*</span></label>
                  <select 
                    value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800"
                  >
                    {profiles.map((prof) => (
                      <option key={prof.id} value={prof.id}>{prof.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide">WILAYAH <span className="text-red-500">*</span></label>
                  <select 
                    value={newRegionId} onChange={(e) => setNewRegionId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800"
                  >
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>{reg.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Dealer Khusus Checkbox */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Star size={13} className="fill-amber-600 text-amber-600" /> Tetapkan Sebagai Dealer Khusus?
                    </p>
                    <p className="text-[11px] text-amber-700/80">Diberikan ketentuan harga, diskon, & hak akses istimewa.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={newIsSpecialDealer}
                    onChange={(e) => setNewIsSpecialDealer(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                </div>

                {newIsSpecialDealer && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/60 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">TIER KEMITRAAN</label>
                      <select
                        value={newSpecialTier}
                        onChange={(e) => setNewSpecialTier(e.target.value)}
                        className="w-full px-3 py-1.5 border border-amber-200 rounded-lg text-xs font-bold bg-white"
                      >
                        <option value="VIP">⭐ VIP Partner</option>
                        <option value="PRIORITY">💎 Mitra Prioritas</option>
                        <option value="DISTRIBUTOR">👑 Distributor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">DISKON KHUSUS (%)</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Contoh: 5"
                        value={newSpecialDiscount}
                        onChange={(e) => setNewSpecialDiscount(e.target.value)}
                        className="w-full px-3 py-1.5 border border-amber-200 rounded-lg text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Hak Akses Kredit Switch & Pilihan Termin (15 Hari / 30 Hari) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Berikan Hak Akses Kredit?</p>
                    <p className="text-[11px] text-slate-400">Pilih jika dealer diperbolehkan memesan dengan Tempo/Kredit.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={newIsCreditEligible}
                    onChange={(e) => setNewIsCreditEligible(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {newIsCreditEligible && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 mt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">PLAFON KREDIT AWAL</label>
                      <input 
                        type="number"
                        min="0"
                        value={newCreditLimit}
                        onChange={(e) => setNewCreditLimit(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">PILIHAN TERMIN (TOP)</label>
                      <select
                        value={newCreditTermDays}
                        onChange={(e) => setNewCreditTermDays(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white cursor-pointer"
                      >
                        <option value="15">⏱️ 15 Hari (Termin 15 Hari)</option>
                        <option value="30">📅 30 Hari (Termin 30 Hari / 1 Bulan)</option>
                        <option value="7">7 Hari (1 Minggu)</option>
                        <option value="45">45 Hari (1.5 Bulan)</option>
                        <option value="60">60 Hari (2 Bulan)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide">SALES PIC (OPSIONAL)</label>
                <select 
                  value={newSalesId} onChange={(e) => setNewSalesId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-gray-800"
                >
                  <option value="">-- Tanpa Sales PIC --</option>
                  {salesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wide">ALAMAT TOKO</label>
                <textarea 
                  value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={2.5} /> Simpan Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
