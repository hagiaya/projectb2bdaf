import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function SalesVisits() {
  const [loading, setLoading] = useState(true);
  const [dealers, setDealers] = useState<any[]>([]);
  const [salesId, setSalesId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'assigned' | 'history'>('assigned');
  const [visitHistory, setVisitHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Real User Fetch
      const { data: sData } = await supabase
        .from('sales')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (sData) {
        setSalesId(sData.id);

        // 1. Fetch Assigned Dealers
        const { data: dealerData, error } = await supabase
          .from('dealers')
          .select('id, store_name, address, latitude, longitude, status')
          .eq('sales_id', sData.id);

        if (error) throw error;

        // Fetch recent visits for each dealer
        const enrichedDealers = await Promise.all(
          (dealerData || []).map(async (dealer) => {
            const { data: recentVisits } = await supabase
              .from('sales_visits')
              .select('id, status, created_at')
              .eq('dealer_id', dealer.id)
              .eq('sales_id', sData.id)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              ...dealer,
              lastVisit: recentVisits?.[0] || null,
            };
          })
        );
        setDealers(enrichedDealers);

        // 2. Fetch Visit History for this sales
        const { data: hData } = await supabase
          .from('sales_visits')
          .select('id, check_in_time, check_out_time, unit_percentage, owner_met, status, dealers(store_name, address)')
          .eq('sales_id', sData.id)
          .eq('status', 'COMPLETED')
          .order('check_out_time', { ascending: false })
          .limit(20);

        setVisitHistory(
          (hData || []).map((h: any) => ({
            id: h.id,
            store_name: h.dealers?.store_name || 'Toko',
            check_in_time: h.check_in_time,
            check_out_time: h.check_out_time,
            unit_percentage: h.unit_percentage,
            owner_met: h.owner_met,
            status: h.status,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching visits data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVisit = async (dealerId: string) => {
    if (!salesId) return;

    if (salesId === 'dummy-sales-id') {
      router.push({
        pathname: '/(sales)/active-visit',
        params: { visitId: 'dummy-visit-' + Date.now(), dealerId },
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_visits')
        .insert({
          sales_id: salesId,
          dealer_id: dealerId,
          status: 'IN_PROGRESS',
        })
        .select()
        .single();

      if (error) throw error;

      router.push({
        pathname: '/(sales)/active-visit',
        params: { visitId: data.id, dealerId },
      });
    } catch (err: any) {
      Alert.alert('Gagal Memulai Visit', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const openMap = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${lat},${lng}`;
      const url = Platform.select({
        ios: `${scheme}${address || 'Toko'}@${latLng}`,
        android: `${scheme}${latLng}(${address || 'Toko'})`,
        default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
      });
      if (url) Linking.openURL(url);
    } else if (address) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
    }
  };

  const renderDealerItem = ({ item }: { item: any }) => {
    const lastVisit = item.lastVisit;
    let isLocked = false;
    let statusText = 'Siap dikunjungi';
    let statusColor = '#16a34a';

    if (lastVisit) {
      if (lastVisit.status === 'IN_PROGRESS') {
        statusText = 'Visitasi sedang berjalan';
        statusColor = '#d97706';
      } else if (lastVisit.status === 'COMPLETED') {
        const lastDate = new Date(lastVisit.created_at);
        const today = new Date();
        const diffDays = Math.floor(Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 2) {
          isLocked = true;
          statusText = `Cooldown 2 Hari (Kunjungan: ${lastDate.toLocaleDateString('id-ID')})`;
          statusColor = '#ef4444';
        } else {
          statusText = `Kunjungan Terakhir: ${lastDate.toLocaleDateString('id-ID')}`;
          statusColor = '#64748b';
        }
      }
    }

    return (
      <View style={[styles.card, isLocked && styles.cardLocked]}>
        <View style={styles.cardTop}>
          <View style={styles.storeIconBox}>
            <Feather name="shopping-bag" size={20} color="#8ec44a" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.storeName}>{item.store_name}</Text>
            <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => openMap(item.latitude, item.longitude, item.address)}
          >
            <Feather name="navigation" size={16} color="#0284c7" />
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <Feather name={isLocked ? 'lock' : 'info'} size={13} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {lastVisit?.status === 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: '#d97706' }]}
              onPress={() =>
                router.push({
                  pathname: '/(sales)/active-visit',
                  params: { visitId: lastVisit.id, dealerId: item.id },
                })
              }
            >
              <Feather name="play" size={14} color="white" />
              <Text style={styles.btnActionText}>Lanjutkan Visitasi</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnAction, isLocked && styles.btnActionDisabled]}
              onPress={() => startVisit(item.id)}
              disabled={isLocked}
            >
              <Feather name="log-in" size={14} color="white" />
              <Text style={styles.btnActionText}>Check-in Kunjungan</Text>
            </TouchableOpacity>
          )}

          {/* Toko Orders Button */}
          <TouchableOpacity
            style={styles.btnOrder}
            onPress={() => router.push({ pathname: '/(sales)/create-order', params: { dealerId: item.id } })}
          >
            <Feather name="file-text" size={14} color="#8ec44a" />
            <Text style={styles.btnOrderText}>Pesanan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyStore}>{item.store_name}</Text>
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>SELESAI</Text>
          </View>
        </View>
        <Text style={styles.historyTime}>
          {new Date(item.check_in_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} •{' '}
          {new Date(item.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} s/d{' '}
          {item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
        </Text>
        <View style={styles.historyFooter}>
          <Text style={styles.historyDetail}>Unit Toko: {item.unit_percentage ?? '-'}%</Text>
          <Text style={styles.historyDetail}>
            {item.owner_met ? '✓ Bertemu Owner' : '✗ Tidak Bertemu Owner'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Kunjungan Lapangan</Text>
            <Text style={styles.subTitle}>Daftar outlet dan jadwal visitasi</Text>
          </View>
          <TouchableOpacity
            style={styles.addDealerBtn}
            onPress={() => router.push('/(sales)/new-dealer')}
          >
            <Feather name="plus" size={16} color="white" />
            <Text style={styles.addDealerBtnText}>Toko Baru</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Filter */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, filterTab === 'assigned' && styles.tabBtnActive]}
            onPress={() => setFilterTab('assigned')}
          >
            <Text style={[styles.tabText, filterTab === 'assigned' && styles.tabTextActive]}>
              Toko Binaan ({dealers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, filterTab === 'history' && styles.tabBtnActive]}
            onPress={() => setFilterTab('history')}
          >
            <Text style={[styles.tabText, filterTab === 'history' && styles.tabTextActive]}>
              Riwayat Visit ({visitHistory.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8ec44a" />
        </View>
      ) : filterTab === 'assigned' ? (
        <FlatList
          data={dealers}
          keyExtractor={(item) => item.id}
          renderItem={renderDealerItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="map" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Belum Ada Toko Binaan</Text>
              <Text style={styles.emptyText}>
                Anda belum memiliki toko binaan yang ditugaskan oleh Admin. Klik tombol "+ Toko Baru" untuk mendaftarkan toko pertama Anda!
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={visitHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Belum Ada Kunjungan</Text>
              <Text style={styles.emptyText}>Riwayat kunjungan toko Anda yang telah selesai akan muncul di sini.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 56,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addDealerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8ec44a',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addDealerBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#8ec44a', fontWeight: '700' },
  listContainer: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLocked: { backgroundColor: '#f8fafc', opacity: 0.85 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  address: { fontSize: 13, color: '#64748b', marginTop: 3 },
  mapBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8 },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8ec44a',
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnActionDisabled: { backgroundColor: '#cbd5e1' },
  btnActionText: { color: 'white', fontWeight: '700', fontSize: 13 },
  btnOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnOrderText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  historyCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyStore: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  historyBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  historyBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803d' },
  historyTime: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 8 },
  historyFooter: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  historyDetail: { fontSize: 12, color: '#475569', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 16 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 8, lineHeight: 20, fontSize: 13 },
});
