import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function CheckoutScreen() {
  const { items, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const [isLoadingDealer, setIsLoadingDealer] = useState(true);

  // Payment Method: 'TRANSFER' or 'COD'
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'COD'>('TRANSFER');
  // 3-digit random unique code for transfer verification (e.g. 100 - 999)
  const [uniqueCode, setUniqueCode] = useState(() => Math.floor(100 + Math.random() * 900));

  // Proof of Transfer state
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  useEffect(() => {
    fetchDealerData();
  }, []);

  const fetchDealerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Fetch dealer error:", error);
        } else if (data) {
          setDealerData(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDealer(false);
    }
  };

  const finalAmount = paymentMethod === 'TRANSFER' ? cartTotal + uniqueCode : cartTotal;

  const pickProofImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Dibutuhkan izin galeri untuk memilih foto bukti transfer.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofUri(result.assets[0].uri);
        setProofBase64(result.assets[0].base64 || null);
      }
    } catch (err: any) {
      console.error('Error pick image:', err);
      Alert.alert('Error', 'Gagal memilih gambar.');
    }
  };

  const handleCreateOrder = async () => {
    if (!dealerData) {
      Alert.alert('Error', 'Data toko/dealer tidak ditemukan. Pastikan akun sudah disetujui Admin.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Keranjang Kosong', 'Tidak ada produk yang dipesan.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const orderNumber = `ORD-${Date.now()}`;
      let uploadedProofUrl: string | null = null;

      // 1. Upload proof if transfer and file selected
      if (paymentMethod === 'TRANSFER' && proofBase64 && user) {
        const filePath = `orders/${user.id}/proof_${orderNumber}_${Date.now()}.jpg`;
        const cleanBase64 = proofBase64.replace(/^data:image\/\w+;base64,/, '');

        const { error: uploadErr } = await supabase.storage
          .from('dealer_documents')
          .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg', upsert: true });

        if (!uploadErr) {
          uploadedProofUrl = supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
        }
      }

      // 2. Insert Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          dealer_id: dealerData.id,
          order_number: orderNumber,
          total_amount: cartTotal,
          final_amount: finalAmount,
          status: 'PENDING', // Tahap 1: Pesan
          payment_method: paymentMethod,
          unique_code: paymentMethod === 'TRANSFER' ? uniqueCode : 0,
          payment_proof_url: uploadedProofUrl || (proofUri ? proofUri : null),
          payment_status: paymentMethod === 'TRANSFER' 
            ? (uploadedProofUrl ? 'menunggu_verifikasi' : 'menunggu_pembayaran')
            : 'cod_pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      const orderId = order.id;

      // 3. Insert Order Items
      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();

      const successMsg = paymentMethod === 'TRANSFER'
        ? 'Pesanan berhasil dibuat! Segera lakukan transfer manual dan upload bukti jika belum diupload.'
        : 'Pesanan berhasil dibuat dengan metode COD (Bayar di Tempat). Tim kami akan segera mengemas barang Anda.';

      Alert.alert('Pesanan Berhasil Dibuat', successMsg, [
        { text: 'Lihat Riwayat Pesanan', onPress: () => router.replace('/(dealer)/orders') }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Gagal Checkout', error.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Konfirmasi & Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Alamat Pengiriman */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="map-pin" size={18} color="#8ec44a" />
            <Text style={styles.sectionTitle}>Alamat Pengiriman Outlet</Text>
          </View>
          {isLoadingDealer ? (
            <ActivityIndicator size="small" color="#8ec44a" />
          ) : dealerData ? (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.boldText}>{dealerData.store_name}</Text>
              <Text style={styles.text}>{dealerData.address || 'Alamat toko lengkap terdaftar di sistem'}</Text>
            </View>
          ) : (
            <Text style={[styles.text, { color: '#ef4444' }]}>⚠️ Data Toko tidak ditemukan. Harap hubungi Admin.</Text>
          )}
        </View>

        {/* Daftar Produk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Produk ({items.length} Barang)</Text>
          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.sku || 'SKU Produk'}</Text>
                <Text style={styles.itemQty}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
              <Text style={styles.itemTotal}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
          ))}
        </View>

        {/* METODE PEMBAYARAN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>
          
          <View style={styles.paymentMethodsGrid}>
            {/* OPSI 1: TRANSFER MANUAL */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'TRANSFER' && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod('TRANSFER')}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'TRANSFER' && styles.radioCircleActive]}>
                  {paymentMethod === 'TRANSFER' && <View style={styles.radioDot} />}
                </View>
                <Feather name="credit-card" size={20} color={paymentMethod === 'TRANSFER' ? '#16a34a' : '#64748b'} />
                <Text style={[styles.methodTitle, paymentMethod === 'TRANSFER' && styles.methodTitleActive]}>
                  Transfer Bank Manual
                </Text>
              </View>
              <Text style={styles.methodSub}>Transfer ke rekening resmi perusahaan + 3 kode unik acak</Text>
            </TouchableOpacity>

            {/* OPSI 2: COD (BAYAR DI TEMPAT) */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'COD' && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod('COD')}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleActive]}>
                  {paymentMethod === 'COD' && <View style={styles.radioDot} />}
                </View>
                <Feather name="truck" size={20} color={paymentMethod === 'COD' ? '#16a34a' : '#64748b'} />
                <Text style={[styles.methodTitle, paymentMethod === 'COD' && styles.methodTitleActive]}>
                  COD (Bayar di Tempat)
                </Text>
              </View>
              <Text style={styles.methodSub}>Bayar tunai kepada kurir/sales saat barang pesanan tiba di toko</Text>
            </TouchableOpacity>
          </View>

          {/* DETAIL TRANSFER BANK JIKA DIPILIH */}
          {paymentMethod === 'TRANSFER' && (
            <View style={styles.transferDetailBox}>
              <Text style={styles.transferHeading}>Rekening Tujuan Transfer:</Text>
              
              <View style={styles.bankCard}>
                <Text style={styles.bankName}>Bank Central Asia (BCA)</Text>
                <Text style={styles.bankNumber}>8730-123-4567</Text>
                <Text style={styles.bankHolder}>a/n PT DAP Retail Indonesia</Text>
              </View>

              <View style={[styles.bankCard, { marginTop: 8 }]}>
                <Text style={styles.bankName}>Bank Mandiri</Text>
                <Text style={styles.bankNumber}>137-00-987654-1</Text>
                <Text style={styles.bankHolder}>a/n PT DAP Retail Indonesia</Text>
              </View>

              {/* Box 3 Digit Kode Unik Acak */}
              <View style={styles.uniqueCodeBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uniqueCodeTitle}>3 Kode Acak Transaksi:</Text>
                  <Text style={styles.uniqueCodeDesc}>Ditambahkan otomatis ke total bayar untuk verifikasi</Text>
                </View>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>+{uniqueCode}</Text>
                </View>
              </View>

              {/* Upload Bukti Pembayaran */}
              <Text style={[styles.transferHeading, { marginTop: 14 }]}>Upload Bukti Transfer (Opsional saat ini, bisa di riwayat):</Text>
              <TouchableOpacity style={styles.uploadProofBtn} onPress={pickProofImage}>
                {proofUri ? (
                  <View style={styles.proofPreviewWrap}>
                    <Image source={{ uri: proofUri }} style={styles.proofImg} contentFit="cover" />
                    <View style={styles.reselectBadge}>
                      <Text style={styles.reselectText}>Ganti Bukti</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadProofPlaceholder}>
                    <Feather name="upload-cloud" size={26} color="#8ec44a" />
                    <Text style={styles.uploadProofPrompt}>Pilih Foto Bukti Transfer</Text>
                    <Text style={styles.uploadProofSub}>Format JPG/PNG dari galeri HP</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* DETAIL COD JIKA DIPILIH */}
          {paymentMethod === 'COD' && (
            <View style={styles.codDetailBox}>
              <Feather name="check-circle" size={20} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={styles.codTitle}>Sistem Alur Pesanan COD:</Text>
                <Text style={styles.codText}>
                  1. Pesan ➔ 2. Pengemasan di Gudang ➔ 3. Pengiriman ke Outlet ➔ 4. COD Bayar Tunai di Toko.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* RINCIAN TAGIHAN */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal Produk</Text>
            <Text style={styles.paymentValue}>Rp {cartTotal.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Biaya Pengiriman</Text>
            <Text style={styles.paymentValue}>Gratis (Wilayah Toko)</Text>
          </View>

          {paymentMethod === 'TRANSFER' && (
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: '#d97706', fontWeight: 'bold' }]}>Kode Unik Transaksi</Text>
              <Text style={[styles.paymentValue, { color: '#d97706', fontWeight: 'bold' }]}>+ Rp {uniqueCode}</Text>
            </View>
          )}

          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total yang Harus Dibayar</Text>
            <Text style={styles.totalValue}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
          </View>
          {paymentMethod === 'TRANSFER' && (
            <Text style={styles.exactTransferNote}>
              * Pastikan transfer TEPAT sejumlah <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
            </Text>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.payBtn, loading && styles.payBtnDisabled]} 
          onPress={handleCreateOrder} 
          disabled={loading || !dealerData}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="check-circle" size={20} color="white" />
              <Text style={styles.payBtnText}>
                {paymentMethod === 'TRANSFER' ? 'Konfirmasi Transfer & Buat Pesanan' : 'Buat Pesanan (COD Bayar)'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#8ec44a',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16 },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  boldText: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 2 },
  text: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 2 },
  itemQty: { fontSize: 12, color: '#64748b' },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  paymentMethodsGrid: { marginTop: 12, gap: 10 },
  methodCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  methodCardActive: {
    borderColor: '#8ec44a',
    backgroundColor: '#f0fdf4',
  },
  methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: { borderColor: '#8ec44a' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8ec44a' },
  methodTitle: { fontSize: 14, fontWeight: '700', color: '#475569' },
  methodTitleActive: { color: '#15803d' },
  methodSub: { fontSize: 11, color: '#64748b', marginLeft: 28 },
  transferDetailBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transferHeading: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8 },
  bankCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankName: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  bankNumber: { fontSize: 16, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5, marginVertical: 2 },
  bankHolder: { fontSize: 11, color: '#64748b' },
  uniqueCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  uniqueCodeTitle: { fontSize: 12, fontWeight: 'bold', color: '#92400e' },
  uniqueCodeDesc: { fontSize: 10, color: '#b45309', marginTop: 1 },
  codeBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeBadgeText: { color: 'white', fontWeight: '900', fontSize: 15 },
  uploadProofBtn: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  uploadProofPlaceholder: { alignItems: 'center', padding: 14, gap: 4 },
  uploadProofPrompt: { fontSize: 12, fontWeight: '700', color: '#8ec44a' },
  uploadProofSub: { fontSize: 10, color: '#94a3b8' },
  proofPreviewWrap: { width: '100%', height: 110, position: 'relative' },
  proofImg: { width: '100%', height: '100%' },
  reselectBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reselectText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  codDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  codTitle: { fontSize: 12, fontWeight: 'bold', color: '#166534' },
  codText: { fontSize: 11, color: '#15803d', marginTop: 2, lineHeight: 16 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { fontSize: 13, color: '#64748b' },
  paymentValue: { fontSize: 13, color: '#334155', fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#8ec44a' },
  exactTransferNote: { fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  bottomBar: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  payBtn: {
    backgroundColor: '#8ec44a',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
