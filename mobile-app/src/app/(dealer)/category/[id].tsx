import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import FallbackImage from '../../../components/FallbackImage';
import { useCart } from '../../../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2; // 2 Sisi / 2 Column Grid

export default function CategoryProductsScreen() {
  const { id } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount, addToCart } = useCart();

  const [categoryName, setCategoryName] = useState('Kategori');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    // Get category name
    if (id) {
      const { data: catData } = await supabase.from('categories').select('name').eq('id', id).single();
      if (catData) setCategoryName(catData.name);

      // Get products for this category
      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('status', 'ACTIVE')
        .eq('category_id', id);
        
      if (prodData) setProducts(prodData);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
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

      {/* DAFTAR PRODUK (2 SISI / 2 COLUMNS GRID) */}
      <ScrollView contentContainerStyle={styles.productList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#8ec44a" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.gridContainer}>
            {filteredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={[styles.productCard, product.stock === 0 && { opacity: 0.5 }]}
                disabled={product.stock === 0}
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
                  
                  {product.image_urls && product.image_urls.length > 1 && (
                    <View style={{ position: 'absolute', bottom: 6, flexDirection: 'row', gap: 4 }}>
                      {product.image_urls.map((_: any, i: number) => (
                        <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
                      ))}
                    </View>
                  )}

                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{product.categories?.name || 'Lainnya'}</Text>
                  </View>
                </View>

                {/* DETAILS */}
                <View style={styles.cardDetails}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  
                  {/* BINTANG & JUMLAH TERJUAL */}
                  <View style={styles.ratingRow}>
                    <View style={styles.starBadge}>
                      <Feather name="star" size={12} color="#eab308" />
                      <Text style={styles.ratingText}>{product.rating || '0.0'}</Text>
                    </View>
                    <Text style={styles.soldText}>• {product.sold || 0}</Text>
                  </View>

                  {/* HARGA */}
                  <Text style={styles.productPrice}>Rp {Number(product.price).toLocaleString('id-ID')}</Text>

                  {/* FOOTER & BUTTON */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.stockText}>Stok: {product.stock}</Text>
                    <TouchableOpacity style={styles.addCartBtn} onPress={() => addToCart(product)}>
                      <Feather name="plus" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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

  // Product List 2 Columns (2 Sisi Grid)
  productList: { padding: 16, paddingTop: 8 },
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

  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: '#64748b', fontSize: 14 }
});
