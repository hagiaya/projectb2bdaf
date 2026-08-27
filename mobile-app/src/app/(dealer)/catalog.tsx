import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2; // 2 Sisi / 2 Column Grid

export default function CatalogScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string, image_url?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { cartCount } = useCart();

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) setCategories(catData);
    setLoading(false);
  };

  const filteredCategories = categories.filter((cat) => {
    return cat.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(dealer)/home')} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Katalog Kategori</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(dealer)/cart' as any)}>
          <Feather name="shopping-cart" size={22} color="white" />
          {cartCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color="#8ec44a" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Cari kategori produk..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DAFTAR KATEGORI (2 COLUMNS GRID) */}
      <ScrollView contentContainerStyle={styles.categoryList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#8ec44a" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridContainer}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard}
                onPress={() => router.push(`/category/${cat.id}`)}
              >
                <View style={styles.imageBox}>
                  {cat.image_url ? (
                    <FallbackImage uri={cat.image_url} style={{ width: '100%', height: '100%' }} fallbackIcon="grid" />
                  ) : (
                    <Feather name="grid" size={36} color="#8ec44a" />
                  )}
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Tidak ada kategori ditemukan.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0' },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 52, 
    paddingBottom: 16, 
    backgroundColor: '#8ec44a' 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  cartBtn: { padding: 4, position: 'relative' },
  badge: { 
    position: 'absolute', 
    top: -2, 
    right: -4, 
    backgroundColor: '#eab308', 
    borderRadius: 10, 
    width: 18, 
    height: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Search
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: '#dcf0c3',
    shadowColor: '#8ec44a',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a' },

  // Category List 2 Columns
  categoryList: { padding: 16, paddingTop: 8 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  categoryCard: { 
    width: CARD_WIDTH, 
    backgroundColor: 'white', 
    borderRadius: 14, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#f0f7e6',
    shadowColor: '#8ec44a', 
    shadowOpacity: 0.06, 
    elevation: 2,
    marginBottom: 4,
  },
  imageBox: { 
    width: '100%', 
    height: 140, 
    backgroundColor: '#f0f7e6', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  cardDetails: { padding: 12, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#64748b', fontSize: 14 }
});
