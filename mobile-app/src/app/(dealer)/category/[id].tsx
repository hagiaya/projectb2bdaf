import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import FallbackImage from '../../../components/FallbackImage';
import { useCart } from '../../../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2; // 2 Sisi / 2 Column Grid
const VIEW_MODE_STORAGE_KEY = 'PRODUCT_VIEW_MODE';

export default function CategoryProductsScreen() {
  const { id } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount, addToCart } = useCart();

  const [categoryName, setCategoryName] = useState('Kategori');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Load saved view mode preference
    AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'grid' || savedMode === 'list') {
          setViewMode(savedMode);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, mode).catch(() => {});
  };

  const fetchData = async () => {
    setLoading(true);
    if (id) {
      let catName = 'Kategori';
      if (id === 'all') {
        catName = 'Semua Produk';
      } else {
        const { data: catData } = await supabase.from('categories').select('name').eq('id', id).single();
        if (catData) catName = catData.name;
      }
      setCategoryName(catName);

      // Get products for this category ordered by priority
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('status', 'ACTIVE');

      if (id !== 'all') {
        query = query.eq('category_id', id);
      }

      let { data: prodData, error } = await query
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error && (error.message?.includes('sort_order') || error.code === '42703')) {
        let fbQuery = supabase
          .from('products')
          .select('*, categories(name)')
          .eq('status', 'ACTIVE');
        if (id !== 'all') {
          fbQuery = fbQuery.eq('category_id', id);
        }
        const fb = await fbQuery.order('name', { ascending: true });
        prodData = fb.data;
      }
        
      if (prodData) {
        const sorted = [...prodData].sort((a: any, b: any) => {
          const orderA = a.sort_order ?? 9999;
          const orderB = b.sort_order ?? 9999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.name || '').localeCompare(b.name || '');
        });
        setProducts(sorted);
      }
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    return (
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(dealer)/catalog')} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
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
            placeholder={`Cari produk di ${categoryName}...`}
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

      {/* TOOLBAR: JUMLAH PRODUK & TOGGLE MODE GRID / LIST */}
      <View style={styles.toolbar}>
        <Text style={styles.productCountText}>
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

      {/* DAFTAR PRODUK (GRID / LIST VIEW) */}
      <ScrollView contentContainerStyle={styles.productList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#8ec44a" style={{ marginTop: 40 }} />
        ) : viewMode === 'grid' ? (
          /* ========== MODE GRID (2 SISI) ========== */
          <View style={styles.gridContainer}>
            {filteredProducts.map((product) => {
              const isHabis = product.stock === 0;
              const hasNewTag = Boolean(product.is_new || (product.sku && product.sku.toUpperCase().includes('NEW')) || (product.name && product.name.toUpperCase().includes('NEW')));
              const displaySku = product.sku ? product.sku.replace(/NEW/gi, '').trim() : (product.name || 'Produk');
              return (
              <TouchableOpacity 
                key={product.id} 
                style={[styles.productCard, isHabis && { opacity: 0.6 }]}
                disabled={isHabis}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                {/* GAMBAR PRODUK */}
                <View style={styles.imageBox}>
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <FallbackImage uri={product.image_urls[0]} style={{ width: '100%', height: '100%' }} />
                  ) : product.image_url ? (
                    <FallbackImage uri={product.image_url} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Feather name="box" size={36} color="#8ec44a" />
                  )}
                  
                  {isHabis && (
                    <View style={styles.habisOverlay}>
                      <Text style={styles.habisText}>HABIS</Text>
                    </View>
                  )}
                  {product.image_urls && product.image_urls.length > 1 && (
                    <View style={{ position: 'absolute', bottom: 6, flexDirection: 'row', gap: 4 }}>
                      {product.image_urls.map((_: any, i: number) => (
                        <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
                      ))}
                    </View>
                  )}

                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{product.categories?.name || categoryName || 'Lainnya'}</Text>
                  </View>
                </View>

                {/* DETAILS */}
                <View style={styles.cardDetails}>
                  {(!isHabis && hasNewTag) && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  <Text style={styles.productName} numberOfLines={2}>{displaySku}</Text>
                  
                  {/* BINTANG & JUMLAH TERJUAL */}
                  <View style={styles.ratingRow}>
                    <View style={styles.starBadge}>
                      <Feather name="star" size={12} color="#eab308" />
                      <Text style={styles.ratingText}>{product.rating || '5.0'}</Text>
                    </View>
                    <Text style={styles.soldText}>• {product.sold || 0}</Text>
                  </View>

                  {/* HARGA */}
                  {product.promo_price && product.promo_price < product.price ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Text style={[styles.productPrice, { color: '#f59e0b' }]}>
                          Rp {Number(product.promo_price).toLocaleString('id-ID')}
                        </Text>
                        <View style={styles.promoBadge}>
                          <Text style={styles.promoBadgeText}>{product.promo_label || 'PROMO'}</Text>
                        </View>
                      </View>
                      <Text style={styles.originalPrice}>
                        Rp {Number(product.price).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.productPrice}>Rp {Number(product.price).toLocaleString('id-ID')}</Text>
                  )}

                  {/* FOOTER & BUTTON */}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.stockText, isHabis && { color: '#ef4444' }]}>
                      {isHabis ? 'Stok Habis' : `Stok: ${product.stock}`}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.addCartBtn, isHabis && { backgroundColor: '#cbd5e1' }]} 
                      onPress={() => addToCart(product)}
                      disabled={isHabis}
                    >
                      <Feather name="plus" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )})}
          </View>
        ) : (
          /* ========== MODE LIST (DAFTAR 1 SISI HORIZONTAL) ========== */
          <View style={styles.listContainer}>
            {filteredProducts.map((product) => {
              const isHabis = product.stock === 0;
              const hasNewTag = Boolean(product.is_new || (product.sku && product.sku.toUpperCase().includes('NEW')) || (product.name && product.name.toUpperCase().includes('NEW')));
              const displaySku = product.sku ? product.sku.replace(/NEW/gi, '').trim() : (product.name || 'Produk');
              return (
              <TouchableOpacity 
                key={product.id} 
                style={[styles.productListCard, isHabis && { opacity: 0.6 }]}
                disabled={isHabis}
                onPress={() => router.push(`/product/${product.id}`)}
                activeOpacity={0.7}
              >
                {/* GAMBAR PRODUK LIST */}
                <View style={styles.imageListContainer}>
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <FallbackImage uri={product.image_urls[0]} style={{ width: '100%', height: '100%' }} />
                  ) : product.image_url ? (
                    <FallbackImage uri={product.image_url} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Feather name="box" size={32} color="#8ec44a" />
                  )}

                  {isHabis && (
                    <View style={styles.habisOverlayList}>
                      <Text style={styles.habisTextList}>HABIS</Text>
                    </View>
                  )}

                  {product.image_urls && product.image_urls.length > 1 && (
                    <View style={{ position: 'absolute', bottom: 4, flexDirection: 'row', gap: 3 }}>
                      {product.image_urls.map((_: any, i: number) => (
                        <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
                      ))}
                    </View>
                  )}
                </View>

                {/* DETAILS LIST */}
                <View style={styles.listDetails}>
                  <View>
                    <View style={styles.listTagsRow}>
                      <View style={styles.categoryTagList}>
                        <Text style={styles.categoryTagListText}>{product.categories?.name || categoryName || 'Lainnya'}</Text>
                      </View>
                      {(!isHabis && hasNewTag) && (
                        <View style={styles.newBadgeList}>
                          <Text style={styles.newBadgeListText}>NEW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.productNameList} numberOfLines={2}>{displaySku}</Text>
                    
                    {/* RATING & TERJUAL */}
                    <View style={styles.ratingRowList}>
                      <View style={styles.starBadge}>
                        <Feather name="star" size={11} color="#eab308" />
                        <Text style={styles.ratingText}>{product.rating || '5.0'}</Text>
                      </View>
                      <Text style={styles.soldText}>• {product.sold || 0} terjual</Text>
                    </View>
                  </View>

                  {/* HARGA, STOK & BUTTON KERANJANG */}
                  <View style={styles.listFooter}>
                    <View>
                      {product.promo_price && product.promo_price < product.price ? (
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                            <Text style={[styles.productPriceList, { color: '#f59e0b' }]}>
                              Rp {Number(product.promo_price).toLocaleString('id-ID')}
                            </Text>
                            <View style={styles.promoBadge}>
                              <Text style={styles.promoBadgeText}>{product.promo_label || 'PROMO'}</Text>
                            </View>
                          </View>
                          <Text style={styles.originalPrice}>
                            Rp {Number(product.price).toLocaleString('id-ID')}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.productPriceList}>Rp {Number(product.price).toLocaleString('id-ID')}</Text>
                      )}
                      <Text style={[styles.stockTextList, isHabis && { color: '#ef4444' }]}>
                        {isHabis ? 'Stok Habis' : `Stok: ${product.stock}`}
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.addCartBtnList, isHabis && styles.addCartBtnDisabled]} 
                      onPress={() => addToCart(product)}
                      disabled={isHabis}
                      activeOpacity={0.8}
                    >
                      <Feather name="shopping-cart" size={13} color="white" style={{ marginRight: 4 }} />
                      <Text style={styles.addCartBtnListText}>{isHabis ? 'Habis' : '+ Keranjang'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )})}
          </View>
        )}

        {!loading && filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Tidak ada produk dalam kategori ini.</Text>
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

  // Toolbar Subheader
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  productCountText: {
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

  // Product List ScrollView
  productList: { padding: 16, paddingTop: 6 },

  // Grid Mode (2 Sisi Grid)
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  productCard: { 
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
    height: 110, 
    backgroundColor: '#f0f7e6', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
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
  },
  habisText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
    transform: [{ rotate: '-15deg' }],
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  categoryTag: { 
    position: 'absolute', 
    top: 8, 
    left: 8, 
    backgroundColor: 'rgba(20, 83, 45, 0.85)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6 
  },
  categoryTagText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  newBadge: { alignSelf: 'flex-start', backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  newBadgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },

  cardDetails: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: '#1e293b', height: 36, lineHeight: 18 },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, gap: 4 },
  starBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, color: '#ca8a04', fontWeight: 'bold' },
  soldText: { fontSize: 11, color: '#94a3b8' },

  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#8ec44a', marginTop: 2 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  stockText: { fontSize: 11, color: '#64748b' },
  addCartBtn: { 
    backgroundColor: '#8ec44a', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  // List Mode (1 Sisi Horizontal)
  listContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  productListCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f0f7e6',
    shadowColor: '#8ec44a',
    shadowOpacity: 0.06,
    elevation: 2,
  },
  imageListContainer: {
    width: 95,
    height: 95,
    backgroundColor: '#f0f7e6',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  habisOverlayList: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  habisTextList: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  listDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  listTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryTagList: {
    backgroundColor: 'rgba(20, 83, 45, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagListText: {
    color: '#166534',
    fontSize: 9,
    fontWeight: '700',
  },
  newBadgeList: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeListText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  productNameList: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 18,
  },
  ratingRowList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  productPriceList: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8ec44a',
  },
  stockTextList: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  addCartBtnList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8ec44a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#8ec44a',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addCartBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  addCartBtnListText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Empty state
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#64748b', fontSize: 14 },

  // Promo styles
  promoBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  promoBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
});

