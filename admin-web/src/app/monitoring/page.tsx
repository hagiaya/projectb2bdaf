'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Search, Calendar, Clock, MapPin, CheckCircle, XCircle, FileText, Image as ImageIcon, ExternalLink, Filter, Check, X, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'visits' | 'leaves'>('attendance');
  const [loading, setLoading] = useState(true);

  // Filter Date
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [attendances, setAttendances] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Modal: Image Preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Modal: Leave Action (Approve / Reject)
  const [leaveModal, setLeaveModal] = useState<{ open: boolean; item: any; action: 'APPROVE' | 'REJECT' | null }>({
    open: false,
    item: null,
    action: null,
  });
  const [adminNote, setAdminNote] = useState('');
  const [processingLeave, setProcessingLeave] = useState(false);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, selectedDate]);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'attendance') {
        // Fetch Attendance for selectedDate
        const { data, error } = await supabase
          .from('sales_attendance')
          .select(`
            id,
            attendance_date,
            check_in_time,
            check_out_time,
            is_late,
            status,
            selfie_url,
            display_image_1_url,
            display_image_2_url,
            unit_percentage,
            notes,
            sales (
              id,
              profiles (full_name, phone_number)
            )
          `)
          .eq('attendance_date', selectedDate)
          .order('check_in_time', { ascending: false });

        if (error) console.error('Error fetching attendance:', error);
        setAttendances(data || []);
      } else if (activeTab === 'visits') {
        // Fetch Visits around selectedDate
        const startOfDay = `${selectedDate}T00:00:00Z`;
        const endOfDay = `${selectedDate}T23:59:59Z`;

        const { data, error } = await supabase
          .from('sales_visits')
          .select(`
            id,
            check_in_time,
            check_out_time,
            unit_percentage,
            owner_met,
            selfie_url,
            display_image_1_url,
            display_image_2_url,
            latitude,
            longitude,
            notes,
            status,
            earned_amount,
            dealers (id, store_name, address),
            sales (
              id,
              profiles (full_name, phone_number)
            )
          `)
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .order('check_in_time', { ascending: false });

        if (error) console.error('Error fetching visits:', error);
        setVisits(data || []);
      } else if (activeTab === 'leaves') {
        // Fetch Leaves
        const { data, error } = await supabase
          .from('sales_leaves')
          .select(`
            id,
            leave_type,
            start_date,
            end_date,
            reason,
            proof_image_url,
            admin_notes,
            status,
            created_at,
            sales (
              id,
              profiles (full_name, phone_number)
            )
          `)
          .order('created_at', { ascending: false });

        if (error) console.error('Error fetching leaves:', error);
        setLeaves(data || []);
      }
    } catch (err) {
      console.error('Fetch monitoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLeave = async () => {
    if (!leaveModal.item || !leaveModal.action) return;
    setProcessingLeave(true);
    try {
      const newStatus = leaveModal.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      const { error } = await supabase
        .from('sales_leaves')
        .update({
          status: newStatus,
          admin_notes: adminNote.trim() || null,
        })
        .eq('id', leaveModal.item.id);

      if (error) throw error;

      alert(`Permohonan cuti/sakit berhasil di-${newStatus === 'APPROVED' ? 'setujui' : 'tolak'}.`);
      setLeaveModal({ open: false, item: null, action: null });
      setAdminNote('');
      fetchTabData();
    } catch (err: any) {
      alert(`Gagal memproses permohonan: ${err.message}`);
    } finally {
      setProcessingLeave(false);
    }
  };

  const calculateDuration = (checkIn?: string, checkOut?: string) => {
    if (!checkIn) return '-';
    const start = new Date(checkIn).getTime();
    const end = checkOut ? new Date(checkOut).getTime() : new Date().getTime();
    const mins = Math.floor((end - start) / (1000 * 60));
    return `${Math.max(0, mins)} menit`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Activity size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Monitoring Sales</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Pantau kehadiran harian, kepatuhan jam kerja, verifikasi foto kunjungan lapangan, dan persetujuan cuti.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm">
          <Calendar size={16} className="text-emerald-600" />
          <span className="text-xs font-bold text-slate-500 uppercase">Tanggal:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-slate-800 focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'attendance'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock size={16} /> Presensi Harian ({attendances.length})
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'visits'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin size={16} /> Log Kunjungan Toko ({visits.length})
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'leaves'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} /> Permohonan Cuti / Sakit ({leaves.filter((l) => l.status === 'PENDING').length} Baru)
        </button>
      </div>

      {/* TAB 1: Presensi Harian */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Presensi</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{attendances.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase">Hadir Tepat Waktu</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {attendances.filter((a) => !a.is_late).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-rose-600 uppercase">Terlambat (&gt; 10:00)</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {attendances.filter((a) => a.is_late).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase">Sudah Check-out</p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {attendances.filter((a) => a.check_out_time).length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-5 font-semibold">Nama Sales</th>
                  <th className="p-5 font-semibold">Nomor Kontak</th>
                  <th className="p-5 font-semibold">Jam Masuk</th>
                  <th className="p-5 font-semibold">Jam Pulang</th>
                  <th className="p-5 font-semibold">Foto Selfie & 2 Display</th>
                  <th className="p-5 font-semibold">Status Presensi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      Memuat presensi...
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      Tidak ada data presensi pada tanggal {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/50">
                      <td className="p-5 font-bold text-slate-900">
                        {att.sales?.profiles?.full_name || 'Sales Representative'}
                      </td>
                      <td className="p-5 text-slate-600">{att.sales?.profiles?.phone_number || '-'}</td>
                      <td className="p-5 font-bold text-slate-800">
                        {att.check_in_time
                          ? new Date(att.check_in_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="p-5 text-slate-600 font-medium">
                        {att.check_out_time
                          ? new Date(att.check_out_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : <span className="text-amber-600 font-semibold text-xs">Belum Check-out</span>}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {att.selfie_url && (
                              <button
                                onClick={() => setPreviewImageUrl(att.selfie_url)}
                                className="group relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-200 hover:ring-2 hover:ring-emerald-500 transition-all"
                                title="Foto Selfie Pulang"
                              >
                                <img src={att.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/40 text-[8px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Selfie</span>
                              </button>
                            )}
                            {att.display_image_1_url && (
                              <button
                                onClick={() => setPreviewImageUrl(att.display_image_1_url)}
                                className="group relative w-9 h-9 rounded-lg overflow-hidden border border-blue-200 hover:ring-2 hover:ring-blue-500 transition-all"
                                title="Foto Display 1"
                              >
                                <img src={att.display_image_1_url} alt="Display 1" className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/40 text-[8px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Disp 1</span>
                              </button>
                            )}
                            {att.display_image_2_url && (
                              <button
                                onClick={() => setPreviewImageUrl(att.display_image_2_url)}
                                className="group relative w-9 h-9 rounded-lg overflow-hidden border border-blue-200 hover:ring-2 hover:ring-blue-500 transition-all"
                                title="Foto Display 2"
                              >
                                <img src={att.display_image_2_url} alt="Display 2" className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/40 text-[8px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Disp 2</span>
                              </button>
                            )}
                            {!att.selfie_url && !att.display_image_1_url && (
                              <span className="text-xs text-gray-400 italic">-</span>
                            )}
                          </div>
                          {att.check_out_time && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block w-fit">
                              Display: {att.unit_percentage ?? 0}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            att.is_late
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {att.is_late ? 'Terlambat (> 10:00)' : 'Tepat Waktu'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Log Kunjungan Toko */}
      {activeTab === 'visits' && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-5 font-semibold">Sales Representative</th>
                <th className="p-5 font-semibold">Outlet / Toko</th>
                <th className="p-5 font-semibold">Waktu & Durasi</th>
                <th className="p-5 font-semibold">Hasil Kunjungan</th>
                <th className="p-5 font-semibold">Foto Selfie & 2 Display</th>
                <th className="p-5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    Memuat data kunjungan...
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    Tidak ada kunjungan toko pada tanggal {selectedDate}.
                  </td>
                </tr>
              ) : (
                visits.map((v) => {
                  const isCompleted = v.status === 'COMPLETED';
                  const duration = calculateDuration(v.check_in_time, v.check_out_time);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-5">
                        <p className="font-bold text-slate-900">{v.sales?.profiles?.full_name || 'Sales'}</p>
                        <p className="text-xs text-slate-500">{v.sales?.profiles?.phone_number || '-'}</p>
                      </td>

                      <td className="p-5">
                        <p className="font-bold text-slate-800">{v.dealers?.store_name || 'Toko'}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{v.dealers?.address || '-'}</p>
                      </td>

                      <td className="p-5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Clock size={13} className="text-emerald-600" />
                          <span>{duration}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(v.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          {v.check_out_time ? ` - ${new Date(v.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </p>
                      </td>

                      <td className="p-5">
                        <p className="text-xs font-semibold text-slate-700">
                          Display Unit: <span className="font-bold text-emerald-700">{v.unit_percentage ?? '-'}%</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {v.owner_met ? '✓ Bertemu Owner' : '✗ Tidak Bertemu Owner'}
                        </p>
                        {v.notes && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-1.5 rounded mt-1.5 max-w-xs">
                            "{v.notes}"
                          </p>
                        )}
                      </td>

                      <td className="p-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {v.selfie_url && (
                              <button
                                onClick={() => setPreviewImageUrl(v.selfie_url)}
                                className="group relative w-8 h-8 rounded-lg overflow-hidden border border-emerald-200 hover:ring-2 hover:ring-emerald-500 transition-all"
                                title="Selfie Visit"
                              >
                                <img src={v.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/40 text-[7px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Selfie</span>
                              </button>
                            )}
                            {v.display_image_1_url && (
                              <button
                                onClick={() => setPreviewImageUrl(v.display_image_1_url)}
                                className="group relative w-8 h-8 rounded-lg overflow-hidden border border-blue-200 hover:ring-2 hover:ring-blue-500 transition-all"
                                title="Display 1"
                              >
                                <img src={v.display_image_1_url} alt="Display 1" className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/40 text-[7px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Disp 1</span>
                              </button>
                            )}
                            {v.display_image_2_url && (
                              <button
                                onClick={() => setPreviewImageUrl(v.display_image_2_url)}
                                className="group relative w-8 h-8 rounded-lg overflow-hidden border border-blue-200 hover:ring-2 hover:ring-blue-500 transition-all"
                                title="Display 2"
                              >
                                <img src={v.display_image_2_url} alt="Display 2" className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/40 text-[7px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100">Disp 2</span>
                              </button>
                            )}
                            {v.latitude && v.longitude && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors inline-flex items-center"
                                title="Buka Peta GPS"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block w-fit">
                            Display: {v.unit_percentage ?? 0}%
                          </span>
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCompleted ? 'Selesai' : 'Sedang Berjalan'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Permohonan Cuti & Izin */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-5 font-semibold">Nama Sales</th>
                <th className="p-5 font-semibold">Tipe Permohonan</th>
                <th className="p-5 font-semibold">Rentang Tanggal</th>
                <th className="p-5 font-semibold">Alasan</th>
                <th className="p-5 font-semibold">Lampiran</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    Memuat data permohonan cuti...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    Tidak ada data permohonan cuti atau izin sakit.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => {
                  const isPending = leave.status === 'PENDING';
                  const isApproved = leave.status === 'APPROVED';
                  const isRejected = leave.status === 'REJECTED';

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/50">
                      <td className="p-5">
                        <p className="font-bold text-slate-900">{leave.sales?.profiles?.full_name || 'Sales'}</p>
                        <p className="text-xs text-slate-500">{leave.sales?.profiles?.phone_number || '-'}</p>
                      </td>

                      <td className="p-5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            leave.leave_type === 'SICK'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {leave.leave_type === 'SICK' ? 'Izin Sakit' : 'Cuti Tahunan'}
                        </span>
                      </td>

                      <td className="p-5">
                        <p className="font-bold text-slate-800 text-xs">
                          {leave.start_date} s/d {leave.end_date}
                        </p>
                      </td>

                      <td className="p-5">
                        <p className="text-xs text-slate-700 max-w-xs">{leave.reason}</p>
                        {leave.admin_notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1">
                            Catatan Admin: "{leave.admin_notes}"
                          </p>
                        )}
                      </td>

                      <td className="p-5">
                        {leave.proof_image_url ? (
                          <button
                            onClick={() => setPreviewImageUrl(leave.proof_image_url)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} /> Surat Dokter
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu Approval'}
                        </span>
                      </td>

                      <td className="p-5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setLeaveModal({ open: true, item: leave, action: 'APPROVE' });
                                setAdminNote('');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg transition-colors shadow-sm"
                              title="Setujui Permohonan"
                            >
                              <Check size={14} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => {
                                setLeaveModal({ open: true, item: leave, action: 'REJECT' });
                                setAdminNote('');
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg transition-colors shadow-sm"
                              title="Tolak Permohonan"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Selesai diproses</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Image Preview */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl relative">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-slate-800 text-sm">Lampiran Foto Bukti</h3>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center bg-black/5 rounded-xl overflow-hidden max-h-[70vh]">
              <img src={previewImageUrl} alt="Lampiran" className="object-contain max-h-[70vh] w-auto" />
            </div>
            <div className="mt-3 flex justify-end">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                Buka Resolusi Penuh <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Process Leave Action */}
      {leaveModal.open && leaveModal.item && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              {leaveModal.action === 'APPROVE' ? 'Setujui Permohonan Cuti/Sakit' : 'Tolak Permohonan Cuti/Sakit'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sales: <span className="font-bold text-slate-700">{leaveModal.item.sales?.profiles?.full_name}</span> (
              {leaveModal.item.start_date} s/d {leaveModal.item.end_date})
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Catatan Admin (Opsional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={
                  leaveModal.action === 'APPROVE'
                    ? 'Contoh: Disetujui, lekas sembuh dan istirahat yang cukup.'
                    : 'Contoh: Ditolak karena surat dokter tidak valid atau kuota cuti habis.'
                }
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLeaveModal({ open: false, item: null, action: null })}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleProcessLeave}
                disabled={processingLeave}
                className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50 ${
                  leaveModal.action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processingLeave
                  ? 'Memproses...'
                  : leaveModal.action === 'APPROVE'
                  ? 'Konfirmasi Setujui'
                  : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
