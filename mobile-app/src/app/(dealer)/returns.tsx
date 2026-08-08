import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function ReturnsScreen() {
  const [returns, setReturns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    const { data } = await supabase.from('returns').select('*').order('created_at', { ascending: false });
    if (data) setReturns(data);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retur Barang</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Feather name="plus-circle" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {returns.map(ret => (
          <View key={ret.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.retId}>{ret.return_number}</Text>
              <Text style={[styles.status, ret.status === 'APPROVED' ? styles.statusSuccess : styles.statusWarning]}>{ret.status}</Text>
            </View>
            <Text style={styles.date}>{new Date(ret.created_at).toLocaleDateString('id-ID')}</Text>
            <View style={styles.productInfo}>
              <Feather name="package" size={16} color="#64748b" style={{ marginRight: 8 }} />
              <Text style={styles.productText}>{ret.reason}</Text>
            </View>
            <TouchableOpacity style={styles.detailBtn}>
              <Text style={styles.detailText}>Cek Status</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6fbf0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: '#8ec44a' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  addBtn: { padding: 4 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f7e6', shadowColor: '#8ec44a', shadowOpacity: 0.05, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  retId: { fontSize: 14, fontWeight: 'bold', color: '#4a6b22' },
  status: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusSuccess: { color: '#7eb33a', backgroundColor: '#f0f7e6' },
  statusWarning: { color: '#ca8a04', backgroundColor: '#fef9c3' },
  date: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  productInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6fbf0', padding: 12, borderRadius: 8, marginBottom: 12 },
  productText: { fontSize: 14, color: '#475569', flex: 1 },
  detailBtn: { backgroundColor: '#f6fbf0', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#dcf0c3' },
  detailText: { color: '#8ec44a', fontWeight: 'bold', fontSize: 12 }
});
