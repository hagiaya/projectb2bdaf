import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = useState([
    { id: 1, name: 'Semen Gresik 40kg', price: 55000, category: 'Material', stock: 1250 },
    { id: 2, name: 'Cat Tembok Dulux 5kg', price: 145000, category: 'Cat', stock: 85 },
    { id: 3, name: 'Keramik Roman 40x40', price: 95000, category: 'Keramik', stock: 200 },
  ]);

  const removeItem = (id: number) => {
    setWishlistItems(wishlistItems.filter(item => item.id !== id));
    Alert.alert('Dihapus', 'Produk telah dihapus dari Wishlist');
  };

  const addToCart = (name: string) => {
    Alert.alert('Sukses', `${name} berhasil ditambahkan ke Keranjang!`);
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
        {wishlistItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.imagePlaceholder}>
              <Feather name="heart" size={24} color="#ef4444" />
            </View>
            <View style={styles.details}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>Rp {item.price.toLocaleString('id-ID')}</Text>
              <Text style={styles.stock}>Stok: {item.stock}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cartBtn} onPress={() => addToCart(item.name)}>
                <Feather name="shopping-cart" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

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
  shopBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});
