import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, Platform, TextInput } from 'react-native';
import { useSafeBottom } from '../../hooks/useSafeBottom';
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
  received_at?: string;
  receiver_name?: string;
  receiving_notes?: string;
  receiving_proof_url?: string;
  order_items: { products: { name: string, sku: string }, quantity: number, unit_price: number }[];
  dealers?: { address: string, store_name: string };
}

export default function OrdersScreen() {
  const safeBottom = useSafeBottom();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showTransferAlert, setShowTransferAlert] = useState(false);
  const [bankInfo, setBankInfo] = useState<{
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
  }>({
    bank_name: 'BCA (Bank Central Asia)',
    bank_account_number: '829-019-8821',
    bank_account_name: 'PT DISTRIBUSI AKSESORIS PRIMA',
  });

  // Receiving state
  const [receivingModalOrder, setReceivingModalOrder] = useState<Order | null>(null);
  const [receiverNameInput, setReceiverNameInput] = useState('');
  const [receivingNotesInput, setReceivingNotesInput] = useState('');
  const [receivingPhotoUri, setReceivingPhotoUri] = useState<string | null>(null);
  const [receivingPhotoBase64, setReceivingPhotoBase64] = useState<string | null>(null);
  const [submittingReceiving, setSubmittingReceiving] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Fetch dynamic bank settings
    supabase
      .from('payment_settings')
      .select('bank_name, bank_account_number, bank_account_name')
      .eq('id', 'default')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBankInfo({
            bank_name: data.bank_name || 'BCA (Bank Central Asia)',
            bank_account_number: data.bank_account_number || '829-019-8821',
            bank_account_name: data.bank_account_name || 'PT DISTRIBUSI AKSESORIS PRIMA',
          });
        }
      });

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
      case 'RECEIVED': return 3;
      case 'COMPLETED': return 4;
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
      case 'RECEIVED':
        return { label: '4. Penerimaan (Diterima)', color: '#0d9488', bg: '#ccfbf1' };
      case 'COMPLETED':
        return { label: '5. Selesai / Lunas', color: '#16a34a', bg: '#f0fdf4' };
      case 'CANCELLED':
        return { label: 'Dibatalkan', color: '#dc2626', bg: '#fee2e2' };
      default:
        return { label: status, color: '#475569', bg: '#f1f5f9' };
    }
  };

  const handleOpenReceivingModal = (order: Order) => {
    setReceivingModalOrder(order);
    setReceiverNameInput(order.receiver_name || order.dealers?.store_name || '');
    setReceivingNotesInput(order.receiving_notes || 'Barang telah diterima lengkap dan dalam kondisi baik.');
    setReceivingPhotoUri(order.receiving_proof_url || null);
    setReceivingPhotoBase64(null);
  };

  const handlePickReceivingPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh izin galeri untuk memilih foto bukti penerimaan / surat jalan.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceivingPhotoUri(result.assets[0].uri);
        setReceivingPhotoBase64(result.assets[0].base64 || null);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal memilih foto bukti tanda terima.');
    }
  };

  const handleConfirmReceiving = async () => {
    if (!receivingModalOrder) return;
    if (!receiverNameInput.trim()) {
      Alert.alert('Data Belum Lengkap', 'Harap isi nama penerima barang (PIC atau pemilik toko).');
      return;
    }

    setSubmittingReceiving(true);
    try {
      let publicUrl = receivingPhotoUri;
      const { data: { user } } = await supabase.auth.getUser();

      if (receivingPhotoBase64 && user) {
        const filePath = `receiving/${user.id}/proof_${receivingModalOrder.id}_${Date.now()}.jpg`;
        const cleanBase64 = receivingPhotoBase64.replace(/^data:image\/\w+;base64,/, '');

        const { error: uploadErr } = await supabase.storage
          .from('dealer_documents')
          .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg', upsert: true });

        if (!uploadErr) {
          publicUrl = supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
        }
      }

      const payload: any = {
        status: 'RECEIVED',
        received_at: new Date().toISOString(),
        receiver_name: receiverNameInput.trim(),
        receiving_notes: receivingNotesInput.trim() || 'Barang telah diterima lengkap dan dalam kondisi baik.',
        receiving_proof_url: publicUrl || null,
        receiving_status: 'RECEIVED',
      };

      if (receivingModalOrder.payment_method === 'KREDIT') {
        const { data: dData } = await supabase.from('dealers').select('credit_term_days').eq('profile_id', user.id).single();
        if (dData?.credit_term_days) {
           const dueDate = new Date();
           dueDate.setDate(dueDate.getDate() + dData.credit_term_days);
           payload.payment_due_date = dueDate.toISOString();
        }
      }

      let { error: updateErr } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', receivingModalOrder.id);

      // Fallback if schema does not have the receiving columns yet
      if (updateErr && updateErr.message?.includes('column')) {
        console.warn('Receiving columns might not exist yet, updating status only:', updateErr.message);
        const fb = await supabase.from('orders').update({ status: 'RECEIVED' }).eq('id', receivingModalOrder.id);
        updateErr = fb.error;
      }

      if (updateErr) throw updateErr;

      Alert.alert('Berhasil Diterima', 'Terima kasih! Konfirmasi penerimaan barang berhasil disimpan. Status pesanan kini: 4. Penerimaan (Diterima).');
      setReceivingModalOrder(null);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === receivingModalOrder.id) {
        setSelectedOrder({ ...selectedOrder, ...payload });
      }
    } catch (e: any) {
      console.error('Error confirming receiving:', e);
      Alert.alert('Gagal Konfirmasi', e.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmittingReceiving(false);
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

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: safeBottom }]}>
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

                {/* 5 STAGES STEPPER PIPELINE */}
                <View style={styles.pipelineBox}>
                  {['Pesan', 'Pengemasan', 'Pengiriman', 'Penerimaan', 'Selesai'].map((stage, idx) => {
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
                        {idx < 4 && (
                          <View style={[styles.stepLine, currentStage > idx && styles.stepLineActive]} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>

                {/* RECEIVING ACTION BUTTON OR BANNER */}
                {order.status === 'SHIPPED' && (
                  <TouchableOpacity
                    style={styles.receiveBtnAction}
                    onPress={() => handleOpenReceivingModal(order)}
                  >
                    <Feather name="check-square" size={15} color="white" />
                    <Text style={styles.receiveBtnActionText}>📦 Konfirmasi Barang Diterima</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'RECEIVED' && (
                  <View style={styles.receivedBadgeBanner}>
                    <Feather name="check-circle" size={14} color="#0f766e" />
                    <Text style={styles.receivedBadgeBannerText}>
                      ✓ Barang telah diterima{order.receiver_name ? ` oleh ${order.receiver_name}` : ''}
                    </Text>
                  </View>
                )}

                {/* PAYMENT METHOD INFO */}
                <View style={styles.paymentInfoRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather
                      name={order.payment_method === 'COD' ? 'truck' : order.payment_method === 'KREDIT' ? 'award' : 'credit-card'}
                      size={14}
                      color="#64748b"
                    />
                    <Text style={styles.paymentMethodText}>
                      {order.payment_method === 'COD' ? 'COD (Bayar di Tempat)' : order.payment_method === 'KREDIT' ? 'Kredit / Tempo (TOP)' : `Transfer Bank (Kode: +${order.unique_code || 0})`}
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
                    <Feather name={selectedOrder.payment_method === 'COD' ? 'truck' : selectedOrder.payment_method === 'KREDIT' ? 'award' : 'credit-card'} size={18} color="#8ec44a" />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b' }}>
                      {selectedOrder.payment_method === 'COD' ? 'COD (Bayar Tunai di Tempat)' : selectedOrder.payment_method === 'KREDIT' ? 'Kredit / Tempo (TOP)' : 'Transfer Bank Manual'}
                    </Text>
                  </View>

                  {selectedOrder.payment_method === 'TRANSFER' && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ fontSize: 12, color: '#475569' }}>
                        Rekening Tujuan: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{bankInfo.bank_name} {bankInfo.bank_account_number} a.n. {bankInfo.bank_account_name}</Text>
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
                          onPress={() => setShowTransferAlert(true)}
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
                          onPress={() => setShowTransferAlert(true)}
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

                {/* PENERIMAAN BARANG (GOODS RECEIPT) */}
                <Text style={styles.sectionHeading}>Status Penerimaan Barang (Tahap 4)</Text>
                <View style={styles.receivingCardDetail}>
                  {selectedOrder.status === 'RECEIVED' || selectedOrder.status === 'COMPLETED' || selectedOrder.receiver_name ? (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Feather name="check-circle" size={16} color="#0d9488" />
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f766e' }}>
                          Barang Telah Diterima di Toko
                        </Text>
                      </View>
                      <Text style={styles.receivingDetailText}>
                        Penerima: <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{selectedOrder.receiver_name || selectedOrder.dealers?.store_name || '-'}</Text>
                      </Text>
                      {selectedOrder.received_at && (
                        <Text style={styles.receivingDetailText}>
                          Waktu: <Text style={{ color: '#475569' }}>{new Date(selectedOrder.received_at).toLocaleString('id-ID')}</Text>
                        </Text>
                      )}
                      <View style={{ backgroundColor: '#f0fdfa', padding: 8, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#ccfbf1' }}>
                        <Text style={{ fontSize: 11, color: '#0f766e', fontStyle: 'italic' }}>
                          "{selectedOrder.receiving_notes || 'Barang telah diterima lengkap dan dalam kondisi baik.'}"
                        </Text>
                      </View>
                      {selectedOrder.receiving_proof_url && (
                        <TouchableOpacity 
                          style={{ marginTop: 8 }}
                          onPress={() => setPreviewImage(selectedOrder.receiving_proof_url || null)}
                        >
                          <Image source={{ uri: selectedOrder.receiving_proof_url }} style={{ width: 80, height: 80, borderRadius: 8 }} contentFit="cover" />
                          <Text style={{ fontSize: 11, color: '#0d9488', marginTop: 2, fontWeight: '600' }}>Lihat foto tanda terima</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : selectedOrder.status === 'SHIPPED' ? (
                    <View style={{ alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 8, lineHeight: 18 }}>
                        Pesanan saat ini sedang dalam perjalanan menuju outlet. Jika kurir telah menyerahkan barang, silakan konfirmasi di bawah:
                      </Text>
                      <TouchableOpacity 
                        style={styles.confirmReceiveInModalBtn}
                        onPress={() => {
                          const ord = selectedOrder;
                          setSelectedOrder(null);
                          handleOpenReceivingModal(ord);
                        }}
                      >
                        <Feather name="check-square" size={15} color="white" />
                        <Text style={styles.confirmReceiveInModalBtnText}>Konfirmasi Penerimaan Barang</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                      Penerimaan barang dapat dikonfirmasi saat pesanan telah dikirimkan oleh gudang.
                    </Text>
                  )}
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

      {/* MODAL KONFIRMASI PENERIMAAN BARANG DEALER */}
      <Modal visible={!!receivingModalOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: '#f0fdfa', borderBottomColor: '#ccfbf1' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="package" size={16} color="#0d9488" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: '#0f766e' }]}>Konfirmasi Penerimaan</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{receivingModalOrder?.order_number}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setReceivingModalOrder(null)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440, padding: 4 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 18 }}>
                Pastikan paket dan jumlah barang yang diterima dari kurir telah diperiksa dan sesuai sebelum konfirmasi.
              </Text>

              <Text style={styles.inputLabel}>
                Nama Penerima (Pemilik / Karyawan Toko) <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={receiverNameInput}
                onChangeText={setReceiverNameInput}
                placeholder="Contoh: Budi Santoso (Pemilik Toko)"
                placeholderTextColor="#94a3b8"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Catatan Kondisi Barang Saat Tiba
              </Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                value={receivingNotesInput}
                onChangeText={setReceivingNotesInput}
                multiline
                numberOfLines={3}
                placeholder="Contoh: Barang diterima lengkap 10 dus, kondisi segel bagus."
                placeholderTextColor="#94a3b8"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Foto Tanda Terima / Surat Jalan (Opsional)
              </Text>
              {receivingPhotoUri ? (
                <View style={{ marginTop: 6, position: 'relative', width: 90, height: 90 }}>
                  <Image source={{ uri: receivingPhotoUri }} style={{ width: 90, height: 90, borderRadius: 10 }} contentFit="cover" />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#dc2626', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => {
                      setReceivingPhotoUri(null);
                      setReceivingPhotoBase64(null);
                    }}
                  >
                    <Feather name="x" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.pickPhotoBtn} onPress={handlePickReceivingPhoto}>
                  <Feather name="camera" size={16} color="#0d9488" />
                  <Text style={styles.pickPhotoBtnText}>Pilih Foto Bukti Terima</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReceivingModalOrder(null)}
                disabled={submittingReceiving}
              >
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitReceivingBtn}
                onPress={handleConfirmReceiving}
                disabled={submittingReceiving}
              >
                {submittingReceiving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather name="check" size={15} color="white" />
                    <Text style={styles.modalSubmitReceivingBtnText}>Konfirmasi Diterima</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POPUP PERINGATAN DATA TRANSFER SEBELUM UPLOAD */}
      <Modal visible={showTransferAlert} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.alertIconWrap}>
              <Feather name="alert-triangle" size={30} color="#d97706" />
            </View>
            <Text style={styles.alertTitle}>Peringatan Transfer Bank</Text>
            <Text style={styles.alertSubtitle}>
              Harap periksa dan pastikan kembali data transfer Anda sebelum mengunggah bukti pembayaran:
            </Text>

            <View style={styles.alertDetailsCard}>
              <View style={styles.alertDetailRow}>
                <Text style={styles.alertDetailLabel}>Rekening Tujuan Resmi:</Text>
                <Text style={styles.alertDetailValBold}>{bankInfo.bank_name} {bankInfo.bank_account_number}</Text>
                <Text style={styles.alertDetailSub}>a.n. {bankInfo.bank_account_name}</Text>
              </View>

              {selectedOrder && (
                <View style={[styles.alertDetailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fde68a' }]}>
                  <Text style={styles.alertDetailLabel}>Nominal Transfer Wajib Sesuai:</Text>
                  <Text style={[styles.alertDetailValBold, { color: '#b45309', fontSize: 16 }]}>
                    Rp {Number(selectedOrder.final_amount).toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.alertDetailSub}>
                    * Termasuk kode unik (+Rp {selectedOrder.unique_code || 0}). Dilarang membulatkan nominal!
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.alertNoticeBox}>
              <Feather name="info" size={14} color="#92400e" style={{ marginTop: 2 }} />
              <Text style={styles.alertNoticeText}>
                Pastikan foto struk atau screenshot m-banking yang Anda unggah terlihat jelas, menampilkan tanggal/jam, dan nominal transfer persis sesuai tagihan.
              </Text>
            </View>

            <View style={styles.alertActionRow}>
              <TouchableOpacity 
                style={styles.alertBtnCancel} 
                onPress={() => setShowTransferAlert(false)}
              >
                <Text style={styles.alertBtnCancelText}>Periksa Ulang</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.alertBtnConfirm} 
                onPress={() => {
                  setShowTransferAlert(false);
                  if (selectedOrder) handleUploadProof(selectedOrder.id);
                }}
              >
                <Feather name="upload" size={15} color="white" />
                <Text style={styles.alertBtnConfirmText}>Pilih Foto Bukti</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  /* POPUP PERINGATAN TRANSFER */
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  alertDetailsCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  alertDetailRow: {
    gap: 2,
  },
  alertDetailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  alertDetailValBold: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  alertDetailSub: {
    fontSize: 11,
    color: '#78350f',
  },
  alertNoticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  alertNoticeText: {
    fontSize: 11,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
  },
  alertActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  alertBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  alertBtnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  alertBtnConfirm: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8ec44a',
  },
  alertBtnConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'white',
  },

  /* FITUR PENERIMAAN BARANG STYLES */
  receiveBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#0d9488',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  receiveBtnActionText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  receivedBadgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  receivedBadgeBannerText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  receivingCardDetail: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  receivingDetailText: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 3,
  },
  confirmReceiveInModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d9488',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  confirmReceiveInModalBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  pickPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 4,
  },
  pickPhotoBtnText: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13,
  },
  modalSubmitReceivingBtn: {
    flex: 1.5,
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalSubmitReceivingBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
});


