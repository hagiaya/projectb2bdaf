import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';

export default function WishlistScreen() {
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [realItems, setRealItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchRealData();
  }, [wishlistItems]);

  const fetchRealData = async () => {
    if (wishlistItems.length === 0) {
      setRealItems([]);
      return;
    }
    const ids = wishlistItems.map(i => i.id);
    const { data } = await supabase.from('products').select('*').in('id', ids);
    if (data) setRealItems(data);
  };

  const removeItem = (id: string) => {
    removeFromWishlist(id);
    Alert.alert('Dihapus', 'Produk telah dihapus dari Wishlist');
  };

  const handleAddToCart = (item: any) => {
    addToCart(item, 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist Saya ({wishlistItems.length})</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {wishlistItems.map((item) => {
          const realItem = realItems.find(r => r.id === item.id) || item;
          const isHabis = realItem.stock === 0;
          const hasNewTag = (realItem.sku && realItem.sku.toUpperCase().includes('NEW')) || (realItem.name && realItem.name.toUpperCase().includes('NEW'));
          const displaySku = realItem.sku ? realItem.sku.replace(/NEW/gi, '').trim() : 'SKU Tidak Diketahui';
          const displayPrice = realItem.price || 0;
          
          return (
            <View key={item.id} style={[styles.card, isHabis && { opacity: 0.6 }]}>
              <View style={{ position: 'relative' }}>
                <FallbackImage 
                  uri={(realItem.image_urls && realItem.image_urls.length > 0) ? realItem.image_urls[0] : realItem.image_url} 
                  style={styles.productImage} 
                  fallbackIcon="heart"
                  iconColor="#ef4444"
                />
                {isHabis && (
                  <View style={styles.habisOverlay}>
                    <Text style={[styles.habisText, { fontSize: 10, paddingHorizontal: 4 }]}>HABIS</Text>
                  </View>
                )}
              </View>
              <View style={styles.details}>
                {(!isHabis && hasNewTag) && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={styles.category}>{item.category || 'Uncategorized'}</Text>
                <Text style={styles.name}>{displaySku}</Text>
                <Text style={styles.price}>Rp {Number(displayPrice).toLocaleString('id-ID')}</Text>
                <Text style={styles.stock}>Stok: {realItem.stock}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cartBtn, isHabis && { backgroundColor: '#cbd5e1' }]} 
                  onPress={() => handleAddToCart(realItem)}
                  disabled={isHabis}
                >
                  <Feather name="shopping-cart" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {wishlistItems.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="heart" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Wishlist Anda kosong.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(dealer)/catalog')}>
              <Text style={styles.shopBtnText}>Lihat Katalog</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#8ec44a' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f0f7e6', shadowColor: '#8ec44a', shadowOpacity: 0.05, elevation: 2 },
  imagePlaceholder: { width: 64, height: 64, backgroundColor: '#fef2f2', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  productImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },
  details: { flex: 1 },
  category: { fontSize: 10, color: '#8ec44a', fontWeight: 'bold', textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginVertical: 2 },
  price: { fontSize: 14, fontWeight: 'bold', color: '#8ec44a' },
  stock: { fontSize: 11, color: '#64748b', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  removeBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
  cartBtn: { padding: 8, backgroundColor: '#8ec44a', borderRadius: 8 },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyText: { marginTop: 12, color: '#64748b', fontSize: 14 },
  shopBtn: { marginTop: 16, backgroundColor: '#8ec44a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  shopBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
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
    borderRadius: 10,
    marginRight: 12,
  },
  habisText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
    transform: [{ rotate: '-15deg' }],
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  newBadge: { alignSelf: 'flex-start', backgroundColor: '#3b82f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  newBadgeText: { color: 'white', fontSize: 8, fontWeight: 'bold' }
});
