import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  final_amount: number;
  status: string;
  order_items: { products: { name: string }, quantity: number, unit_price: number }[];
  address: string;
}

export default function OrdersScreen() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    // Fetch orders and their items. 
    // In a real app, you'd filter by the logged-in dealer_id.
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name))')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as unknown as Order[]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {!loading && orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shopping-bag" size={48} color="#dcf0c3" />
            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
            <Text style={styles.emptySub}>Anda belum melakukan pemesanan apa pun. Silakan lihat katalog kami.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(dealer)/catalog')}>
              <Text style={styles.emptyBtnText}>Lihat Katalog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map(order => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>{order.order_number}</Text>
                <Text style={styles.status}>{order.status}</Text>
              </View>
              <Text style={styles.date}>{new Date(order.created_at).toLocaleDateString('id-ID')}</Text>
              <View style={styles.footer}>
                <Text style={styles.totalLabel}>Total Tagihan:</Text>
                <Text style={styles.totalValue}>Rp {Number(order.final_amount).toLocaleString('id-ID')}</Text>
              </View>
              <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedOrder(order)}>
                <Text style={styles.detailText}>Lihat Detail</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DETAIL PESANAN BERFUNGSI */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📄 Detail Pesanan</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={{ maxHeight: 400, marginVertical: 12 }}>
                <View style={styles.invInfo}>
                  <View>
                    <Text style={styles.invTitle}>{selectedOrder.order_number}</Text>
                    <Text style={styles.invDate}>{new Date(selectedOrder.created_at).toLocaleDateString('id-ID')}</Text>
                  </View>
                  <Text style={styles.statusBadge}>{selectedOrder.status}</Text>
                </View>

                {/* ITEM LIST */}
                <Text style={styles.sectionHeading}>Daftar Produk ({(selectedOrder.order_items || []).length})</Text>
                <View style={styles.itemsBox}>
                  {(selectedOrder.order_items || []).map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.products?.name || 'Produk'}</Text>
                        <Text style={styles.itemSub}>{item.quantity}x @ Rp {Number(item.unit_price).toLocaleString('id-ID')}</Text>
                      </View>
                      <Text style={styles.itemTotal}>Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}</Text>
                    </View>
                  ))}
                </View>

                {/* ALAMAT PENGIRIMAN */}
                <Text style={styles.sectionHeading}>Alamat Pengiriman</Text>
                <View style={styles.addressBox}>
                  <Feather name="map-pin" size={16} color="#8ec44a" style={{ marginTop: 2 }} />
                  <Text style={styles.addressText}>{selectedOrder.address || 'Alamat tidak tersedia'}</Text>
                </View>

                {/* TOTAL SUMMARY */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalSummaryLabel}>Total Pembayaran:</Text>
                  <Text style={styles.totalSummaryValue}>Rp {Number(selectedOrder.final_amount).toLocaleString('id-ID')}</Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#8ec44a' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f7e6', shadowColor: '#8ec44a', shadowOpacity: 0.05, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#4a6b22' },
  status: { fontSize: 12, fontWeight: 'bold', color: '#8ec44a', backgroundColor: '#f0f7e6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  date: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, marginBottom: 12 },
  totalLabel: { fontSize: 12, color: '#64748b' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#8ec44a' },
  detailBtn: { backgroundColor: '#f6fbf0', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#dcf0c3' },
  detailText: { color: '#8ec44a', fontWeight: 'bold', fontSize: 12 },

  // Empty State
  emptyState: { alignItems: 'center', padding: 40, marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#4a6b22', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 20, lineHeight: 20 },
  emptyBtn: { backgroundColor: '#8ec44a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 24 },
  emptyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#4a6b22' },

  invInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f6fbf0', padding: 12, borderRadius: 10, marginBottom: 16 },
  invTitle: { fontSize: 14, fontWeight: 'bold', color: '#4a6b22' },
  invDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: 'bold', color: '#8ec44a', backgroundColor: '#f0f7e6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  sectionHeading: { fontSize: 12, fontWeight: 'bold', color: '#4a6b22', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  itemsBox: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, gap: 10, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  itemSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: 'bold', color: '#4a6b22' },

  addressBox: { flexDirection: 'row', gap: 8, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 16 },
  addressText: { fontSize: 12, color: '#475569', flex: 1 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalSummaryLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  totalSummaryValue: { fontSize: 16, fontWeight: 'bold', color: '#8ec44a' },

  closeBtn: { backgroundColor: '#8ec44a', padding: 14, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});
