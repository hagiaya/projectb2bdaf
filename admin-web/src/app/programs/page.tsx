'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Gift,
  Plane,
  Coins,
  Package,
  Calendar,
  Users,
  Eye,
  X,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Edit2,
  Send,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');

  // Modal Create / Edit Program
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK'>('BARANG_SUPPORT');
  const [formTarget, setFormTarget] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Verification / Claim Approval
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch programs
      const { data: pData, error: pErr } = await supabase
        .from('dealer_programs')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch participants with dealer & program relation
      const { data: partData, error: partErr } = await supabase
        .from('dealer_program_participants')
        .select('*, dealers(id, store_name, address, profiles(full_name, phone_number)), dealer_programs(*)')
        .order('enrolled_at', { ascending: false });

      if (!pErr && pData && pData.length > 0) {
        // Enriched with participant counts
        const enriched = pData.map((prog: any) => {
          const matchedParts = (partData || []).filter((p: any) => p.program_id === prog.id);
          return {
            ...prog,
            participants_count: matchedParts.length,
            achieved_count: matchedParts.filter(
              (p: any) => p.status === 'ACHIEVED' || p.status === 'CLAIMED'
            ).length,
          };
        });
        setPrograms(enriched);
      } else {
        // Fallback realistic seed data if not migrated yet
        const defaultPrograms: DealerProgram[] = [
          {
            id: '11111111-1111-1111-1111-111111111111',
            title: 'Program Etalase & Display Support Toko 2026',
            program_type: 'BARANG_SUPPORT',
            description:
              'Dapatkan dukungan 1 unit etalase kaca display resmi DAP lengkap dengan neon box akrilik untuk mempercantik outlet Anda setelah mencapai target akumulasi order.',
            target_amount: 25000000,
            reward_description:
              '1 Unit Etalase Kaca Display DAP Premium (P 120cm x T 100cm) + 1 Neon Box Akrilik LED',
            banner_url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600',
            start_date: '2026-09-01',
            end_date: '2026-11-30',
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            participants_count: 3,
            achieved_count: 1,
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            title: 'Mega Trip Liburan Eksklusif ke Bangkok 4D3N',
            program_type: 'TRIP',
            description:
              'Kumpulkan omset belanja aksesoris Anda dan nikmati liburan mewah ke Bangkok Thailand bersama seluruh dealer terbaik DAP. Seluruh biaya tiket, hotel bintang 5 & tur ditanggung penuh!',
            target_amount: 120000000,
            reward_description:
              '1 Tiket All-In Tour Bangkok 4H3M (Tiket PP, Hotel Bintang 5, Full Board Meals, City Tour & Visa)',
            banner_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
            start_date: '2026-09-01',
            end_date: '2027-02-28',
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            participants_count: 2,
            achieved_count: 0,
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            title: 'Program Super Cashback Loyalty 5%',
            program_type: 'CASHBACK',
            description:
              'Program akselerasi keuntungan dealer! Capai target belanja minimum Rp 40 Juta dan dapatkan cashback tunai 5% langsung cair ke rekening atau dipotongkan pada tagihan nota berikutnya.',
            target_amount: 40000000,
            reward_description:
              'Cashback Tunai 5% (Senilai Rp 2.000.000) langsung cair ke rekening bank pemilik toko',
            banner_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600',
            start_date: '2026-09-01',
            end_date: '2026-10-31',
            status: 'ACTIVE',
            created_at: new Date().toISOString(),
            participants_count: 4,
            achieved_count: 1,
          },
        ];
        setPrograms(defaultPrograms);
      }

      if (!partErr && partData && partData.length > 0) {
        setParticipants(partData as any);
      } else {
        // Fallback sample participants
        setParticipants([
          {
            id: 'p-1',
            program_id: '11111111-1111-1111-1111-111111111111',
            dealer_id: 'd-1',
            enrolled_at: '2026-09-02T10:00:00Z',
            current_progress_amount: 26500000,
            status: 'CLAIMED',
            claim_notes:
              'Target sudah tercapai. Mohon dikirimkan etalase ke alamat Toko Maju Jaya, Jl. Sudirman No. 123 Jakarta Selatan.',
            admin_notes: '',
            claimed_at: '2026-09-08T08:30:00Z',
            dealers: {
              id: 'd-1',
              store_name: 'Toko Maju Jaya',
              address: 'Jl. Sudirman No. 123, Jakarta Selatan',
              profiles: {
                full_name: 'Haji Ahmad',
                phone_number: '081298765432',
              },
            },
            dealer_programs: {
              id: '11111111-1111-1111-1111-111111111111',
              title: 'Program Etalase & Display Support Toko 2026',
              program_type: 'BARANG_SUPPORT',
              description: '',
              target_amount: 25000000,
              reward_description: '1 Unit Etalase Kaca Display DAP Premium + Neon Box',
              start_date: '2026-09-01',
              end_date: '2026-11-30',
              status: 'ACTIVE',
              created_at: '',
            },
          },
          {
            id: 'p-2',
            program_id: '22222222-2222-2222-2222-222222222222',
            dealer_id: 'd-2',
            enrolled_at: '2026-09-03T11:00:00Z',
            current_progress_amount: 45000000,
            status: 'ENROLLED',
            dealers: {
              id: 'd-2',
              store_name: 'Berkah Cell',
              address: 'Jl. Gatsu No. 45, Jakarta Pusat',
              profiles: {
                full_name: 'Budi Kurniawan',
                phone_number: '081377889900',
              },
            },
            dealer_programs: {
              id: '22222222-2222-2222-2222-222222222222',
              title: 'Mega Trip Liburan Eksklusif ke Bangkok 4D3N',
              program_type: 'TRIP',
              description: '',
              target_amount: 120000000,
              reward_description: '1 Tiket All-In Tour Bangkok 4H3M',
              start_date: '2026-09-01',
              end_date: '2027-02-28',
              status: 'ACTIVE',
              created_at: '',
            },
          },
          {
            id: 'p-3',
            program_id: '33333333-3333-3333-3333-333333333333',
            dealer_id: 'd-3',
            enrolled_at: '2026-09-04T14:20:00Z',
            current_progress_amount: 40500000,
            status: 'ACHIEVED',
            dealers: {
              id: 'd-3',
              store_name: 'Maju Mundur Accessories',
              address: 'Jl. Merdeka No. 99, Jakarta Barat',
              profiles: {
                full_name: 'Siti Rahma',
                phone_number: '081566778899',
              },
            },
            dealer_programs: {
              id: '33333333-3333-3333-3333-333333333333',
              title: 'Program Super Cashback Loyalty 5%',
              program_type: 'CASHBACK',
              description: '',
              target_amount: 40000000,
              reward_description: 'Cashback Tunai 5% (Rp 2.000.000)',
              start_date: '2026-09-01',
              end_date: '2026-10-31',
              status: 'ACTIVE',
              created_at: '',
            },
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching programs data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTarget || !formReward.trim()) {
      alert('Harap lengkapi judul program, target belanja, dan rincian hadiah.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
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
          setPrograms([{ ...data[0], participants_count: 0, achieved_count: 0 }, ...programs]);
        } else {
          // Local fallback update
          const newProg: DealerProgram = {
            id: 'prog-' + Date.now(),
            ...payload,
            created_at: new Date().toISOString(),
            participants_count: 0,
            achieved_count: 0,
          };
          setPrograms([newProg, ...programs]);
        }
      }

      setIsProgramModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert('Gagal menyimpan program: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (program: DealerProgram) => {
    const newStatus = program.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { error } = await supabase
      .from('dealer_programs')
      .update({ status: newStatus })
      .eq('id', program.id);

    if (!error) {
      setPrograms(
        programs.map((p) => (p.id === program.id ? { ...p, status: newStatus } : p))
      );
    } else {
      setPrograms(
        programs.map((p) => (p.id === program.id ? { ...p, status: newStatus } : p))
      );
    }
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
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
  };

  const handleProcessClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;

    setApprovalSubmitting(true);
    try {
      const newStatus = approvalDecision === 'APPROVE' ? 'CLAIMED' : 'REJECTED';
      const payload: any = {
        status: newStatus,
        admin_notes: adminNotes.trim(),
        approved_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('dealer_program_participants')
        .update(payload)
        .eq('id', selectedParticipant.id);

      // Local update
      setParticipants(
        participants.map((p) =>
          p.id === selectedParticipant.id ? { ...p, ...payload } : p
        )
      );

      setSelectedParticipant(null);
      setAdminNotes('');
      alert(
        approvalDecision === 'APPROVE'
          ? 'Klaim hadiah berhasil disetujui & status diperbarui.'
          : 'Klaim hadiah berhasil ditolak dengan catatan.'
      );
    } catch (err: any) {
      alert('Gagal memproses klaim: ' + err.message);
    } finally {
      setApprovalSubmitting(false);
    }
  };

  // Filtered Programs
  const filteredPrograms = programs.filter((p) => {
    if (selectedTypeFilter !== 'ALL' && p.program_type !== selectedTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchReward = p.reward_description.toLowerCase().includes(q);
      if (!matchTitle && !matchReward) return false;
    }
    return true;
  });

  // Filtered Participants
  const filteredParticipants = participants.filter((p) => {
    if (selectedProgramFilter !== 'ALL' && p.program_id !== selectedProgramFilter) return false;
    if (selectedStatusFilter !== 'ALL' && p.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const storeMatch = p.dealers?.store_name?.toLowerCase().includes(q);
      const progMatch = p.dealer_programs?.title?.toLowerCase().includes(q);
      if (!storeMatch && !progMatch) return false;
    }
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BARANG_SUPPORT':
        return {
          label: 'Barang Support',
          icon: Package,
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
        };
      case 'TRIP':
        return {
          label: 'Trip Jalan-jalan',
          icon: Plane,
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200',
        };
      case 'CASHBACK':
        return {
          label: 'Program Cashback',
          icon: Coins,
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
        };
      default:
        return {
          label: type,
          icon: Award,
          bg: 'bg-slate-50',
          text: 'text-slate-700',
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

  const totalActivePrograms = programs.filter((p) => p.status === 'ACTIVE').length;
  const totalParticipants = participants.length;
  const pendingClaims = participants.filter(
    (p) => p.status === 'CLAIMED' && !p.approved_at
  ).length;
  const achievedTotal = participants.filter((p) => p.status === 'ACHIEVED').length;

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
            Kelola 3 program loyalitas dealer: Target Barang Support, Trip Jalan-jalan, dan Cashback.
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
            <p className="text-2xl font-black text-purple-600 mt-0.5">{pendingClaims || participants.filter(p => p.status === 'CLAIMED').length} Hadiah</p>
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

      {/* ========================================================================= */}
      {/* TAB 1: MANAJEMEN PROGRAM (KATALOG) */}
      {/* ========================================================================= */}
      {activeTab === 'programs' && (
        <div>
          {/* FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'Semua Kategori' },
                { key: 'BARANG_SUPPORT', label: '🎁 Barang Support' },
                { key: 'TRIP', label: '✈️ Trip Jalan-jalan' },
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
                placeholder="Cari nama program atau hadiah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* PROGRAM CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 p-12 text-center text-slate-400">Memuat program...</div>
            ) : filteredPrograms.length === 0 ? (
              <div className="col-span-3 bg-white p-12 rounded-2xl border border-slate-100 text-center">
                <Award size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">Belum ada program di kategori ini.</p>
                <p className="text-xs text-slate-400 mt-1">Klik "Buat Program Baru" untuk menambahkan target reward.</p>
              </div>
            ) : (
              filteredPrograms.map((prog) => {
                const badge = getTypeBadge(prog.program_type);
                const Icon = badge.icon;
                const isOngoing = new Date(prog.end_date) >= new Date();

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
                            ? 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600'
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

                      {/* Target & Reward Highlight Box */}
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

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProgramFilter(prog.id);
                            setActiveTab('participants');
                          }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} /> Lihat Peserta
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
                          {prog.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* ========================================================================= */}
      {/* TAB 2: MONITORING PESERTA & APPROVAL KLAIM */}
      {/* ========================================================================= */}
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
                  { key: 'CLAIMED', label: 'Klaim / Dikirim' },
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
                placeholder="Cari nama toko dealer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
          </div>

          {/* TABLE OF PARTICIPANTS */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-5 border-b border-slate-100">Nama Toko & Kontak</th>
                <th className="p-5 border-b border-slate-100">Program Target</th>
                <th className="p-5 border-b border-slate-100">Progres Akumulasi Belanja</th>
                <th className="p-5 border-b border-slate-100">Status Partisipasi</th>
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
                  const target = part.dealer_programs?.target_amount || 1;
                  const current = part.current_progress_amount || 0;
                  const percent = Math.min(100, Math.round((current / target) * 100));
                  const statusBadge = getParticipantStatusBadge(part.status);
                  const typeBadge = getTypeBadge(part.dealer_programs?.program_type || '');

                  return (
                    <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Toko & Kontak */}
                      <td className="p-5">
                        <p className="font-bold text-slate-900">{part.dealers?.store_name || 'Toko Binaan'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {part.dealers?.profiles?.full_name || 'Pemilik'} • {part.dealers?.profiles?.phone_number || '-'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-[220px]">
                          {part.dealers?.address || ''}
                        </p>
                      </td>

                      {/* Program Info */}
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeBadge.bg} ${typeBadge.text} border ${typeBadge.border} mb-1`}
                        >
                          {typeBadge.label}
                        </span>
                        <p className="font-semibold text-slate-800 text-xs">
                          {part.dealer_programs?.title || 'Program Target'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
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
                        {part.claim_notes && (
                          <div className="mt-1.5 text-[11px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 max-w-[220px]">
                            <strong className="block mb-0.5">Catatan Toko:</strong>
                            {part.claim_notes}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          {part.dealers?.profiles?.phone_number && (
                            <a
                              href={`https://wa.me/${part.dealers.profiles.phone_number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Hubungi Toko via WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setSelectedParticipant(part);
                              setApprovalDecision('APPROVE');
                              setAdminNotes(part.admin_notes || '');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              part.status === 'CLAIMED' || part.status === 'ACHIEVED'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Gift size={13} />
                            {part.status === 'CLAIMED'
                              ? 'Verifikasi Hadiah'
                              : part.status === 'ACHIEVED'
                              ? 'Kirim Reward'
                              : 'Detail'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
            <span>
              Menampilkan <strong>{filteredParticipants.length}</strong> partisipan toko
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT PROGRAM */}
      {/* ========================================================================= */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingProgramId ? 'Edit Program Dealer' : 'Buat Program Target Baru'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan target belanja, periode, dan hadiah reward untuk dealer.
                </p>
              </div>
              <button
                onClick={() => setIsProgramModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Judul Program */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Judul Program <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Program Etalase Kaca Display 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Kategori Program & Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Kategori Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="BARANG_SUPPORT">🎁 Barang Support Toko</option>
                    <option value="TRIP">✈️ Trip Jalan-jalan / Tour</option>
                    <option value="CASHBACK">💰 Program Cashback Tunai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Target Belanja (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 25000000"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Rincian Hadiah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Deskripsi Hadiah / Reward <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1 Unit Etalase Display DAP + Neon Box Akrilik"
                  value={formReward}
                  onChange={(e) => setFormReward(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Periode Program */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  URL Foto Banner (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Deskripsi & Syarat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Syarat & Ketentuan Program
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan mekanisme dan syarat pencapaian target..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VERIFIKASI & APPROVAL KLAIM HADIAH */}
      {/* ========================================================================= */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900">Verifikasi Klaim Hadiah</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proses klaim reward toko binaan yang telah mencapai target.
                </p>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessClaim} className="p-6 space-y-4">
              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Toko:</span>
                  <strong className="text-slate-900">{selectedParticipant.dealers?.store_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <strong className="text-slate-900">{selectedParticipant.dealer_programs?.title}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hadiah Reward:</span>
                  <span className="font-bold text-emerald-700">{selectedParticipant.dealer_programs?.reward_description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Akumulasi Belanja:</span>
                  <strong className="text-slate-900">
                    Rp {Number(selectedParticipant.current_progress_amount).toLocaleString('id-ID')}
                  </strong>
                </div>
                {selectedParticipant.claim_notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Catatan Pengajuan Toko:</span>
                    <p className="p-2.5 bg-white rounded-lg border border-slate-200 font-medium text-slate-800">
                      {selectedParticipant.claim_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Decision Radio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Keputusan Verifikasi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('APPROVE')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      approvalDecision === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={16} /> Setujui & Kirim
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('REJECT')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      approvalDecision === 'REJECT'
                        ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <X size={16} /> Tolak Klaim
                  </button>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Catatan Admin (Nomor Resi / Referensi Transfer / Tiket)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    approvalDecision === 'APPROVE'
                      ? 'Contoh: Etalase dikirim via Ekspedisi Baraka No Resi BRK-882194 / Cashback telah ditransfer ke BCA 1234567890 an Ahmad.'
                      : 'Alasan penolakan klaim...'
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={approvalSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-2 ${
                    approvalDecision === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <Send size={14} />
                  {approvalSubmitting ? 'Memproses...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
