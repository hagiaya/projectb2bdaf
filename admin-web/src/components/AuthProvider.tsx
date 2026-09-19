'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [loading, setLoading] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Safety timeout: Never stay in loading state longer than 1.5 seconds
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1500);

    const checkUser = async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          await new Promise((r) => setTimeout(r, 200));
          const retryRes = await supabase.auth.getSession();
          session = retryRes.data.session;
        }

        if (!session) {
          if (isMounted) {
            setLoading(false);
            router.push('/login');
          }
          return;
        }

        // Verify role (bypass for Dito)
        if (session.user.email?.toLowerCase() !== 'ditoapp@atomicmail.io') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role !== 'ADMIN') {
            await supabase.auth.signOut();
            if (isMounted) {
              router.push('/login');
            }
          }
        }
      } catch (err) {
        console.warn('Auth check warning:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session) {
        if (session.user.email?.toLowerCase() !== 'ditoapp@atomicmail.io') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.role !== 'ADMIN') {
            await supabase.auth.signOut();
            router.push('/login');
          }
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, [pathname, isLoginPage, router]);

  // If on login page, render login page immediately without sidebar or loading spinner
  if (isLoginPage) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <span className="text-xs font-semibold text-slate-500">Memuat sesi Admin DAP...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </>
  );
}
