'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Building2, Hash, User, CheckCircle2, AlertCircle,
  Save, RefreshCw, Truck, Clock, DollarSign, Shield,
  Loader2, Info, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentSettings {
  id: string;
  // CBD - Transfer Bank Manual
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  cbd_enabled: boolean;
  cbd_term_label: string;
  cbd_instructions: string;
  // COD settings
  cod_enabled: boolean;
  cod_term_days: number;
  cod_term_label: string;
  cod_max_amount: number;
  cod_policy_terms: string;
}

const DEFAULT_SETTINGS: PaymentSettings = {
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
  cod_policy_terms: 'Pembayaran dilakukan saat barang diterima oleh dealer. Nominal COD maksimum sesuai kebijakan yang ditetapkan.',
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [cbdExpanded, setCbdExpanded] = useState(true);
  const [codExpanded, setCodExpanded] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (e) {
      console.error('Error fetching payment settings:', e);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const payload = {
        id: 'default',
        bank_name: settings.bank_name.trim(),
        bank_account_number: settings.bank_account_number.trim(),
        bank_account_name: settings.bank_account_name.trim(),
        cbd_enabled: settings.cbd_enabled,
        cbd_term_label: settings.cbd_term_label.trim(),
        cbd_instructions: settings.cbd_instructions.trim(),
        cod_enabled: settings.cod_enabled,
        cod_term_days: settings.cod_term_days,
        cod_term_label: settings.cod_term_label.trim(),
        cod_max_amount: settings.cod_max_amount,
        cod_policy_terms: settings.cod_policy_terms.trim(),
      };

      const { error } = await supabase
        .from('payment_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e: any) {
      console.error('Error saving payment settings:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
    setIsSaving(false);
  };

  const update = (key: keyof PaymentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-emerald-600" />
          <p className="text-gray-500 font-medium">Memuat pengaturan pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Pengaturan Pembayaran</h1>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Konfigurasi metode transfer bank CBD &amp; COD untuk semua dealer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw size={15} />
              Muat Ulang
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : saveStatus === 'success'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : saveStatus === 'error'
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-95'
              }`}
            >
              {isSaving ? (
                <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
              ) : saveStatus === 'success' ? (
                <><CheckCircle2 size={16} /> Tersimpan!</>
              ) : saveStatus === 'error' ? (
                <><AlertCircle size={16} /> Gagal Simpan</>
              ) : (
                <><Save size={16} /> Simpan Perubahan</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6">

        {/* INFO BANNER */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900">Pengaturan Global</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Perubahan rekening bank &amp; metode pembayaran di sini akan langsung berlaku untuk semua dealer di aplikasi mobile secara real-time.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: TRANSFER BANK MANUAL (CBD) */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Section Header */}
          <button
            onClick={() => setCbdExpanded(!cbdExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.cbd_enabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                <Building2 size={20} className={settings.cbd_enabled ? 'text-emerald-600' : 'text-gray-400'} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">Transfer Bank Manual (CBD)</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${settings.cbd_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {settings.cbd_enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Cash Before Delivery — Dealer transfer sebelum pesanan dikirim</p>
              </div>
            </div>
            {cbdExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {cbdExpanded && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">

              {/* Toggle Aktif / Nonaktif */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-bold text-gray-800">Status Metode CBD</p>
                  <p className="text-xs text-gray-500 mt-0.5">Jika dinonaktifkan, pilihan transfer bank tidak akan muncul di checkout dealer</p>
                </div>
                <button
                  onClick={() => update('cbd_enabled', !settings.cbd_enabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer flex-shrink-0 ${settings.cbd_enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.cbd_enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Nama Bank */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 size={13} className="text-emerald-600" />
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={settings.bank_name}
                  onChange={(e) => update('bank_name', e.target.value)}
                  placeholder="contoh: BCA (Bank Central Asia)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Nomor Rekening */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Hash size={13} className="text-emerald-600" />
                    Nomor Rekening
                  </label>
                  <div className="relative">
                    <input
                      type={showAccountNumber ? 'text' : 'password'}
                      value={settings.bank_account_number}
                      onChange={(e) => update('bank_account_number', e.target.value)}
                      placeholder="contoh: 1234567890"
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm font-bold font-mono text-gray-900 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showAccountNumber ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Nama Pemilik */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={13} className="text-emerald-600" />
                    Atas Nama
                  </label>
                  <input
                    type="text"
                    value={settings.bank_account_name}
                    onChange={(e) => update('bank_account_name', e.target.value)}
                    placeholder="contoh: PT DISTRIBUSI AKSESORIS PRIMA"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all uppercase"
                  />
                </div>
              </div>

              {/* Label CBD */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Label Metode (tampil di checkout dealer)
                </label>
                <input
                  type="text"
                  value={settings.cbd_term_label}
                  onChange={(e) => update('cbd_term_label', e.target.value)}
                  placeholder="Transfer Bank Manual (CBD - Cash Before Delivery)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Instruksi CBD */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Instruksi Pembayaran (tampil di checkout dealer)
                </label>
                <textarea
                  value={settings.cbd_instructions}
                  onChange={(e) => update('cbd_instructions', e.target.value)}
                  rows={3}
                  placeholder="Transfer ke rekening resmi perusahaan..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Preview Card */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5">
                  <Shield size={12} />
                  PRATINJAU — Tampilan di Aplikasi Dealer
                </p>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Building2 size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{settings.bank_name || '—'}</p>
                      <p className="text-lg font-black font-mono text-gray-800 tracking-widest">
                        {showAccountNumber ? settings.bank_account_number : settings.bank_account_number.replace(/\d(?=\d{3})/g, '•')}
                      </p>
                      <p className="text-xs text-gray-500">a.n. {settings.bank_account_name || '—'}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <p className="text-xs text-gray-500">{settings.cbd_instructions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: COD (Bayar di Tempat) */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setCodExpanded(!codExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.cod_enabled ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <Truck size={20} className={settings.cod_enabled ? 'text-amber-600' : 'text-gray-400'} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">COD (Bayar di Tempat)</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${settings.cod_enabled ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {settings.cod_enabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Cash On Delivery — Dealer bayar saat barang diterima</p>
              </div>
            </div>
            {codExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {codExpanded && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">

              {/* Toggle COD */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-bold text-gray-800">Status Metode COD</p>
                  <p className="text-xs text-gray-500 mt-0.5">Jika dinonaktifkan, pilihan COD tidak akan muncul di checkout</p>
                </div>
                <button
                  onClick={() => update('cod_enabled', !settings.cod_enabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer flex-shrink-0 ${settings.cod_enabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.cod_enabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Termin Hari */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-600" />
                    Termin Pembayaran (H+?)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">H+</span>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={settings.cod_term_days}
                      onChange={(e) => update('cod_term_days', parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:ring-4 focus:ring-amber-400/15 focus:border-amber-400 outline-none transition-all text-center"
                    />
                    <span className="text-xs text-gray-500 font-medium">hari</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">0 = Bayar Saat Terima (H+0)</p>
                </div>

                {/* Maksimal COD */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign size={13} className="text-amber-600" />
                    Batas Maksimal COD (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={settings.cod_max_amount}
                      onChange={(e) => update('cod_max_amount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:ring-4 focus:ring-amber-400/15 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">0 = tidak ada batas</p>
                </div>
              </div>

              {/* Label COD */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Label Metode COD
                </label>
                <input
                  type="text"
                  value={settings.cod_term_label}
                  onChange={(e) => update('cod_term_label', e.target.value)}
                  placeholder="Bayar Saat Terima Barang (H+0)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-amber-400/15 focus:border-amber-400 outline-none transition-all"
                />
              </div>

              {/* Kebijakan COD */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Ketentuan &amp; Kebijakan COD
                </label>
                <textarea
                  value={settings.cod_policy_terms}
                  onChange={(e) => update('cod_policy_terms', e.target.value)}
                  rows={3}
                  placeholder="Pembayaran dilakukan saat barang diterima..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-4 focus:ring-amber-400/15 focus:border-amber-400 outline-none transition-all resize-none"
                />
              </div>

              {/* Preview COD */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                  <Shield size={12} />
                  PRATINJAU — Tampilan di Aplikasi Dealer
                </p>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck size={18} className="text-amber-600" />
                      <p className="text-sm font-bold text-gray-900">COD (Bayar di Tempat)</p>
                    </div>
                    <span className="text-xs font-black bg-amber-100 text-amber-800 px-2 py-1 rounded-lg">
                      {settings.cod_term_days === 0 ? 'H+0' : `H+${settings.cod_term_days}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{settings.cod_term_label}</p>
                  {settings.cod_max_amount > 0 && (
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      Maks. Rp {settings.cod_max_amount.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex justify-end pt-2 pb-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-2xl text-base font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg ${
              isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white hover:shadow-xl active:scale-95'
            }`}
          >
            {isSaving ? (
              <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={18} /> Simpan Semua Pengaturan Pembayaran</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
