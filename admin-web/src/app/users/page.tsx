'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserCog, User, Shield, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Profile is read-only from this client interface for security (Auth handling usually needed)
    // We just show them and allow role updates if RLS permits.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setUsers(data as any);
    }
    setIsLoading(false);
  };

  const handleUpdateRole = async (id: string, newRole: string) => {
    if (confirm(`Ubah role menjadi ${newRole}?`)) {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
      if (!error) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      } else {
        alert("Gagal mengupdate role. Pastikan Anda punya hak akses admin.");
      }
    }
  };

  const filteredUsers = users.filter((u) => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.phone_number && u.phone_number.includes(searchQuery))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <UserCog size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengguna & Hak Akses</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Kelola profil pengguna dan atur Role akses (Admin/Sales/Dealer).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Pengguna (Nama, No HP)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-5 font-semibold border-b border-gray-100">Nama Lengkap</th>
              <th className="p-5 font-semibold border-b border-gray-100">Kontak</th>
              <th className="p-5 font-semibold border-b border-gray-100">Role Saat Ini</th>
              <th className="p-5 font-semibold border-b border-gray-100">Ubah Role</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {isLoading ? (
               <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Memuat data profil...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
               <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Tidak ada pengguna ditemukan.</td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.full_name}</p>
                      <p className="text-xs text-slate-400 font-medium">ID: {user.id.substring(0,8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Phone size={14} className="text-slate-400" /> {user.phone_number || '-'}
                  </div>
                </td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    user.role === 'ADMIN' ? 'bg-purple-100/50 text-purple-700 border-purple-200/50' :
                    user.role === 'DEALER' ? 'bg-blue-100/50 text-blue-700 border-blue-200/50' :
                    'bg-slate-100/80 text-slate-700 border-slate-200'
                  }`}>
                    <Shield size={14} /> {user.role}
                  </span>
                </td>
                <td className="p-5">
                  <select 
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="DEALER">DEALER</option>
                    <option value="SALES">SALES</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
