'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, CheckCircle, XCircle, MapPin, Store, Shield, Phone, Edit2, Check, X, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesRep {
  id: string;
  profile_id: string;
  ktp_number?: string;
  region_id?: string;
  balance: number;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
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

  // Modal: Add/Assign New Sales
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [newSalesRegion, setNewSalesRegion] = useState('');
  const [savingNewSales, setSavingNewSales] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Regions
      const { data: regData } = await supabase.from('regions').select('id, name').order('name');
      if (regData) setRegions(regData);

      // 2. Fetch Dealers
      const { data: dData } = await supabase.from('dealers').select('id, store_name, address, sales_id').order('store_name');
      const dealersList = dData || [];
      setAllDealers(dealersList);

      // 3. Fetch Sales records with profiles and regions
      const { data: sData, error: sError } = await supabase
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
          regions (id, name)
        `)
        .order('created_at', { ascending: false });

      if (sError) {
        console.error('Error fetching sales:', sError);
      }

      // Also check if there are profiles with role = 'SALES' that don't have a sales row yet
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role, approval_status')
        .eq('role', 'SALES');

      const existingProfileIds = new Set((sData || []).map((s: any) => s.profile_id));
      const unlinkedProfiles = (pData || []).filter((p) => !existingProfileIds.has(p.id));

      // Calculate assigned dealers count
      const enrichedSales: SalesRep[] = (sData || []).map((s: any) => {
        const count = dealersList.filter((d) => d.sales_id === s.id).length;
        return {
          ...s,
          assignedDealersCount: count,
        };
      });

      // Append unlinked profiles as virtual pending sales
      unlinkedProfiles.forEach((up) => {
        enrichedSales.push({
          id: `unlinked-${up.id}`,
          profile_id: up.id,
          balance: 0,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          profiles: up,
          assignedDealersCount: 0,
        });
      });

      setSalesList(enrichedSales);

      // Available non-sales profiles for add modal
      const { data: nonSalesProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role')
        .neq('role', 'SALES')
        .limit(30);

      setAvailableProfiles(nonSalesProfiles || []);
    } catch (err) {
      console.error('Fetch error in sales page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sales: SalesRep) => {
    if (!confirm(`Setujui akun sales "${sales.profiles?.full_name}"?`)) return;

    try {
      // 1. If unlinked, insert into sales table first
      if (sales.id.startsWith('unlinked-')) {
        const { data: inserted, error: insErr } = await supabase
          .from('sales')
          .insert({
            profile_id: sales.profile_id,
            status: 'ACTIVE',
            balance: 0,
          })
          .select()
          .single();

        if (insErr) throw insErr;
      } else {
        const { error } = await supabase.from('sales').update({ status: 'ACTIVE' }).eq('id', sales.id);
        if (error) throw error;
      }

      // 2. Update profile approval_status
      await supabase.from('profiles').update({ approval_status: 'APPROVED', role: 'SALES' }).eq('id', sales.profile_id);

      alert('Akun sales berhasil disetujui & diaktifkan.');
      fetchData();
    } catch (err: any) {
      alert(`Gagal menyetujui: ${err.message}`);
    }
  };

  const handleToggleStatus = async (sales: SalesRep) => {
    const nextStatus = sales.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`Ubah status sales "${sales.profiles?.full_name}" menjadi ${nextStatus}?`)) return;

    try {
      const { error } = await supabase.from('sales').update({ status: nextStatus }).eq('id', sales.id);
      if (error) throw error;

      setSalesList((prev) =>
        prev.map((s) => (s.id === sales.id ? { ...s, status: nextStatus as any } : s))
      );
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  const handleSaveRegion = async () => {
    if (!activeSalesForRegion) return;
    try {
      const { error } = await supabase
        .from('sales')
        .update({ region_id: selectedNewRegion || null })
        .eq('id', activeSalesForRegion.id);

      if (error) throw error;

      alert('Wilayah kerja sales berhasil diperbarui.');
      setRegionModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Gagal memperbarui wilayah: ${err.message}`);
    }
  };

  const handleToggleDealerAssignment = async (dealerId: string, currentSalesId?: string | null) => {
    if (!activeSalesForDealers) return;
    setSavingDealers(true);
    try {
      const newSalesId = currentSalesId === activeSalesForDealers.id ? null : activeSalesForDealers.id;

      const { error } = await supabase.from('dealers').update({ sales_id: newSalesId }).eq('id', dealerId);

      if (error) throw error;

      setAllDealers((prev) =>
        prev.map((d) => (d.id === dealerId ? { ...d, sales_id: newSalesId } : d))
      );

      // Update local count
      setSalesList((prev) =>
        prev.map((s) => {
          if (s.id === activeSalesForDealers.id) {
            const count = (s.assignedDealersCount || 0) + (newSalesId ? 1 : -1);
            return { ...s, assignedDealersCount: Math.max(0, count) };
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
    if (!selectedProfileId) {
      alert('Pilih pengguna terlebih dahulu.');
      return;
    }

    setSavingNewSales(true);
    try {
      // 1. Update profile role to SALES
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ role: 'SALES', approval_status: 'APPROVED' })
        .eq('id', selectedProfileId);

      if (profErr) throw profErr;

      // 2. Insert into sales
      const payload: any = {
        profile_id: selectedProfileId,
        status: 'ACTIVE',
        balance: 0,
      };
      if (newSalesRegion) payload.region_id = newSalesRegion;

      const { error: salesErr } = await supabase.from('sales').insert(payload);
      if (salesErr) throw salesErr;

      alert('Berhasil menambahkan akun Sales baru!');
      setAddModalOpen(false);
      setSelectedProfileId('');
      setNewSalesRegion('');
      fetchData();
    } catch (err: any) {
      alert(`Gagal menambahkan sales: ${err.message}`);
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

    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchRegion = regionFilter === 'ALL' || s.region_id === regionFilter;

    return matchQuery && matchStatus && matchRegion;
  });

  const totalSales = salesList.length;
  const activeCount = salesList.filter((s) => s.status === 'ACTIVE').length;
  const pendingCount = salesList.filter((s) => s.status === 'PENDING').length;
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Sales</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Kelola tim sales lapangan, penugasan wilayah kerja, verifikasi akun, dan alokasi toko binaan.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm hover:shadow transition-all"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Sales Baru
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tim Sales</p>
          <p className="text-2xl font-black text-slate-800">{totalSales}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Sales Aktif</p>
          <p className="text-2xl font-black text-emerald-700">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Menunggu Approval</p>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Saldo Reward</p>
          <p className="text-2xl font-black text-slate-800">{formatRupiah(totalBalance)}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama sales, nomor telepon..."
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
              <th className="p-5 font-semibold">Sales Representative</th>
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
                <td colSpan={6} className="p-10 text-center text-gray-400 font-medium">
                  Memuat data tim sales...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-slate-600">Tidak ada sales ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                </td>
              </tr>
            ) : (
              filteredSales.map((sales) => {
                const isActive = sales.status === 'ACTIVE';
                const isPending = sales.status === 'PENDING';

                return (
                  <tr key={sales.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sales Profile */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                          {sales.profiles?.full_name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sales.profiles?.full_name || 'Tanpa Nama'}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {sales.profiles?.phone_number || '-'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="p-5">
                      <button
                        onClick={() => {
                          setActiveSalesForRegion(sales);
                          setSelectedNewRegion(sales.region_id || '');
                          setRegionModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all group"
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
                      >
                        <Store size={13} />
                        <span>{sales.assignedDealersCount || 0} Toko Binaan</span>
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
                        {isActive ? 'Aktif' : isPending ? 'Pending Approval' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending ? (
                          <button
                            onClick={() => handleApprove(sales)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Check size={14} /> Setujui
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(sales)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-emerald-100">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Alokasi Toko Binaan</h3>
                <p className="text-xs text-slate-500">
                  Sales: <span className="font-bold text-emerald-700">{activeSalesForDealers.profiles?.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => setDealerModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Centang toko untuk menugaskannya ke sales ini. Toko yang dicentang akan otomatis muncul di aplikasi mobile sales.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              {allDealers.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Belum ada data toko/dealer terdaftar.</p>
              ) : (
                allDealers.map((d) => {
                  const isAssignedToThis = d.sales_id === activeSalesForDealers.id;
                  const isAssignedToOther = d.sales_id && d.sales_id !== activeSalesForDealers.id;

                  return (
                    <div
                      key={d.id}
                      onClick={() => !savingDealers && handleToggleDealerAssignment(d.id, d.sales_id)}
                      className={`py-3 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isAssignedToThis ? 'bg-emerald-50/80' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 mr-4">
                        <p className="font-bold text-sm text-slate-800">{d.store_name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{d.address || 'Tanpa alamat'}</p>
                        {isAssignedToOther && (
                          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 inline-block">
                            (Sudah di-assign ke sales lain)
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isAssignedToThis
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isAssignedToThis && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setDealerModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold"
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
            <h3 className="font-bold text-slate-900 text-lg mb-1">Atur Wilayah Kerja</h3>
            <p className="text-xs text-slate-500 mb-5">
              Ubah wilayah penugasan untuk {activeSalesForRegion.profiles?.full_name}.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Pilih Wilayah</label>
              <select
                value={selectedNewRegion}
                onChange={(e) => setSelectedNewRegion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">-- Tanpa Wilayah Tertentu --</option>
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

      {/* MODAL 3: Add / Assign New Sales */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Tambah Akun Sales Baru</h3>
            <p className="text-xs text-slate-500 mb-5">
              Pilih profil pengguna untuk diberikan akses Role SALES dan ditugaskan ke wilayah kerja.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Pilih Pengguna Terdaftar *
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Pengguna --</option>
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.phone_number || 'Tanpa HP'}) - Saat ini: {p.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Wilayah Kerja</label>
                <select
                  value={newSalesRegion}
                  onChange={(e) => setNewSalesRegion(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Pilih Wilayah (Opsional) --</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
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
                {savingNewSales ? 'Menyimpan...' : 'Jadikan Sales'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
