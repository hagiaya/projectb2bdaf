import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Image as RNImage
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import { useSafeBottom } from '../../hooks/useSafeBottom';

interface ReturnItemSKU {
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  reason?: string;
  condition?: string;
  photo_url?: string;
}

interface ReplacementItemSKU {
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface ReturnTicket {
  id: string;
  order_id?: string;
  dealer_id?: string;
  return_number: string;
  reason: string;
  status: string;
  created_at: string;
  return_items?: ReturnItemSKU[];
  dealer_courier?: string;
  dealer_shipping_receipt_no?: string;
  dealer_shipping_photo_url?: string;
  dealer_shipped_at?: string;
  admin_received_at?: string;
  admin_notes?: string;
  replacement_items?: ReplacementItemSKU[];
  replacement_courier?: string;
  replacement_shipping_receipt_no?: string;
  replacement_shipping_photo_url?: string;
  replacement_shipped_at?: string;
  dealer_received_at?: string;
  completed_at?: string;
  orders?: {
    order_number: string;
    final_amount?: number;
  };
}

interface OrderOption {
  id: string;
  order_number: string;
  created_at: string;
}

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  image_url?: string;
}

export default function ReturnsScreen() {
  const safeBottom = useSafeBottom();
  const [returns, setReturns] = useState<ReturnTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [dealerStoreName, setDealerStoreName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Master products for quick SKU selection
  const [productList, setProductList] = useState<ProductOption[]>([]);
  const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);

  // ==========================================
  // MODAL 1: AJUKAN RETUR BARU (STEP 1)
  // ==========================================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [generalReason, setGeneralReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [returnItemsInput, setReturnItemsInput] = useState<ReturnItemSKU[]>([
    { sku: '', name: '', quantity: 1, condition: 'Cacat Pabrik / Mati Total', reason: '' }
  ]);
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [activeItemIndexForProductPicker, setActiveItemIndexForProductPicker] = useState<number | null>(null);

  // ==========================================
  // MODAL 2: UPLOAD RESI KIRIM DEALER (STEP 2)
  // ==========================================
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingTicket, setShippingTicket] = useState<ReturnTicket | null>(null);
  const [dealerCourier, setDealerCourier] = useState('J&T Express');
  const [dealerReceiptNo, setDealerReceiptNo] = useState('');
  const [dealerPhotoUri, setDealerPhotoUri] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // ==========================================
  // MODAL 3: DETAIL LENGKAP & 7-STEP TRACKER
  // ==========================================
  const [selectedReturn, setSelectedReturn] = useState<ReturnTicket | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [completingReturn, setCompletingReturn] = useState(false);

  useEffect(() => {
    fetchReturns();
    fetchCatalogProducts();

    // Subscribe to realtime updates on returns table
    const channel = supabase
      .channel('dealer-returns-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        fetchReturns(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCatalogProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, sku, name, image_url')
        .limit(100);
      if (data) setProductList(data);
    } catch (e) {
      console.error('Fetch products err:', e);
    }
  };

  const normalizeTicket = (row: any): ReturnTicket => {
    let parsedMetadata: any = {};
    if (typeof row.reason === 'string' && row.reason.trim().startsWith('{')) {
      try {
        parsedMetadata = JSON.parse(row.reason);
      } catch (e) {
        parsedMetadata = {};
      }
    }

    const returnItems = row.return_items && Array.isArray(row.return_items) && row.return_items.length > 0
      ? row.return_items
      : parsedMetadata.return_items || [];

    const replacementItems = row.replacement_items && Array.isArray(row.replacement_items) && row.replacement_items.length > 0
      ? row.replacement_items
      : parsedMetadata.replacement_items || [];

    return {
      ...row,
      status: row.status || 'REQUESTED',
      reason: parsedMetadata.summary || row.reason || 'Klaim Retur Barang',
      return_items: returnItems,
      dealer_courier: row.dealer_courier || parsedMetadata.dealer_courier,
      dealer_shipping_receipt_no: row.dealer_shipping_receipt_no || parsedMetadata.dealer_shipping_receipt_no,
      dealer_shipping_photo_url: row.dealer_shipping_photo_url || parsedMetadata.dealer_shipping_photo_url,
      dealer_shipped_at: row.dealer_shipped_at || parsedMetadata.dealer_shipped_at,
      admin_received_at: row.admin_received_at || parsedMetadata.admin_received_at,
      admin_notes: row.admin_notes || parsedMetadata.admin_notes,
      replacement_items: replacementItems,
      replacement_courier: row.replacement_courier || parsedMetadata.replacement_courier,
      replacement_shipping_receipt_no: row.replacement_shipping_receipt_no || parsedMetadata.replacement_shipping_receipt_no,
      replacement_shipping_photo_url: row.replacement_shipping_photo_url || parsedMetadata.replacement_shipping_photo_url,
      replacement_shipped_at: row.replacement_shipped_at || parsedMetadata.replacement_shipped_at,
      dealer_received_at: row.dealer_received_at || parsedMetadata.dealer_received_at,
      completed_at: row.completed_at || parsedMetadata.completed_at,
    };
  };

  const fetchReturns = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let currentDealerId = null;

      if (user) {
        const { data: dealer } = await supabase
          .from('dealers')
          .select('id, store_name')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (dealer?.id) {
          currentDealerId = dealer.id;
          setDealerId(dealer.id);
          setDealerStoreName(dealer.store_name || 'Toko Dealer');
        }
      }

      let query = supabase
        .from('returns')
        .select('*, orders(order_number, final_amount)')
        .order('created_at', { ascending: false });

      if (currentDealerId) {
        query = query.eq('dealer_id', currentDealerId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setReturns(data.map(normalizeTicket));
      } else {
        setReturns([]);
      }

      // Fetch user's orders for return submission dropdown
      if (currentDealerId) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, order_number, created_at')
          .eq('dealer_id', currentDealerId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (ordersData) {
          setOrderOptions(ordersData as OrderOption[]);
        }
      }
    } catch (err) {
      console.error('Fetch returns error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // STEP 1: AJUKAN RETUR BARU
  // ==========================================
  const handleAddItemRow = () => {
    setReturnItemsInput([
      ...returnItemsInput,
      { sku: '', name: '', quantity: 1, condition: 'Cacat Pabrik / Mati Total', reason: '' }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (returnItemsInput.length === 1) return;
    setReturnItemsInput(returnItemsInput.filter((_, idx) => idx !== index));
  };

  const handleSelectProduct = (product: ProductOption, index: number) => {
    const updated = [...returnItemsInput];
    updated[index] = {
      ...updated[index],
      product_id: product.id,
      sku: product.sku || `SKU-${product.id.slice(0, 5)}`,
      name: product.name,
    };
    setReturnItemsInput(updated);
    setActiveItemIndexForProductPicker(null);
  };

  const handleCreateReturn = async () => {
    // Validasi input
    const validItems = returnItemsInput.filter(item => item.sku.trim() || item.name.trim());
    if (validItems.length === 0) {
      Alert.alert('Data Belum Lengkap', 'Harap isi minimal 1 barang (SKU / Nama Produk dan Quantity) yang ingin diretur.');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const returnNumber = `RET/${dateStr}/${randomCode}`;

      const cleanItems = validItems.map(item => ({
        product_id: item.product_id,
        sku: item.sku.trim() || 'SKU-DAP',
        name: item.name.trim() || 'Produk DAP',
        quantity: Math.max(1, Number(item.quantity) || 1),
        condition: item.condition || 'Rusak/Cacat',
        reason: item.reason || generalReason || 'Klaim Retur'
      }));

      const summaryReason = generalReason.trim() || `Retur ${cleanItems.length} SKU barang rusak`;

      const payload: any = {
        return_number: returnNumber,
        reason: summaryReason,
        status: 'REQUESTED',
        return_items: cleanItems
      };

      if (dealerId) payload.dealer_id = dealerId;
      if (selectedOrderId) payload.order_id = selectedOrderId;

      // Fallback object in case DB columns not migrated yet
      const fallbackMeta = {
        summary: summaryReason,
        return_items: cleanItems,
        status_step: 'REQUESTED'
      };

      const { data, error } = await supabase
        .from('returns')
        .insert([payload])
        .select('*');

      if (error) {
        console.warn('Direct column insert error, trying fallback:', error);
        // Fallback: save clean JSON in reason
        const fallbackPayload: any = {
          return_number: returnNumber,
          reason: JSON.stringify(fallbackMeta),
          status: 'REQUESTED'
        };
        if (dealerId) fallbackPayload.dealer_id = dealerId;
        if (selectedOrderId) fallbackPayload.order_id = selectedOrderId;

        const { error: fallbackErr } = await supabase
          .from('returns')
          .insert([fallbackPayload]);

        if (fallbackErr) {
          // If status CHECK constraint rejects 'REQUESTED', try 'PENDING'
          const { error: retryErr } = await supabase
            .from('returns')
            .insert([{
              ...fallbackPayload,
              status: 'PENDING'
            }]);

          if (retryErr) {
            throw retryErr;
          }
        }
      }

      // Kirim Notifikasi ke Admin & Sales
      try {
        await supabase.from('notifications').insert([
          {
            title: `Pengajuan Retur Baru - ${returnNumber}`,
            description: `${dealerStoreName || 'Dealer'} mengajukan retur untuk ${cleanItems.length} SKU (${cleanItems.reduce((a, b) => a + b.quantity, 0)} unit). Menunggu resi kirim dealer.`,
            type: 'RETURN',
            target_role: 'ADMIN',
            reference_id: returnNumber
          },
          {
            title: `Dealer Anda Mengajukan Retur (${returnNumber})`,
            description: `${dealerStoreName || 'Dealer'} mengajukan klaim retur barang.`,
            type: 'RETURN',
            target_role: 'SALES',
            reference_id: returnNumber
          }
        ]);
      } catch (notifErr) {
        // Safe to ignore if notifications table not yet created
      }

      Alert.alert(
        'Pengajuan Retur Berhasil! 📦',
        `Nomor Tiket: ${returnNumber}\n\nLangkah selanjutnya:\nSilakan kirimkan fisik barang retur ke Gudang Pusat DAP, lalu upload bukti resi pengiriman agar segera diperiksa tim gudang.`,
        [
          { 
            text: 'Upload Resi Sekarang', 
            onPress: () => {
              setIsAddModalOpen(false);
              fetchReturns();
              // Buka modal upload resi untuk tiket baru ini
              setTimeout(() => {
                setShippingTicket({
                  id: '',
                  return_number: returnNumber,
                  reason: summaryReason,
                  status: 'REQUESTED',
                  created_at: new Date().toISOString(),
                  return_items: cleanItems
                });
                setDealerReceiptNo('');
                setDealerPhotoUri(null);
                setIsShippingModalOpen(true);
              }, 600);
            }
          },
          { 
            text: 'Nanti Saja', 
            onPress: () => {
              setIsAddModalOpen(false);
              fetchReturns();
            },
            style: 'cancel'
          }
        ]
      );

      // Reset form
      setReturnItemsInput([{ sku: '', name: '', quantity: 1, condition: 'Cacat Pabrik / Mati Total', reason: '' }]);
      setGeneralReason('');
    } catch (err: any) {
      Alert.alert('Gagal Mengajukan Retur', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // STEP 2: UPLOAD FOTO & BUKTI RESI PENGIRIMAN DEALER
  // ==========================================
  const handlePickDealerPhoto = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Kamera Ditolak', 'Aplikasi memerlukan izin akses kamera.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          base64: true
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Galeri Ditolak', 'Aplikasi memerlukan izin akses galeri foto.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDealerPhotoUri(result.assets[0].uri);
        // If no receipt number yet, autofill demo or random
        if (!dealerReceiptNo) {
          setDealerReceiptNo(`JT${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        }
      }
    } catch (err: any) {
      Alert.alert('Kesalahan', err.message);
    }
  };

  const handleUseDemoReceipt = () => {
    setDealerPhotoUri('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80');
    setDealerReceiptNo(`JNE${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    Alert.alert('Bukti Demo Siap', 'Nomor resi & contoh foto resi terisi secara otomatis untuk kemudahan testing.');
  };

  const handleSubmitDealerShipping = async () => {
    if (!shippingTicket) return;
    if (!dealerReceiptNo.trim()) {
      Alert.alert('Resi Belum Diisi', 'Harap masukkan nomor resi pengiriman barang retur.');
      return;
    }

    setUploadingReceipt(true);
    try {
      const now = new Date().toISOString();
      const photoUrl = dealerPhotoUri || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80';

      const updatePayload: any = {
        status: 'SHIPPED_BY_DEALER',
        dealer_courier: dealerCourier,
        dealer_shipping_receipt_no: dealerReceiptNo.trim(),
        dealer_shipping_photo_url: photoUrl,
        dealer_shipped_at: now
      };

      const fallbackMeta = {
        summary: shippingTicket.reason,
        return_items: shippingTicket.return_items,
        dealer_courier: dealerCourier,
        dealer_shipping_receipt_no: dealerReceiptNo.trim(),
        dealer_shipping_photo_url: photoUrl,
        dealer_shipped_at: now,
        status_step: 'SHIPPED_BY_DEALER'
      };

      let targetId = shippingTicket.id;
      // If we only have return_number
      if (!targetId) {
        const { data: found } = await supabase
          .from('returns')
          .select('id')
          .eq('return_number', shippingTicket.return_number)
          .single();
        if (found) targetId = found.id;
      }

      const { error } = await supabase
        .from('returns')
        .update(updatePayload)
        .eq('id', targetId);

      if (error) {
        console.warn('Column update error, fallback to reason JSON:', error);
        await supabase
          .from('returns')
          .update({
            status: 'SHIPPED_BY_DEALER',
            reason: JSON.stringify(fallbackMeta)
          })
          .eq('id', targetId);
      }

      // Notif ke admin
      try {
        await supabase.from('notifications').insert([{
          title: `Dealer Mengirim Barang Retur (${shippingTicket.return_number})`,
          description: `${dealerStoreName || 'Dealer'} telah mengirim barang retur via ${dealerCourier} (No. Resi: ${dealerReceiptNo.trim()}). Harap pantau kedatangan fisik di gudang.`,
          type: 'RETURN',
          target_role: 'ADMIN',
          reference_id: shippingTicket.return_number
        }]);
      } catch (e) {}

      Alert.alert(
        'Bukti Pengiriman Berhasil Disimpan! 🚚',
        `No. Resi ${dealerReceiptNo.trim()} telah tercatat.\n\nStatus saat ini: "Barang Dalam Perjalanan ke Gudang DAP". Tim gudang akan mengonfirmasi saat paket fisik telah tiba.`
      );

      setIsShippingModalOpen(false);
      setShippingTicket(null);
      fetchReturns();
    } catch (err: any) {
      Alert.alert('Gagal Simpan Resi', err.message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  // ==========================================
  // STEP 6 & 7: SUDAH DITERIMA DEALER & KLIK SELESAI
  // ==========================================
  const handleCompleteReturnByDealer = async (ticket: ReturnTicket) => {
    Alert.alert(
      'Konfirmasi Penerimaan Barang Pengganti',
      `Apakah Anda sudah menerima fisik barang pengganti dari DAP dan telah memastikannya dalam kondisi lengkap dan baik?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Selesai & Diterima', 
          onPress: async () => {
            setCompletingReturn(true);
            try {
              const now = new Date().toISOString();
              const updatePayload: any = {
                status: 'COMPLETED',
                dealer_received_at: now,
                completed_at: now
              };

              const fallbackMeta = {
                summary: ticket.reason,
                return_items: ticket.return_items,
                dealer_courier: ticket.dealer_courier,
                dealer_shipping_receipt_no: ticket.dealer_shipping_receipt_no,
                dealer_shipping_photo_url: ticket.dealer_shipping_photo_url,
                dealer_shipped_at: ticket.dealer_shipped_at,
                admin_received_at: ticket.admin_received_at,
                admin_notes: ticket.admin_notes,
                replacement_items: ticket.replacement_items,
                replacement_courier: ticket.replacement_courier,
                replacement_shipping_receipt_no: ticket.replacement_shipping_receipt_no,
                replacement_shipping_photo_url: ticket.replacement_shipping_photo_url,
                replacement_shipped_at: ticket.replacement_shipped_at,
                dealer_received_at: now,
                completed_at: now,
                status_step: 'COMPLETED'
              };

              const { error } = await supabase
                .from('returns')
                .update(updatePayload)
                .eq('id', ticket.id);

              if (error) {
                await supabase
                  .from('returns')
                  .update({
                    status: 'COMPLETED',
                    reason: JSON.stringify(fallbackMeta)
                  })
                  .eq('id', ticket.id);
              }

              // Notif ke admin
              try {
                await supabase.from('notifications').insert([{
                  title: `Retur Selesai - ${ticket.return_number}`,
                  description: `Dealer ${dealerStoreName || 'Dealer'} telah mengonfirmasi penerimaan barang pengganti. Tiket retur resmi selesai.`,
                  type: 'RETURN',
                  target_role: 'ADMIN',
                  reference_id: ticket.id
                }]);
              } catch (e) {}

              Alert.alert('Retur Tuntas Selesai! 🎉', 'Terima kasih telah mempercayai garansi resmi DAP. Penggantian barang Anda telah rampung.');
              setSelectedReturn(null);
              fetchReturns();
            } catch (err: any) {
              Alert.alert('Gagal menyelesaikan retur', err.message);
            } finally {
              setCompletingReturn(false);
            }
          }
        }
      ]
    );
  };

  // Helper badge & status UI
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'PENDING':
        return {
          step: 1,
          label: '1. Menunggu Resi Kirim',
          sub: 'Kirim barang fisik & upload resi',
          bg: '#fef3c7',
          text: '#92400e',
          border: '#fde68a'
        };
      case 'SHIPPED_BY_DEALER':
        return {
          step: 2,
          label: '2. Dikirim ke Gudang',
          sub: 'Menunggu fisik tiba di gudang DAP',
          bg: '#dbeafe',
          text: '#1e40af',
          border: '#bfdbfe'
        };
      case 'RECEIVED_BY_ADMIN':
        return {
          step: 3,
          label: '3. Tiba di Gudang Pusat',
          sub: 'Sedang disiapkan barang pengganti',
          bg: '#f3e8ff',
          text: '#6b21a8',
          border: '#e9d5ff'
        };
      case 'REPLACEMENT_SHIPPED':
        return {
          step: 5,
          label: '5. Pengganti Dikirim',
          sub: 'Barang pengganti dalam perjalanan ke toko Anda',
          bg: '#ccfbf1',
          text: '#115e59',
          border: '#99f6e4'
        };
      case 'COMPLETED':
      case 'PROCESSED':
        return {
          step: 7,
          label: '7. Retur Selesai',
          sub: 'Barang pengganti telah diterima',
          bg: '#dcfce7',
          text: '#166534',
          border: '#bbf7d0'
        };
      case 'REJECTED':
        return {
          step: 0,
          label: 'Ditolak',
          sub: 'Tidak memenuhi syarat klaim garansi',
          bg: '#ffe4e6',
          text: '#9f1239',
          border: '#fecdd3'
        };
      default:
        return {
          step: 1,
          label: status,
          sub: 'Tiket retur terdaftar',
          bg: '#f1f5f9',
          text: '#334155',
          border: '#e2e8f0'
        };
    }
  };

  const filteredReturns = returns.filter(ticket => {
    if (activeTab === 'ACTIVE') {
      return ticket.status !== 'COMPLETED' && ticket.status !== 'PROCESSED' && ticket.status !== 'REJECTED';
    }
    if (activeTab === 'COMPLETED') {
      return ticket.status === 'COMPLETED' || ticket.status === 'PROCESSED';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Retur & Garansi Produk</Text>
          <Text style={styles.headerSub}>Lacak & Ajukan Penggantian Barang</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setIsAddModalOpen(true)} 
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Feather name="plus-circle" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('ALL')}
          style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            Semua ({returns.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('ACTIVE')}
          style={[styles.tabItem, activeTab === 'ACTIVE' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
            Berjalan ({returns.filter(r => r.status !== 'COMPLETED' && r.status !== 'PROCESSED' && r.status !== 'REJECTED').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('COMPLETED')}
          style={[styles.tabItem, activeTab === 'COMPLETED' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
            Selesai ({returns.filter(r => r.status === 'COMPLETED' || r.status === 'PROCESSED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8ec44a" />
          <Text style={styles.loadingText}>Memuat tiket retur...</Text>
        </View>
      ) : filteredReturns.length === 0 ? (
        <ScrollView 
          contentContainerStyle={[styles.emptyContainer, { paddingBottom: safeBottom }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} colors={['#8ec44a']} />}
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="refresh-cw" size={38} color="#8ec44a" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'COMPLETED' ? 'Belum Ada Retur Selesai' : 'Belum Ada Pengajuan Retur'}
            </Text>
            <Text style={styles.emptyDesc}>
              Klaim produk rusak, cacat pabrik, atau salah kirim dengan mudah. DAP memberikan garansi penggantian unit gres baru.
            </Text>

            <TouchableOpacity 
              onPress={() => setIsAddModalOpen(true)}
              style={styles.emptyActionBtn}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.emptyActionText}>Ajukan Retur Barang Sekarang</Text>
            </TouchableOpacity>
          </View>

          {/* SOP Retur Box */}
          <View style={styles.sopCard}>
            <View style={styles.sopHeader}>
              <Feather name="shield" size={18} color="#4a6b22" style={{ marginRight: 6 }} />
              <Text style={styles.sopTitle}>7 Langkah Alur Retur DAP B2B:</Text>
            </View>
            <Text style={styles.sopStep}>1. Input detail SKU & Qty barang yang diretur.</Text>
            <Text style={styles.sopStep}>2. Kirim paket fisik & upload foto resi pengiriman.</Text>
            <Text style={styles.sopStep}>3. Paket fisik tiba & dikonfirmasi oleh gudang pusat.</Text>
            <Text style={styles.sopStep}>4. Admin menyiapkan barang pengganti baru.</Text>
            <Text style={styles.sopStep}>5. Admin upload foto resi kirim balik ke toko dealer.</Text>
            <Text style={styles.sopStep}>6. Barang pengganti tiba di tangan Anda.</Text>
            <Text style={styles.sopStep}>7. Klik "Selesai" untuk menuntaskan retur.</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={[styles.list, { paddingBottom: safeBottom }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} colors={['#8ec44a']} />}
        >
          {/* Action Quick Banner */}
          <TouchableOpacity 
            onPress={() => setIsAddModalOpen(true)}
            style={styles.newClaimBanner}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.bannerIcon}>
                <Feather name="plus" size={18} color="white" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.bannerTitle}>Ada Barang Rusak / Cacat?</Text>
                <Text style={styles.bannerSubtitle}>Klik untuk buat tiket pengajuan retur baru</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#8ec44a" />
          </TouchableOpacity>

          {filteredReturns.map((ticket) => {
            const badge = getStatusBadge(ticket.status);
            const totalUnits = (ticket.return_items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);

            return (
              <View key={ticket.id} style={styles.card}>
                {/* Header Card */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.retId}>{ticket.return_number}</Text>
                    <Text style={styles.date}>
                      {new Date(ticket.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Return Items Preview */}
                <View style={styles.itemsSummaryBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Feather name="package" size={14} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.itemsCountTitle}>
                      {ticket.return_items && ticket.return_items.length > 0 
                        ? `${ticket.return_items.length} SKU Barang (${totalUnits} Unit)`
                        : 'Detail Retur'}
                    </Text>
                  </View>

                  {ticket.return_items && ticket.return_items.length > 0 ? (
                    ticket.return_items.slice(0, 3).map((item, idx) => (
                      <Text key={idx} style={styles.itemRowText} numberOfLines={1}>
                        • <Text style={{ fontWeight: 'bold', color: '#15803d' }}>[{item.sku}]</Text> {item.name} <Text style={{ fontWeight: 'bold' }}>x{item.quantity}</Text>
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.itemRowText} numberOfLines={2}>
                      {ticket.reason}
                    </Text>
                  )}
                </View>

                {/* Sub status info */}
                <View style={styles.subStatusRow}>
                  <Feather name="info" size={13} color="#64748b" style={{ marginRight: 6 }} />
                  <Text style={styles.subStatusText}>{badge.sub}</Text>
                </View>

                {/* Action Buttons per Status */}
                <View style={styles.cardActions}>
                  {/* Step 2 Action: Upload receipt if still requested */}
                  {(ticket.status === 'REQUESTED' || ticket.status === 'PENDING') && !ticket.dealer_shipping_receipt_no && (
                    <TouchableOpacity
                      onPress={() => {
                        setShippingTicket(ticket);
                        setDealerReceiptNo('');
                        setDealerPhotoUri(null);
                        setIsShippingModalOpen(true);
                      }}
                      style={styles.uploadReceiptBtn}
                      activeOpacity={0.8}
                    >
                      <Feather name="truck" size={15} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.uploadReceiptBtnText}>Upload Resi Pengiriman</Text>
                    </TouchableOpacity>
                  )}

                  {/* Step 6 & 7 Action: Dealer confirms replacement received and completes */}
                  {ticket.status === 'REPLACEMENT_SHIPPED' && (
                    <TouchableOpacity
                      onPress={() => handleCompleteReturnByDealer(ticket)}
                      disabled={completingReturn}
                      style={styles.completeActionBtn}
                      activeOpacity={0.8}
                    >
                      {completingReturn ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Feather name="check-circle" size={15} color="white" style={{ marginRight: 6 }} />
                          <Text style={styles.completeActionBtnText}>Barang Diterima (Klik Selesai)</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Detail & 7-Step View Button */}
                  <TouchableOpacity 
                    onPress={() => setSelectedReturn(ticket)}
                    style={styles.detailBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="activity" size={14} color="#4a6b22" style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>Lacak Alur 7 Tahap</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORM AJUKAN RETUR BARU (STEP 1) */}
      {/* ========================================================================= */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCardLarge}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.modalIconBox}>
                  <Feather name="box" size={18} color="#4a6b22" />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Ajukan Retur Barang</Text>
                  <Text style={styles.modalSubtitle}>Tahap 1: Input detail SKU & Qty</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Order Selection */}
              {orderOptions.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Pilih Faktur / Nomor Pesanan (Opsional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderChipsContainer}>
                    <TouchableOpacity
                      onPress={() => setSelectedOrderId('')}
                      style={[styles.orderChip, !selectedOrderId && styles.orderChipSelected]}
                    >
                      <Text style={[styles.orderChipText, !selectedOrderId && styles.orderChipTextSelected]}>
                        Tanpa Pesanan
                      </Text>
                    </TouchableOpacity>

                    {orderOptions.map((ord) => {
                      const isSelected = selectedOrderId === ord.id;
                      return (
                        <TouchableOpacity
                          key={ord.id}
                          onPress={() => setSelectedOrderId(ord.id)}
                          style={[styles.orderChip, isSelected && styles.orderChipSelected]}
                        >
                          <Text style={[styles.orderChipText, isSelected && styles.orderChipTextSelected]}>
                            {ord.order_number}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Items List Input */}
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Daftar SKU & Quantity Barang Retur *</Text>
                  <TouchableOpacity onPress={handleAddItemRow} style={styles.addRowBtn}>
                    <Feather name="plus" size={14} color="#15803d" />
                    <Text style={styles.addRowBtnText}>Tambah SKU</Text>
                  </TouchableOpacity>
                </View>

                {returnItemsInput.map((item, idx) => (
                  <View key={idx} style={styles.itemInputCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.itemInputNumber}>Item #{idx + 1}</Text>
                      {returnItemsInput.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveItemRow(idx)}>
                          <Feather name="trash-2" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* SKU & Search helper */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.fieldLabel}>SKU Produk *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Misal: DCZ16"
                          placeholderTextColor="#94a3b8"
                          value={item.sku}
                          onChangeText={(text) => {
                            const updated = [...returnItemsInput];
                            updated[idx].sku = text;
                            setReturnItemsInput(updated);
                          }}
                        />
                      </View>

                      <View style={{ flex: 0.8 }}>
                        <Text style={styles.fieldLabel}>Quantity *</Text>
                        <TextInput
                          style={[styles.textInput, { textAlign: 'center', fontWeight: 'bold' }]}
                          keyboardType="numeric"
                          placeholder="1"
                          placeholderTextColor="#94a3b8"
                          value={item.quantity.toString()}
                          onChangeText={(text) => {
                            const updated = [...returnItemsInput];
                            updated[idx].quantity = parseInt(text) || 1;
                            setReturnItemsInput(updated);
                          }}
                        />
                      </View>
                    </View>

                    {/* Product Name */}
                    <View style={{ marginBottom: 8 }}>
                      <Text style={styles.fieldLabel}>Nama Barang / Tipe</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Contoh: Kabel Fast Charging DAP 100W"
                        placeholderTextColor="#94a3b8"
                        value={item.name}
                        onChangeText={(text) => {
                          const updated = [...returnItemsInput];
                          updated[idx].name = text;
                          setReturnItemsInput(updated);
                        }}
                      />
                    </View>

                    {/* Quick Pick from Master Products button */}
                    {productList.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => setActiveItemIndexForProductPicker(activeItemIndexForProductPicker === idx ? null : idx)}
                        style={styles.catalogHelperBtn}
                      >
                        <Feather name="search" size={13} color="#059669" />
                        <Text style={styles.catalogHelperText}>Pilih dari Katalog Produk DAP ({productList.length})</Text>
                      </TouchableOpacity>
                    )}

                    {/* Catalog Picker Dropdown for this item */}
                    {activeItemIndexForProductPicker === idx && (
                      <View style={styles.catalogPickerBox}>
                        <TextInput
                          style={styles.catalogSearchInput}
                          placeholder="Cari nama atau SKU produk..."
                          placeholderTextColor="#94a3b8"
                          value={skuSearchQuery}
                          onChangeText={setSkuSearchQuery}
                        />
                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                          {productList
                            .filter(p => 
                              p.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) || 
                              p.sku.toLowerCase().includes(skuSearchQuery.toLowerCase())
                            )
                            .slice(0, 15)
                            .map((prod) => (
                              <TouchableOpacity
                                key={prod.id}
                                onPress={() => handleSelectProduct(prod, idx)}
                                style={styles.catalogItemRow}
                              >
                                <Text style={styles.catalogItemSku}>[{prod.sku}]</Text>
                                <Text style={styles.catalogItemName} numberOfLines={1}>{prod.name}</Text>
                              </TouchableOpacity>
                            ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Alasan Kerusakan per item */}
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.fieldLabel}>Alasan Kerusakan Produk</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Misal: Port longgar / tidak ada arus"
                        placeholderTextColor="#94a3b8"
                        value={item.reason}
                        onChangeText={(text) => {
                          const updated = [...returnItemsInput];
                          updated[idx].reason = text;
                          setReturnItemsInput(updated);
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>

              {/* Catatan Tambahan Pengajuan */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.inputLabel}>Catatan Tambahan Pengajuan Retur</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                  placeholder="Keterangan tambahan untuk gudang DAP..."
                  placeholderTextColor="#94a3b8"
                  value={generalReason}
                  onChangeText={setGeneralReason}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                onPress={() => setIsAddModalOpen(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleCreateReturn}
                disabled={submitting}
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitBtnText}>Kirim Pengajuan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD RESI PENGIRIMAN DEALER (STEP 2) */}
      {/* ========================================================================= */}
      {isShippingModalOpen && shippingTicket && (
        <Modal
          visible={isShippingModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsShippingModalOpen(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCardLarge}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalIconBox, { backgroundColor: '#dbeafe' }]}>
                    <Feather name="truck" size={18} color="#1d4ed8" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.modalTitle}>Upload Bukti Resi Pengiriman</Text>
                    <Text style={styles.modalSubtitle}>Tiket: {shippingTicket.return_number}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsShippingModalOpen(false)}>
                  <Feather name="x" size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Alamat Gudang Penerima */}
                <View style={styles.warehouseAddressBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Feather name="map-pin" size={16} color="#4a6b22" style={{ marginRight: 6 }} />
                    <Text style={styles.warehouseTitle}>Alamat Pengiriman Gudang DAP:</Text>
                  </View>
                  <Text style={styles.warehouseText}>
                    Pusat Retur & Servis DAP Indonesia{'\n'}
                    Komp. Pergudangan Prima B2B Blok A No. 88, Daan Mogot, Jakarta Barat, 11840.{'\n'}
                    UP: Tim Pemeriksa Retur Garansi DAP (0812-8888-9999)
                  </Text>
                </View>

                {/* Ekspedisi */}
                <Text style={styles.inputLabel}>Pilih Jasa Ekspedisi / Kurir</Text>
                <View style={styles.courierChipsContainer}>
                  {['J&T Express', 'JNE Express', 'SiCepat', 'Anteraja', 'Kargo / Lainnya'].map((courier) => {
                    const isSelected = dealerCourier === courier;
                    return (
                      <TouchableOpacity
                        key={courier}
                        onPress={() => setDealerCourier(courier)}
                        style={[styles.courierChip, isSelected && styles.courierChipSelected]}
                      >
                        <Text style={[styles.courierChipText, isSelected && styles.courierChipTextSelected]}>
                          {courier}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Nomor Resi */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Nomor Resi / No. AWB *</Text>
                <TextInput
                  style={[styles.textInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' }]}
                  placeholder="Contoh: JT8891238910"
                  placeholderTextColor="#94a3b8"
                  value={dealerReceiptNo}
                  onChangeText={setDealerReceiptNo}
                />

                {/* Foto Bukti Resi */}
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.inputLabel}>Foto Bukti Resi Pengiriman *</Text>
                    <TouchableOpacity onPress={handleUseDemoReceipt}>
                      <Text style={styles.demoLinkText}>⚡ Gunakan Bukti Demo</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.photoActionRow}>
                    <TouchableOpacity 
                      onPress={() => handlePickDealerPhoto(true)}
                      style={styles.photoPickerBtn}
                      activeOpacity={0.8}
                    >
                      <Feather name="camera" size={16} color="#059669" />
                      <Text style={styles.photoPickerBtnText}>Ambil Foto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => handlePickDealerPhoto(false)}
                      style={styles.photoPickerBtn}
                      activeOpacity={0.8}
                    >
                      <Feather name="image" size={16} color="#059669" />
                      <Text style={styles.photoPickerBtnText}>Pilih Galeri</Text>
                    </TouchableOpacity>
                  </View>

                  {dealerPhotoUri ? (
                    <View style={styles.previewPhotoContainer}>
                      <RNImage source={{ uri: dealerPhotoUri }} style={styles.previewPhotoImage} />
                      <TouchableOpacity 
                        onPress={() => setDealerPhotoUri(null)}
                        style={styles.removePhotoBtn}
                      >
                        <Feather name="trash-2" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  onPress={() => setIsShippingModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleSubmitDealerShipping}
                  disabled={uploadingReceipt}
                  style={[styles.submitBtn, uploadingReceipt && { opacity: 0.6 }]}
                >
                  {uploadingReceipt ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitBtnText}>Simpan & Kirim Resi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DETAIL LENGKAP & VISUAL TRACKER 7 TAHAP */}
      {/* ========================================================================= */}
      {selectedReturn && (
        <Modal
          visible={Boolean(selectedReturn)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedReturn(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardLarge}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedReturn.return_number}</Text>
                  <Text style={styles.modalSubtitle}>Detail Alur & Progres Retur</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReturn(null)}>
                  <Feather name="x" size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* 7-Step Interactive Pipeline */}
                <View style={styles.timelineBox}>
                  <Text style={styles.timelineBoxTitle}>Status 7 Tahap Retur:</Text>

                  {/* Step 1 */}
                  <View style={styles.timelineRow}>
                    <View style={[styles.timelineBadge, { backgroundColor: '#10b981' }]}>
                      <Feather name="check" size={12} color="white" />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineHeading}>1. Pengajuan SKU & Qty</Text>
                      <Text style={styles.timelineDesc}>Tiket dibuat oleh pemilik dealer. Notifikasi terkirim.</Text>
                    </View>
                  </View>

                  <View style={styles.timelineConnector} />

                  {/* Step 2 */}
                  <View style={styles.timelineRow}>
                    <View style={[
                      styles.timelineBadge, 
                      { backgroundColor: selectedReturn.dealer_shipping_receipt_no ? '#10b981' : '#f59e0b' }
                    ]}>
                      {selectedReturn.dealer_shipping_receipt_no ? (
                        <Feather name="check" size={12} color="white" />
                      ) : (
                        <Text style={styles.timelineBadgeText}>2</Text>
                      )}
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineHeading}>2. Foto Resi Kirim Dealer</Text>
                      {selectedReturn.dealer_shipping_receipt_no ? (
                        <View style={{ marginTop: 2 }}>
                          <Text style={styles.timelineDesc}>
                            {selectedReturn.dealer_courier}: <Text style={{ fontWeight: 'bold', color: '#1e40af' }}>{selectedReturn.dealer_shipping_receipt_no}</Text>
                          </Text>
                          {selectedReturn.dealer_shipping_photo_url && (
                            <TouchableOpacity 
                              onPress={() => setPreviewImage(selectedReturn.dealer_shipping_photo_url!)}
                              style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}
                            >
                              <Feather name="image" size={12} color="#059669" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 11, color: '#059669', fontWeight: 'bold' }}>Lihat Foto Resi Kirim</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.timelineDesc}>Menunggu foto bukti pengiriman fisik dari Anda.</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.timelineConnector} />

                  {/* Step 3 */}
                  <View style={styles.timelineRow}>
                    <View style={[
                      styles.timelineBadge, 
                      { backgroundColor: selectedReturn.admin_received_at ? '#10b981' : '#cbd5e1' }
                    ]}>
                      {selectedReturn.admin_received_at ? (
                        <Feather name="check" size={12} color="white" />
                      ) : (
                        <Text style={styles.timelineBadgeText}>3</Text>
                      )}
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineHeading}>3. Diterima di Gudang Pusat</Text>
                      {selectedReturn.admin_received_at ? (
                        <Text style={styles.timelineDesc}>
                          Paket fisik telah tiba di gudang. Catatan: "{selectedReturn.admin_notes || 'Lengkap & Sesuai'}"
                        </Text>
                      ) : (
                        <Text style={styles.timelineDesc}>Menunggu konfirmasi kedatangan paket fisik di gudang.</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.timelineConnector} />

                  {/* Step 4 & 5 */}
                  <View style={styles.timelineRow}>
                    <View style={[
                      styles.timelineBadge, 
                      { backgroundColor: selectedReturn.replacement_shipping_receipt_no ? '#10b981' : '#cbd5e1' }
                    ]}>
                      {selectedReturn.replacement_shipping_receipt_no ? (
                        <Feather name="check" size={12} color="white" />
                      ) : (
                        <Text style={styles.timelineBadgeText}>4-5</Text>
                      )}
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineHeading}>4-5. Barang Pengganti Dikirim Balik</Text>
                      {selectedReturn.replacement_shipping_receipt_no ? (
                        <View style={{ marginTop: 2 }}>
                          <Text style={styles.timelineDesc}>
                            {selectedReturn.replacement_courier}: <Text style={{ fontWeight: 'bold', color: '#0d9488' }}>{selectedReturn.replacement_shipping_receipt_no}</Text>
                          </Text>
                          {selectedReturn.replacement_shipping_photo_url && (
                            <TouchableOpacity 
                              onPress={() => setPreviewImage(selectedReturn.replacement_shipping_photo_url!)}
                              style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}
                            >
                              <Feather name="image" size={12} color="#0d9488" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 11, color: '#0d9488', fontWeight: 'bold' }}>Lihat Foto Resi Kirim Balik</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.timelineDesc}>Admin sedang menyiapkan unit pengganti & resi kirim balik.</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.timelineConnector} />

                  {/* Step 6 & 7 */}
                  <View style={styles.timelineRow}>
                    <View style={[
                      styles.timelineBadge, 
                      { backgroundColor: selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PROCESSED' ? '#10b981' : '#cbd5e1' }
                    ]}>
                      {selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PROCESSED' ? (
                        <Feather name="check" size={12} color="white" />
                      ) : (
                        <Text style={styles.timelineBadgeText}>6-7</Text>
                      )}
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineHeading}>6-7. Diterima Dealer & Selesai</Text>
                      {selectedReturn.status === 'COMPLETED' || selectedReturn.status === 'PROCESSED' ? (
                        <Text style={styles.timelineDesc}>
                          Proses retur tuntas! Pemilik dealer telah mengonfirmasi barang pengganti diterima pada {selectedReturn.completed_at ? new Date(selectedReturn.completed_at).toLocaleDateString('id-ID') : 'hari ini'}.
                        </Text>
                      ) : (
                        <Text style={styles.timelineDesc}>Menunggu Anda menerima paket pengganti dan menekan tombol Selesai.</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Daftar SKU Yang Diretur */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionHeaderTitle}>Barang Yang Anda Retur:</Text>
                  {selectedReturn.return_items && selectedReturn.return_items.length > 0 ? (
                    selectedReturn.return_items.map((item, idx) => (
                      <View key={idx} style={styles.itemDetailCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemDetailName}>{item.name}</Text>
                          <Text style={styles.itemDetailSku}>SKU: {item.sku} • Kondisi: {item.condition || 'Rusak'}</Text>
                          {item.reason && <Text style={styles.itemDetailReason}>"{item.reason}"</Text>}
                        </View>
                        <Text style={styles.itemDetailQty}>{item.quantity} Unit</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.genericReasonText}>{selectedReturn.reason}</Text>
                  )}
                </View>

                {/* Daftar SKU Pengganti dari Admin */}
                {selectedReturn.replacement_items && selectedReturn.replacement_items.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionHeaderTitle, { color: '#0d9488' }]}>Barang Pengganti dari DAP:</Text>
                    {selectedReturn.replacement_items.map((item, idx) => (
                      <View key={idx} style={[styles.itemDetailCard, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemDetailName}>{item.name}</Text>
                          <Text style={styles.itemDetailSku}>SKU: {item.sku}</Text>
                          {item.notes && <Text style={styles.itemDetailReason}>{item.notes}</Text>}
                        </View>
                        <Text style={[styles.itemDetailQty, { color: '#0d9488' }]}>{item.quantity} Unit</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action button inside modal if replacement shipped */}
                {selectedReturn.status === 'REPLACEMENT_SHIPPED' && (
                  <TouchableOpacity
                    onPress={() => handleCompleteReturnByDealer(selectedReturn)}
                    style={[styles.completeActionBtn, { marginTop: 20 }]}
                    activeOpacity={0.8}
                  >
                    <Feather name="check-circle" size={16} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.completeActionBtnText}>Barang Sudah Diterima (Klik Selesai)</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  onPress={() => setSelectedReturn(null)}
                  style={styles.closeDetailBtn}
                >
                  <Text style={styles.closeDetailBtnText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: IMAGE PREVIEW ZOOM */}
      {/* ========================================================================= */}
      {previewImage && (
        <Modal
          visible={Boolean(previewImage)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <TouchableOpacity 
            style={styles.imageZoomOverlay} 
            activeOpacity={1} 
            onPress={() => setPreviewImage(null)}
          >
            <View style={styles.imageZoomCard}>
              <RNImage source={{ uri: previewImage }} style={styles.zoomedImage} resizeMode="contain" />
              <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.closeZoomBtn}>
                <Feather name="x" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 56 : 48, 
    paddingBottom: 16, 
    backgroundColor: '#8ec44a' 
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 11, fontWeight: '600', color: '#f0fdf4', marginTop: 1 },
  addBtn: { padding: 4 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 14, fontWeight: '600' },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  tabItemActive: {
    backgroundColor: '#8ec44a'
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  tabTextActive: {
    color: 'white'
  },

  // List
  list: { padding: 16 },
  newClaimBanner: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8ec44a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  bannerSubtitle: { fontSize: 11, fontWeight: '500', color: '#64748b', marginTop: 1 },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  retId: { fontSize: 15, fontWeight: '900', color: '#0f172a', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  date: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  statusText: { fontSize: 11, fontWeight: '800' },

  itemsSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8
  },
  itemsCountTitle: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  itemRowText: { fontSize: 12, color: '#334155', marginTop: 2 },
  subStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subStatusText: { fontSize: 11, color: '#64748b', fontWeight: '500' },

  cardActions: {
    flexDirection: 'column',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  uploadReceiptBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadReceiptBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },
  completeActionBtn: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2
  },
  completeActionBtnText: { color: 'white', fontSize: 13, fontWeight: '900' },
  detailBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailText: { color: '#4a6b22', fontSize: 12, fontWeight: '800' },

  // Empty State
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 24, 
    alignItems: 'center', 
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f6fbf0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: '#1e293b', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8ec44a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  emptyActionText: { color: 'white', fontSize: 13, fontWeight: '800' },

  // SOP Box
  sopCard: {
    backgroundColor: '#f6fbf0',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#dcfce7'
  },
  sopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sopTitle: { fontSize: 13, fontWeight: '800', color: '#166534' },
  sopStep: { fontSize: 12, color: '#15803d', lineHeight: 20, fontWeight: '500' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  modalCardLarge: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f6fbf0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  modalSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 1 },
  modalBody: { padding: 18 },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#8ec44a'
  },
  submitBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  // Form Inputs
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a'
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 70
  },

  // Order Chips
  orderChipsContainer: { flexDirection: 'row', marginBottom: 4 },
  orderChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  orderChipSelected: {
    backgroundColor: '#f6fbf0',
    borderColor: '#8ec44a'
  },
  orderChipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  orderChipTextSelected: { color: '#4a6b22', fontWeight: '800' },

  // Multi-item SKU Input
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addRowBtnText: { fontSize: 12, fontWeight: '800', color: '#15803d' },
  itemInputCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  itemInputNumber: { fontSize: 11, fontWeight: '800', color: '#8ec44a', textTransform: 'uppercase' },

  catalogHelperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4
  },
  catalogHelperText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  catalogPickerBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 8,
    marginTop: 6
  },
  catalogSearchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 12
  },
  catalogItemRow: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  catalogItemSku: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  catalogItemName: { fontSize: 12, color: '#334155' },

  // Warehouse box in Modal 2
  warehouseAddressBox: {
    backgroundColor: '#f6fbf0',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 14
  },
  warehouseTitle: { fontSize: 12, fontWeight: '800', color: '#166534' },
  warehouseText: { fontSize: 11, color: '#15803d', lineHeight: 17 },

  courierChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  courierChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  courierChipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#1d4ed8'
  },
  courierChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  courierChipTextSelected: { color: '#1e40af', fontWeight: '800' },

  demoLinkText: { fontSize: 11, fontWeight: '800', color: '#059669' },
  photoActionRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10 },
  photoPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10
  },
  photoPickerBtnText: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  previewPhotoContainer: {
    marginTop: 6,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  previewPhotoImage: { width: '100%', height: 160, borderRadius: 10 },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 6
  },

  // Timeline in Modal 3
  timelineBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  timelineBoxTitle: { fontSize: 13, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  timelineBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  timelineTextCol: { flex: 1 },
  timelineHeading: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  timelineDesc: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 16 },
  timelineConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#cbd5e1',
    marginLeft: 11,
    marginVertical: 4
  },

  sectionHeaderTitle: { fontSize: 13, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  itemDetailCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6
  },
  itemDetailName: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  itemDetailSku: { fontSize: 11, color: '#64748b', marginTop: 1 },
  itemDetailReason: { fontSize: 11, color: '#0f172a', fontStyle: 'italic', marginTop: 2 },
  itemDetailQty: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  genericReasonText: { fontSize: 13, color: '#475569', backgroundColor: 'white', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  closeDetailBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10
  },
  closeDetailBtnText: { fontSize: 13, fontWeight: '800', color: '#475569' },

  // Image Zoom
  imageZoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  imageZoomCard: { width: '100%', maxHeight: '80%', position: 'relative' },
  zoomedImage: { width: '100%', height: '100%', borderRadius: 12 },
  closeZoomBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 8
  }
});
