import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useSafeBottom } from '../../hooks/useSafeBottom';

export default function CheckoutScreen() {
  const safeBottom = useSafeBottom();
  const { items, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const [isLoadingDealer, setIsLoadingDealer] = useState(true);

  // Payment Method: 'TRANSFER' | 'COD' | 'KREDIT'
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'COD' | 'KREDIT'>('TRANSFER');
  // 3-digit random unique code for transfer verification (e.g. 100 - 999)
  const [uniqueCode, setUniqueCode] = useState(() => Math.floor(100 + Math.random() * 900));

  // Payment (CBD Bank & COD) Company Settings
  const [paymentSettings, setPaymentSettings] = useState<{
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    cbd_enabled?: boolean;
    cbd_term_label?: string;
    cbd_instructions?: string;
    cod_enabled: boolean;
    cod_term_days: number;
    cod_term_label: string;
    cod_max_amount: number;
    cod_policy_terms: string;
  }>({
    bank_name: 'BCA (Bank Central Asia)',
    bank_account_number: '829-019-8821',
    bank_account_name: 'PT DISTRIBUSI AKSESORIS PRIMA',
    cbd_enabled: true,
    cbd_term_label: 'Transfer Bank Manual (CBD - Cash Before Delivery)',
    cbd_instructions: 'Transfer ke rekening resmi perusahaan + 3 digit kode unik sebelum pesanan diproses dan dikirim.',
    cod_enabled: true,
    cod_term_days: 0,
    cod_term_label: 'Bayar Saat Terima Barang (H+0)',
    cod_max_amount: 10000000,
    cod_policy_terms: 'Pembayaran diserahkan kepada kurir pengantar saat barang tiba di toko.',
  });
  const codSettings = paymentSettings; // backward-compatibility alias

  // Proof of Transfer state
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  // Confirmation / Warning Popup state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchDealerData();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        setPaymentSettings(prev => ({
          ...prev,
          ...data,
        }));
      }
    } catch (e) {
      console.warn("Fetch payment_settings error:", e);
    }
  };

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

  // Credit Limit Calculations
  const isCreditEligible = Boolean(dealerData && (dealerData.is_credit_eligible || dealerData.credit_status === 'ACTIVE' || (dealerData.credit_limit && dealerData.credit_limit > 0)));
  const creditLimit = Number(dealerData?.credit_limit || 0);
  const creditUsed = Number(dealerData?.outstanding_balance || 0);
  const remainingCredit = Math.max(0, creditLimit - creditUsed);
  const creditTermDays = dealerData?.credit_term_days || 15;

  // Dealer Khusus & Special Discount Calculations
  const isSpecialDealer = Boolean(dealerData?.is_special_dealer);
  const specialDiscountPercent = isSpecialDealer ? Number(dealerData?.special_discount_percentage || 0) : 0;
  const specialDealerTier = dealerData?.special_dealer_tier || 'VIP';
  const specialPricingNotes = dealerData?.special_pricing_notes || '';
  const specialAccess = (dealerData?.special_access_permissions && typeof dealerData.special_access_permissions === 'object') ? dealerData.special_access_permissions : {};
  const specialDiscountAmount = specialDiscountPercent > 0 ? Math.round(cartTotal * (specialDiscountPercent / 100)) : 0;
  const totalAfterDiscount = Math.max(0, cartTotal - specialDiscountAmount);
  const isCreditInsufficient = isCreditEligible && totalAfterDiscount > remainingCredit;

  const finalAmount = paymentMethod === 'TRANSFER' ? totalAfterDiscount + uniqueCode : totalAfterDiscount;

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

  const handlePromptConfirmation = () => {
    if (!dealerData) {
      Alert.alert('Data Toko Belum Siap', 'Data toko/dealer tidak ditemukan. Pastikan akun sudah disetujui Admin.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Keranjang Kosong', 'Tidak ada produk yang dipesan.');
      return;
    }

    if (paymentMethod === 'COD') {
      if (!codSettings.cod_enabled) {
        Alert.alert('COD Dinonaktifkan', 'Metode pembayaran COD sedang tidak tersedia sesuai kebijakan perusahaan.');
        return;
      }
      if (codSettings.cod_max_amount > 0 && totalAfterDiscount > codSettings.cod_max_amount) {
        Alert.alert(
          'Batas COD Terlampaui',
          `Total pesanan (Rp ${totalAfterDiscount.toLocaleString('id-ID')}) melebihi batas maksimal transaksi COD sebesar Rp ${codSettings.cod_max_amount.toLocaleString('id-ID')}. Silakan gunakan Transfer Bank atau hubungi Admin.`
        );
        return;
      }
    }

    if (paymentMethod === 'KREDIT') {
      if (!isCreditEligible) {
        Alert.alert(
          'Akses Kredit Belum Aktif',
          'Fasilitas limit kredit hanya dapat digunakan oleh dealer mitra yang telah disetujui Admin. Silakan hubungi Sales PIC atau Admin.'
        );
        return;
      }
      if (isCreditInsufficient) {
        Alert.alert(
          'Sisa Limit Tidak Mencukupi',
          `Total pesanan Anda (Rp ${totalAfterDiscount.toLocaleString('id-ID')}) melebihi sisa plafon kredit yang tersedia (Rp ${remainingCredit.toLocaleString('id-ID')}). Silakan kurangi belanja atau gunakan metode Transfer Bank.`
        );
        return;
      }
    }

    setShowConfirmModal(true);
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

      // 2. Insert Order with discount_amount
      const orderPayload: any = {
        dealer_id: dealerData.id,
        order_number: orderNumber,
        total_amount: cartTotal,
        discount_amount: specialDiscountAmount,
        final_amount: finalAmount,
        status: 'PENDING', // Tahap 1: Pesan
        payment_method: paymentMethod,
        unique_code: paymentMethod === 'TRANSFER' ? uniqueCode : 0,
        payment_proof_url: uploadedProofUrl || (proofUri ? proofUri : null),
        payment_status: paymentMethod === 'TRANSFER' 
          ? (uploadedProofUrl ? 'menunggu_verifikasi' : 'menunggu_pembayaran')
          : paymentMethod === 'COD'
          ? 'cod_pending'
          : 'tempo_berjalan',
      };

      let { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (orderError && orderError.message?.includes('discount_amount')) {
        delete orderPayload.discount_amount;
        const fb = await supabase.from('orders').insert(orderPayload).select('id').single();
        order = fb.data;
        orderError = fb.error;
      }

      if (orderError || !order) throw (orderError || new Error('Gagal membuat data pesanan'));
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

      // 4. Update outstanding_balance if payment method is KREDIT
      if (paymentMethod === 'KREDIT') {
        const newOutstanding = creditUsed + totalAfterDiscount;
        await supabase
          .from('dealers')
          .update({ outstanding_balance: newOutstanding })
          .eq('id', dealerData.id);
      }

      setShowConfirmModal(false);
      clearCart();

      const successMsg = paymentMethod === 'TRANSFER'
        ? 'Pesanan berhasil dibuat! Segera lakukan transfer manual dan upload bukti jika belum diupload.'
        : paymentMethod === 'COD'
        ? `Pesanan berhasil dibuat dengan metode COD (${codSettings.cod_term_label})! Tim kami akan segera mengemas barang Anda.`
        : `Pesanan berhasil dibuat dengan Fasilitas Kredit / Tempo (${creditTermDays} Hari)! Sisa limit kredit Anda telah disesuaikan.`;

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

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

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
        {/* BANNER DEALER KHUSUS (JIKA MEMILIKI HAK KHUSUS) */}
        {isSpecialDealer && (
          <View style={styles.specialDealerBanner}>
            <View style={styles.specialDealerBadgeRow}>
              <View style={styles.specialDealerStarBadge}>
                <Feather name="award" size={13} color="#b45309" />
                <Text style={styles.specialDealerStarText}>DEALER KHUSUS ({specialDealerTier})</Text>
              </View>
              {specialDiscountPercent > 0 && (
                <View style={styles.specialDiscountPill}>
                  <Text style={styles.specialDiscountPillText}>Hemat {specialDiscountPercent}%</Text>
                </View>
              )}
            </View>
            <Text style={styles.specialDealerBannerTitle}>Akun Mitra Istimewa Terverifikasi</Text>
            <Text style={styles.specialDealerBannerDesc}>
              {specialPricingNotes 
                ? specialPricingNotes 
                : `Anda mendapatkan ketentuan harga khusus diskon ${specialDiscountPercent}%, prioritas stok, dan fasilitas tempo kemitraan eksklusif.`}
            </Text>
            <View style={styles.specialPrivilegesRow}>
              {Boolean(specialAccess?.prioritas_stok) && (
                <View style={styles.privilegeMiniBadge}>
                  <Feather name="zap" size={11} color="#16a34a" />
                  <Text style={styles.privilegeMiniText}>Prioritas Stok</Text>
                </View>
              )}
              {Boolean(specialAccess?.bebas_min_order) && (
                <View style={styles.privilegeMiniBadge}>
                  <Feather name="check" size={11} color="#2563eb" />
                  <Text style={styles.privilegeMiniText}>Bebas Min Order</Text>
                </View>
              )}
              {Boolean(specialAccess?.harga_distributor) && (
                <View style={styles.privilegeMiniBadge}>
                  <Feather name="tag" size={11} color="#d97706" />
                  <Text style={styles.privilegeMiniText}>Harga Tier Khusus</Text>
                </View>
              )}
            </View>
          </View>
        )}

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
                <Text style={styles.itemName}>{item.name || item.sku || 'SKU Produk'}</Text>
                <Text style={styles.itemQty}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
              <Text style={styles.itemTotal}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
          ))}
        </View>

        {/* METODE PEMBAYARAN */}
        {/* METODE PEMBAYARAN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>
          
          <View style={styles.paymentMethodsGrid}>
            {/* OPSI 1: TRANSFER MANUAL (CBD) */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'TRANSFER' && styles.methodCardActive,
                paymentSettings.cbd_enabled === false && { opacity: 0.5 },
              ]}
              onPress={() => (paymentSettings.cbd_enabled ?? true) && setPaymentMethod('TRANSFER')}
              disabled={paymentSettings.cbd_enabled === false}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'TRANSFER' && styles.radioCircleActive]}>
                  {paymentMethod === 'TRANSFER' && <View style={styles.radioDot} />}
                </View>
                <Feather name="credit-card" size={20} color={paymentMethod === 'TRANSFER' ? '#16a34a' : '#64748b'} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
                  <Text style={[styles.methodTitle, paymentMethod === 'TRANSFER' && styles.methodTitleActive]}>
                    {paymentSettings.cbd_term_label || 'Transfer Bank Manual (CBD)'}
                  </Text>
                  <View style={[styles.termBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                    <Text style={[styles.termBadgeText, { color: '#1d4ed8' }]}>CBD</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.methodSub}>
                {paymentSettings.cbd_instructions || 'Transfer ke rekening resmi perusahaan + 3 kode unik acak'}
              </Text>
            </TouchableOpacity>

            {/* OPSI 2: COD (BAYAR DI TEMPAT DENGAN PENGATURAN TERMIN) */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'COD' && styles.methodCardActive,
                !codSettings.cod_enabled && { opacity: 0.5 },
              ]}
              onPress={() => codSettings.cod_enabled && setPaymentMethod('COD')}
              disabled={!codSettings.cod_enabled}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleActive]}>
                  {paymentMethod === 'COD' && <View style={styles.radioDot} />}
                </View>
                <Feather name="truck" size={20} color={paymentMethod === 'COD' ? '#16a34a' : '#64748b'} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
                  <Text style={[styles.methodTitle, paymentMethod === 'COD' && styles.methodTitleActive]}>
                    COD (Bayar di Tempat)
                  </Text>
                  <View style={styles.termBadge}>
                    <Text style={styles.termBadgeText}>{codSettings.cod_term_days === 0 ? 'H+0' : `H+${codSettings.cod_term_days}`}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.methodSub}>
                {codSettings.cod_term_label} • {codSettings.cod_max_amount > 0 ? `Maks. Rp ${(codSettings.cod_max_amount / 1000000).toFixed(0)}Jt` : 'Sesuai Kebijakan'}
              </Text>
            </TouchableOpacity>

            {/* OPSI 3: KREDIT / LIMIT DEALER (TOP) */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                paymentMethod === 'KREDIT' && styles.methodCardActive,
                (!isCreditEligible || isCreditInsufficient) && styles.methodCardDisabled,
              ]}
              onPress={() => {
                if (!isCreditEligible) {
                  Alert.alert(
                    'Akses Kredit Belum Aktif',
                    'Akun Anda berstatus reguler. Fasilitas limit kredit tempo (TOP) hanya dapat digunakan oleh dealer mitra yang telah disetujui Admin.'
                  );
                  return;
                }
                if (isCreditInsufficient) {
                  Alert.alert(
                    'Sisa Limit Tidak Mencukupi',
                    `Total pesanan (Rp ${cartTotal.toLocaleString('id-ID')}) melebihi sisa limit kredit Anda (Rp ${remainingCredit.toLocaleString('id-ID')}).`
                  );
                  return;
                }
                setPaymentMethod('KREDIT');
              }}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radioCircle, paymentMethod === 'KREDIT' && styles.radioCircleActive]}>
                  {paymentMethod === 'KREDIT' && <View style={styles.radioDot} />}
                </View>
                <Feather name="file-text" size={20} color={paymentMethod === 'KREDIT' ? '#7c3aed' : '#64748b'} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
                  <Text style={[styles.methodTitle, paymentMethod === 'KREDIT' && { color: '#7c3aed' }]}>
                    Kredit / Tempo (TOP)
                  </Text>
                  {isCreditEligible ? (
                    <View style={styles.creditBadgeActive}>
                      <Text style={styles.creditBadgeActiveText}>Tempo {creditTermDays} Hari</Text>
                    </View>
                  ) : (
                    <View style={styles.creditBadgeLocked}>
                      <Feather name="lock" size={10} color="#64748b" />
                      <Text style={styles.creditBadgeLockedText}>Khusus Mitra</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.methodSub}>
                {isCreditEligible 
                  ? `Sisa Limit: Rp ${remainingCredit.toLocaleString('id-ID')} (Plafon Rp ${creditLimit.toLocaleString('id-ID')})`
                  : 'Fasilitas kredit khusus dealer mitra dengan persetujuan Admin'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* DETAIL REKENING JIKA TRANSFER MANUAL */}
          {paymentMethod === 'TRANSFER' && (
            <View style={styles.transferDetailBox}>
              <Text style={styles.transferHeading}>Rekening Tujuan Transfer</Text>
              <View style={styles.bankCard}>
                <Feather name="briefcase" size={20} color="#8ec44a" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bankName}>{paymentSettings.bank_name || 'BCA (Bank Central Asia)'}</Text>
                  <Text style={styles.bankNumber}>{paymentSettings.bank_account_number || '829-019-8821'}</Text>
                  <Text style={styles.bankHolder}>a.n. {paymentSettings.bank_account_name || 'PT DISTRIBUSI AKSESORIS PRIMA'}</Text>
                </View>
              </View>

              {/* INFO KODE UNIK */}
              <View style={styles.uniqueCodeBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uniqueCodeTitle}>Kode Unik Pembayaran Otomatis</Text>
                  <Text style={styles.uniqueCodeDesc}>
                    Wajib transfer sesuai 3 digit kode unik di bawah ini agar diverifikasi otomatis:
                  </Text>
                </View>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>+{uniqueCode}</Text>
                </View>
              </View>

              {/* UPLOAD BUKTI TRANSFER */}
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.transferHeading, { marginBottom: 6 }]}>Upload Bukti Transfer (Opsional)</Text>
                <TouchableOpacity style={styles.uploadProofBtn} onPress={pickProofImage}>
                  {proofUri ? (
                    <View style={styles.proofPreviewWrap}>
                      <Image source={{ uri: proofUri }} style={styles.proofImg} contentFit="cover" />
                      <View style={styles.reselectBadge}>
                        <Text style={styles.reselectText}>Ganti Foto</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadProofPlaceholder}>
                      <Feather name="upload-cloud" size={24} color="#8ec44a" />
                      <Text style={styles.uploadProofPrompt}>Pilih Foto Bukti Transfer</Text>
                      <Text style={styles.uploadProofSub}>Bisa diunggah nanti di Riwayat Pesanan</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* DETAIL KETENTUAN COD */}
          {paymentMethod === 'COD' && (
            <View style={styles.codDetailBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="truck" size={18} color="#166534" />
                <Text style={styles.codTitle}>Ketentuan Termin COD ({codSettings.cod_term_label})</Text>
              </View>
              <Text style={styles.codText}>{codSettings.cod_policy_terms}</Text>
              {codSettings.cod_max_amount > 0 && (
                <View style={styles.codLimitWarning}>
                  <Feather name="info" size={12} color="#92400e" />
                  <Text style={styles.codLimitWarningText}>
                    Batas transaksi COD: Rp {codSettings.cod_max_amount.toLocaleString('id-ID')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* DETAIL KREDIT / TEMPO */}
          {paymentMethod === 'KREDIT' && isCreditEligible && (
            <View style={styles.creditDetailBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Feather name="award" size={18} color="#6d28d9" />
                <Text style={styles.creditTitle}>Fasilitas Kredit Mitra B2B (TOP)</Text>
              </View>
              <View style={styles.creditStatsRow}>
                <View style={styles.creditStatItem}>
                  <Text style={styles.creditStatLabel}>Plafon Total</Text>
                  <Text style={styles.creditStatVal}>Rp {creditLimit.toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.creditStatItem}>
                  <Text style={styles.creditStatLabel}>Terpakai</Text>
                  <Text style={[styles.creditStatVal, { color: '#ef4444' }]}>Rp {creditUsed.toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.creditStatItem}>
                  <Text style={styles.creditStatLabel}>Sisa Limit</Text>
                  <Text style={[styles.creditStatVal, { color: '#16a34a' }]}>Rp {remainingCredit.toLocaleString('id-ID')}</Text>
                </View>
              </View>
              <View style={styles.creditTenorBox}>
                <Feather name="calendar" size={14} color="#6d28d9" />
                <Text style={styles.creditTenorText}>
                  Jatuh tempo pelunasan: <Text style={{ fontWeight: 'bold' }}>{creditTermDays} hari</Text> sejak barang dikirim.
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

          {specialDiscountAmount > 0 && (
            <View style={styles.paymentRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="tag" size={14} color="#16a34a" />
                <Text style={[styles.paymentLabel, { color: '#16a34a', fontWeight: '700' }]}>
                  Diskon Khusus ({specialDiscountPercent}%)
                </Text>
              </View>
              <Text style={[styles.paymentValue, { color: '#16a34a', fontWeight: '800' }]}>
                - Rp {specialDiscountAmount.toLocaleString('id-ID')}
              </Text>
            </View>
          )}

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

          {specialDiscountAmount > 0 && (
            <Text style={[styles.exactTransferNote, { color: '#16a34a', marginTop: 4 }]}>
              ✨ Anda hemat <Text style={{ fontWeight: 'bold' }}>Rp {specialDiscountAmount.toLocaleString('id-ID')}</Text> melalui program Dealer Khusus!
            </Text>
          )}

          {paymentMethod === 'TRANSFER' && (
            <Text style={styles.exactTransferNote}>
              * Pastikan transfer TEPAT sejumlah <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
            </Text>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={[styles.bottomBar, { paddingBottom: safeBottom }]}>
        <TouchableOpacity 
          style={[styles.payBtn, loading && styles.payBtnDisabled]} 
          onPress={handlePromptConfirmation} 
          disabled={loading || !dealerData}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="check-circle" size={20} color="white" />
              <Text style={styles.payBtnText}>
                {paymentMethod === 'TRANSFER' 
                  ? 'Konfirmasi Transfer & Buat Pesanan' 
                  : paymentMethod === 'COD'
                  ? `Buat Pesanan (COD ${codSettings.cod_term_days === 0 ? 'H+0' : 'H+' + codSettings.cod_term_days})`
                  : `Buat Pesanan (Kredit ${creditTermDays} Hari)`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* POPUP PERINGATAN & KONFIRMASI PESANAN SEBELUM DIPROSES */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) setShowConfirmModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            {/* Warning Icon Badge */}
            <View style={styles.modalIconWrap}>
              <View style={[
                styles.warningCircle, 
                paymentMethod === 'TRANSFER' && styles.transferWarningCircle,
                paymentMethod === 'KREDIT' && { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }
              ]}>
                <Feather 
                  name={paymentMethod === 'TRANSFER' ? 'alert-triangle' : paymentMethod === 'KREDIT' ? 'award' : 'check-circle'} 
                  size={32} 
                  color={paymentMethod === 'TRANSFER' ? '#d97706' : paymentMethod === 'KREDIT' ? '#7c3aed' : '#16a34a'} 
                />
              </View>
            </View>

            <Text style={styles.confirmModalTitle}>
              {paymentMethod === 'TRANSFER' 
                ? 'Peringatan Transfer Bank' 
                : paymentMethod === 'KREDIT'
                ? `Konfirmasi Kredit (TOP ${creditTermDays} Hari)`
                : 'Konfirmasi Pesanan COD'}
            </Text>
            <Text style={styles.confirmModalSubtitle}>
              {paymentMethod === 'TRANSFER'
                ? 'Harap periksa dan pastikan kembali data transfer Anda sebelum melanjutkan pembayaran.'
                : paymentMethod === 'KREDIT'
                ? `Harap periksa kembali detail pesanan tempo ${creditTermDays} hari sebelum diproses gudang.`
                : 'Harap periksa kembali seluruh detail order sebelum diproses oleh sistem & gudang.'}
            </Text>

            {/* Peringatan Khusus Data Transfer */}
            {paymentMethod === 'TRANSFER' ? (
              <View style={styles.transferAlertCard}>
                <View style={styles.transferAlertHeader}>
                  <Feather name="alert-circle" size={18} color="#b45309" />
                  <Text style={styles.transferAlertTitle}>PASTIKAN KEMBALI DATA TRANSFER:</Text>
                </View>
                <View style={styles.transferAlertItem}>
                  <Text style={styles.transferAlertBullet}>1.</Text>
                  <Text style={styles.transferAlertText}>
                    <Text style={{ fontWeight: 'bold' }}>Rekening Resmi Perusahaan:</Text> Transfer hanya ke <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{paymentSettings.bank_name || 'BCA'} {paymentSettings.bank_account_number || '829-019-8821'}</Text> a.n. <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{paymentSettings.bank_account_name || 'PT DISTRIBUSI AKSESORIS PRIMA'}</Text>.
                  </Text>
                </View>
                <View style={styles.transferAlertItem}>
                  <Text style={styles.transferAlertBullet}>2.</Text>
                  <Text style={styles.transferAlertText}>
                    <Text style={{ fontWeight: 'bold' }}>Nominal Transfer Wajib Tepat:</Text> Wajib transfer tepat <Text style={{ fontWeight: 'bold', color: '#b45309' }}>Rp {finalAmount.toLocaleString('id-ID')}</Text> (termasuk 3 digit kode unik <Text style={{ fontWeight: 'bold' }}>+{uniqueCode}</Text>). <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>JANGAN DIBULATKAN</Text> agar sistem verifikasi otomatis berhasil.
                  </Text>
                </View>
                <View style={styles.transferAlertItem}>
                  <Text style={styles.transferAlertBullet}>3.</Text>
                  <Text style={styles.transferAlertText}>
                    <Text style={{ fontWeight: 'bold' }}>Simpan Bukti Pembayaran:</Text> Simpan struk ATM / screenshot m-banking yang jelas untuk diunggah sebagai bukti sah transaksi.
                  </Text>
                </View>
              </View>
            ) : (
              /* Warning Notice Banner COD */
              <View style={styles.warningNoticeBox}>
                <Feather name="info" size={16} color="#15803d" style={{ marginTop: 2 }} />
                <Text style={[styles.warningNoticeText, { color: '#166534' }]}>
                  Pesanan COD akan disiapkan dan dikirim ke alamat toko Anda. Siapkan uang tunai pas saat kurir tiba.
                </Text>
              </View>
            )}

            {/* Scrollable Summary Details */}
            <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
              {/* Box Rincian Rekening & Total Transfer Khusus TRANSFER */}
              {paymentMethod === 'TRANSFER' && (
                <View style={styles.transferHighlightBox}>
                  <Text style={styles.transferHighlightTitle}>Data Rekening Tujuan Transfer</Text>
                  <View style={styles.transferBankRow}>
                    <Feather name="briefcase" size={18} color="#0284c7" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName}>{paymentSettings.bank_name || 'BCA (Bank Central Asia)'}</Text>
                      <Text style={styles.bankNumber}>{paymentSettings.bank_account_number || '829-019-8821'}</Text>
                      <Text style={styles.bankHolder}>a.n. {paymentSettings.bank_account_name || 'PT DISTRIBUSI AKSESORIS PRIMA'}</Text>
                    </View>
                  </View>

                  <View style={styles.transferAmountRow}>
                    <View>
                      <Text style={styles.transferAmountLabel}>Total Wajib Ditransfer:</Text>
                      <Text style={styles.transferAmountSub}>Termasuk kode unik (+Rp {uniqueCode})</Text>
                    </View>
                    <Text style={styles.transferAmountValue}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
                  </View>

                  <View style={styles.proofCheckBadge}>
                    <Feather
                      name={proofUri ? 'check-circle' : 'alert-circle'}
                      size={13}
                      color={proofUri ? '#16a34a' : '#d97706'}
                    />
                    <Text style={[styles.proofCheckText, { color: proofUri ? '#16a34a' : '#d97706' }]}>
                      {proofUri
                        ? 'Bukti transfer sudah dilampirkan dan siap diunggah'
                        : 'Bukti transfer belum dilampirkan (dapat diunggah nanti di Riwayat Pesanan)'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Shipping Destination */}
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionLabel}>Tujuan Pengiriman Outlet</Text>
                <View style={styles.summaryAddressBox}>
                  <Feather name="map-pin" size={15} color="#8ec44a" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryStoreName}>{dealerData?.store_name || 'Toko Anda'}</Text>
                    <Text style={styles.summaryAddressText} numberOfLines={2}>
                      {dealerData?.address || 'Alamat toko terdaftar di sistem'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Items Breakdown */}
              <View style={styles.summarySection}>
                <View style={styles.summaryHeaderRow}>
                  <Text style={styles.summarySectionLabel}>Daftar Produk Pesanan</Text>
                  <Text style={styles.summaryItemsCount}>
                    {totalQuantity} pcs ({items.length} item)
                  </Text>
                </View>
                <View style={styles.summaryItemsContainer}>
                  {items.map((item, idx) => (
                    <View key={item.id || idx} style={styles.summaryItemRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.summaryItemName} numberOfLines={1}>
                          {item.name || item.sku || `Produk #${idx + 1}`}
                        </Text>
                        <Text style={styles.summaryItemSub}>
                          {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      <Text style={styles.summaryItemPrice}>
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Special Dealer Discount In Modal */}
              {specialDiscountAmount > 0 && (
                <View style={styles.modalDiscountBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="award" size={14} color="#b45309" />
                    <Text style={styles.modalDiscountLabel}>Diskon Dealer Khusus ({specialDiscountPercent}%):</Text>
                  </View>
                  <Text style={styles.modalDiscountVal}>- Rp {specialDiscountAmount.toLocaleString('id-ID')}</Text>
                </View>
              )}

              {/* Total Billing for COD */}
              {paymentMethod === 'COD' && (
                <View style={styles.summaryTotalBox}>
                  <View>
                    <Text style={styles.summaryTotalLabel}>Total yang Harus Dibayar (COD):</Text>
                    <Text style={styles.summarySubNote}>{codSettings.cod_term_label}</Text>
                  </View>
                  <Text style={styles.summaryTotalValue}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
                </View>
              )}

              {/* Total Billing for KREDIT */}
              {paymentMethod === 'KREDIT' && (
                <View style={[styles.summaryTotalBox, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}>
                  <View>
                    <Text style={[styles.summaryTotalLabel, { color: '#6d28d9' }]}>Total Tagihan Kredit (TOP):</Text>
                    <Text style={styles.summarySubNote}>Jatuh tempo {creditTermDays} hari sejak barang dikirim</Text>
                  </View>
                  <Text style={[styles.summaryTotalValue, { color: '#7c3aed' }]}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowConfirmModal(false)}
                disabled={loading}
              >
                <Feather name="arrow-left" size={15} color="#475569" />
                <Text style={styles.btnSecondaryText}>Cek Kembali Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
                onPress={handleCreateOrder}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather name="check" size={17} color="white" />
                    <Text style={styles.btnPrimaryText}>
                      {paymentMethod === 'TRANSFER' ? 'Data Sesuai, Lanjutkan' : 'Ya, Proses Pesanan'}
                    </Text>
                  </>
                )}
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
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  codTitle: { fontSize: 12, fontWeight: 'bold', color: '#166534' },
  codText: { fontSize: 11, color: '#15803d', marginTop: 2, lineHeight: 16 },
  codLimitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  codLimitWarningText: { fontSize: 10, fontWeight: 'bold', color: '#92400e' },
  termBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  termBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
  creditBadgeActive: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  creditBadgeActiveText: { fontSize: 10, fontWeight: 'bold', color: '#6d28d9' },
  creditBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  creditBadgeLockedText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  methodCardDisabled: {
    opacity: 0.7,
  },
  creditDetailBox: {
    backgroundColor: '#f5f3ff',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  creditTitle: { fontSize: 12, fontWeight: 'bold', color: '#6d28d9' },
  creditStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ede9fe',
    marginVertical: 8,
  },
  creditStatItem: { alignItems: 'center' },
  creditStatLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  creditStatVal: { fontSize: 11, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
  creditTenorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditTenorText: { fontSize: 11, color: '#6d28d9', flex: 1, lineHeight: 15 },
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

  /* MODAL PERINGATAN & KONFIRMASI */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  confirmModalBox: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  warningCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  transferWarningCircle: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  transferAlertCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  transferAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  transferAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.3,
  },
  transferAlertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  transferAlertBullet: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b45309',
  },
  transferAlertText: {
    fontSize: 11,
    color: '#78350f',
    flex: 1,
    lineHeight: 16,
  },
  transferHighlightBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  transferHighlightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  transferBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 10,
  },
  transferAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  transferAmountLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
  },
  transferAmountSub: {
    fontSize: 10,
    color: '#15803d',
    marginTop: 1,
  },
  transferAmountValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  warningNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef08a',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  warningNoticeText: {
    fontSize: 11,
    color: '#92400e',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  summaryScroll: {
    maxHeight: 260,
    marginBottom: 14,
  },
  summarySection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summarySectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryItemsCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8ec44a',
  },
  summaryAddressBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  summaryStoreName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryAddressText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  summaryItemsContainer: {
    gap: 6,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  summaryItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  summaryItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryMethodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryMethodText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  proofCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  proofCheckText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  summaryTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  summaryTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  summarySubNote: {
    fontSize: 10,
    color: '#15803d',
    marginTop: 1,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16a34a',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  btnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#8ec44a',
  },
  btnPrimaryDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'white',
  },
  // Special Dealer Styles
  specialDealerBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  specialDealerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specialDealerStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialDealerStarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  specialDiscountPill: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  specialDiscountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
  },
  specialDealerBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 4,
  },
  specialDealerBannerDesc: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 10,
  },
  specialPrivilegesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  privilegeMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  privilegeMiniText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350f',
  },
  modalDiscountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  modalDiscountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  modalDiscountVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
  },
});
