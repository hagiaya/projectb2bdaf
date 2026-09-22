'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  Gift,
  Plane,
  Coins,
  Package,
  Calendar,
  Users,
  Eye,
  X,
  MessageCircle,
  Edit2,
  Send,
  Trash2,
  Sliders,
  Store,
  Tag,
  Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SupportItem {
  id: string;
  code: string;
  name: string;
  min_purchase: number;
  dimensions?: string;
  category?: string;
  description?: string;
  image_url?: string;
}

const DEFAULT_SUPPORT_ITEMS: SupportItem[] = [
  {
    id: 'dlp13',
    code: 'DLP13',
    name: 'KURSI PLASTIK DAP',
    min_purchase: 500000,
    dimensions: 'Standar Kursi Plastik Toko',
    category: 'Fasilitas Toko',
    description: 'Kursi plastik hijau branding DAP resmi untuk kenyamanan ruang tunggu pelanggan toko Anda.',
  },
  {
    id: 'dlp16',
    code: 'DLP16',
    name: 'RAK MINI (Smart Accessories Center)',
    min_purchase: 2500000,
    dimensions: 'Display Meja Kasir Akrilik',
    category: 'Display Meja',
    description: 'Rak display meja akrilik hijau DAP untuk gantungan aksesoris kabel, charger, dan earphone di depan kasir.',
  },
  {
    id: 'logo-gantung',
    code: 'LOGO GANTUNG',
    name: 'LOGO GANTUNG DAP',
    min_purchase: 3500000,
    dimensions: '120cm x 30.5cm',
    category: 'Signage Plafon',
    description: 'Signage gantung akrilik resmi DAP Accessories berlampu untuk digantung di langit-langit toko.',
  },
  {
    id: 'dlp30',
    code: 'DLP30',
    name: 'RAK PUTAR',
    min_purchase: 4500000,
    dimensions: 'Rak Putar Multi-Sisi Portable',
    category: 'Display Lantai',
    description: 'Rak display putar modern untuk gantungan produk handsfree, case, dan tempered glass 360 derajat.',
  },
  {
    id: 'dlp09',
    code: 'DLP09',
    name: 'RAK DINDING',
    min_purchase: 5000000,
    dimensions: 'Tinggi 100cm x Lebar 100cm',
    category: 'Display Dinding',
    description: 'Panel besi ram hitam kokoh dengan header hijau DAP untuk menempel rapi di dinding toko.',
  },
  {
    id: 'dlp01',
    code: 'DLP01',
    name: 'RAK BESAR',
    min_purchase: 6000000,
    dimensions: 'Tinggi 220cm x Lebar 100cm',
    category: 'Display Lantai',
    description: 'Rak display floorstanding 220cm dengan ram besi gantung, papan ambalan bawah, dan header DAP.',
  },
  {
    id: 'dlp14',
    code: 'DLP14',
    name: 'RUNNING TEXT (NOW OPEN DAP LED)',
    min_purchase: 6000000,
    dimensions: '130cm x 20cm',
    category: 'Signage Digital',
    description: 'Layar display running text digital LED merah terang 130cm x 20cm bertuliskan NOW OPEN & DAP DAY DAY UP.',
  },
  {
    id: 'dlp17',
    code: 'DLP17',
    name: 'RAK JUMBO',
    min_purchase: 8000000,
    dimensions: 'Tinggi 240cm x Lebar 100cm',
    category: 'Display Lantai',
    description: 'Rak display jumbo tertinggi 240cm dengan kapasitas display aksesoris terlengkap dan ambalan display produk.',
  },
  {
    id: 'dlp18',
    code: 'DLP18',
    name: 'RAK TENGAH',
    min_purchase: 10000000,
    dimensions: '1280mm x 900mm x 750mm',
    category: 'Display Island',
    description: 'Gondola display island tingkat 5 mewah untuk diletakkan di tengah toko dengan branding DAP.',
  },
  {
    id: 'etalase-showcase',
    code: 'ETALASE SHOWCASE',
    name: 'ETALASE SHOWCASE DAP',
    min_purchase: 25000000,
    dimensions: '110cm x 120cm x 50cm',
    category: 'Etalase Showcase',
    description: 'Etalase kaca display showcase mewah resmi DAP berlogo akrilik hijau dengan lampu LED display dan kunci pengaman.',
  },
];

interface DealerProgram {
  id: string;
  title: string;
  program_type: 'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK';
  description: string;
  target_amount: number;
  reward_description: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  created_at: string;
  participants_count?: number;
  achieved_count?: number;
  support_items?: SupportItem[];
}

interface Participant {
  id: string;
  program_id: string;
  dealer_id: string;
  enrolled_at: string;
  current_progress_amount: number;
  status: 'ENROLLED' | 'ACHIEVED' | 'CLAIMED' | 'REJECTED';
  claim_notes?: string;
  admin_notes?: string;
  claimed_at?: string;
  approved_at?: string;
  selected_item_id?: string;
  selected_item_name?: string;
  selected_item_qty?: number;
  custom_target_amount?: number;
  dealers?: {
    id: string;
    store_name: string;
    address: string;
    profiles?: {
      full_name: string;
      phone_number: string;
    };
  };
  dealer_programs?: DealerProgram;
}

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState<'programs' | 'participants'>('programs');
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<DealerProgram[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Filter States
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modal Create / Edit Program
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK'>('BARANG_SUPPORT');
  const [formTarget, setFormTarget] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formStartDate, setFormStartDate] = useState('2026-09-01');
  const [formEndDate, setFormEndDate] = useState('2026-12-31');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Kelola Support Items (Etalase & Display)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [activeProgramForSupport, setActiveProgramForSupport] = useState<DealerProgram | null>(null);
  const [supportItemsList, setSupportItemsList] = useState<SupportItem[]>(DEFAULT_SUPPORT_ITEMS);
  const [isSavingSupportItems, setIsSavingSupportItems] = useState(false);
  
  // Form tambah item support baru
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newMinPurchase, setNewMinPurchase] = useState('');
  const [newDimensions, setNewDimensions] = useState('');
  const [newCategory, setNewCategory] = useState('Display Toko');
  const [newDesc, setNewDesc] = useState('');

  // Modal Verification / Claim Approval
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch programs
      const { data: progData, error: progErr } = await supabase
        .from('dealer_programs')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch participants
      const { data: partData, error: partErr } = await supabase
        .from('dealer_program_participants')
        .select('*, dealers(id, store_name, address, profiles(full_name, phone_number)), dealer_programs(*)')
        .order('enrolled_at', { ascending: false });

      if (progData && !progErr) {
        const enrichedPrograms: DealerProgram[] = (progData as unknown as DealerProgram[]).map((prog) => {
          const progParticipants = (partData || []).filter(
            (p: { program_id: string }) => p.program_id === prog.id
          );
          const achievedCount = progParticipants.filter(
            (p: { status: string }) => p.status === 'ACHIEVED' || p.status === 'CLAIMED'
          ).length;

          // Merge support_items with default catalog if BARANG_SUPPORT
          let items = prog.support_items;
          if (prog.program_type === 'BARANG_SUPPORT' && (!items || items.length === 0)) {
            items = DEFAULT_SUPPORT_ITEMS;
          }

          return {
            ...prog,
            participants_count: progParticipants.length,
            achieved_count: achievedCount,
            support_items: items,
          };
        });
        setPrograms(enrichedPrograms);
      }

      if (partData && !partErr) {
        setParticipants(partData as unknown as Participant[]);
      }
    } catch (err) {
      console.error('Error fetching programs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSupportModal = (prog: DealerProgram) => {
    setActiveProgramForSupport(prog);
    setSupportItemsList(prog.support_items && prog.support_items.length > 0 ? prog.support_items : DEFAULT_SUPPORT_ITEMS);
    setIsSupportModalOpen(true);
  };

  const handleAddItemToSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !newMinPurchase) return;

    const minAmount = parseFloat(newMinPurchase.replace(/[^0-9]/g, '')) || 0;
    const newItem: SupportItem = {
      id: 'item-' + Date.now(),
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      min_purchase: minAmount,
      dimensions: newDimensions.trim() || 'Standar Toko',
      category: newCategory,
      description: newDesc.trim() || undefined,
    };

    setSupportItemsList([...supportItemsList, newItem]);
    setNewCode('');
    setNewName('');
    setNewMinPurchase('');
    setNewDimensions('');
    setNewDesc('');
  };

  const handleDeleteSupportItem = (id: string) => {
    if (confirm('Hapus produk support ini dari katalog?')) {
      setSupportItemsList(supportItemsList.filter((item) => item.id !== id));
    }
  };

  const handleUpdateItemMinPurchase = (id: string, newAmountStr: string) => {
    const val = parseFloat(newAmountStr.replace(/[^0-9]/g, '')) || 0;
    setSupportItemsList(
      supportItemsList.map((item) => (item.id === id ? { ...item, min_purchase: val } : item))
    );
  };

  const handleSaveSupportItems = async () => {
    if (!activeProgramForSupport) return;
    setIsSavingSupportItems(true);

    try {
      const { error } = await supabase
        .from('dealer_programs')
        .update({ support_items: supportItemsList })
        .eq('id', activeProgramForSupport.id);

      if (error) {
        console.warn('Could not update support_items column in Supabase (run update_program_support_catalog.sql):', error.message);
      }

      // Update local state
      setPrograms(
        programs.map((p) =>
          p.id === activeProgramForSupport.id
            ? { ...p, support_items: supportItemsList }
            : p
        )
      );

      alert('Katalog Produk Support & Minimal Pembelian berhasil disimpan!');
      setIsSupportModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal menyimpan: ' + msg);
    } finally {
      setIsSavingSupportItems(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formTarget || !formReward) {
      alert('Harap lengkapi judul, target, dan deskripsi reward.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: formTitle.trim(),
        program_type: formType,
        target_amount: parseFloat(formTarget),
        reward_description: formReward.trim(),
        description: formDescription.trim(),
        banner_url: formBanner.trim() || null,
        start_date: formStartDate,
        end_date: formEndDate,
        status: 'ACTIVE',
      };

      if (formType === 'BARANG_SUPPORT') {
        payload.support_items = DEFAULT_SUPPORT_ITEMS;
      }

      if (editingProgramId) {
        const { error } = await supabase
          .from('dealer_programs')
          .update(payload)
          .eq('id', editingProgramId);
        if (error) throw error;
        setPrograms(programs.map((p) => (p.id === editingProgramId ? { ...p, ...payload } : p)));
      } else {
        const { data, error } = await supabase
          .from('dealer_programs')
          .insert([payload])
          .select();
        if (!error && data) {
          setPrograms([{ ...(data[0] as DealerProgram), participants_count: 0, achieved_count: 0 }, ...programs]);
        } else {
          const newProg: DealerProgram = {
            ...(payload as unknown as DealerProgram),
            id: 'prog-' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            participants_count: 0,
            achieved_count: 0,
          };
          setPrograms([newProg, ...programs]);
        }
      }

      setIsProgramModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal menyimpan program: ' + msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (program: DealerProgram) => {
    const newStatus = program.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await supabase.from('dealer_programs').update({ status: newStatus }).eq('id', program.id);
    setPrograms(programs.map((p) => (p.id === program.id ? { ...p, status: newStatus } : p)));
  };

  const openEditProgram = (prog: DealerProgram) => {
    setEditingProgramId(prog.id);
    setFormTitle(prog.title);
    setFormType(prog.program_type);
    setFormTarget(prog.target_amount.toString());
    setFormReward(prog.reward_description);
    setFormDescription(prog.description || '');
    setFormBanner(prog.banner_url || '');
    setFormStartDate(prog.start_date);
    setFormEndDate(prog.end_date);
    setIsProgramModalOpen(true);
  };

  const resetForm = () => {
    setEditingProgramId(null);
    setFormTitle('');
    setFormType('BARANG_SUPPORT');
    setFormTarget('');
    setFormReward('');
    setFormDescription('');
    setFormBanner('');
    setFormStartDate('2026-09-01');
    setFormEndDate('2026-12-31');
  };

  const handleProcessClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;

    setApprovalSubmitting(true);
    try {
      const newStatus = approvalDecision === 'APPROVE' ? 'CLAIMED' : 'REJECTED';
      const payload: Record<string, unknown> = {
        status: newStatus,
        admin_notes: adminNotes.trim(),
        approved_at: new Date().toISOString(),
      };

      await supabase
        .from('dealer_program_participants')
        .update(payload)
        .eq('id', selectedParticipant.id);

      setParticipants(
        participants.map((p) =>
          p.id === selectedParticipant.id ? { ...p, ...payload } : p
        )
      );

      setSelectedParticipant(null);
      setAdminNotes('');
      alert(`Klaim hadiah berhasil di-${approvalDecision === 'APPROVE' ? 'setujui' : 'tolak'}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal memproses klaim: ' + msg);
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BARANG_SUPPORT':
        return {
          label: 'Barang Support Toko',
          icon: Package,
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
        };
      case 'TRIP':
        return {
          label: 'Trip Liburan',
          icon: Plane,
          bg: 'bg-sky-50',
          text: 'text-sky-800',
          border: 'border-sky-200',
        };
      case 'CASHBACK':
        return {
          label: 'Cashback Tunai',
          icon: Coins,
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
        };
      default:
        return {
          label: type,
          icon: Award,
          bg: 'bg-slate-50',
          text: 'text-slate-800',
          border: 'border-slate-200',
        };
    }
  };

  const getParticipantStatusBadge = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return {
          label: 'Sedang Berjalan',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
        };
      case 'ACHIEVED':
        return {
          label: 'Target Tercapai 🎉',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        };
      case 'CLAIMED':
        return {
          label: 'Hadiah Dikirim / Selesai',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
        };
      case 'REJECTED':
        return {
          label: 'Klaim Ditolak',
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
        };
    }
  };

  const filteredPrograms = programs.filter((p) => {
    if (selectedTypeFilter !== 'ALL' && p.program_type !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.reward_description.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredParticipants = participants.filter((part) => {
    if (selectedProgramFilter !== 'ALL' && part.program_id !== selectedProgramFilter) return false;
    if (selectedStatusFilter !== 'ALL' && part.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const storeMatch = part.dealers?.store_name?.toLowerCase().includes(q);
      const ownerMatch = part.dealers?.profiles?.full_name?.toLowerCase().includes(q);
      const progMatch = part.dealer_programs?.title?.toLowerCase().includes(q);
      return storeMatch || ownerMatch || progMatch;
    }
    return true;
  });

  const totalActivePrograms = programs.filter((p) => p.status === 'ACTIVE').length;
  const totalParticipants = participants.length;
  const achievedTotal = participants.filter((p) => p.status === 'ACHIEVED').length;
  const pendingClaims = participants.filter((p) => p.status === 'CLAIMED' && !p.approved_at).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-sm">
              <Award size={26} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Program & Target Dealer
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Kelola program reward toko: Katalog Etalase & Display Support, Trip Liburan, dan Cashback.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsProgramModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Buat Program Baru
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Program Aktif</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalActivePrograms} Program</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dealer Bergabung</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalParticipants} Outlet</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tembus Target</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{achievedTotal} Toko</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <Gift size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Klaim Diajukan</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5">
              {pendingClaims || participants.filter((p) => p.status === 'CLAIMED').length} Hadiah
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
            activeTab === 'programs'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award size={18} />
          Katalog Program ({programs.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
            activeTab === 'participants'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users size={18} />
          Monitoring Peserta & Klaim ({participants.length})
        </button>
      </div>

      {/* TAB 1: MANAJEMEN PROGRAM */}
      {activeTab === 'programs' && (
        <div>
          {/* FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'Semua Kategori' },
                { key: 'BARANG_SUPPORT', label: '🎁 Barang Support (Etalase & Display)' },
                { key: 'TRIP', label: '✈️ Trip Liburan' },
                { key: 'CASHBACK', label: '💰 Program Cashback' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedTypeFilter(filter.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTypeFilter === filter.key
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* PROGRAM CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 p-12 text-center text-slate-400 font-medium">Memuat program...</div>
            ) : filteredPrograms.length === 0 ? (
              <div className="col-span-3 bg-white p-12 rounded-2xl border border-slate-100 text-center">
                <Award size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">Belum ada program di kategori ini.</p>
                <p className="text-xs text-slate-400 mt-1">Klik &quot;Buat Program Baru&quot; untuk menambahkan target reward.</p>
              </div>
            ) : (
              filteredPrograms.map((prog) => {
                const badge = getTypeBadge(prog.program_type);
                const Icon = badge.icon;
                const itemsCount = prog.support_items?.length || DEFAULT_SUPPORT_ITEMS.length;

                return (
                  <div
                    key={prog.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
                  >
                    {/* Program Banner Image */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={
                          prog.banner_url ||
                          (prog.program_type === 'BARANG_SUPPORT'
                            ? '/katalog-program-support.png'
                            : prog.program_type === 'TRIP'
                            ? 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600'
                            : 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600')
                        }
                        alt={prog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badge.bg} ${badge.text} border ${badge.border} shadow-sm backdrop-blur-sm`}
                        >
                          <Icon size={13} /> {badge.label}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            prog.status === 'ACTIVE'
                              ? 'bg-emerald-500 text-white shadow'
                              : 'bg-slate-500 text-white'
                          }`}
                        >
                          {prog.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-emerald-700 transition-colors">
                        {prog.title}
                      </h3>

                      {/* Khusus BARANG_SUPPORT: Highlight Katalog Etalase & Display */}
                      {prog.program_type === 'BARANG_SUPPORT' ? (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                              <Tag size={13} className="text-amber-600" /> Katalog Pilihan Dealer:
                            </span>
                            <span className="text-xs font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                              {itemsCount} Item Support
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 font-medium">
                            Minimal Pembelian: <strong>500 Ribu s/d 25 Juta</strong>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            Etalase Showcase, Rak Jumbo, Rak Dinding, Running Text LED, Kursi, dll.
                          </p>
                        </div>
                      ) : (
                        /* Target & Reward Box */
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 mb-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-semibold text-emerald-800">Target Belanja Toko:</span>
                            <span className="text-sm font-black text-emerald-700">
                              Rp {Number(prog.target_amount).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-emerald-100/70">
                            <span className="text-[11px] font-bold text-slate-700 block mb-0.5">Hadiah Reward:</span>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              🎁 {prog.reward_description}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {prog.description || 'Tidak ada deskripsi tambahan.'}
                      </p>

                      {/* Stats & Period footer */}
                      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          <span>
                            s/d {new Date(prog.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                            <Users size={12} /> {prog.participants_count || 0} Toko
                          </span>
                          {(prog.achieved_count || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                              🎉 {prog.achieved_count} Tembus
                            </span>
                          )}
                        </div>
                      </div>

                      {/* KHUSUS PROGRAM SUPPORT: TOMBOL KELOLA PRODUK SUPPORT */}
                      {prog.program_type === 'BARANG_SUPPORT' && (
                        <button
                          onClick={() => openSupportModal(prog)}
                          className="w-full mb-2.5 py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Sliders size={14} /> Kelola Produk Support & Min. Pembelian ({itemsCount} Item)
                        </button>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProgramFilter(prog.id);
                            setActiveTab('participants');
                          }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} /> Peserta ({prog.participants_count || 0})
                        </button>
                        <button
                          onClick={() => openEditProgram(prog)}
                          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                          title="Edit Program"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(prog)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                            prog.status === 'ACTIVE'
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {prog.status === 'ACTIVE' ? 'Nonaktif' : 'Aktifkan'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONITORING PESERTA */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* PARTICIPANT FILTERS */}
          <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 bg-slate-50/50 justify-between items-center">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="min-w-[200px]">
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Semua Program ({programs.length})</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-1.5">
                {[
                  { key: 'ALL', label: 'Semua Status' },
                  { key: 'ENROLLED', label: 'Sedang Berjalan' },
                  { key: 'ACHIEVED', label: 'Target Tercapai' },
                  { key: 'CLAIMED', label: 'Klaim Diajukan' },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setSelectedStatusFilter(st.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedStatusFilter === st.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari toko dealer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
          </div>

          {/* TABLE */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5 border-b border-slate-100">Nama Toko & Kontak</th>
                <th className="p-5 border-b border-slate-100">Program & Item Pilihan</th>
                <th className="p-5 border-b border-slate-100">Progres Belanja</th>
                <th className="p-5 border-b border-slate-100">Status</th>
                <th className="p-5 border-b border-slate-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Memuat partisipan...
                  </td>
                </tr>
              ) : filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    Belum ada dealer yang terdaftar pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((part) => {
                  // Custom target if dealer chose specific support item
                  const target = part.custom_target_amount || part.dealer_programs?.target_amount || 1;
                  const current = part.current_progress_amount || 0;
                  const percent = Math.min(100, Math.round((current / target) * 100));
                  const statusBadge = getParticipantStatusBadge(part.status);
                  const typeBadge = getTypeBadge(part.dealer_programs?.program_type || '');

                  // Detect chosen item from claim_notes or selected_item_name
                  let chosenItemLabel = part.selected_item_name || '';
                  if (part.selected_item_qty && part.selected_item_qty > 1) {
                    chosenItemLabel = `${chosenItemLabel} (${part.selected_item_qty} Unit)`;
                  } else if (!chosenItemLabel && part.claim_notes && part.claim_notes.includes('[PILIHAN ITEM:')) {
                    const match = part.claim_notes.match(/\[PILIHAN ITEM:\s*([^\]]+)\]/);
                    if (match) chosenItemLabel = match[1];
                  }

                  return (
                    <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Toko & Kontak */}
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <Store size={16} className="text-emerald-600 shrink-0" />
                          <p className="font-bold text-slate-900">{part.dealers?.store_name || 'Toko Binaan'}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {part.dealers?.profiles?.full_name || 'Pemilik'} • {part.dealers?.profiles?.phone_number || '-'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-[220px]">
                          {part.dealers?.address || ''}
                        </p>
                      </td>

                      {/* Program & Item Pilihan */}
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeBadge.bg} ${typeBadge.text} border ${typeBadge.border} mb-1`}
                        >
                          {typeBadge.label}
                        </span>
                        <p className="font-semibold text-slate-800 text-xs">
                          {part.dealer_programs?.title || 'Program Target'}
                        </p>

                        {/* Tampilkan item support yang dipilih toko jika ada */}
                        {chosenItemLabel ? (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-black">
                            <Gift size={13} className="text-amber-600 shrink-0" />
                            <span>{chosenItemLabel}</span>
                          </div>
                        ) : null}

                        <p className="text-[11px] text-slate-400 mt-1">
                          Bergabung: {new Date(part.enrolled_at).toLocaleDateString('id-ID')}
                        </p>
                      </td>

                      {/* Progress Belanja */}
                      <td className="p-5 min-w-[220px]">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-bold text-slate-900">
                            Rp {Number(current).toLocaleString('id-ID')}
                          </span>
                          <span className="font-semibold text-slate-400">
                            / Rp {Number(target).toLocaleString('id-ID')}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          {percent}% tercapai{' '}
                          {percent < 100 && (
                            <span className="font-normal text-slate-400">
                              (Kurang Rp {Number(target - current).toLocaleString('id-ID')})
                            </span>
                          )}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}
                        >
                          {statusBadge.label}
                        </span>
                        {part.claimed_at && (
                          <p className="text-[11px] text-purple-700 font-semibold mt-1">
                            Klaim: {new Date(part.claimed_at).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {part.dealers?.profiles?.phone_number && (
                            <a
                              href={`https://wa.me/${part.dealers.profiles.phone_number.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Halo ${part.dealers.profiles.full_name || 'Bapak/Ibu'}, kami dari DAP Official ingin menginfokan terkait Program "${part.dealer_programs?.title}".`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Chat WhatsApp Dealer"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}

                          {part.status === 'CLAIMED' ? (
                            <button
                              onClick={() => {
                                setSelectedParticipant(part);
                                setApprovalDecision('APPROVE');
                                setAdminNotes(part.admin_notes || '');
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <Gift size={14} /> Proses Klaim
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedParticipant(part);
                                setApprovalDecision('APPROVE');
                                setAdminNotes(part.admin_notes || '');
                              }}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Detail Peserta"
                            >
                              <Eye size={16} />
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: KELOLA KATALOG PRODUK SUPPORT (ETALASE & DISPLAY) */}
      {/* ========================================================================= */}
      {isSupportModalOpen && activeProgramForSupport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shadow-sm">
                  <Package size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Katalog Produk Support DAP (Etalase & Display)
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Atur daftar item etalase/rak beserta minimal pembelian agar dealer dapat memilih reward yang diinginkan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Poster info banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Info size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Tersedia 10 Item Support Toko Resmi Sesuai Poster Katalog DAP
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Dealer dapat memilih item yang sesuai kapasitas tokonya. Target akumulasi belanja dealer otomatis mengikuti nilai minimal pembelian item yang dipilih.
                    </p>
                  </div>
                </div>
                <a
                  href="/katalog-program-support.png"
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 font-bold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Lihat Poster Asli
                </a>
              </div>

              {/* DAFTAR ITEM KATALOG SAAT INI */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center justify-between">
                  <span>Daftar Produk Support & Syarat Minimal Pembelian ({supportItemsList.length} Item)</span>
                  <span className="text-xs font-semibold text-slate-400">Dapat diedit nominalnya</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {supportItemsList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-0.5 bg-slate-900 text-white rounded">
                              {item.code}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              #{idx + 1}
                            </span>
                          </div>
                          <h5 className="text-sm font-extrabold text-slate-900 mt-1">
                            {item.name}
                          </h5>
                          {item.dimensions && (
                            <p className="text-xs text-slate-500 font-medium">
                              Ukuran: {item.dimensions}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSupportItem(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Hapus item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Minimal Pembelian Box */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-amber-900 bg-amber-300 px-2.5 py-1 rounded-md">
                          PEMBELIAN:
                        </span>
                        <div className="flex items-center gap-1 font-black text-emerald-700 text-sm">
                          <span>Rp</span>
                          <input
                            type="text"
                            value={Number(item.min_purchase).toLocaleString('id-ID')}
                            onChange={(e) => handleUpdateItemMinPurchase(item.id, e.target.value)}
                            className="w-32 px-2 py-1 bg-white border border-slate-300 rounded font-black text-right text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FORM TAMBAH PRODUK BARU */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <Plus size={16} className="text-emerald-600" /> Tambah Item Support Baru ke Katalog
                </h4>
                <form onSubmit={handleAddItemToSupport} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-100/70 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">KODE (misal: DLP99)</label>
                    <input
                      type="text"
                      required
                      placeholder="DLP99"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">NAMA PRODUK</label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Standee Display Akrilik"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">MIN. PEMBELIAN (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="misal: 15000000"
                      value={newMinPurchase}
                      onChange={(e) => setNewMinPurchase(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">UKURAN / DIMENSI</label>
                    <input
                      type="text"
                      placeholder="misal: 150cm x 80cm"
                      value={newDimensions}
                      onChange={(e) => setNewDimensions(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">DESKRIPSI SINGKAT</label>
                      <input
                        type="text"
                        placeholder="Deskripsi bahan atau kegunaan display"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0"
                    >
                      + Tambahkan
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-white"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingSupportItems}
                onClick={handleSaveSupportItems}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {isSavingSupportItems ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Katalog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUAT / EDIT PROGRAM UMUM */}
      {/* ========================================================================= */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingProgramId ? 'Edit Program Target' : 'Buat Program Target Baru'}
              </h3>
              <button onClick={() => setIsProgramModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  KATEGORI PROGRAM <span className="text-red-500">*</span>
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as unknown as 'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK')}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="BARANG_SUPPORT">🎁 Barang Support Toko (Etalase, Display, Rak, Signage)</option>
                  <option value="TRIP">✈️ Trip Jalan-jalan / Liburan Luar Negeri</option>
                  <option value="CASHBACK">💰 Program Cashback Tunai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  JUDUL PROGRAM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Program Etalase Display Support Toko 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    TARGET BELANJA (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="misal: 25000000"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    BANNER IMAGE URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formBanner}
                    onChange={(e) => setFormBanner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  DESKRIPSI REWARD / HADIAH <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: 1 Unit Etalase Kaca Display DAP Premium"
                  value={formReward}
                  onChange={(e) => setFormReward(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">KETERANGAN LENGKAP</label>
                <textarea
                  rows={3}
                  placeholder="Syarat dan ketentuan program..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TANGGAL MULAI</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TANGGAL BERAKHIR</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: APPROVAL KLAIM HADIAH */}
      {/* ========================================================================= */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Proses Klaim Hadiah Toko</h3>
              <button onClick={() => setSelectedParticipant(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessClaim} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                <p className="text-xs font-bold text-slate-900 text-base">
                  {selectedParticipant.dealers?.store_name}
                </p>
                <p className="text-xs text-slate-600">
                  Pemilik: <strong>{selectedParticipant.dealers?.profiles?.full_name}</strong> ({selectedParticipant.dealers?.profiles?.phone_number || '-'})
                </p>
                <p className="text-xs text-slate-500">
                  Program: <strong>{selectedParticipant.dealer_programs?.title}</strong>
                </p>

                {/* Tampilkan item support yang dipilih */}
                {selectedParticipant.selected_item_name || selectedParticipant.claim_notes?.includes('[PILIHAN ITEM:') ? (
                  <div className="mt-2 p-2.5 bg-amber-100 border border-amber-300 rounded-lg text-amber-950 text-xs font-black">
                    🎁 HADIAH PILIHAN TOKO:{' '}
                    {selectedParticipant.selected_item_name 
                      ? `${selectedParticipant.selected_item_name}${selectedParticipant.selected_item_qty && selectedParticipant.selected_item_qty > 1 ? ` (${selectedParticipant.selected_item_qty} Unit)` : ''}`
                      : selectedParticipant.claim_notes?.match(/\[PILIHAN ITEM:\s*([^\]]+)\]/)?.[1]}
                  </div>
                ) : null}

                {selectedParticipant.claim_notes && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-700">
                    <strong>Catatan Pengajuan Toko:</strong>
                    <p className="whitespace-pre-wrap mt-0.5 text-slate-600">{selectedParticipant.claim_notes}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">KEPUTUSAN APPROVAL</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('APPROVE')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      approvalDecision === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Setujui & Kirim Hadiah
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REJECT')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      approvalDecision === 'REJECT'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Tolak Klaim
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CATATAN ADMIN / NO RESI PENGIRIMAN
                </label>
                <textarea
                  rows={3}
                  placeholder="misal: Hadiah dikirim via J&T Cargo No Resi: DAP98129038, estimasi tiba 3 hari kerja..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={approvalSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={14} /> {approvalSubmitting ? 'Memproses...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
