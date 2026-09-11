import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function SalesLeave() {
  const [loading, setLoading] = useState(false);
  const [salesId, setSalesId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [leaveType, setLeaveType] = useState<'SICK' | 'ANNUAL'>('SICK');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);

  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // Default dates to today
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setUserId(user.id);
      const { data: sData } = await supabase
        .from('sales')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (sData) {
        setSalesId(sData.id);
        fetchHistory(sData.id);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const fetchHistory = async (sId: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_leaves')
        .select('*')
        .eq('sales_id', sId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveHistory(data || []);
    } catch (error) {
      console.error('Error fetching leave history:', error);
    }
  };

  const pickProofImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Dibutuhkan izin galeri/file untuk memilih surat dokter.');
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
    } catch (error) {
      console.error('Error picking proof image:', error);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert('Perhatian', 'Harap lengkapi tanggal mulai, tanggal selesai, dan alasan pengajuan.');
      return;
    }

    if (leaveType === 'SICK' && !proofBase64 && !proofUri) {
      Alert.alert('Surat Dokter Wajib', 'Pengajuan izin Sakit wajib menyertakan foto/dokumen surat keterangan dokter.');
      return;
    }

    setLoading(true);
    try {
      if (!salesId || salesId === 'dummy-sales-id') {
        // Local state update for demo mode
        const newItem = {
          id: 'demo-' + Date.now(),
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          proof_image_url: proofUri,
          status: 'PENDING',
          admin_notes: null,
        };
        setLeaveHistory([newItem, ...leaveHistory]);
        Alert.alert('Berhasil', 'Pengajuan izin berhasil dikirim (Demo Mode). Menunggu persetujuan Admin.');
        setReason('');
        setProofUri(null);
        setProofBase64(null);
        setLoading(false);
        return;
      }

      let photoUrl = null;

      if (proofBase64 && userId) {
        const filePath = `${userId}/sales/leave_${Date.now()}.jpg`;
        const cleanBase64 = proofBase64.replace(/^data:image\/\w+;base64,/, '');

        const { error: uploadError } = await supabase.storage
          .from('dealer_documents')
          .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg' });

        if (!uploadError) {
          photoUrl = supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
        }
      }

      const { error } = await supabase.from('sales_leaves').insert({
        sales_id: salesId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        proof_image_url: photoUrl,
        status: 'PENDING',
      });

      if (error) throw error;

      Alert.alert('Pengajuan Terkirim!', 'Permohonan Anda berhasil dikirimkan ke Admin untuk diverifikasi.');

      setReason('');
      setProofUri(null);
      setProofBase64(null);
      fetchHistory(salesId);
    } catch (err: any) {
      Alert.alert('Gagal Mengajukan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pengajuan Cuti & Izin</Text>
        <Text style={styles.subTitle}>Kelola permohonan izin sakit dan cuti tahunan</Text>
      </View>

      <View style={styles.content}>
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Form Permohonan Izin Baru</Text>

          {/* Type Toggle */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeBtn, leaveType === 'SICK' && styles.typeBtnActive]}
              onPress={() => setLeaveType('SICK')}
            >
              <Feather name="plus-circle" size={16} color={leaveType === 'SICK' ? '#16a34a' : '#64748b'} />
              <Text style={[styles.typeText, leaveType === 'SICK' && styles.typeTextActive]}>Izin Sakit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, leaveType === 'ANNUAL' && styles.typeBtnActive]}
              onPress={() => setLeaveType('ANNUAL')}
            >
              <Feather name="calendar" size={16} color={leaveType === 'ANNUAL' ? '#16a34a' : '#64748b'} />
              <Text style={[styles.typeText, leaveType === 'ANNUAL' && styles.typeTextActive]}>Cuti Tahunan</Text>
            </TouchableOpacity>
          </View>

          {/* Dates */}
          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Tanggal Mulai *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Tanggal Selesai *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          {/* Reason */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Alasan / Keterangan Lengkap *</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Jelaskan alasan izin / sakit secara rinci..."
              multiline
              value={reason}
              onChangeText={setReason}
            />
          </View>

          {/* Doctor Note upload for SICK */}
          {leaveType === 'SICK' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.label}>Foto Surat Keterangan Dokter *</Text>
              <TouchableOpacity style={styles.photoBox} onPress={pickProofImage}>
                {proofUri ? (
                  <Image source={{ uri: proofUri }} style={styles.photoImg} contentFit="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Feather name="upload-cloud" size={30} color="#8ec44a" />
                    <Text style={styles.photoText}>Pilih Surat Dokter dari Galeri / File</Text>
                    <Text style={styles.photoSub}>Format JPG/PNG, pastikan terbaca jelas</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>Kirimkan Permohonan</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <Text style={styles.sectionTitle}>Riwayat Permohonan Izin</Text>
        {leaveHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Belum ada riwayat pengajuan cuti atau izin.</Text>
          </View>
        ) : (
          leaveHistory.map((item) => {
            const isApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';
            const badgeColor = isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#854d0e';
            const badgeBg = isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef9c3';

            return (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.leave_type === 'SICK' ? 'SURAT SAKIT' : 'CUTI TAHUNAN'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                      {item.status === 'APPROVED' ? 'DISETUJUI' : item.status === 'REJECTED' ? 'DITOLAK' : 'MENUNGGU'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyDates}>
                  {item.start_date} s/d {item.end_date}
                </Text>
                <Text style={styles.historyReason}>{item.reason}</Text>

                {item.admin_notes && (
                  <View style={styles.adminNoteBox}>
                    <Text style={styles.adminNoteLabel}>Catatan Admin:</Text>
                    <Text style={styles.adminNoteVal}>{item.admin_notes}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    padding: 20,
    paddingTop: 56,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  content: { padding: 16 },
  card: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 14 },
  typeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  typeBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  typeText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeTextActive: { color: '#16a34a', fontWeight: '700' },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  photoBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPlaceholder: { alignItems: 'center', padding: 24 },
  photoText: { color: '#8ec44a', fontWeight: '700', marginTop: 8, fontSize: 13 },
  photoSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  photoImg: { width: '100%', height: 160 },
  submitBtn: {
    backgroundColor: '#8ec44a',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  historyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  historyDates: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  historyReason: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  adminNoteBox: { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#8ec44a' },
  adminNoteLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },
  adminNoteVal: { fontSize: 12, color: '#334155', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 30, padding: 20 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontSize: 13 },
});
