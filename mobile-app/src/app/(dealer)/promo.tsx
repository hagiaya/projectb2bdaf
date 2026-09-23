import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useSafeBottom } from '../../hooks/useSafeBottom';

interface Promo {
  id: number | string;
  title: string;
  desc: string;
  code: string;
  expire: string;
  banner_url?: string | null;
}

export default function PromoScreen() {
  const safeBottom = useSafeBottom();
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const now = new Date().getTime();
      // Filter out expired promos if expires_at is set
      const activeData = data.filter(p => !p.expires_at || new Date(p.expires_at).getTime() >= now);

      const mappedPromos: Promo[] = activeData.map(p => ({
        id: p.id,
        title: p.title || `Diskon ${p.discount_percent}%`,
        desc: p.description || `Diskon ${p.discount_percent}% untuk seluruh pembelanjaan produk.`,
        code: p.code,
        banner_url: p.banner_url || null,
        expire: p.expires_at 
          ? new Date(p.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Berlaku Permanen'
      }));

      setPromos(mappedPromos);
    }
    setIsLoading(false);
  };

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

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: safeBottom }]}>
        {appliedCode && (
          <View style={styles.activeBanner}>
            <Feather name="check-circle" size={20} color="#8ec44a" />
            <Text style={styles.activeText}>Voucher Aktif: <Text style={{ fontWeight: 'bold' }}>{appliedCode}</Text></Text>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#8ec44a" style={{ marginTop: 40 }} />
        ) : promos.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40, marginTop: 40 }}>
            <Feather name="gift" size={48} color="#94a3b8" />
            <Text style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Belum ada promo saat ini.</Text>
          </View>
        ) : (
          promos.map(promo => {
            const isApplied = appliedCode === promo.code;
            return (
              <View key={promo.id} style={[styles.card, isApplied && styles.cardApplied]}>
                {promo.banner_url && (
                  <View style={styles.cardBannerWrap}>
                    <Image source={{ uri: promo.banner_url }} style={styles.cardBannerImg} resizeMode="cover" />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.badge}><Feather name="percent" size={18} color="white" /></View>
                  <View style={{ marginLeft: 50, flex: 1 }}>
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
              </View>
            );
          })
        )}
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
  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#f0f7e6', shadowColor: '#8ec44a', shadowOpacity: 0.05, elevation: 2, overflow: 'hidden' },
  cardBannerWrap: { width: '100%', height: 130, backgroundColor: '#f1f5f9' },
  cardBannerImg: { width: '100%', height: '100%' },
  cardBody: { padding: 16, position: 'relative' },
  cardApplied: { borderColor: '#8ec44a', borderWidth: 2 },
  badge: { position: 'absolute', top: 12, left: 12, width: 44, height: 44, backgroundColor: '#eab308', borderRadius: 22, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
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
