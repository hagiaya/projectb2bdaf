'use client';

import React, { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';
import { getProductImageUrl } from '@/lib/image';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
  showZoomIcon?: boolean;
}

export default function ProductImage({
  src,
  alt = 'Foto Produk',
  className = 'w-full h-full object-cover',
  containerClassName = '',
  onClick,
  showZoomIcon = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedUrl = getProductImageUrl(src);

  if (!resolvedUrl || hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl border border-slate-200/60 ${containerClassName || className}`}
        onClick={onClick}
      >
        <Package size={20} strokeWidth={1.5} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80 group ${onClick ? 'cursor-pointer' : ''} ${containerClassName}`}
      onClick={onClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200/70 animate-pulse flex items-center justify-center">
          <Package size={18} className="text-slate-400 opacity-60" />
        </div>
      )}
      <img
        src={resolvedUrl}
        alt={alt}
        className={`${className} transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
      {showZoomIcon && onClick && (
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <span className="text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">Lihat</span>
        </div>
      )}
    </div>
  );
}
