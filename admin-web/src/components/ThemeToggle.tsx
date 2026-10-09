'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[120px] h-10 bg-gray-100 rounded-xl animate-pulse" />;
  }

  return (
    <div className="flex items-center p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
          theme === 'light' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
        }`}
      >
        <Sun size={14} className="mr-1.5" />
        <span className="text-xs">Clean</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
          theme === 'dark' ? 'bg-zinc-700 text-emerald-400 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400'
        }`}
      >
        <Moon size={14} className="mr-1.5" />
        <span className="text-xs">Dark</span>
      </button>
    </div>
  );
}
