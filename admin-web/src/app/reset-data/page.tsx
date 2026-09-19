'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Archive, 
  ShoppingCart, 
  Store, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  Trash2,
  Lock,
  Layers,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ResetOption {
  id: 'stock' | 'transactions' | 'dealers' | 'sales' | 'products';
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  confirmationCode: string;
  description: string;
  whatGetsDeleted: string[];
  whatIsKept: string[];
  severity: 'warning' | 'danger' | 'critical';
}

export default function ResetDataPage() {
  const [activeModal, setActiveModal] = useState<ResetOption | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetOptions: ResetOption[] = [
    {
      id: 'stock',
      title: 'Reset Jumlah Stok Seluruh Produk',
      category: 'Inventaris & Gudang',
      badge: 'Stok ke 0',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Archive size={26} className="text-amber-600" />,
      iconBg: 'bg-amber-50',
      confirmationCode: 'RESET STOK',
      description: 'Mengubah nilai stok seluruh produk dalam master katalog menjadi 0 dan menghapus seluruh histori mutasi perubahan stok.',
      whatGetsDeleted: [
        'Nilai stok seluruh produk diubah menjadi 0',
        'Seluruh riwayat log mutasi stok (tabel stock_logs)'
      ],
      whatIsKept: [
        'Data master produk, SKU, nama, foto & harga tetap tersimpan',
        'Data kategori produk tetap utuh',
        'Data transaksi & riwayat pesanan tidak terpengaruh'
      ],
      severity: 'warning'
    },
    {
      id: 'transactions',
      title: 'Reset Seluruh Data Transaksi',
      category: 'Penjualan & Pesanan',
      badge: 'Order & Retur',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: <ShoppingCart size={26} className="text-rose-600" />,
      iconBg: 'bg-rose-50',
      confirmationCode: 'RESET TRANSAKSI',
      description: 'Menghapus seluruh riwayat pesanan masuk, rincian produk yang dibeli, dan tiket pengajuan retur dari sistem.',
      whatGetsDeleted: [
        'Seluruh data pesanan (tabel orders)',
        'Seluruh item detail pesanan (tabel order_items)',
        'Seluruh tiket retur & komplain garansi (tabel returns)',
        'Outstanding balance kredit dealer di-reset ke Rp 0'
      ],
      whatIsKept: [
        'Master produk dan sisa stok barang tetap tersimpan',
        'Data outlet/dealer terdaftar tetap utuh',
        'Akun sales dan target bulanan tetap tersimpan'
      ],
      severity: 'danger'
    },
    {
      id: 'dealers',
      title: 'Reset Seluruh Data Dealer (Toko)',
      category: 'Mitra & Toko Binaan',
      badge: 'Master Toko',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <Store size={26} className="text-purple-600" />,
      iconBg: 'bg-purple-50',
      confirmationCode: 'RESET DEALER',
      description: 'Menghapus seluruh data dealer/outlet mitra terdaftar, partisipasi program promosi reward, dan dokumen legalitas.',
      whatGetsDeleted: [
        'Seluruh data toko / dealer terdaftar (tabel dealers)',
        'Seluruh partisipasi program reward dealer (dealer_program_participants)',
        'Histori pesanan dan retur terkait dealer dibersihkan',
        'Role profil pengguna dealer dikembalikan menjadi akun umum (USER)'
      ],
      whatIsKept: [
        'Data master produk & stok gudang tetap utuh',
        'Data master wilayah kerja dan personil sales tetap tersimpan'
      ],
      severity: 'danger'
    },
    {
      id: 'sales',
      title: 'Reset Data Sales & SPV',
      category: 'SDM & Penggajian',
      badge: 'Sales & Kinerja',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Users size={26} className="text-blue-600" />,
      iconBg: 'bg-blue-50',
      confirmationCode: 'RESET SALES',
      description: 'Membersihkan riwayat kinerja tim sales: presensi GPS, kunjungan toko binaan, pengajuan cuti, target, dan slip gaji.',
      whatGetsDeleted: [
        'Seluruh slip penggajian digital (tabel sales_payrolls)',
        'Seluruh target penjualan bulanan (tabel sales_targets)',
        'Seluruh log kunjungan toko binaan (tabel sales_visits)',
        'Seluruh log presensi harian (tabel sales_attendances)',
        'Seluruh permohonan cuti / izin (tabel sales_leaves)',
        'Penugasan toko binaan sales_id pada tabel dealers dilepaskan (NULL)',
        'Saldo komisi seluruh sales di-reset menjadi 0'
      ],
      whatIsKept: [
        'Master produk dan data stok gudang tetap tersimpan',
        'Data master toko/dealer tetap tersimpan (hanya dilepas dari binaan sales)',
        'Akun personil sales di tabel sales tetap aktif'
      ],
      severity: 'warning'
    },
    {
      id: 'products',
      title: 'Reset Seluruh Data Master Produk',
      category: 'Katalog Produk',
      badge: 'Katalog Kosong',
      badgeColor: 'bg-red-100 text-red-900 border-red-300 font-black',
      icon: <Package size={26} className="text-red-700" />,
      iconBg: 'bg-red-50',
      confirmationCode: 'RESET PRODUK',
      description: 'Menghapus seluruh item produk dari katalog sistem secara permanen. Bersihkan sebelum import ulang master pricelist baru.',
      whatGetsDeleted: [
        'Seluruh produk dalam katalog master (tabel products)',
        'Seluruh log mutasi stok produk (tabel stock_logs)',
        'Seluruh item order yang merujuk pada produk (tabel order_items)'
      ],
      whatIsKept: [
        'Daftar kategori produk tetap utuh (tidak terhapus)',
        'Data akun dealer, sales, dan wilayah kerja tetap tersimpan',
        'Data program reward DAP tetap tersimpan'
      ],
      severity: 'critical'
    }
  ];

  const handleOpenModal = (option: ResetOption) => {
    setActiveModal(option);
    setConfirmationInput('');
    setResultMessage(null);
  };

  const handleExecuteReset = async () => {
    if (!activeModal) return;

    if (confirmationInput.trim() !== activeModal.confirmationCode) {
      alert(`Kode konfirmasi salah! Harap ketik dengan tepat: "${activeModal.confirmationCode}"`);
      return;
    }

    setIsProcessing(true);
    setResultMessage(null);

    try {
      switch (activeModal.id) {
        case 'stock': {
          // 1. Reset stock in products to 0
          const { error: stockErr } = await supabase
            .from('products')
            .update({ stock: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // updates all rows

          if (stockErr) throw stockErr;

          // 2. Clear stock logs
          try {
            await supabase
              .from('stock_logs')
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn('stock_logs delete skipped or empty', e);
          }

          setResultMessage({
            type: 'success',
            text: 'Berhasil me-reset jumlah stok seluruh produk menjadi 0 dan membersihkan log mutasi stok.'
          });
          break;
        }

        case 'transactions': {
          // 1. Delete returns first (due to foreign key reference)
          try {
            await supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn('returns delete error', e);
          }

          // 2. Delete order_items
          try {
            await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn('order_items delete error', e);
          }

          // 3. Delete orders
          const { error: ordErr } = await supabase
            .from('orders')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (ordErr) throw ordErr;

          // 4. Reset dealer outstanding balances
          try {
            await supabase.from('dealers').update({ outstanding_balance: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn('dealers balance reset error', e);
          }

          setResultMessage({
            type: 'success',
            text: 'Seluruh data transaksi pesanan, order items, dan tiket retur berhasil dibersihkan.'
          });
          break;
        }

        case 'dealers': {
          // 1. Delete returns
          try {
            await supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 2. Delete order items and orders
          try {
            await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 3. Delete dealer program participants
          try {
            await supabase.from('dealer_program_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 4. Delete dealers
          const { error: dErr } = await supabase
            .from('dealers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (dErr) throw dErr;

          // 5. Update profiles role back to USER
          try {
            await supabase.from('profiles').update({ role: 'USER' }).eq('role', 'DEALER');
          } catch (e) {
            console.warn(e);
          }

          setResultMessage({
            type: 'success',
            text: 'Seluruh data toko/dealer mitra berhasil dihapus dari sistem.'
          });
          break;
        }

        case 'sales': {
          // 1. Delete payrolls
          try {
            await supabase.from('sales_payrolls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 2. Delete targets
          try {
            await supabase.from('sales_targets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 3. Delete visits
          try {
            await supabase.from('sales_visits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 4. Delete attendances
          try {
            await supabase.from('sales_attendances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 5. Delete leaves
          try {
            await supabase.from('sales_leaves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 6. Unlink dealers from sales
          try {
            await supabase.from('dealers').update({ sales_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 7. Reset sales balance to 0
          try {
            await supabase.from('sales').update({ balance: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          setResultMessage({
            type: 'success',
            text: 'Seluruh histori aktivitas sales (presensi, visitasi, target, slip gaji) berhasil dibersihkan.'
          });
          break;
        }

        case 'products': {
          // 1. Delete order_items first
          try {
            await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 2. Delete stock_logs
          try {
            await supabase.from('stock_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          } catch (e) {
            console.warn(e);
          }

          // 3. Delete products
          const { error: pErr } = await supabase
            .from('products')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (pErr) throw pErr;

          setResultMessage({
            type: 'success',
            text: 'Seluruh data master produk berhasil dihapus dari database.'
          });
          break;
        }
      }
    } catch (err: any) {
      console.error('Reset execution error:', err);
      setResultMessage({
        type: 'error',
        text: `Gagal mengeksekusi reset data: ${err.message || err}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
            <RotateCcw size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pusat Reset & Pembersihan Data</h1>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Kelola penghapusan dan reset data sistem secara terisolasi. Pilihlah modul yang ingin di-reset sesuai kebutuhan operasional.
        </p>
      </div>

      {/* Security Warning Banner */}
      <div className="mb-8 p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-2xl flex items-start gap-4 shadow-2xs">
        <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Perhatian Keamanan Data</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Aksi reset data bersifat permanen dan tidak dapat dibatalkan. Setiap modul telah diisolasi agar tidak menghapus modul lain di luar pilihannya. Setiap eksekusi mewajibkan pengetikan kode konfirmasi verifikasi.
          </p>
        </div>
      </div>

      {/* 5 Reset Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resetOptions.map((opt) => (
          <div
            key={opt.id}
            className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
          >
            <div className="p-6">
              {/* Header card */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${opt.iconBg}`}>
                  {opt.icon}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
              </div>

              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {opt.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 mb-2 group-hover:text-rose-700 transition-colors">
                {opt.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {opt.description}
              </p>

              {/* Checkpoints */}
              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">Data yang dibersihkan:</p>
                {opt.whatGetsDeleted.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <span className="text-rose-500 font-bold">•</span>
                    <span className="line-clamp-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50/70 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleOpenModal(opt)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  opt.severity === 'critical'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    : opt.severity === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs'
                }`}
              >
                <Trash2 size={14} />
                <span>Pilih & Reset Data</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIRMATION MODAL */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeModal.iconBg}`}>
                  {activeModal.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{activeModal.title}</h3>
                  <span className="text-xs text-slate-500 font-medium">Konfirmasi Keamanan Ganda</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Impact Details */}
            <div className="space-y-4 mb-5">
              <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle size={14} /> Peringatan Efek Pembersihan:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {activeModal.whatGetsDeleted.map((item, idx) => (
                    <li key={idx}><b>{item}</b></li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={14} /> Data yang Tetap Aman (Tidak Terhapus):
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {activeModal.whatIsKept.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Confirmation Input Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Ketik frasa konfirmasi berikut untuk mengeksekusi:
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-center font-black tracking-wider text-sm text-slate-800 border border-slate-200 select-all mb-2">
                  {activeModal.confirmationCode}
                </div>
                <input
                  type="text"
                  placeholder={`Ketik "${activeModal.confirmationCode}" di sini...`}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-slate-800 text-center uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* Result Notice */}
              {resultMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                  resultMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {resultMessage.text}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isProcessing || confirmationInput.trim() !== activeModal.confirmationCode}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer ${
                  confirmationInput.trim() === activeModal.confirmationCode
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-md'
                    : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                {isProcessing ? (
                  <span>Mengeksekusi Reset...</span>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Eksekusi {activeModal.confirmationCode}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
