import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';
import { useCart } from '../../context/CartContext';
import { useSafeBottom } from '../../hooks/useSafeBottom';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2; // 2 Sisi / 2 Column Grid
const VIEW_MODE_STORAGE_KEY = 'CATEGORY_VIEW_MODE';

export default function CatalogScreen() {
  const safeBottom = useSafeBottom();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string, image_url?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { cartCount } = useCart();

  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'grid' || savedMode === 'list') {
          setViewMode(savedMode);
        }
      })
      .catch(() => {});
    fetchData();
  }, []);

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, mode).catch(() => {});
  };

  const fetchData = async () => {
    setLoading(true);
    let { data: catData, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
      const fb = await supabase.from('categories').select('*').order('name');
      catData = fb.data;
    }

    if (catData) {
      const sorted = [...catData].sort((a: any, b: any) => {
        const orderA = a.sort_order ?? 9999;
        const orderB = b.sort_order ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
      setCategories(sorted);
    }
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

      {/* TOOLBAR: JUMLAH KATEGORI & TOGGLE GRID / LIST */}
      <View style={styles.toolbar}>
        <Text style={styles.countText}>
          {filteredCategories.length} Kategori
        </Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => handleToggleViewMode('grid')}
            activeOpacity={0.7}
          >
            <Feather name="grid" size={15} color={viewMode === 'grid' ? '#15803d' : '#64748b'} />
            <Text style={[styles.toggleBtnText, viewMode === 'grid' && styles.toggleBtnTextActive]}>Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => handleToggleViewMode('list')}
            activeOpacity={0.7}
          >
            <Feather name="list" size={15} color={viewMode === 'list' ? '#15803d' : '#64748b'} />
            <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DAFTAR KATEGORI (GRID / LIST) */}
      <ScrollView contentContainerStyle={[styles.categoryList, { paddingBottom: safeBottom }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#8ec44a" style={{ marginTop: 40 }} />
        ) : viewMode === 'grid' ? (
          /* ========== MODE GRID (2 SISI) ========== */
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
        ) : (
          /* ========== MODE LIST (DAFTAR 1 SISI HORIZONTAL) ========== */
          <View style={styles.listContainer}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryListCard}
                onPress={() => router.push(`/category/${cat.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.imageListContainer}>
                  {cat.image_url ? (
                    <FallbackImage uri={cat.image_url} style={{ width: '100%', height: '100%' }} fallbackIcon="grid" />
                  ) : (
                    <Feather name="grid" size={24} color="#8ec44a" />
                  )}
                </View>

                <View style={styles.listDetails}>
                  <Text style={styles.categoryListName} numberOfLines={1}>{cat.name}</Text>
                  <Text style={styles.categoryListSub}>Buka produk kategori ini</Text>
                </View>

                <View style={styles.arrowIconWrap}>
                  <Feather name="chevron-right" size={20} color="#94a3b8" />
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
  searchContainer: { padding: 16, paddingBottom: 6 },
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

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#e8f5d8',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#d4edb8',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  toggleBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#15803d',
    fontWeight: 'bold',
  },

  // Category List
  categoryList: { padding: 16, paddingTop: 6 },

  // Mode Grid
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

  // Mode List
  listContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  categoryListCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f7e6',
    shadowColor: '#8ec44a',
    shadowOpacity: 0.06,
    elevation: 2,
  },
  imageListContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f7e6',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listDetails: {
    flex: 1,
    marginLeft: 14,
  },
  categoryListName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  categoryListSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  arrowIconWrap: {
    padding: 6,
  },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#64748b', fontSize: 14 }
});

