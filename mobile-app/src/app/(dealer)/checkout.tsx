import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/supabase';

export default function CheckoutScreen() {
  const { items, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const [isLoadingDealer, setIsLoadingDealer] = useState(true);

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
          .single();
          
        if (error) {
          console.error("Fetch dealer error:", error);
          if (Platform.OS === 'web') window.alert("Gagal memuat data toko. Apakah pendaftaran sudah disetujui Admin secara penuh?");
          else Alert.alert('Error', 'Gagal memuat data toko. Pastikan akun sudah disetujui Admin.');
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

  const handlePayment = async () => {
    if (!dealerData) {
      Alert.alert('Error', 'Data dealer tidak ditemukan.');
      return;
    }

    setLoading(true);
    try {
      // 1. Generate Order Number (ORD-TIMESTAMP)
      const orderNumber = `ORD-${Date.now()}`;
      
      // 2. Insert Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          dealer_id: dealerData.id,
          order_number: orderNumber,
          total_amount: cartTotal,
          final_amount: cartTotal, // Belum ada diskon dsb
          status: 'PENDING'
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
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsError) throw itemsError;

      // 4. Create Midtrans Transaction
      const { data: txData, error: txError } = await supabase.functions.invoke('create-midtrans-transaction', {
        body: { order_id: orderId }
      });

      if (txError || !txData?.success) {
        throw new Error(txData?.error || txError?.message || "Gagal menghubungi Midtrans");
      }

      clearCart();

      // 5. Buka Midtrans Payment URL di In-App Browser
      if (txData.payment_url) {
        if (txData.payment_url.includes('dummy')) {
           const msg = 'Pesanan masuk ke mode Simulasi karena Server Key Midtrans belum diatur.';
           if (Platform.OS === 'web') {
             window.alert(msg);
             router.push('/(dealer)/orders');
           } else {
             Alert.alert('Simulasi Berhasil', msg, [{ text: 'OK', onPress: () => router.push('/(dealer)/orders') }]);
           }
        } else {
           await WebBrowser.openBrowserAsync(txData.payment_url);
           router.push('/(dealer)/orders');
        }
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Terjadi kesalahan saat memproses pesanan.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Gagal Checkout', msg);
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
        <Text style={styles.headerTitle}>Ringkasan Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
          {isLoadingDealer ? (
            <ActivityIndicator size="small" color="#8ec44a" />
          ) : dealerData ? (
            <>
              <Text style={styles.boldText}>{dealerData.store_name}</Text>
              <Text style={styles.text}>{dealerData.address || 'Alamat tidak tersedia'}</Text>
            </>
          ) : (
            <Text style={[styles.text, {color: '#ef4444'}]}>⚠️ Data Toko/Dealer tidak ditemukan. Harap hubungi Admin.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Produk ({items.length})</Text>
          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
              <Text style={styles.itemTotal}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal Produk</Text>
            <Text style={styles.paymentValue}>Rp {cartTotal.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Biaya Pengiriman</Text>
            <Text style={styles.paymentValue}>Gratis (Menyusul)</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Tagihan</Text>
            <Text style={styles.totalValue}>Rp {cartTotal.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.payBtn, loading && styles.payBtnDisabled]} 
          onPress={handlePayment} 
          disabled={loading || !dealerData}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payBtnText}>Bayar dengan Midtrans</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1e293b',
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  boldText: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 4 },
  text: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemName: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 4 },
  itemQty: { fontSize: 13, color: '#64748b' },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { fontSize: 14, color: '#64748b' },
  paymentValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#8ec44a' },
  bottomBar: { backgroundColor: 'white', padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  payBtn: { backgroundColor: '#8ec44a', padding: 16, borderRadius: 12, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
