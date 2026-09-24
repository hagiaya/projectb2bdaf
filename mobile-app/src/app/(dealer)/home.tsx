import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Modal, Alert, Image, Linking
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';
import { useCart } from '../../context/CartContext';
import { useSafeBottom } from '../../hooks/useSafeBottom';

const WA_NUMBER = '628114981666'; // 08114981666 → format internasional

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

// =========================================================
// DATA DUMMY BANNER & MENU
// =========================================================

const bannerAds = [
  { id: '1', title: 'Promo Akhir Tahun', subtitle: 'Diskon hingga 30% untuk semua produk', color: '#8ec44a', accent: '#4a6b22', route: '/(dealer)/promo' },
  { id: '3', title: 'Gratis Ongkir', subtitle: 'Untuk pembelian minimal Rp 500.000', color: '#7eb33a', accent: '#166534', route: '/(dealer)/promo' },
];

// MENU DENGAN PILIHAN BERFUNGSI (Menu "Lainnya" sudah dihapus)
const menuItems = [
  { name: 'Katalog', route: '/(dealer)/catalog', icon: 'grid' },
  { name: 'Pesanan', route: '/(dealer)/orders', icon: 'shopping-bag' },
  { name: 'Program', route: '/(dealer)/programs', icon: 'award' },
  { name: 'Promo', route: '/(dealer)/promo', icon: 'gift' },
  { name: 'Retur', route: '/(dealer)/returns', icon: 'refresh-ccw' },
  { name: 'Wishlist', route: '/(dealer)/wishlist', icon: 'heart' },
];

// =========================================================
// FLASH SALE COUNTDOWN
// =========================================================
function useCountdown(targetHour: number) {
  const getSecondsLeft = () => {
    const now = new Date();
    const end = new Date();
    end.setHours(targetHour, 0, 0, 0);
    if (now >= end) end.setDate(end.getDate() + 1);
    return Math.floor((end.getTime() - now.getTime()) / 1000);
  };
  const [secs, setSecs] = useState(getSecondsLeft());
  useEffect(() => {
    const t = setInterval(() => setSecs(getSecondsLeft()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return { h, m, s };
}

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  banner_url?: string | null;
  code?: string;
  discount_percent?: number;
  color: string;
  accent: string;
  route: string;
}

function BannerCarousel() {
  const [active, setActive] = useState(0);
  const [banners, setBanners] = useState<BannerItem[]>(bannerAds as any);
  const flatRef = useRef<FlatList>(null);

  const fetchPromoBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const colors = [
          { color: '#15803d', accent: '#166534' },
          { color: '#2563eb', accent: '#1e40af' },
          { color: '#7c3aed', accent: '#6d28d9' },
          { color: '#c2410c', accent: '#9a3412' },
        ];

        const promoBanners: BannerItem[] = data.map((p: any, idx: number) => {
          const c = colors[idx % colors.length];
          return {
            id: p.id,
            title: p.title || `Promo Diskon ${p.discount_percent}%`,
            subtitle: p.description || `Gunakan kode: ${p.code} saat checkout`,
            banner_url: p.banner_url || null,
            code: p.code,
            discount_percent: p.discount_percent,
            color: c.color,
            accent: c.accent,
            route: '/(dealer)/promo',
          };
        });

        // Always include Reward Program banner
        const rewardProgramBanner: BannerItem = {
          id: 'reward-program-banner',
          title: 'Target Program Display & Reward DAP',
          subtitle: 'Capai target belanja & dapatkan Etalase, Rak Display, & Cashback!',
          banner_url: null,
          color: '#8ec44a',
          accent: '#4a6b22',
          route: '/(dealer)/programs',
        };

        setBanners([promoBanners[0], rewardProgramBanner, ...promoBanners.slice(1)]);
      }
    } catch (e) {
      console.warn('Fetch promo banners error:', e);
    }
  };

  useEffect(() => {
    fetchPromoBanners();

    // Live subscription for instant banner update when admin uploads JPG
    const promoSub = supabase
      .channel('home-promos-live-banners')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promos' },
        () => {
          fetchPromoBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(promoSub);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const next = (active + 1) % banners.length;
      flatRef.current?.scrollToOffset({ offset: next * BANNER_WIDTH, animated: true });
      setActive(next);
    }, 4500);
    return () => clearInterval(timer);
  }, [active, banners.length]);

  return (
    <View style={styles.bannerSection}>
      <FlatList
        ref={flatRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
          setActive(idx);
        }}
        renderItem={({ item }) => {
          if (item.banner_url) {
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.bannerCardImageWrap, { width: BANNER_WIDTH }]}
                onPress={() => router.push(((item as any).route || '/(dealer)/promo') as any)}
              >
                <Image
                  source={{ uri: item.banner_url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerImageOverlay}>
                  {item.code && (
                    <View style={styles.bannerImageBadge}>
                      <Feather name="tag" size={11} color="white" />
                      <Text style={styles.bannerImageBadgeText}>
                        {item.code} {item.discount_percent ? `• Diskon ${item.discount_percent}%` : ''}
                      </Text>
                    </View>
                  )}
                  <View style={styles.bannerImageBottomText}>
                    <Text style={styles.bannerImageTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.bannerImageSub} numberOfLines={1}>{item.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <View style={[styles.bannerCard, { backgroundColor: item.color, width: BANNER_WIDTH }]}>
              <View style={[styles.bannerCircle, { backgroundColor: item.accent }]} />
              <Feather name="tag" size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => router.push(((item as any).route || '/(dealer)/promo') as any)}
              >
                <Text style={styles.bannerBtnText}>Lihat Sekarang →</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, active === i && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

// =========================================================
// MAIN SCREEN
// =========================================================
export default function DealerHome() {
  const countdown = useCountdown(23);
  const { cartCount, addToCart } = useCart();
  const safeBottom = useSafeBottom();

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real Profile States
  const [profile, setProfile] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);

  // Modal States
  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isTrackVisible, setIsTrackVisible] = useState(false);
  // Real Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchProducts();
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    // Ambil produk dengan prioritas urutan yang ditentukan admin
    let { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(20);

    if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
      const fb = await supabase.from('products').select('*').limit(20);
      data = fb.data;
    }

    if (data) {
      const sorted = [...data].sort((a: any, b: any) => {
        const orderA = a.sort_order ?? 9999;
        const orderB = b.sort_order ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
      setProducts(sorted);
      setFlashSaleProducts(sorted.filter(p => p.is_flash_sale));
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: dealerData } = await supabase.from('dealers').select('*').eq('profile_id', user.id).single();
    
    if (profileData) setProfile(profileData);
    if (dealerData) setDealer(dealerData);
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (data && !error) {
      setNotifications(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileVisible(false);
    router.replace('/login');
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  // derived lists (Membagi produk yang diacak ke berbagai section agar tidak sama)
  const bestSellerProducts = products.slice(0, 4);
  const recentlyViewed = products.slice(9, 14);

  const storeName = dealer?.store_name || 'Toko Anda';
  const initial = storeName.substring(0, 2).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: safeBottom + 20 }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={{ width: 120, height: 40, resizeMode: 'contain', marginBottom: 12, marginLeft: -8 }} 
          />
          <Text style={styles.greeting}>Halo, {profile?.full_name || storeName} 👋</Text>
          <Text style={styles.subtitle}>Selamat datang kembali!</Text>
        </View>
        <View style={styles.headerRight}>
          {/* 1. ICON NOTIFIKASI BERFUNGSI */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setIsNotifVisible(true)}>
            <Feather name="bell" size={20} color="white" />
            {unreadCount > 0 && <View style={styles.notifBadge} />}
          </TouchableOpacity>

          {/* KERANJANG */}
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'transparent' }]} onPress={() => router.push('/(dealer)/cart' as any)}>
            <Feather name="shopping-cart" size={20} color="white" />
            {cartCount > 0 && (
              <View style={[styles.notifBadge, { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', right: 4, top: 4 }]}>
                <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 2. LOGO PROFILE USER BERFUNGSI */}
          <TouchableOpacity style={styles.avatar} onPress={() => setIsProfileVisible(true)}>
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BANNER VERIFIKASI PENDING */}
      {profile?.approval_status === 'PENDING' && (
        <View style={styles.pendingBanner}>
          <View style={styles.pendingIconWrap}>
            <Feather name="clock" size={22} color="#92400e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Akun Sedang Diverifikasi ⏳</Text>
            <Text style={styles.pendingDesc}>
              Akun Anda sedang dalam proses verifikasi oleh Admin (1×24 jam). Anda bisa menjelajahi katalog, namun belum bisa melakukan pemesanan.
            </Text>
          </View>
        </View>
      )}

      {/* SEARCH BAR */}
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(dealer)/catalog')}>
        <Feather name="search" size={16} color="#8ec44a" />
        <Text style={styles.searchPlaceholder}>Cari produk, kategori...</Text>
      </TouchableOpacity>

      {/* MENU UTAMA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.name} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
              <View style={styles.menuIcon}>
                <Feather name={item.icon as any} size={22} color="#8ec44a" />
              </View>
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
          {/* Tombol Pengaduan / WA */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              const msg = encodeURIComponent('Halo, saya dealer dan ingin menyampaikan pengaduan/keluhan:');
              Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${msg}`).catch(() =>
                Alert.alert('Gagal', 'Tidak dapat membuka WhatsApp. Pastikan WhatsApp terinstall.')
              );
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#dcfce7' }]}>
              <Feather name="message-circle" size={22} color="#16a34a" />
            </View>
            <Text style={styles.menuText}>Pengaduan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PRODUK TERLARIS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Produk Terlaris</Text>
          <TouchableOpacity onPress={() => router.push('/(dealer)/catalog')}><Text style={styles.seeAll}>Lihat Semua</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {!loading && bestSellerProducts.length === 0 ? (
            <View style={styles.emptyProductBox}>
              <Text style={styles.emptyProductText}>Belum ada produk terlaris saat ini.</Text>
            </View>
          ) : (
            bestSellerProducts.map((item) => {
              const isHabis = item.stock === 0;
              const hasNewTag = (item.sku && item.sku.toUpperCase().includes('NEW')) || (item.name && item.name.toUpperCase().includes('NEW'));
              const displaySku = item.sku ? item.sku.replace(/NEW/gi, '').trim() : 'SKU Tidak Diketahui';
              return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.productCard, isHabis && { opacity: 0.6 }]}
                disabled={isHabis}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <View style={styles.productImage}>
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <FallbackImage uri={item.image_urls[0]} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  ) : item.image_url ? (
                    <FallbackImage uri={item.image_url} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  ) : (
                    <Feather name="box" size={32} color="#8ec44a" />
                  )}
                  
                  {isHabis && (
                    <View style={styles.habisOverlay}>
                      <Text style={styles.habisText}>HABIS</Text>
                    </View>
                  )}
                </View>
                {(!isHabis && hasNewTag) && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={2}>{displaySku}</Text>
                <Text style={styles.productSold}>100+ terjual</Text>
                <Text style={styles.productPrice}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
                <TouchableOpacity 
                  style={[styles.buyButton, isHabis && { backgroundColor: '#cbd5e1' }]} 
                  onPress={() => addToCart(item)} 
                  disabled={isHabis}
                >
                  <Text style={styles.buyText}>{isHabis ? 'Habis' : '+ Keranjang'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )})
          )}
        </ScrollView>
      </View>

      {/* BANNER ADS */}
      <BannerCarousel />

      {/* FLASH SALE */}
      {flashSaleProducts.length > 0 && (
        <View style={[styles.section, { backgroundColor: '#fee2e2', padding: 16, marginHorizontal: 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="zap" size={20} color="#ef4444" />
              <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Flash Sale</Text>
            </View>
            <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{String(hours).padStart(2, '0')} : {String(minutes).padStart(2, '0')} : {String(seconds).padStart(2, '0')}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {flashSaleProducts.map((item) => {
              const isHabis = item.stock === 0;
              return (
                <TouchableOpacity 
                  key={`flash-${item.id}`} 
                  style={[styles.flashCard, isHabis && { opacity: 0.6 }]}
                  onPress={() => router.push(`/(dealer)/product/${item.id}`)}
                  disabled={isHabis}
                >
                  <View style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9', alignSelf: 'center' }}>
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <FallbackImage uri={item.image_urls[0]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : item.image_url ? (
                      <FallbackImage uri={item.image_url} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Feather name="package" size={32} color="#94a3b8" style={{ alignSelf: 'center', marginTop: 44 }} />
                    )}
                    {isHabis && (
                      <View style={styles.habisOverlay}>
                        <Text style={styles.habisText}>HABIS</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.productName, { marginTop: 8 }]} numberOfLines={2}>{item.name}</Text>
                  
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: '#94a3b8', textDecorationLine: 'line-through' }}>
                      Rp {item.price.toLocaleString('id-ID')}
                    </Text>
                    <Text style={[styles.productPrice, { color: '#ef4444', fontSize: 14 }]}>
                      Rp {item.flash_sale_price ? Number(item.flash_sale_price).toLocaleString('id-ID') : item.price.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.buyBtn, { backgroundColor: '#ef4444', marginTop: 8 }, isHabis && { backgroundColor: '#fca5a5' }]}
                    onPress={() => addToCart(item, 1)}
                    disabled={isHabis}
                  >
                    <Text style={styles.buyText}>{isHabis ? 'Habis' : '+ Keranjang'}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* BARU DILIHAT */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👁 Terakhir Dilihat</Text>
          <TouchableOpacity onPress={() => router.push('/(dealer)/catalog')}><Text style={styles.seeAll}>Lihat Semua</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {!loading && recentlyViewed.length === 0 ? (
            <View style={styles.emptyProductBox}>
              <Text style={styles.emptyProductText}>Belum ada produk yang dilihat.</Text>
            </View>
          ) : (
            recentlyViewed.map((item) => {
              const isHabis = item.stock === 0;
              const hasNewTag = (item.sku && item.sku.toUpperCase().includes('NEW')) || (item.name && item.name.toUpperCase().includes('NEW'));
              const displaySku = item.sku ? item.sku.replace(/NEW/gi, '').trim() : 'SKU Tidak Diketahui';
              return (
              <View 
                key={item.id} 
                style={[styles.recentCard, isHabis && { opacity: 0.6 }]}
                pointerEvents={isHabis ? 'none' : 'auto'}
              >
                <View style={styles.recentImage}>
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <FallbackImage uri={item.image_urls[0]} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  ) : item.image_url ? (
                    <FallbackImage uri={item.image_url} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  ) : (
                    <Feather name="package" size={24} color="#8ec44a" />
                  )}
                  {isHabis && (
                    <View style={styles.habisOverlay}>
                      <Text style={[styles.habisText, { fontSize: 10, paddingHorizontal: 4 }]}>HABIS</Text>
                    </View>
                  )}
                </View>
                {(!isHabis && hasNewTag) && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={2}>{displaySku}</Text>
                <Text style={styles.productPrice}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
              </View>
            )})
          )}
        </ScrollView>
      </View>

      {/* LACAK PESANAN (CTA) */}
      <TouchableOpacity style={styles.trackOrderBanner} onPress={() => setIsTrackVisible(true)}>
        <Feather name="package" size={22} color="#8ec44a" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.trackTitle}>Lacak Pesanan Anda</Text>
          <Text style={styles.trackSubtitle}>Klik untuk melihat status pengiriman</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#8ec44a" />
      </TouchableOpacity>

      {/* BANNER PENGADUAN / KOMPLAIN WA */}
      <TouchableOpacity
        style={styles.complaintBanner}
        activeOpacity={0.85}
        onPress={() => {
          const msg = encodeURIComponent(
            'Halo Tim Support, saya dealer dan ingin menyampaikan pengaduan / laporan:'
          );
          Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${msg}`).catch(() =>
            Alert.alert('Gagal', 'Tidak dapat membuka WhatsApp.')
          );
        }}
      >
        <View style={styles.complaintIconWrap}>
          <Feather name="message-circle" size={22} color="white" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.complaintTitle}>Ada Pengaduan / Komplain?</Text>
          <Text style={styles.complaintSubtitle}>Hubungi tim kami langsung via WhatsApp</Text>
        </View>
        <View style={styles.complaintWABadge}>
          <Feather name="external-link" size={14} color="white" />
        </View>
      </TouchableOpacity>

      <View style={{ height: 32 }} />

      {/* ==================== MODALS ==================== */}

      {/* 1. MODAL NOTIFIKASI */}
      <Modal visible={isNotifVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 Notifikasi</Text>
              <TouchableOpacity onPress={() => setIsNotifVisible(false)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {notifications.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748b' }}>Tidak ada notifikasi baru.</Text>
              ) : (
                notifications.map((n) => {
                  const dateObj = new Date(n.created_at);
                  const isToday = new Date().toDateString() === dateObj.toDateString();
                  const timeStr = isToday ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : dateObj.toLocaleDateString('id-ID');
                  
                  return (
                    <TouchableOpacity 
                      key={n.id} 
                      style={[styles.notifItem, !n.is_read && { backgroundColor: '#f0fdf4' }]} 
                      onPress={() => !n.is_read && markNotificationRead(n.id)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={[styles.notifTitle, !n.is_read && { color: '#16a34a' }]}>{n.title}</Text>
                        {!n.is_read && <View style={{ width: 8, height: 8, backgroundColor: '#eab308', borderRadius: 4, marginTop: 4 }} />}
                      </View>
                      <Text style={styles.notifDesc}>{n.description}</Text>
                      <Text style={styles.notifTime}>{timeStr}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. MODAL PROFILE USER */}
      <Modal visible={isProfileVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Profil Toko / Dealer</Text>
              <TouchableOpacity onPress={() => setIsProfileVisible(false)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileBody}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarText}>{initial}</Text>
              </View>
              <Text style={styles.profileStoreName}>{storeName}</Text>
              <Text style={[
                styles.profileStatus,
                profile?.approval_status === 'PENDING' && { color: '#d97706' },
                profile?.approval_status === 'REJECTED' && { color: '#ef4444' },
              ]}>
                {profile?.approval_status === 'PENDING' ? '⏳ Menunggu Verifikasi Admin' :
                 profile?.approval_status === 'REJECTED' ? '❌ Pendaftaran Ditolak' :
                 '✅ Dealer Terverifikasi'}
              </Text>

              <View style={styles.profileInfoList}>
                <View style={styles.profileInfoItem}>
                  <Feather name="user" size={16} color="#8ec44a" />
                  <Text style={styles.profileInfoText}>Pemilik: {profile?.full_name || 'Tidak ada info'}</Text>
                </View>
                <View style={styles.profileInfoItem}>
                  <Feather name="phone" size={16} color="#8ec44a" />
                  <Text style={styles.profileInfoText}>{profile?.phone_number || 'Tidak ada info'}</Text>
                </View>
                <View style={styles.profileInfoItem}>
                  <Feather name="map-pin" size={16} color="#8ec44a" />
                  <Text style={styles.profileInfoText}>{dealer?.address || 'Tidak ada info'}</Text>
                </View>
              </View>

              {dealer?.is_credit_eligible && (
                <View style={[styles.profileInfoList, { backgroundColor: '#f5f3ff', marginBottom: 20 }]}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6d28d9', marginBottom: 8 }}>Info Kredit / Tempo B2B</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: '#475569' }}>Plafon Total:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b' }}>Rp {Number(dealer.credit_limit || 0).toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: '#475569' }}>Kredit Terpakai:</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#ef4444' }}>Rp {Number(dealer.outstanding_balance || 0).toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ede9fe', paddingTop: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#16a34a' }}>Sisa Plafon (Tersedia):</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#16a34a' }}>Rp {Math.max(0, Number(dealer.credit_limit || 0) - Number(dealer.outstanding_balance || 0)).toLocaleString('id-ID')}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={handleLogout}
              >
                <Feather name="log-out" size={18} color="white" />
                <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. MODAL LACAK PESANAN DETAIL */}
      <Modal visible={isTrackVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚚 Detail Lacak Pesanan</Text>
              <TouchableOpacity onPress={() => setIsTrackVisible(false)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#4a6b22' }}>No. Invoice: INV-20231024-001</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Tanggal: 24 Oktober 2026</Text>

              <View style={styles.trackSteps}>
                <View style={styles.trackStepItem}>
                  <View style={[styles.stepDot, styles.stepDotDone]} />
                  <Text style={styles.stepTextDone}>Pesanan Dibuat (24 Oct 09:00)</Text>
                </View>
                <View style={styles.trackStepItem}>
                  <View style={[styles.stepDot, styles.stepDotDone]} />
                  <Text style={styles.stepTextDone}>Dikonfirmasi Gudang (24 Oct 10:30)</Text>
                </View>
                <View style={styles.trackStepItem}>
                  <View style={[styles.stepDot, styles.stepDotActive]} />
                  <Text style={styles.stepTextActive}>Dalam Kurir Pengiriman (Sukur Logistics)</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.fullOrdersBtn}
                onPress={() => {
                  setIsTrackVisible(false);
                  router.push('/(dealer)/orders');
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Lihat Semua Riwayat Pesanan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// =========================================================
// STYLES
// =========================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0' },

  header: { padding: 20, paddingTop: 40, paddingBottom: 24, backgroundColor: '#8dc54a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  subtitle: { color: '#dcf0c3', fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 19, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, backgroundColor: '#eab308', borderRadius: 4 },
  avatar: { width: 40, height: 40, backgroundColor: '#dcf0c3', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#4a6b22', fontWeight: 'bold', fontSize: 12 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginTop: -18, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#8ec44a', shadowOpacity: 0.10, shadowRadius: 6, elevation: 4, gap: 8 },
  searchPlaceholder: { color: '#94a3b8', fontSize: 14 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4a6b22', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#8ec44a', fontWeight: '600' },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  menuItem: { width: '25%', alignItems: 'center', marginBottom: 16 },
  menuIcon: { width: 52, height: 52, backgroundColor: '#f0f7e6', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  menuText: { fontSize: 11, color: '#4b5563', textAlign: 'center' },

  productCard: { width: 150, backgroundColor: 'white', borderRadius: 14, padding: 12, marginRight: 12, shadowColor: '#8ec44a', shadowOpacity: 0.08, elevation: 2 },
  productImage: { width: '100%', height: 90, backgroundColor: '#f0f7e6', borderRadius: 8, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  productSold: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  productPrice: { fontSize: 14, color: '#8ec44a', fontWeight: 'bold', marginTop: 4, marginBottom: 10 },
  buyButton: { backgroundColor: '#8ec44a', paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  buyText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  bannerSection: { marginHorizontal: 16, marginTop: 20 },
  bannerCard: { borderRadius: 16, padding: 20, overflow: 'hidden', marginRight: 0, minHeight: 140 },
  bannerCardImageWrap: { borderRadius: 16, overflow: 'hidden', height: 148, position: 'relative', backgroundColor: '#064e3b' },
  bannerImage: { width: '100%', height: '100%' },
  bannerImageOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 14,
    justifyContent: 'space-between',
  },
  bannerImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerImageBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bannerImageBottomText: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginHorizontal: -14,
    marginBottom: -14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backdropFilter: 'blur(4px)',
  },
  bannerImageTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerImageSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  bannerCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -40, top: -40, opacity: 0.5 },
  bannerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 14 },
  bannerBtn: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bannerBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dcf0c3' },
  dotActive: { backgroundColor: '#8ec44a', width: 18 },

  flashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flashTitle: { fontSize: 16, fontWeight: 'bold', color: '#4a6b22' },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  countBox: { backgroundColor: '#ca8a04', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  countText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  colon: { color: '#ca8a04', fontWeight: 'bold', fontSize: 14 },
  flashCard: { width: 140, backgroundColor: 'white', borderRadius: 14, padding: 10, marginRight: 12, shadowColor: '#ca8a04', shadowOpacity: 0.08, elevation: 2 },
  flashImage: { width: '100%', height: 80, backgroundColor: '#fef9c3', borderRadius: 8, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  flashName: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  flashOriginalPrice: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through', marginTop: 2 },
  flashPrice: { fontSize: 14, color: '#ca8a04', fontWeight: 'bold', marginTop: 2 },
  discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#eab308', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 1 },
  discountText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  stockBar: { height: 4, backgroundColor: '#fef08a', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  stockFill: { height: 4, backgroundColor: '#eab308', borderRadius: 2 },
  stockText: { fontSize: 10, color: '#94a3b8', marginTop: 3, marginBottom: 8 },
  flashBuyBtn: { backgroundColor: '#eab308', paddingVertical: 7, borderRadius: 8, alignItems: 'center' },

  recentCard: { width: 120, backgroundColor: 'white', borderRadius: 12, padding: 10, marginRight: 12, shadowColor: '#8ec44a', shadowOpacity: 0.05, elevation: 1 },
  recentImage: { width: '100%', height: 70, backgroundColor: '#f0f7e6', borderRadius: 8, marginBottom: 6, justifyContent: 'center', alignItems: 'center' },

  trackOrderBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginTop: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#dcf0c3', shadowColor: '#8ec44a', shadowOpacity: 0.10, elevation: 2 },
  trackTitle: { fontSize: 14, fontWeight: '700', color: '#4a6b22' },
  trackSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#4a6b22' },

  notifItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  notifTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  notifDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  notifTime: { fontSize: 10, color: '#94a3b8', marginTop: 4 },

  profileBody: { alignItems: 'center', paddingVertical: 16 },
  profileAvatarLarge: { width: 64, height: 64, backgroundColor: '#f0f7e6', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileAvatarText: { color: '#4a6b22', fontSize: 20, fontWeight: 'bold' },
  profileStoreName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  profileStatus: { fontSize: 12, color: '#8ec44a', fontWeight: '600', marginTop: 2, marginBottom: 16 },
  profileInfoList: { width: '100%', gap: 10, marginBottom: 20, backgroundColor: '#f6fbf0', padding: 14, borderRadius: 12 },
  profileInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileInfoText: { fontSize: 13, color: '#334155' },
  logoutBtn: { width: '100%', backgroundColor: '#ef4444', padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  logoutBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  trackSteps: { paddingVertical: 16, gap: 12 },
  trackStepItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepDotDone: { backgroundColor: '#8ec44a' },
  stepDotActive: { backgroundColor: '#eab308' },
  stepTextDone: { fontSize: 12, color: '#475569' },
  stepTextActive: { fontSize: 12, color: '#ca8a04', fontWeight: 'bold' },
  fullOrdersBtn: { backgroundColor: '#8ec44a', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },

  emptyProductBox: { paddingVertical: 20, paddingHorizontal: 16, backgroundColor: 'white', borderRadius: 12, width: width - 32, alignItems: 'center', justifyContent: 'center' },
  emptyProductText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },

  // Pending Verification Banner
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pendingIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: '#fde68a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  pendingDesc: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  habisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 8,
  },
  habisText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
    transform: [{ rotate: '-15deg' }],
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  newBadge: { alignSelf: 'flex-start', backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  newBadgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },

  // Complaint / WA Banner
  complaintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#16a34a',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  complaintIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  complaintTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  complaintSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  complaintWABadge: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buyBtn: { paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
});

