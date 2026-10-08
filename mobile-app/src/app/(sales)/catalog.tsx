import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';
import { useSafeBottom } from '../../hooks/useSafeBottom';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;
const VIEW_MODE_STORAGE_KEY = 'SALES_CATALOG_VIEW_MODE';

export default function SalesCatalogScreen() {
  const safeBottom = useSafeBottom();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list for better detail view

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
    
    // Fetch Categories
    let { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (catError && (catError.message?.includes('sort_order') || catError.code === '42703')) {
      const fb = await supabase.from('categories').select('id, name').order('name');
      catData = fb.data;
    }

    if (catData) {
      setCategories([{ id: 'all', name: 'Semua Produk' }, ...catData]);
    } else {
      setCategories([{ id: 'all', name: 'Semua Produk' }]);
    }

    // Fetch Products
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .in('status', ['ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK']);

    let { data: prodData, error } = await query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
      const fbQuery = supabase
        .from('products')
        .select('*, categories(name)')
        .in('status', ['ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK']);
      const fb = await fbQuery.order('name', { ascending: true });
      prodData = fb.data;
    }
      
    if (prodData) {
      setProducts(prodData);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const matchesCategory = selectedCategoryId === 'all' || product.category_id === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Katalog Produk (Sales)</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={18} color="#8ec44a" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Cari nama produk atau SKU..."
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

      {/* CATEGORY FILTER (HORIZONTAL SCROLL) */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              style={[
                styles.categoryChip, 
                selectedCategoryId === cat.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategoryId === cat.id && styles.categoryChipTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TOOLBAR: JUMLAH PRODUK & TOGGLE GRID / LIST */}
      <View style={styles.toolbar}>
        <Text style={styles.countText}>
          {filteredProducts.length} Produk
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

      {/* DAFTAR PRODUK */}
      <ScrollView contentContainerStyle={[styles.productList, { paddingBottom: safeBottom + 20 }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#8ec44a" style={{ marginTop: 40 }} />
        ) : viewMode === 'grid' ? (
          /* ========== MODE GRID ========== */
          <View style={styles.gridContainer}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.imageBox}>
                  {product.image_url ? (
                    <FallbackImage uri={product.image_url} style={{ width: '100%', height: '100%' }} fallbackIcon="box" />
                  ) : (
                    <Feather name="box" size={32} color="#8ec44a" />
                  )}
                  {product.stock <= 0 && (
                    <View style={styles.outOfStockOverlayGrid}>
                      <Text style={styles.outOfStockTextGrid}>Habis</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {product.categories?.name || 'Tanpa Kategori'}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  
                  {product.promo_price ? (
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceStrike}>Rp {(product.price || 0).toLocaleString('id-ID')}</Text>
                      <Text style={styles.priceText}>Rp {product.promo_price.toLocaleString('id-ID')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.priceText}>Rp {(product.price || 0).toLocaleString('id-ID')}</Text>
                  )}
                  
                  <View style={[styles.stockBadge, product.stock <= 0 ? styles.stockBadgeEmpty : (product.stock < 10 ? styles.stockBadgeLow : styles.stockBadgeOk)]}>
                    <Text style={[styles.stockBadgeText, product.stock <= 0 ? styles.stockBadgeTextEmpty : (product.stock < 10 ? styles.stockBadgeTextLow : styles.stockBadgeTextOk)]}>
                      Stok: {product.stock || 0}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* ========== MODE LIST ========== */
          <View style={styles.listContainer}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productListCard}>
                <View style={styles.imageListContainer}>
                  {product.image_url ? (
                    <FallbackImage uri={product.image_url} style={{ width: '100%', height: '100%' }} fallbackIcon="box" />
                  ) : (
                    <Feather name="box" size={28} color="#8ec44a" />
                  )}
                  {product.stock <= 0 && (
                    <View style={styles.outOfStockOverlayList}>
                      <Text style={styles.outOfStockTextList}>Habis</Text>
                    </View>
                  )}
                </View>

                <View style={styles.listDetails}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {product.categories?.name || 'Tanpa Kategori'}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  {product.sku && <Text style={styles.skuText}>SKU: {product.sku}</Text>}
                  
                  <View style={styles.listPriceRow}>
                    <View>
                      {product.promo_price ? (
                        <>
                          <Text style={styles.priceStrike}>Rp {(product.price || 0).toLocaleString('id-ID')}</Text>
                          <Text style={styles.priceText}>Rp {product.promo_price.toLocaleString('id-ID')}</Text>
                        </>
                      ) : (
                        <Text style={styles.priceText}>Rp {(product.price || 0).toLocaleString('id-ID')}</Text>
                      )}
                    </View>
                    
                    <View style={[styles.stockBadge, product.stock <= 0 ? styles.stockBadgeEmpty : (product.stock < 10 ? styles.stockBadgeLow : styles.stockBadgeOk)]}>
                      <Text style={[styles.stockBadgeText, product.stock <= 0 ? styles.stockBadgeTextEmpty : (product.stock < 10 ? styles.stockBadgeTextLow : styles.stockBadgeTextOk)]}>
                        Stok: {product.stock || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!loading && filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="box" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Tidak ada produk ditemukan.</Text>
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
    backgroundColor: '#8ec44a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: 0.5 },

  // Search
  searchContainer: { paddingHorizontal: 16, marginTop: -20, marginBottom: 12, zIndex: 10 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: '#334155', fontWeight: '500' },
  
  // Category Filter
  categoryFilterContainer: {
    marginBottom: 8,
  },
  categoryFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center'
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#8ec44a',
    borderColor: '#8ec44a',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: 'white',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  countText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  toggleGroup: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#f0fdf4' },
  toggleBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  toggleBtnTextActive: { color: '#15803d' },

  productList: { paddingHorizontal: 16 },

  // Grid Layout
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  imageBox: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockOverlayGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockTextGrid: {
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardDetails: { padding: 12 },
  categoryName: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' },
  productName: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 8, lineHeight: 18, height: 36 },
  
  // List Layout
  listContainer: { gap: 12 },
  productListCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    padding: 12,
    gap: 12,
  },
  imageListContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outOfStockOverlayList: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockTextList: {
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listDetails: { flex: 1, justifyContent: 'center' },
  skuText: { fontSize: 10, color: '#94a3b8', fontWeight: '500', marginBottom: 4 },
  listPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },

  // Common Price & Stock
  priceContainer: { flexDirection: 'column' },
  priceStrike: { fontSize: 10, color: '#94a3b8', textDecorationLine: 'line-through', marginBottom: 2 },
  priceText: { fontSize: 14, fontWeight: '900', color: '#15803d' },
  
  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  stockBadgeOk: { backgroundColor: '#f0fdf4' },
  stockBadgeLow: { backgroundColor: '#fffbeb' },
  stockBadgeEmpty: { backgroundColor: '#fef2f2' },
  stockBadgeText: { fontSize: 10, fontWeight: '800' },
  stockBadgeTextOk: { color: '#166534' },
  stockBadgeTextLow: { color: '#b45309' },
  stockBadgeTextEmpty: { color: '#b91c1c' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '500', textAlign: 'center' },
});
