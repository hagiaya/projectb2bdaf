import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  final_amount: number;
  status: string;
  payment_method?: string;
  unique_code?: number;
  payment_proof_url?: string;
  payment_status?: string;
  order_items: { products: { name: string, sku: string }, quantity: number, unit_price: number }[];
  dealers?: { address: string, store_name: string };
}

export default function OrdersScreen() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    // Realtime orders subscription
    const sub = supabase
      .channel('dealer:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get dealer record
      const { data: dealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      let query = supabase
        .from('orders')
        .select('*, order_items(*, products(name, sku)), dealers(address, store_name)')
        .order('created_at', { ascending: false });

      if (dealer?.id) {
        query = query.eq('dealer_id', dealer.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        setOrders(data as unknown as Order[]);
      }
    } catch (e) {
      console.error('Fetch orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'PACKING':
      case 'PROCESSING': return 1;
      case 'SHIPPED': return 2;
      case 'COMPLETED': return 3;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: '1. Pesan (Diterima)', color: '#d97706', bg: '#fef3c7' };
      case 'PACKING':
      case 'PROCESSING':
        return { label: '2. Pengemasan', color: '#2563eb', bg: '#eff6ff' };
      case 'SHIPPED':
        return { label: '3. Pengiriman', color: '#7c3aed', bg: '#f5f3ff' };
      case 'COMPLETED':
        return { label: '4. COD Bayar / Selesai', color: '#16a34a', bg: '#f0fdf4' };
      case 'CANCELLED':
        return { label: 'Dibatalkan', color: '#dc2626', bg: '#fee2e2' };
      default:
        return { label: status, color: '#475569', bg: '#f1f5f9' };
    }
  };

  const handleUploadProof = async (orderId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin galeri untuk memilih bukti transfer.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingProof(true);
        const asset = result.assets[0];
        const { data: { user } } = await supabase.auth.getUser();

        let publicUrl = asset.uri;
        if (asset.base64 && user) {
          const filePath = `orders/${user.id}/proof_${orderId}_${Date.now()}.jpg`;
          const cleanBase64 = asset.base64.replace(/^data:image\/\w+;base64,/, '');

          const { error: uploadErr } = await supabase.storage
            .from('dealer_documents')
            .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            publicUrl = supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
          }
        }

        const { error: updateErr } = await supabase
          .from('orders')
          .update({
            payment_proof_url: publicUrl,
            payment_status: 'menunggu_verifikasi',
          })
          .eq('id', orderId);

        if (updateErr) throw updateErr;

        Alert.alert('Sukses', 'Bukti transfer berhasil diunggah! Admin akan segera memverifikasi.');
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, payment_proof_url: publicUrl, payment_status: 'menunggu_verifikasi' });
        }
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Gagal Upload', e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setUploadingProof(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat & Status Pesanan</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8ec44a" />
            <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Memuat pesanan Anda...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shopping-bag" size={48} color="#8ec44a" />
            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
            <Text style={styles.emptySub}>Anda belum melakukan pemesanan apa pun. Silakan lihat katalog produk.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(dealer)/catalog')}>
              <Text style={styles.emptyBtnText}>Lihat Katalog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map(order => {
            const badge = getStatusBadge(order.status);
            const currentStage = getStageIndex(order.status);

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>{order.order_number}</Text>
                    <Text style={styles.date}>{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusTagText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* 4 STAGES STEPPER PIPELINE */}
                <View style={styles.pipelineBox}>
                  {['Pesan', 'Pengemasan', 'Pengiriman', 'COD Bayar'].map((stage, idx) => {
                    const isPassed = currentStage >= idx;
                    const isCurrent = currentStage === idx;
                    return (
                      <React.Fragment key={stage}>
                        <View style={styles.stepCol}>
                          <View style={[
                            styles.stepCircle,
                            isPassed && styles.stepCircleActive,
                            isCurrent && styles.stepCircleCurrent
                          ]}>
                            {isPassed ? (
                              <Feather name="check" size={11} color="white" />
                            ) : (
                              <Text style={styles.stepNumber}>{idx + 1}</Text>
                            )}
                          </View>
                          <Text style={[
                            styles.stepLabel,
                            isPassed && styles.stepLabelActive,
                            isCurrent && { fontWeight: '900', color: '#16a34a' }
                          ]}>{stage}</Text>
                        </View>
                        {idx < 3 && (
                          <View style={[styles.stepLine, currentStage > idx && styles.stepLineActive]} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>

                {/* PAYMENT METHOD INFO */}
                <View style={styles.paymentInfoRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather
                      name={order.payment_method === 'COD' ? 'truck' : 'credit-card'}
                      size={14}
                      color="#64748b"
                    />
                    <Text style={styles.paymentMethodText}>
                      {order.payment_method === 'COD' ? 'COD (Bayar di Tempat)' : `Transfer Bank (Kode: +${order.unique_code || 0})`}
                    </Text>
                  </View>

                  {order.payment_method === 'TRANSFER' && (
                    <Text style={[
                      styles.proofBadge,
                      { color: order.payment_proof_url ? '#16a34a' : '#d97706' }
                    ]}>
                      {order.payment_proof_url ? '✓ Bukti Terunggah' : '⚠️ Belum Ada Bukti'}
                    </Text>
                  )}
                </View>

                <View style={styles.footer}>
                  <View>
                    <Text style={styles.totalLabel}>Total Tagihan:</Text>
                    <Text style={styles.totalValue}>Rp {Number(order.final_amount).toLocaleString('id-ID')}</Text>
                  </View>
                  <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedOrder(order)}>
                    <Text style={styles.detailText}>Lihat Detail & Bukti</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL DETAIL PESANAN */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Transaksi Pesanan</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                <View style={styles.invInfo}>
                  <View>
                    <Text style={styles.invTitle}>{selectedOrder.order_number}</Text>
                    <Text style={styles.invDate}>{new Date(selectedOrder.created_at).toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: getStatusBadge(selectedOrder.status).bg }]}>
                    <Text style={[styles.statusTagText, { color: getStatusBadge(selectedOrder.status).color }]}>
                      {getStatusBadge(selectedOrder.status).label}
                    </Text>
                  </View>
                </View>

                {/* METODE PEMBAYARAN DETAIL */}
                <Text style={styles.sectionHeading}>Metode Pembayaran</Text>
                <View style={styles.paymentMethodDetailBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Feather name={selectedOrder.payment_method === 'COD' ? 'truck' : 'credit-card'} size={18} color="#8ec44a" />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>
                      {selectedOrder.payment_method === 'COD' ? 'COD (Bayar Tunai di Tempat)' : 'Transfer Bank Manual'}
                    </Text>
                  </View>

                  {selectedOrder.payment_method === 'TRANSFER' && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ fontSize: 12, color: '#475569' }}>
                        Rekening Tujuan: <Text style={{ fontWeight: 'bold' }}>BCA 8730-123-4567 a/n PT DAP</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                        Kode Acak Transaksi: <Text style={{ fontWeight: 'bold' }}>+{selectedOrder.unique_code || 0}</Text>
                      </Text>
                    </View>
                  )}

                  {selectedOrder.payment_method === 'COD' && (
                    <Text style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
                      ✓ Pembayaran tunai saat kurir/sales menyerahkan barang pesanan.
                    </Text>
                  )}
                </View>

                {/* BUKTI PEMBAYARAN TRANSFER */}
                {selectedOrder.payment_method === 'TRANSFER' && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionHeading}>Bukti Pembayaran</Text>
                    {selectedOrder.payment_proof_url ? (
                      <View style={styles.proofViewWrap}>
                        <TouchableOpacity onPress={() => setPreviewImage(selectedOrder.payment_proof_url || null)}>
                          <Image source={{ uri: selectedOrder.payment_proof_url }} style={styles.proofPreviewImg} contentFit="cover" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.reuploadBtn}
                          onPress={() => handleUploadProof(selectedOrder.id)}
                          disabled={uploadingProof}
                        >
                          {uploadingProof ? (
                            <ActivityIndicator size="small" color="#8ec44a" />
                          ) : (
                            <Text style={styles.reuploadBtnText}>Ganti Bukti</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.noProofBox}>
                        <Feather name="alert-circle" size={20} color="#d97706" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b45309' }}>Belum Ada Bukti Transfer</Text>
                          <Text style={{ fontSize: 11, color: '#92400e' }}>Silakan unggah struk / screenshot m-banking Anda.</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.uploadProofSmallBtn}
                          onPress={() => handleUploadProof(selectedOrder.id)}
                          disabled={uploadingProof}
                        >
                          {uploadingProof ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={styles.uploadProofSmallBtnText}>Upload Bukti</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* ITEM LIST */}
                <Text style={styles.sectionHeading}>Daftar Produk ({(selectedOrder.order_items || []).length})</Text>
                <View style={styles.itemsBox}>
                  {(selectedOrder.order_items || []).map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.products?.sku || 'SKU Produk'}</Text>
                        <Text style={styles.itemSub}>{item.quantity}x @ Rp {Number(item.unit_price).toLocaleString('id-ID')}</Text>
                      </View>
                      <Text style={styles.itemTotal}>Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}</Text>
                    </View>
                  ))}
                </View>

                {/* ALAMAT PENGIRIMAN */}
                <Text style={styles.sectionHeading}>Alamat Pengiriman Outlet</Text>
                <View style={styles.addressBox}>
                  <Feather name="map-pin" size={16} color="#8ec44a" style={{ marginTop: 2 }} />
                  <Text style={styles.addressText}>{selectedOrder.dealers?.address || 'Alamat outlet sesuai data pendaftaran'}</Text>
                </View>

                {/* TOTAL SUMMARY */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalSummaryLabel}>Total Pembayaran:</Text>
                  <Text style={styles.totalSummaryValue}>Rp {Number(selectedOrder.final_amount).toLocaleString('id-ID')}</Text>
                </View>
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity style={styles.closeBtnFull} onPress={() => setSelectedOrder(null)}>
                <Text style={styles.closeBtnText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL IMAGE ZOOM MODAL */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomClose} onPress={() => setPreviewImage(null)}>
            <Feather name="x" size={26} color="white" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.zoomImg} contentFit="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: '#8ec44a',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  date: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 11, fontWeight: '800' },
  pipelineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  stepCol: { alignItems: 'center', minWidth: 56 },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: '#8ec44a' },
  stepCircleCurrent: { backgroundColor: '#16a34a', borderWidth: 2, borderColor: '#bbf7d0' },
  stepNumber: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  stepLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
  stepLabelActive: { color: '#1e293b' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginBottom: 12 },
  stepLineActive: { backgroundColor: '#8ec44a' },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  proofBadge: { fontSize: 11, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  totalLabel: { fontSize: 11, color: '#64748b' },
  totalValue: { fontSize: 15, fontWeight: '900', color: '#8ec44a' },
  detailBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  detailText: { color: '#15803d', fontWeight: 'bold', fontSize: 12 },

  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyBtn: { backgroundColor: '#8ec44a', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, marginTop: 20 },
  emptyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  invInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  invTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  invDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  sectionHeading: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
  paymentMethodDetailBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  proofViewWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proofPreviewImg: { width: 90, height: 90, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  reuploadBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reuploadBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  noProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  uploadProofSmallBtn: {
    backgroundColor: '#8ec44a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  uploadProofSmallBtnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  itemsBox: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, gap: 10, marginBottom: 14 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  itemSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  addressBox: { flexDirection: 'row', gap: 8, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 14 },
  addressText: { fontSize: 12, color: '#475569', flex: 1, lineHeight: 18 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalSummaryLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  totalSummaryValue: { fontSize: 17, fontWeight: '900', color: '#8ec44a' },
  closeBtnFull: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  zoomImg: { width: '100%', height: '80%' },
});
