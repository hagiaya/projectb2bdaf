'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ERPPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inventory?tab=report');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
          Membuka Modul Persediaan ERP...
        </p>
      </div>
    </div>
  );
}
