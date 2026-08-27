import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useCart } from '../../../context/CartContext';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { cartCount, addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  const fetchProductDetail = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .single();
      
    if (!error && data) {
      setProduct(data);
    } else {
      console.error("Error fetching product:", error);
    }
    setLoading(false);
  };

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeImageIndex) {
      setActiveImageIndex(roundIndex);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8ec44a" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Produk tidak ditemukan.</Text>
        <TouchableOpacity style={styles.backButtonEmpty} onPress={() => router.canGoBack() ? router.back() : router.replace('/(dealer)/home')}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  }

  const images = (product.image_urls && product.image_urls.length > 0) 
                 ? product.image_urls 
                 : (product.image_url ? [product.image_url] : []);

  return (
    <View style={styles.container}>
      {/* HEADER OVERLAY */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(dealer)/home')} style={styles.headerBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(dealer)/cart' as any)}>
          <Feather name="shopping-cart" size={24} color="#1e293b" />
          {cartCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* IMAGE SLIDER */}
        <View style={styles.imageSliderContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={styles.imageSlider}
              >
                {images.map((url: string, index: number) => (
                  <Image key={index} source={{ uri: url }} style={styles.productImage} resizeMode="cover" />
                ))}
              </ScrollView>
              
              {images.length > 1 && (
                <View style={styles.paginationDots}>
                  {images.map((_: any, i: number) => (
                    <View 
                      key={i} 
                      style={[
                        styles.dot, 
                        activeImageIndex === i ? styles.dotActive : styles.dotInactive
                      ]} 
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Feather name="box" size={64} color="#94a3b8" />
              <Text style={styles.noImageText}>Tidak ada gambar</Text>
            </View>
          )}
        </View>

        {/* BASIC DETAILS */}
        <View style={styles.detailsSection}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rp {Number(product.price).toLocaleString('id-ID')}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{product.categories?.name || 'Lainnya'}</Text>
            </View>
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="star" size={16} color="#eab308" />
              <Text style={styles.statTextHighlight}>{product.rating || '0.0'}</Text>
              <Text style={styles.statText}>Rating</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statTextHighlight}>{product.sold || 0}</Text>
              <Text style={styles.statText}>Terjual</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statTextHighlight}>{product.stock}</Text>
              <Text style={styles.statText}>Stok Tersedia</Text>
            </View>
          </View>
        </View>

        {/* INFO PRODUK TAMBAHAN */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Informasi Produk</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SKU</Text>
              <Text style={styles.infoValue}>{product.sku || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: product.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }]}>
                {product.status === 'ACTIVE' ? 'Tersedia' : 'Habis/Nonaktif'}
              </Text>
            </View>
          </View>
        </View>

        {/* DESKRIPSI (Untuk saat ini mockup jika belum ada field description di DB) */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
          <Text style={styles.descriptionText}>
            {product.description || 'Tidak ada deskripsi rinci untuk produk ini. Produk ini dijual dan didistribusikan secara resmi.'}
          </Text>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Feather name="minus" size={20} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Feather name="plus" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} disabled={product.stock === 0} onPress={() => addToCart(product, quantity)}>
          <Feather name="shopping-cart" size={20} color="white" />
          <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  errorText: { fontSize: 16, color: '#64748b', marginBottom: 20 },
  backButtonEmpty: { backgroundColor: '#8ec44a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: 'white', fontWeight: 'bold' },
  
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52, // Safe area top
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: '#ef4444', 
    borderRadius: 10, 
    width: 18, 
    height: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  imageSliderContainer: {
    width: width,
    height: width, // Square ratio
    backgroundColor: '#e2e8f0',
    position: 'relative'
  },
  imageSlider: { width: width, height: width },
  productImage: { width: width, height: width },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#8ec44a', width: 24 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.7)' },
  noImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noImageText: { color: '#94a3b8', marginTop: 12, fontWeight: '600' },

  detailsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '900', color: '#8ec44a' },
  categoryTag: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  categoryTagText: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  productName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16, lineHeight: 26 },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  statItem: { flex: 1, alignItems: 'center', flexDirection: 'column' },
  statTextHighlight: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  statText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  divider: { width: 1, height: 24, backgroundColor: '#cbd5e1' },

  descriptionSection: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
    borderRadius: 24,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  infoGrid: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 24 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32, // safe area bottom padding
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtn: { padding: 12 },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', paddingHorizontal: 12 },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#8ec44a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
  },
  addToCartText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
