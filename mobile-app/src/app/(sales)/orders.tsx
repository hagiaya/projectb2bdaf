import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import FallbackImage from '../../components/FallbackImage';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  products?: {
    id: string;
    name: string;
    sku: string;
    image_url?: string;
    price?: number;
  };
}

interface DealerOrder {
  id: string;
  order_number: string;
  dealer_id: string;
  total_amount: number;
  final_amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  unique_code?: number;
  payment_proof_url?: string;
  payment_status?: string;
  dealers?: {
    id: string;
    store_name: string;
    address: string;
    profiles?: {
      full_name?: string;
      phone_number?: string;
    };
  };
  order_items: OrderItem[];
}

export default function SalesOrdersScreen() {
  const params = useLocalSearchParams();
  const filterDealerId = params.dealerId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [dealers, setDealers] = useState<{ id: string; store_name: string }[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string>(filterDealerId || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<DealerOrder | null>(null);

  useEffect(() => {
    fetchOrdersData();
  }, []);

  useEffect(() => {
    if (filterDealerId) {
      setSelectedDealerId(filterDealerId);
    }
  }, [filterDealerId]);

  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      let currentSalesId: string | null = null;
      const { data: sData } = await supabase
        .from('sales')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (sData) currentSalesId = sData.id;

      // Fetch dealers belonging to this sales
      let dList: any[] = [];
      if (currentSalesId) {
        const { data: dealerRows } = await supabase
          .from('dealers')
          .select('id, store_name')
          .or(`sales_id.eq.${currentSalesId},sales_id.eq.${user.id}`);

        if (dealerRows && dealerRows.length > 0) {
          dList = dealerRows;
        }
      }
      setDealers(dList);

      const dealerIds = dList.map((d) => d.id);
      if (dealerIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders for these dealers
      const { data: orderRows, error: orderErr } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          dealer_id,
          total_amount,
          final_amount,
          status,
          created_at,
          payment_method,
          unique_code,
          payment_proof_url,
          payment_status,
          dealers(
            id,
            store_name,
            address,
            profiles(full_name, phone_number)
          ),
          order_items(
            id,
            quantity,
            unit_price,
            subtotal,
            products(id, name, sku, image_url, price)
          )
        `)
        .in('dealer_id', dealerIds)
        .order('created_at', { ascending: false });

      if (!orderErr && orderRows) {
        setOrders(orderRows as unknown as DealerOrder[]);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    // Filter by dealer
    if (selectedDealerId !== 'ALL' && o.dealer_id !== selectedDealerId) {
      return false;
    }
    // Filter by status
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'PENDING' && o.status !== 'PENDING') return false;
      if (selectedStatus === 'PACKING' && o.status !== 'PACKING' && o.status !== 'PROCESSING') return false;
      if (selectedStatus === 'SHIPPED' && o.status !== 'SHIPPED') return false;
      if (selectedStatus === 'COMPLETED' && o.status !== 'COMPLETED') return false;
      if (selectedStatus === 'CANCELLED' && o.status !== 'CANCELLED') return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = o.order_number?.toLowerCase().includes(q);
      const storeMatch = o.dealers?.store_name?.toLowerCase().includes(q);
      const itemMatch = o.order_items?.some((it) => it.products?.name?.toLowerCase().includes(q));
      if (!numMatch && !storeMatch && !itemMatch) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalOmset = filteredOrders.reduce((sum, o) => sum + (Number(o.final_amount) || 0), 0);
  const pendingCount = filteredOrders.filter((o) => o.status === 'PENDING').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: '1. Pesan (Menunggu)',
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          icon: 'clock',
        };
      case 'PACKING':
      case 'PROCESSING':
        return {
          label: '2. Pengemasan',
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          icon: 'package',
        };
      case 'SHIPPED':
        return {
          label: '3. Pengiriman',
          bg: '#f3e8ff',
          color: '#7e22ce',
          border: '#e9d5ff',
          icon: 'truck',
        };
      case 'COMPLETED':
        return {
          label: '4. COD Bayar / Selesai',
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          icon: 'check-circle',
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          icon: 'x-circle',
        };
      default:
        return {
          label: status,
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          icon: 'info',
        };
    }
  };

  const handleContactWhatsApp = (phone?: string, orderNo?: string) => {
    if (!phone) {
      alert('Nomor telepon toko tidak tersedia.');
      return;
    }
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const msg = encodeURIComponent(`Halo, saya Sales PIC Anda. Ingin mengonfirmasi mengenai pesanan ${orderNo || ''}. Apakah ada yang bisa kami bantu?`);
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
  };

  const renderOrderItem = ({ item }: { item: DealerOrder }) => {
    const badge = getStatusBadge(item.status);
    const totalItems = (item.order_items || []).reduce((s, it) => s + (it.quantity || 1), 0);
    const productCount = (item.order_items || []).length;

    return (
      <View style={styles.orderCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Feather name={badge.icon as any} size={12} color={badge.color} />
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Payment Method Banner */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather 
              name={(item.payment_method || '').toUpperCase() === 'COD' ? 'dollar-sign' : 'credit-card'} 
              size={13} 
              color={(item.payment_method || '').toUpperCase() === 'COD' ? '#d97706' : '#0284c7'} 
            />
            <Text style={{ fontSize: 12, fontWeight: '700', color: (item.payment_method || '').toUpperCase() === 'COD' ? '#b45309' : '#0369a1' }}>
              {(item.payment_method || '').toUpperCase() === 'COD' 
                ? 'COD (Bayar di Tempat)' 
                : `Transfer (+${item.unique_code || 0})`}
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: item.payment_proof_url ? '#16a34a' : '#94a3b8' }}>
            {item.payment_proof_url ? '✓ Bukti Ada' : 'Belum Ada Bukti'}
          </Text>
        </View>

        {/* Store Info Banner */}
        <View style={styles.storeBanner}>
          <View style={styles.storeIconContainer}>
            <Feather name="home" size={16} color="#4a6b22" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{item.dealers?.store_name || 'Toko Binaan'}</Text>
            <Text style={styles.storeAddress} numberOfLines={1}>
              {item.dealers?.address || 'Alamat tidak tersedia'}
            </Text>
          </View>
          {item.dealers?.profiles?.phone_number && (
            <TouchableOpacity
              onPress={() => handleContactWhatsApp(item.dealers?.profiles?.phone_number, item.order_number)}
              style={styles.waQuickBtn}
            >
              <Feather name="message-circle" size={16} color="#16a34a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Product preview items */}
        <View style={styles.itemsPreview}>
          <Text style={styles.itemsPreviewSummary}>
            📦 {productCount} Jenis Produk ({totalItems} unit)
          </Text>
          {(item.order_items || []).slice(0, 2).map((it, idx) => (
            <View key={idx} style={styles.previewRow}>
              <Text style={styles.previewItemName} numberOfLines={1}>
                • {it.products?.name || 'Produk Aksesoris'}
              </Text>
              <Text style={styles.previewItemQty}>x{it.quantity}</Text>
            </View>
          ))}
          {(item.order_items || []).length > 2 && (
            <Text style={styles.previewMoreText}>
              +{item.order_items.length - 2} produk lainnya...
            </Text>
          )}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Tagihan</Text>
            <Text style={styles.totalValue}>
              Rp {Number(item.final_amount || item.total_amount).toLocaleString('id-ID')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setSelectedOrder(item)}
          >
            <Text style={styles.detailButtonText}>Lihat Detail</Text>
            <Feather name="chevron-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pesanan Toko Binaan</Text>
          <Text style={styles.headerSubtitle}>
            Daftar transaksi pesanan dari seluruh toko binaan Anda
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchOrdersData}
          disabled={loading}
        >
          <Feather name="rotate-cw" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* METRIC STRIP */}
      <View style={styles.metricStrip}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Pesanan</Text>
          <Text style={styles.metricValue}>{filteredOrders.length}</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }]}>
          <Text style={styles.metricLabel}>Total Omset</Text>
          <Text style={[styles.metricValue, { color: '#2563eb' }]}>
            Rp {(totalOmset / 1000000).toFixed(1)} jt
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Perlu Follow-up</Text>
          <Text style={[styles.metricValue, { color: pendingCount > 0 ? '#b45309' : '#15803d' }]}>
            {pendingCount} Toko
          </Text>
        </View>
      </View>

      {/* FILTER & SEARCH */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari No. Order, Toko, atau Produk..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER TOKO BINAAN HORIZONTAL SCROLL */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContainer}
        >
          <TouchableOpacity
            style={[styles.dealerChip, selectedDealerId === 'ALL' && styles.dealerChipActive]}
            onPress={() => setSelectedDealerId('ALL')}
          >
            <Text style={[styles.dealerChipText, selectedDealerId === 'ALL' && styles.dealerChipTextActive]}>
              🏪 Semua Toko ({dealers.length})
            </Text>
          </TouchableOpacity>
          {dealers.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.dealerChip, selectedDealerId === d.id && styles.dealerChipActive]}
              onPress={() => setSelectedDealerId(d.id)}
            >
              <Text style={[styles.dealerChipText, selectedDealerId === d.id && styles.dealerChipTextActive]}>
                {d.store_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* STATUS FILTER PILLS */}
      <View style={styles.statusFilterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPillsContainer}>
          {[
            { key: 'ALL', label: 'Semua Status' },
            { key: 'PENDING', label: '1. Pesan' },
            { key: 'PACKING', label: '2. Pengemasan' },
            { key: 'SHIPPED', label: '3. Pengiriman' },
            { key: 'COMPLETED', label: '4. COD Bayar' },
            { key: 'CANCELLED', label: 'Batal' },
          ].map((st) => (
            <TouchableOpacity
              key={st.key}
              style={[styles.statusPill, selectedStatus === st.key && styles.statusPillActive]}
              onPress={() => setSelectedStatus(st.key)}
            >
              <Text style={[styles.statusPillText, selectedStatus === st.key && styles.statusPillTextActive]}>
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ORDERS LIST */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8ec44a" />
          <Text style={styles.loadingText}>Memuat pesanan toko binaan...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="shopping-bag" size={36} color="#a3e635" />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
              <Text style={styles.emptySubtitle}>
                {selectedDealerId !== 'ALL'
                  ? 'Toko binaan ini belum memiliki riwayat pesanan.'
                  : 'Belum ada transaksi dari toko binaan Anda.'}
              </Text>
              {selectedDealerId !== 'ALL' && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => setSelectedDealerId('ALL')}
                >
                  <Text style={styles.resetFilterText}>Tampilkan Semua Toko</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* DETAILED ORDER MODAL */}
      <Modal visible={!!selectedOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedOrder && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedOrder.order_number}</Text>
                    <Text style={styles.modalSubtitle}>
                      {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedOrder(null)}
                  >
                    <Feather name="x" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Status Banner */}
                  {(() => {
                    const badge = getStatusBadge(selectedOrder.status);
                    return (
                      <View style={[styles.modalStatusBanner, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Feather name={badge.icon as any} size={16} color={badge.color} />
                        <Text style={[styles.modalStatusText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    );
                  })()}

                  {/* Toko Binaan Information Card */}
                  <View style={styles.modalCard}>
                    <Text style={styles.modalSectionTitle}>Informasi Toko Binaan</Text>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Nama Toko:</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedOrder.dealers?.store_name || '-'}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Nama Pemilik:</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedOrder.dealers?.profiles?.full_name || '-'}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Alamat:</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedOrder.dealers?.address || '-'}
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>WhatsApp:</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedOrder.dealers?.profiles?.phone_number || '-'}
                      </Text>
                    </View>

                    {selectedOrder.dealers?.profiles?.phone_number && (
                      <TouchableOpacity
                        style={styles.waButton}
                        onPress={() =>
                          handleContactWhatsApp(
                            selectedOrder.dealers?.profiles?.phone_number,
                            selectedOrder.order_number
                          )
                        }
                      >
                        <Feather name="message-circle" size={18} color="white" />
                        <Text style={styles.waButtonText}>Hubungi Toko (Follow-up WA)</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Order Items Table */}
                  <View style={styles.modalCard}>
                    <Text style={styles.modalSectionTitle}>
                      Rincian Barang Dipesan ({(selectedOrder.order_items || []).length} Item)
                    </Text>
                    {(selectedOrder.order_items || []).map((item, idx) => (
                      <View key={idx} style={styles.itemDetailCard}>
                        <View style={styles.itemImgWrapper}>
                          <FallbackImage
                            uri={item.products?.image_url}
                            style={styles.itemThumb}
                            resizeMode="cover"
                            fallbackIcon="box"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>
                            {item.products?.name || 'Aksesoris'}
                          </Text>
                          <Text style={styles.itemSku}>SKU: {item.products?.sku || '-'}</Text>
                          <View style={styles.itemPriceRow}>
                            <Text style={styles.itemQtyPrice}>
                              {item.quantity} unit × Rp{' '}
                              {Number(item.unit_price || item.products?.price || 0).toLocaleString('id-ID')}
                            </Text>
                            <Text style={styles.itemSubtotal}>
                              Rp{' '}
                              {Number(
                                item.subtotal ||
                                  (item.quantity || 1) * (item.unit_price || item.products?.price || 0)
                              ).toLocaleString('id-ID')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Payment Info & Proof */}
                  <View style={styles.modalCard}>
                    <Text style={styles.modalSectionTitle}>Metode & Bukti Pembayaran</Text>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Metode:</Text>
                      <Text style={[styles.modalInfoValue, { fontWeight: '700' }]}>
                        {(selectedOrder.payment_method || '').toUpperCase() === 'COD' 
                          ? 'COD (Bayar di Tempat)' 
                          : 'Transfer Bank Manual'}
                      </Text>
                    </View>
                    {selectedOrder.unique_code ? (
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Kode Unik 3 Angka:</Text>
                        <Text style={[styles.modalInfoValue, { color: '#0369a1', fontWeight: '700' }]}>
                          +{selectedOrder.unique_code}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Status Pembayaran:</Text>
                      <Text style={[styles.modalInfoValue, { fontWeight: '700', textTransform: 'capitalize' }]}>
                        {selectedOrder.payment_status || 'Pending'}
                      </Text>
                    </View>

                    {selectedOrder.payment_proof_url ? (
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 8 }}>
                          Bukti Transfer Dealer:
                        </Text>
                        <FallbackImage
                          uri={selectedOrder.payment_proof_url}
                          style={{ width: '100%', height: 180, borderRadius: 8 }}
                          resizeMode="contain"
                          fallbackIcon="file-text"
                        />
                      </View>
                    ) : (
                      <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                          {(selectedOrder.payment_method || '').toUpperCase() === 'COD'
                            ? 'Pembayaran akan diserahkan secara tunai saat barang diterima.'
                            : 'Dealer belum mengunggah foto struk transfer.'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Payment Summary */}
                  <View style={[styles.modalCard, { marginBottom: 30 }]}>
                    <Text style={styles.modalSectionTitle}>Ringkasan Pembayaran</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal Barang</Text>
                      <Text style={styles.summaryVal}>
                        Rp {Number(selectedOrder.total_amount).toLocaleString('id-ID')}
                      </Text>
                    </View>
                    {selectedOrder.unique_code ? (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Kode Unik</Text>
                        <Text style={[styles.summaryVal, { color: '#0284c7' }]}>
                          +Rp {selectedOrder.unique_code}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Biaya Ongkir / Layanan</Text>
                      <Text style={[styles.summaryVal, { color: '#16a34a' }]}>Gratis (B2B)</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.totalGrandLabel}>Total Tagihan</Text>
                      <Text style={styles.totalGrandVal}>
                        Rp {Number(selectedOrder.final_amount || selectedOrder.total_amount).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.closeFullBtn}
                    onPress={() => setSelectedOrder(null)}
                  >
                    <Text style={styles.closeFullBtnText}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4a6b22',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dcf0c3',
    marginTop: 4,
    maxWidth: 280,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricStrip: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  metricCard: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  filterSection: {
    paddingVertical: 8,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dealerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dealerChipActive: {
    backgroundColor: '#4a6b22',
    borderColor: '#4a6b22',
  },
  dealerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dealerChipTextActive: {
    color: 'white',
  },
  statusFilterSection: {
    paddingBottom: 8,
  },
  statusPillsContainer: {
    paddingHorizontal: 16,
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  statusPillActive: {
    backgroundColor: '#8ec44a',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  statusPillTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 10,
    marginBottom: 12,
  },
  storeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ecfccb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  storeAddress: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  waQuickBtn: {
    padding: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  itemsPreview: {
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemsPreviewSummary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  previewItemName: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  previewItemQty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 8,
  },
  previewMoreText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4a6b22',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f7fee7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
  },
  resetFilterBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  modalScroll: {
    padding: 20,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    width: '35%',
  },
  modalInfoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    width: '65%',
    textAlign: 'right',
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  waButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemDetailCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  itemImgWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  itemThumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemQtyPrice: {
    fontSize: 12,
    color: '#64748b',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 10,
  },
  totalGrandLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalGrandVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeFullBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
});
