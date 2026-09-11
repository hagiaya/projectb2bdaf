'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, MessageSquare, Plus, CheckCircle2, 
  Clock, PhoneCall, AlertCircle, Calendar, Store, User, Trash2, X, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Dealer {
  id: string;
  store_name: string;
  address: string;
}

interface SalesProfile {
  id: string;
  full_name: string;
}

interface CrmInteraction {
  id: string;
  dealer_id: string;
  sales_id: string;
  type: string;
  notes: string;
  follow_up_date: string | null;
  status: string;
  created_at: string;
  dealers?: {
    store_name: string;
    address: string;
  };
  profiles?: {
    full_name: string;
  };
}

export default function CrmPage() {
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [salesList, setSalesList] = useState<SalesProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form
  const [dealerId, setDealerId] = useState('');
  const [salesId, setSalesId] = useState('');
  const [interactionType, setInteractionType] = useState('VISIT');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('OPEN');

  useEffect(() => {
    fetchData();

    const sub = supabase
      .channel('public:dealer_crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dealer_crm' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch dealers
    const { data: dData } = await supabase.from('dealers').select('id, store_name, address').order('store_name');
    if (dData) {
      setDealers(dData);
      if (dData.length > 0 && !dealerId) setDealerId(dData[0].id);
    }

    // Fetch sales
    const { data: sData } = await supabase.from('profiles').select('id, full_name').eq('role', 'SALES');
    if (sData) {
      setSalesList(sData);
      if (sData.length > 0 && !salesId) setSalesId(sData[0].id);
    }

    // Fetch CRM interactions
    const { data: crmData, error } = await supabase
      .from('dealer_crm')
      .select('*, dealers(store_name, address), profiles:sales_id(full_name)')
      .order('created_at', { ascending: false });

    if (!error && crmData) {
      setInteractions(crmData as any);
    }
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) {
      alert('Pilih toko dealer.');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('dealer_crm').insert([
      {
        dealer_id: dealerId,
        sales_id: salesId || null,
        type: interactionType,
        notes,
        follow_up_date: followUpDate || null,
        status,
      }
    ]);
    setIsSaving(false);

    if (error) {
      alert('Gagal mencatat interaksi: ' + error.message);
    } else {
      setIsModalOpen(false);
      setNotes('');
      setFollowUpDate('');
      fetchData();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('dealer_crm').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setInteractions(interactions.map(i => i.id === id ? { ...i, status: newStatus } : i));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan CRM ini?')) return;
    const { error } = await supabase.from('dealer_crm').delete().eq('id', id);
    if (!error) {
      setInteractions(interactions.filter(i => i.id !== id));
    }
  };

  const filteredInteractions = interactions.filter(i => {
    const q = searchQuery.toLowerCase();
    const store = i.dealers?.store_name?.toLowerCase() || '';
    const note = i.notes?.toLowerCase() || '';
    const sales = i.profiles?.full_name?.toLowerCase() || '';
    const matchesSearch = store.includes(q) || note.includes(q) || sales.includes(q);
    const matchesType = typeFilter === 'ALL' || i.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'VISIT': return { label: 'Kunjungan Lapangan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CALL': return { label: 'Panggilan Telepon', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'COMPLAINT': return { label: 'Keluhan Produk', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'FOLLOW_UP': return { label: 'Follow Up Order', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { label: type, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Activity size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CRM & Interaksi Dealer</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Manajemen keluhan, riwayat kunjungan sales, dan follow-up relasi dealer.</p>
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
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} /> Catat Interaksi Baru
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {/* Search & Filter */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari toko dealer, catatan, atau nama sales..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Semua Jenis Interaksi</option>
            <option value="VISIT">Kunjungan Lapangan</option>
            <option value="CALL">Panggilan Telepon</option>
            <option value="COMPLAINT">Keluhan Produk</option>
            <option value="FOLLOW_UP">Follow Up Order</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="p-4 pl-6">Toko Dealer & Sales</th>
                <th className="p-4">Jenis Interaksi</th>
                <th className="p-4">Catatan & Hasil</th>
                <th className="p-4">Follow-up & Waktu</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Memuat catatan CRM...
                  </td>
                </tr>
              ) : filteredInteractions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    Tidak ada riwayat interaksi CRM. Klik "Catat Interaksi Baru" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredInteractions.map((item) => {
                  const typeBadge = getTypeBadge(item.type);
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-900">{item.dealers?.store_name || 'Dealer'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <User size={11} /> {item.profiles?.full_name || 'Admin'}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                          {item.notes || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-600">
                          {item.follow_up_date ? (
                            <span className="font-semibold text-amber-700 flex items-center gap-1">
                              <Calendar size={12} /> {new Date(item.follow_up_date).toLocaleDateString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                            item.status === 'RESOLVED' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : item.status === 'FOLLOW_UP' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="OPEN">Open (Menunggu)</option>
                          <option value="FOLLOW_UP">Perlu Follow-up</option>
                          <option value="RESOLVED">Resolved (Selesai)</option>
                        </select>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Interaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Catat Interaksi Dealer</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pilih Toko Dealer</label>
                <select 
                  value={dealerId}
                  onChange={(e) => setDealerId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white"
                  required
                >
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.store_name} - {d.address?.slice(0, 30)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sales Petugas</label>
                  <select 
                    value={salesId}
                    onChange={(e) => setSalesId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white"
                  >
                    <option value="">Admin Langsung</option>
                    {salesList.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jenis Interaksi</label>
                  <select 
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white"
                  >
                    <option value="VISIT">Kunjungan Lapangan</option>
                    <option value="CALL">Panggilan Telepon</option>
                    <option value="COMPLAINT">Keluhan Produk</option>
                    <option value="FOLLOW_UP">Follow Up Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notulen / Catatan Interaksi</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hasil pembicaraan, keluhan barang rusak, permintaan tempo, dll..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jadwal Follow Up</label>
                  <input 
                    type="date" 
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white"
                  >
                    <option value="OPEN">Open (Menunggu)</option>
                    <option value="FOLLOW_UP">Perlu Follow-up</option>
                    <option value="RESOLVED">Resolved (Selesai)</option>
                  </select>
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
