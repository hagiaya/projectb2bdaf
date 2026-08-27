import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, Modal, Alert, Image
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

// =========================================================
// DATA DUMMY BANNER & MENU
// =========================================================

const bannerAds = [
  { id: '1', title: 'Promo Akhir Tahun', subtitle: 'Diskon hingga 30% untuk semua produk', color: '#8ec44a', accent: '#4a6b22' },
  { id: '3', title: 'Gratis Ongkir', subtitle: 'Untuk pembelian minimal Rp 500.000', color: '#7eb33a', accent: '#166534' },
];

// MENU DENGAN PILIHAN BERFUNGSI (Menu "Lainnya" sudah dihapus)
const menuItems = [
  { name: 'Katalog', route: '/(dealer)/catalog', icon: 'grid' },
  { name: 'Pesanan', route: '/(dealer)/orders', icon: 'shopping-bag' },
  { name: 'Retur', route: '/(dealer)/returns', icon: 'refresh-ccw' },
  { name: 'Promo', route: '/(dealer)/promo', icon: 'gift' },
  { name: 'Lacak', route: '/(dealer)/orders', icon: 'map-pin' },
  { name: 'Wishlist', route: '/(dealer)/wishlist', icon: 'heart' },
  { name: 'Histori', route: '/(dealer)/orders', icon: 'clock' },
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

// =========================================================
// BANNER CAROUSEL
// =========================================================
function BannerCarousel() {
  const [active, setActive] = useState(0);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (active + 1) % bannerAds.length;
      flatRef.current?.scrollToOffset({ offset: next * BANNER_WIDTH, animated: true });
      setActive(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <View style={styles.bannerSection}>
      <FlatList
        ref={flatRef}
        data={bannerAds}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
          setActive(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.bannerCard, { backgroundColor: item.color, width: BANNER_WIDTH }]}>
            <View style={[styles.bannerCircle, { backgroundColor: item.accent }]} />
            <Feather name="tag" size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push('/(dealer)/promo')}>
              <Text style={styles.bannerBtnText}>Lihat Sekarang →</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.dots}>
        {bannerAds.map((_, i) => (
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

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real Profile States
  const [profile, setProfile] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);

  // Modal States
  const [isNotifVisible, setIsNotifVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isTrackVisible, setIsTrackVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchProfile();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    // Ambil 15 produk secara acak (karena belum ada tabel khusus flash sale)
    const { data } = await supabase.from('products').select('*').limit(20);
    if (data) {
      // Acak urutan agar terlihat berbeda setiap kali dibuka
      const shuffled = data.sort(() => 0.5 - Math.random());
      setProducts(shuffled);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: dealerData } = await supabase.from('dealers').select('*').eq('profile_id', user.id).single();
      
      if (profileData) setProfile(profileData);
      if (dealerData) setDealer(dealerData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileVisible(false);
    router.replace('/login');
  };

  // derived lists (Membagi produk yang diacak ke berbagai section agar tidak sama)
  const bestSellerProducts = products.slice(0, 4);
  const flashSaleProducts = products.slice(4, 9);
  const recentlyViewed = products.slice(9, 14);

  const notifications = [
    { id: '1', title: 'Pesanan INV-20231024-001 Diproses', desc: 'Semen Gresik 40kg (50 sak) sedang disiapkan oleh gudang.', time: '10 menit lalu' },
    { id: '2', title: 'Promo Diskon 15%', desc: 'Gunakan kode YEAREND15 sebelum 31 Des 2026.', time: '2 jam lalu' },
    { id: '3', title: 'Selamat Datang!', desc: 'Akun Toko Makmur Jaya telah terverifikasi sebagai Dealer Resmi.', time: '1 hari lalu' },
  ];

  const storeName = dealer?.store_name || 'Toko Anda';
  const initial = storeName.substring(0, 2).toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            <View style={styles.notifBadge} />
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
            bestSellerProducts.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.productCard, item.stock === 0 && { opacity: 0.5 }]}
                disabled={item.stock === 0}
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
                </View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSold}>100+ terjual</Text>
                <Text style={styles.productPrice}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
                <TouchableOpacity style={styles.buyButton} onPress={() => addToCart(item)} disabled={item.stock === 0}>
                  <Text style={styles.buyText}>+ Keranjang</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* BANNER ADS */}
      <BannerCarousel />

      {/* FLASH SALE - Dinonaktifkan sementara sampai diatur oleh admin */}
      {/* 
      <View style={styles.section}>
         ... (Flash Sale Section Hidden) ...
      </View> 
      */}

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
            recentlyViewed.map((item) => (
              <View 
                key={item.id} 
                style={[styles.recentCard, item.stock === 0 && { opacity: 0.5 }]}
                pointerEvents={item.stock === 0 ? 'none' : 'auto'}
              >
                <View style={styles.recentImage}>
                  <Feather name="package" size={24} color="#8ec44a" />
                </View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>Rp {Number(item.price).toLocaleString('id-ID')}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* LACAK PESANAN (CTA) */}
      <TouchableOpacity style={styles.trackOrderBanner} onPress={() => setIsTrackVisible(true)}>
        <Feather name="package" size={22} color="#8ec44a" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.trackTitle}>Lacak Pesanan Anda</Text>
          <Text style={styles.trackSubtitle}>INV-20231024-001 • Dalam Pengiriman</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#8ec44a" />
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
              {notifications.map((n) => (
                <View key={n.id} style={styles.notifItem}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifDesc}>{n.desc}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
              ))}
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
  bannerCard: { borderRadius: 16, padding: 20, overflow: 'hidden', marginRight: 0 },
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
  }
});
