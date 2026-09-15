'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('ditoapp@atomicmail.io');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = (customEmail || email).trim();
    const loginPassword = customPassword || password;

    try {
      let sessionData: any = null;

      // Percobaan 1: Login langsung lewat Supabase client
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        if (!authError && data?.session) {
          sessionData = data;
        } else if (authError) {
          // Jika bukan error fetch, simpan dulu errornya
          console.warn('Supabase client login warning:', authError.message);
        }
      } catch (clientErr: any) {
        console.warn('Client direct fetch failed, trying server proxy...', clientErr);
      }

      // Percobaan 2 (Fallback): Jika client fetch diblokir browser/adblock (Failed to fetch)
      if (!sessionData) {
        const proxyRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });

        const proxyData = await proxyRes.json();

        if (!proxyRes.ok) {
          throw new Error(proxyData.error || 'Gagal login. Periksa email dan password Anda.');
        }

        if (proxyData.session) {
          // Sinkronisasi session ke Supabase client
          await supabase.auth.setSession({
            access_token: proxyData.session.access_token,
            refresh_token: proxyData.session.refresh_token,
          });
          sessionData = proxyData;
        }
      }

      if (!sessionData) {
        throw new Error('Gagal menghubungkan sesi login.');
      }

      // Cek apakah emailnya Dito (bypassing role check)
      const userEmail = sessionData.user?.email || loginEmail;
      if (userEmail.toLowerCase() !== 'ditoapp@atomicmail.io') {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessionData.user.id)
          .single();

        if (profileData?.role !== 'ADMIN') {
          await supabase.auth.signOut();
          throw new Error(`Akses ditolak. Akun Anda terdaftar sebagai ${profileData?.role || 'User'}. Portal ini khusus untuk Administrator. Silakan gunakan Link User untuk login Sales/Dealer.`);
        }
      }

      // Pastikan session tersimpan sempurna sebelum redirect
      await new Promise((r) => setTimeout(r, 150));
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Gagal login. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    setEmail('ditoapp@atomicmail.io');
    setPassword('admin123');
    handleLogin(undefined, 'ditoapp@atomicmail.io', 'admin123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-[#8ec44a] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm overflow-hidden p-2 shadow-inner">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">B2B Admin Panel</h1>
          <p className="text-white/90 text-sm mt-1">Masuk untuk mengelola sistem katalog & pesanan</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 mb-6 border border-red-200 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="text-sm">
                <p className="font-semibold">Login Gagal</p>
                <p className="text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Quick 1-Click Login Card */}
          <div className="mb-6 bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Akun Admin Resmi</span>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Terverifikasi
              </span>
            </div>
            <p className="text-xs text-emerald-700/90 mt-1 font-mono">
              ditoapp@atomicmail.io
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleQuickAdminLogin}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {loading ? 'Menghubungkan...' : '1-Klik Masuk sebagai Admin'}
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider font-semibold">Atau Manual</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8ec44a] focus:border-transparent transition-all text-sm font-medium"
                  placeholder="ditoapp@atomicmail.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8ec44a] focus:border-transparent transition-all text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#8ec44a] hover:bg-[#7eb33a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8ec44a] transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Login ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
