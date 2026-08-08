import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Promo {
  id: number;
  title: string;
  desc: string;
  code: string;
  expire: string;
}

export default function PromoScreen() {
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

  const dummyPromos: Promo[] = [
    { id: 1, title: 'Diskon Akhir Tahun 15%', desc: 'Berlaku untuk semua pembelian cat tembok minimal 50 pail.', code: 'YEAREND15', expire: '31 Des 2026' },
    { id: 2, title: 'Cashback Rp 500.000', desc: 'Khusus pembelian Semen Tiga Roda di atas Rp 20.000.000.', code: 'CASHBACK500', expire: '30 Nov 2026' },
    { id: 3, title: 'Gratis Ongkir B2B', desc: 'Tanpa minimal belanja khusus pengiriman area Surabaya & Sidoarjo.', code: 'FREEONGKIRB2B', expire: '15 Nov 2026' },
  ];

  const handleUsePromo = (promo: Promo) => {
    setSelectedPromo(promo);
  };

  const confirmApplyPromo = () => {
    if (selectedPromo) {
      setAppliedCode(selectedPromo.code);
      const currentCode = selectedPromo.code;
      setSelectedPromo(null);
      Alert.alert(
        'Voucher Berhasil Dipasang! 🎉',
        `Kode promo ${currentCode} telah diaktifkan untuk pesanan Anda berikutnya.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promo & Diskon</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {appliedCode && (
          <View style={styles.activeBanner}>
            <Feather name="check-circle" size={20} color="#8ec44a" />
            <Text style={styles.activeText}>Voucher Aktif: <Text style={{ fontWeight: 'bold' }}>{appliedCode}</Text></Text>
          </View>
        )}

        {dummyPromos.map(promo => {
          const isApplied = appliedCode === promo.code;
          return (
            <View key={promo.id} style={[styles.card, isApplied && styles.cardApplied]}>
              <View style={styles.badge}><Feather name="percent" size={20} color="white" /></View>
              <View style={{ marginLeft: 60 }}>
                <Text style={styles.title}>{promo.title}</Text>
                <Text style={styles.desc}>{promo.desc}</Text>
                <View style={styles.footer}>
                  <View>
                    <Text style={styles.codeLabel}>Kode Voucher:</Text>
                    <Text style={styles.code}>{promo.code}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.expireLabel}>Berakhir:</Text>
                    <Text style={styles.expire}>{promo.expire}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.useBtn, isApplied && styles.useBtnDisabled]} 
                  onPress={() => handleUsePromo(promo)}
                  disabled={isApplied}
                >
                  <Text style={styles.useBtnText}>
                    {isApplied ? '✓ Voucher Terpakai' : 'Gunakan Promo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* MODAL KONFIRMASI PENGGUNAAN PROMO */}
      <Modal visible={!!selectedPromo} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Feather name="gift" size={32} color="#8ec44a" />
            </View>
            <Text style={styles.modalTitle}>Gunakan Promo Ini?</Text>
            <Text style={styles.modalDesc}>
              Voucher <Text style={{ fontWeight: 'bold', color: '#8ec44a' }}>{selectedPromo?.code}</Text> ({selectedPromo?.title}) akan dipasang pada keranjang belanja Anda.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedPromo(null)}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmApplyPromo}>
                <Text style={styles.confirmText}>Aktifkan</Text>
              </TouchableOpacity>
            </View>
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
  list: { padding: 16, gap: 16 },
  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0f7e6', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#86efac' },
  activeText: { fontSize: 13, color: '#4a6b22' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0f7e6', shadowColor: '#8ec44a', shadowOpacity: 0.05, elevation: 2, position: 'relative', overflow: 'hidden' },
  cardApplied: { borderColor: '#8ec44a', borderWidth: 2 },
  badge: { position: 'absolute', top: -10, left: -10, width: 60, height: 60, backgroundColor: '#eab308', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#4a6b22', marginBottom: 4 },
  desc: { fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, backgroundColor: '#f6fbf0', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#dcf0c3' },
  codeLabel: { fontSize: 10, color: '#64748b' },
  code: { fontSize: 14, fontWeight: 'bold', color: '#8ec44a', marginTop: 2 },
  expireLabel: { fontSize: 10, color: '#ef4444' },
  expire: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  useBtn: { backgroundColor: '#8ec44a', padding: 12, borderRadius: 8, alignItems: 'center' },
  useBtnDisabled: { backgroundColor: '#94a3b8' },
  useBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', width: '100%', borderRadius: 20, padding: 24, alignItems: 'center' },
  modalIconBox: { width: 60, height: 60, backgroundColor: '#f0f7e6', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  modalDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#8ec44a', alignItems: 'center' },
  confirmText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});
