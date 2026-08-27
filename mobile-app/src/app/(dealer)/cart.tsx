import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import FallbackImage from '../../components/FallbackImage';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

export default function CartScreen() {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan produk ke keranjang terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login terlebih dahulu.");

      // Cek status verifikasi akun sebelum checkout
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        Alert.alert(
          'Profil Belum Lengkap', 
          'Silakan lengkapi data profil toko Anda terlebih dahulu sebelum bisa checkout.',
          [{ text: 'Lengkapi Profil', onPress: () => router.push('/register') }]
        );
        setLoading(false);
        return;
      }

      if (profile.approval_status === 'PENDING') {
        Alert.alert(
          '⏳ Menunggu Verifikasi Admin',
          'Akun Anda sedang dalam proses verifikasi oleh Admin. Anda dapat menjelajahi katalog sambil menunggu.\n\nProses verifikasi biasanya memakan waktu 1x24 jam.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      if (profile.approval_status === 'REJECTED') {
        Alert.alert(
          '❌ Akun Ditolak',
          'Maaf, akun Anda tidak disetujui oleh Admin. Silakan hubungi kami untuk informasi lebih lanjut.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // 1. Arahkan ke halaman Ringkasan (Checkout)
      router.push('/(dealer)/checkout');

    } catch (error: any) {
      console.error(error);
      Alert.alert('Gagal Checkout', error.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang Belanja</Text>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-cart" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Keranjang Anda masih kosong</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(dealer)/catalog')}>
            <Text style={styles.shopBtnText}>Mulai Belanja</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.itemList}>
            {items.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemImageContainer}>
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <FallbackImage uri={item.image_urls[0]} style={styles.itemImage} />
                  ) : item.image_url ? (
                    <FallbackImage uri={item.image_url} style={styles.itemImage} />
                  ) : (
                    <Feather name="box" size={32} color="#8ec44a" />
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
                  
                  <View style={styles.actionRow}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.qtyBtn} 
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Feather name="minus" size={16} color="#64748b" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.qtyBtn} 
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Feather name="plus" size={16} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => {
                        Alert.alert('Hapus Item', `Yakin ingin menghapus ${item.name} dari keranjang?`, [
                          { text: 'Batal', style: 'cancel' },
                          { text: 'Hapus', style: 'destructive', onPress: () => removeFromCart(item.id) }
                        ]);
                      }}
                    >
                      <Feather name="trash-2" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* BOTTOM TOTAL BAR */}
          <View style={styles.bottomBar}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total Harga</Text>
              <Text style={styles.totalAmount}>Rp {cartTotal.toLocaleString('id-ID')}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
              <Text style={styles.checkoutBtnText}>{loading ? 'Memproses...' : 'Checkout'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8ec44a',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 16, marginBottom: 24 },
  shopBtn: { backgroundColor: '#8ec44a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  shopBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  itemList: { padding: 16 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#8ec44a', marginTop: 4 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  qtyBtn: { padding: 8 },
  qtyText: { fontSize: 14, fontWeight: 'bold', width: 24, textAlign: 'center' },
  deleteBtn: { padding: 8 },

  bottomBar: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInfo: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#64748b' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  checkoutBtn: {
    backgroundColor: '#8ec44a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
