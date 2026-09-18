import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function SalesEarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'attendance' | 'payroll'>('sales');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'attendance' | 'visits'>('attendance');

  // Sales profile & settings
  const [salesRecord, setSalesRecord] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Data lists
  const [orders, setOrders] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [visitsList, setVisitsList] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  // Selected payroll for detail modal
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Month & Year Filter
  const currentMonthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNames[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchEarningsData();
  }, [selectedMonth, selectedYear]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // 1. Fetch Profile
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(pData);

      // 2. Fetch Sales Record
      const { data: sData } = await supabase
        .from('sales')
        .select('*, regions(name)')
        .eq('profile_id', user.id)
        .maybeSingle();
      setSalesRecord(sData);

      if (!sData) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const monthIndex = currentMonthNames.indexOf(selectedMonth);
      const startOfMonth = new Date(selectedYear, monthIndex, 1).toISOString();
      const endOfMonth = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999).toISOString();
      const startDateStr = startOfMonth.split('T')[0];
      const endDateStr = endOfMonth.split('T')[0];

      // 3. Fetch Assigned Dealers
      const { data: myDealers } = await supabase
        .from('dealers')
        .select('id, store_name')
        .eq('sales_id', sData.id);

      const dealerIds = (myDealers || []).map((d) => d.id);

      // 4. Fetch Orders of assigned dealers or tagged with this sales_id
      let orderQuery = supabase
        .from('orders')
        .select('id, order_number, dealer_id, total_amount, final_amount, status, created_at, dealers(store_name)')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });

      if (dealerIds.length > 0) {
        orderQuery = orderQuery.or(`sales_id.eq.${sData.id},dealer_id.in.(${dealerIds.join(',')})`);
      } else {
        orderQuery = orderQuery.eq('sales_id', sData.id);
      }

      const { data: orderData } = await orderQuery;
      setOrders(orderData || []);

      // 5. Fetch Attendance
      const { data: attData } = await supabase
        .from('sales_attendance')
        .select('*')
        .eq('sales_id', sData.id)
        .gte('attendance_date', startDateStr)
        .lte('attendance_date', endDateStr)
        .order('attendance_date', { ascending: false });
      setAttendanceList(attData || []);

      // 6. Fetch Visits
      const { data: vData } = await supabase
        .from('sales_visits')
        .select('id, dealer_id, check_in_time, check_out_time, earned_amount, status, notes, unit_percentage, created_at, dealers(store_name)')
        .eq('sales_id', sData.id)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });
      setVisitsList(vData || []);

      // 7. Fetch Official Payroll Slips
      const { data: prData } = await supabase
        .from('sales_payrolls')
        .select('*')
        .eq('sales_id', sData.id)
        .eq('period_month', selectedMonth)
        .eq('period_year', selectedYear)
        .order('created_at', { ascending: false });
      setPayrolls(prData || []);

    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarningsData();
  };

  const formatRupiah = (val: number = 0) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  // Commission percentage from sales record (default 1.0% or set by admin)
  const commissionRate = Number(salesRecord?.direct_commission_pct || 1.0) / 100;

  // Total sales stats
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalCompletedTurnover = completedOrders.reduce((sum, o) => sum + (o.final_amount || o.total_amount || 0), 0);
  const totalEstimatedCommission = totalCompletedTurnover * commissionRate;

  // Attendance & visit stats
  const presentDaysCount = attendanceList.filter((a) => a.status === 'PRESENT').length;
  const completedVisitsCount = visitsList.filter((v) => v.status === 'COMPLETED').length;

  const baseSalary = Number(salesRecord?.base_salary || 4500000);
  const targetVisits = (Number(salesRecord?.daily_visit_target) || 6) * (Number(salesRecord?.work_days_per_month) || 26);
  const valuePerVisit = targetVisits > 0 ? baseSalary / targetVisits : 28846;
  const earnedVisitSalary = Math.round(completedVisitsCount * valuePerVisit);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Histori Pendapatan</Text>
          <Text style={styles.headerSubtitle}>{profile?.full_name || 'Sales Force'} • {salesRecord?.regions?.name || 'Area Bebas'}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchEarningsData}>
          <Feather name="rotate-cw" size={18} color="#8ec44a" />
        </TouchableOpacity>
      </View>

      {/* Month & Year Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          <Feather name="calendar" size={14} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.filterLabel}>Periode:</Text>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>{selectedMonth} {selectedYear}</Text>
          </View>
        </View>
        <Text style={styles.filterNotice}>Dihitung real-time dari aktivitas Anda</Text>
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'sales' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sales')}
        >
          <Feather
            name="trending-up"
            size={16}
            color={activeTab === 'sales' ? '#8ec44a' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
            1. Penjualan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'attendance' && styles.tabButtonActive]}
          onPress={() => setActiveTab('attendance')}
        >
          <Feather
            name="check-circle"
            size={16}
            color={activeTab === 'attendance' ? '#8ec44a' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
            2. Absensi & Visit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'payroll' && styles.tabButtonActive]}
          onPress={() => setActiveTab('payroll')}
        >
          <Feather
            name="file-text"
            size={16}
            color={activeTab === 'payroll' ? '#8ec44a' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'payroll' && styles.tabTextActive]}>
            Slip Gaji
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8ec44a']} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#8ec44a" />
            <Text style={styles.loadingText}>Memuat rincian histori pendapatan...</Text>
          </View>
        ) : (
          <>
            {/* ==================== TAB 1: PENJUALAN & KOMISI ==================== */}
            {activeTab === 'sales' && (
              <View>
                {/* Highlight Card Penjualan */}
                <View style={styles.summaryCardGreen}>
                  <View style={styles.summaryCardHeader}>
                    <View>
                      <Text style={styles.summarySubTitle}>Estimasi Komisi Penjualan</Text>
                      <Text style={styles.summaryMainValue}>{formatRupiah(totalEstimatedCommission)}</Text>
                    </View>
                    <View style={styles.summaryIconBox}>
                      <Feather name="percent" size={24} color="#ffffff" />
                    </View>
                  </View>
                  <View style={styles.summaryCardFooter}>
                    <View style={styles.summaryMiniStat}>
                      <Text style={styles.miniStatLabel}>Total Omset Selesai</Text>
                      <Text style={styles.miniStatValue}>{formatRupiah(totalCompletedTurnover)}</Text>
                    </View>
                    <View style={styles.summaryMiniDivider} />
                    <View style={styles.summaryMiniStat}>
                      <Text style={styles.miniStatLabel}>Rate Komisi</Text>
                      <Text style={styles.miniStatValue}>{(commissionRate * 100).toFixed(1)}%</Text>
                    </View>
                    <View style={styles.summaryMiniDivider} />
                    <View style={styles.summaryMiniStat}>
                      <Text style={styles.miniStatLabel}>Order Selesai</Text>
                      <Text style={styles.miniStatValue}>{completedOrders.length} Transaksi</Text>
                    </View>
                  </View>
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Riwayat Order Toko Binaan</Text>
                    <Text style={styles.sectionSubtitle}>
                      {orders.length} order tercatat pada {selectedMonth} {selectedYear}
                    </Text>
                  </View>
                </View>

                {/* Orders List */}
                {orders.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Feather name="inbox" size={36} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
                    <Text style={styles.emptyDesc}>
                      Belum ada order toko binaan yang tercatat untuk periode ini.
                    </Text>
                  </View>
                ) : (
                  orders.map((order) => {
                    const isCompleted = order.status === 'COMPLETED';
                    const orderAmount = order.final_amount || order.total_amount || 0;
                    const commissionAmount = orderAmount * commissionRate;

                    return (
                      <View key={order.id} style={styles.orderCard}>
                        <View style={styles.orderCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.storeNameText}>{order.dealers?.store_name || 'Toko Retail'}</Text>
                            <Text style={styles.orderNumberText}>#{order.order_number || order.id.slice(0, 8)}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              isCompleted
                                ? { backgroundColor: '#dcfce7', borderColor: '#86efac' }
                                : { backgroundColor: '#fef3c7', borderColor: '#fde047' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isCompleted ? { color: '#15803d' } : { color: '#b45309' },
                              ]}
                            >
                              {isCompleted ? 'SELESAI' : order.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.orderDivider} />

                        <View style={styles.orderCardBottom}>
                          <View>
                            <Text style={styles.orderLabelSmall}>Nilai Belanja</Text>
                            <Text style={styles.orderAmountValue}>{formatRupiah(orderAmount)}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.orderLabelSmall}>Estimasi Komisi ({(commissionRate * 100).toFixed(1)}%)</Text>
                            <Text style={[styles.commissionValue, !isCompleted && { color: '#94a3b8' }]}>
                              {formatRupiah(commissionAmount)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.orderDateRow}>
                          <Feather name="clock" size={11} color="#94a3b8" />
                          <Text style={styles.orderDateText}>
                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ==================== TAB 2: ABSENSI & VISITASI ==================== */}
            {activeTab === 'attendance' && (
              <View>
                {/* Highlight Card Absensi & Visit */}
                <View style={styles.summaryCardBlue}>
                  <View style={styles.summaryCardHeader}>
                    <View>
                      <Text style={styles.summarySubTitle}>Estimasi Gaji Pokok Sesuai Visit</Text>
                      <Text style={styles.summaryMainValue}>{formatRupiah(earnedVisitSalary)}</Text>
                    </View>
                    <View style={styles.summaryIconBoxBlue}>
                      <Feather name="map-pin" size={24} color="#ffffff" />
                    </View>
                  </View>
                  <View style={styles.summaryCardFooter}>
                    <View style={styles.summaryMiniStat}>
                      <Text style={styles.miniStatLabel}>Hadir Kerja</Text>
                      <Text style={styles.miniStatValue}>{presentDaysCount} Hari</Text>
                    </View>
                    <View style={styles.summaryMiniDivider} />
                    <View style={styles.summaryMiniStat}>
                      <Text style={styles.miniStatLabel}>Kunjungan Selesai</Text>
                      <Text style={styles.miniStatValue}>{completedVisitsCount} Toko</Text>
                    </View>
                    <View style={styles.summaryMiniDivider} />
                    <View style={styles.summaryMiniStat}>
                      <Text style={styles.miniStatLabel}>Target Bulanan</Text>
                      <Text style={styles.miniStatValue}>{targetVisits} Visit</Text>
                    </View>
                  </View>
                </View>

                {/* Sub Tab Switcher */}
                <View style={styles.subTabRow}>
                  <TouchableOpacity
                    style={[styles.subTabBtn, attendanceSubTab === 'attendance' && styles.subTabBtnActive]}
                    onPress={() => setAttendanceSubTab('attendance')}
                  >
                    <Feather
                      name="clock"
                      size={14}
                      color={attendanceSubTab === 'attendance' ? '#ffffff' : '#64748b'}
                    />
                    <Text
                      style={[styles.subTabText, attendanceSubTab === 'attendance' && styles.subTabTextActive]}
                    >
                      Riwayat Presensi ({attendanceList.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.subTabBtn, attendanceSubTab === 'visits' && styles.subTabBtnActive]}
                    onPress={() => setAttendanceSubTab('visits')}
                  >
                    <Feather
                      name="map"
                      size={14}
                      color={attendanceSubTab === 'visits' ? '#ffffff' : '#64748b'}
                    />
                    <Text style={[styles.subTabText, attendanceSubTab === 'visits' && styles.subTabTextActive]}>
                      Riwayat Kunjungan ({visitsList.length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sub Tab Content: Absensi */}
                {attendanceSubTab === 'attendance' && (
                  <View>
                    {attendanceList.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Feather name="calendar" size={36} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Belum Ada Data Presensi</Text>
                        <Text style={styles.emptyDesc}>
                          Belum ada catatan check-in untuk periode {selectedMonth} {selectedYear}.
                        </Text>
                      </View>
                    ) : (
                      attendanceList.map((att) => {
                        const isLate = att.is_late;
                        const hasCheckedOut = Boolean(att.check_out_time);

                        return (
                          <View key={att.id} style={styles.attendanceItemCard}>
                            <View style={styles.attItemTop}>
                              <View style={styles.dateCircle}>
                                <Text style={styles.dateCircleDay}>
                                  {new Date(att.attendance_date).getDate()}
                                </Text>
                                <Text style={styles.dateCircleMonth}>
                                  {new Date(att.attendance_date).toLocaleDateString('id-ID', { month: 'short' })}
                                </Text>
                              </View>
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.attDayText}>
                                    {new Date(att.attendance_date).toLocaleDateString('id-ID', { weekday: 'long' })}
                                  </Text>
                                  {isLate ? (
                                    <View style={styles.lateBadgeSmall}>
                                      <Text style={styles.lateBadgeText}>Terlambat</Text>
                                    </View>
                                  ) : (
                                    <View style={styles.onTimeBadgeSmall}>
                                      <Text style={styles.onTimeBadgeText}>Tepat Waktu</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.attFullDateText}>{att.attendance_date}</Text>
                              </View>
                              <View
                                style={[
                                  styles.statusPill,
                                  hasCheckedOut
                                    ? { backgroundColor: '#dcfce7' }
                                    : { backgroundColor: '#fef3c7' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    hasCheckedOut ? { color: '#166534' } : { color: '#92400e' },
                                  ]}
                                >
                                  {hasCheckedOut ? 'Selesai' : 'Bertugas'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.attHoursRow}>
                              <View style={styles.hourBox}>
                                <Text style={styles.hourLabel}>Masuk</Text>
                                <Text style={styles.hourValue}>
                                  {att.check_in_time
                                    ? new Date(att.check_in_time).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '-'}
                                </Text>
                              </View>
                              <View style={styles.hourBox}>
                                <Text style={styles.hourLabel}>Pulang</Text>
                                <Text style={styles.hourValue}>
                                  {att.check_out_time
                                    ? new Date(att.check_out_time).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Belum Pulang'}
                                </Text>
                              </View>
                              <View style={styles.hourBox}>
                                <Text style={styles.hourLabel}>Display Toko</Text>
                                <Text style={styles.hourValue}>
                                  {att.unit_percentage ? `${att.unit_percentage}%` : '-'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* Sub Tab Content: Visitasi */}
                {attendanceSubTab === 'visits' && (
                  <View>
                    {visitsList.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Feather name="map-pin" size={36} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>Belum Ada Kunjungan</Text>
                        <Text style={styles.emptyDesc}>
                          Belum ada data kunjungan toko yang tercatat pada periode ini.
                        </Text>
                      </View>
                    ) : (
                      visitsList.map((visit) => {
                        const isDone = visit.status === 'COMPLETED';

                        return (
                          <View key={visit.id} style={styles.visitItemCard}>
                            <View style={styles.visitItemTop}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.visitStoreName}>
                                  {visit.dealers?.store_name || 'Toko Retail'}
                                </Text>
                                <Text style={styles.visitTimeText}>
                                  {new Date(visit.created_at).toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.visitEarnedLabel}>Nilai Visit</Text>
                                <Text style={styles.visitEarnedValue}>
                                  +{formatRupiah(Number(visit.earned_amount) || Math.round(valuePerVisit))}
                                </Text>
                              </View>
                            </View>

                            {visit.notes && (
                              <View style={styles.visitNoteBox}>
                                <Feather name="message-square" size={11} color="#64748b" />
                                <Text style={styles.visitNoteText} numberOfLines={2}>
                                  {visit.notes}
                                </Text>
                              </View>
                            )}

                            <View style={styles.visitFooterRow}>
                              <View
                                style={[
                                  styles.visitStatusPill,
                                  isDone ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fef3c7' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.visitStatusPillText,
                                    isDone ? { color: '#166534' } : { color: '#b45309' },
                                  ]}
                                >
                                  {isDone ? 'TERVERIFIKASI' : 'SEDANG BERLANGSUNG'}
                                </Text>
                              </View>
                              {visit.unit_percentage !== null && (
                                <Text style={styles.visitUnitText}>
                                  Display DAP: {visit.unit_percentage}%
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ==================== TAB 3: SLIP GAJI BULANAN ==================== */}
            {activeTab === 'payroll' && (
              <View>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Slip Gaji Resmi dari Admin</Text>
                    <Text style={styles.sectionSubtitle}>
                      Dokumen resmi penghasilan bulanan yang telah disetujui kantor
                    </Text>
                  </View>
                </View>

                {payrolls.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Feather name="file-text" size={36} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>Belum Ada Slip Gaji</Text>
                    <Text style={styles.emptyDesc}>
                      Slip gaji untuk periode {selectedMonth} {selectedYear} belum diterbitkan oleh Admin. Silakan periksa kembali setelah rekap akhir bulan.
                    </Text>
                  </View>
                ) : (
                  payrolls.map((pr) => {
                    const isPaid = pr.status === 'PAID';

                    return (
                      <View key={pr.id} style={styles.payrollCard}>
                        <View style={styles.payrollCardHeader}>
                          <View>
                            <Text style={styles.payrollNumberText}>{pr.payroll_number || 'SLIP GAJI RESMI'}</Text>
                            <Text style={styles.payrollPeriodText}>
                              Periode {pr.period_month} {pr.period_year}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.payrollBadge,
                              isPaid ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fef3c7' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.payrollBadgeText,
                                isPaid ? { color: '#15803d' } : { color: '#b45309' },
                              ]}
                            >
                              {isPaid ? 'SUDAH DIBAYAR' : 'TERBIT / DRAFT'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.payrollDivider} />

                        {/* Breakdown Rows */}
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>1. Gaji Pokok Visitasi ({pr.achieved_visits || 0} visit)</Text>
                          <Text style={styles.breakdownValue}>{formatRupiah(pr.earned_visit_salary || 0)}</Text>
                        </View>

                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>2. Insentif Penjualan</Text>
                          <Text style={styles.breakdownValue}>{formatRupiah(pr.earned_incentive_amount || 0)}</Text>
                        </View>

                        {Number(pr.spv_direct_sales_commission || 0) > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>3. Komisi SPV Direct Sales</Text>
                            <Text style={styles.breakdownValue}>{formatRupiah(pr.spv_direct_sales_commission)}</Text>
                          </View>
                        )}

                        {Number(pr.team_bonus_amount || 0) > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>4. Bonus Tim SPV</Text>
                            <Text style={styles.breakdownValue}>{formatRupiah(pr.team_bonus_amount)}</Text>
                          </View>
                        )}

                        {Number(pr.other_bonus || 0) > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Bonus Tambahan</Text>
                            <Text style={styles.breakdownValue}>{formatRupiah(pr.other_bonus)}</Text>
                          </View>
                        )}

                        {Number(pr.deductions_amount || 0) > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={[styles.breakdownLabel, { color: '#ef4444' }]}>Potongan</Text>
                            <Text style={[styles.breakdownValue, { color: '#ef4444' }]}>
                              -{formatRupiah(pr.deductions_amount)}
                            </Text>
                          </View>
                        )}

                        <View style={styles.totalSalaryBox}>
                          <View>
                            <Text style={styles.totalSalaryLabel}>Total Gaji Bersih (THP)</Text>
                            <Text style={styles.totalSalaryNotice}>Transfer ke rekening Anda</Text>
                          </View>
                          <Text style={styles.totalSalaryValue}>{formatRupiah(pr.net_salary || 0)}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.detailBtn}
                          onPress={() => {
                            setSelectedPayroll(pr);
                            setModalVisible(true);
                          }}
                        >
                          <Feather name="eye" size={14} color="#8ec44a" />
                          <Text style={styles.detailBtnText}>Buka Rincian Lengkap Slip Gaji</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Detail Slip Gaji Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rincian Slip Gaji</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedPayroll?.payroll_number} • {selectedPayroll?.period_month} {selectedPayroll?.period_year}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>A. Data Sales</Text>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Nama Sales</Text>
                  <Text style={styles.modalVal}>{profile?.full_name}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Jabatan</Text>
                  <Text style={styles.modalVal}>
                    {salesRecord?.is_spv ? 'Supervisor Sales (SPV)' : 'Sales Representative'}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Wilayah Kerja</Text>
                  <Text style={styles.modalVal}>{salesRecord?.regions?.name || 'Area Bebas'}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>B. Rincian Komponen Gaji</Text>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Gaji Pokok Acuan</Text>
                  <Text style={styles.modalVal}>{formatRupiah(selectedPayroll?.nominal_base_salary)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Realisasi Kunjungan</Text>
                  <Text style={styles.modalVal}>
                    {selectedPayroll?.achieved_visits} / {selectedPayroll?.target_visits} visit ({selectedPayroll?.visit_achievement_pct}%)
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Gaji Pokok Diterima</Text>
                  <Text style={[styles.modalVal, { fontWeight: 'bold', color: '#16a34a' }]}>
                    {formatRupiah(selectedPayroll?.earned_visit_salary)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Realisasi Penjualan</Text>
                  <Text style={styles.modalVal}>{formatRupiah(selectedPayroll?.achieved_sales_amount)}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Insentif Penjualan</Text>
                  <Text style={[styles.modalVal, { fontWeight: 'bold', color: '#16a34a' }]}>
                    +{formatRupiah(selectedPayroll?.earned_incentive_amount)}
                  </Text>
                </View>
                {Number(selectedPayroll?.other_bonus || 0) > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Bonus: {selectedPayroll?.bonus_notes || 'Lain-lain'}</Text>
                    <Text style={[styles.modalVal, { color: '#16a34a' }]}>
                      +{formatRupiah(selectedPayroll?.other_bonus)}
                    </Text>
                  </View>
                )}
                {Number(selectedPayroll?.deductions_amount || 0) > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Potongan: {selectedPayroll?.deduction_notes || 'Lain-lain'}</Text>
                    <Text style={[styles.modalVal, { color: '#dc2626' }]}>
                      -{formatRupiah(selectedPayroll?.deductions_amount)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.modalSection, { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10 }]}>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { fontWeight: 'bold', color: '#15803d', fontSize: 14 }]}>
                    Take Home Pay (THP)
                  </Text>
                  <Text style={{ fontWeight: 'bold', color: '#15803d', fontSize: 16 }}>
                    {formatRupiah(selectedPayroll?.net_salary)}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
                  Status: {selectedPayroll?.status === 'PAID' ? 'Sudah Dibayarkan via Transfer' : 'Draft / Disetujui'}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f6fbf0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 6,
  },
  monthBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterNotice: {
    fontSize: 10,
    color: '#94a3b8',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  tabButtonActive: {
    backgroundColor: '#f6fbf0',
    borderWidth: 1.5,
    borderColor: '#8ec44a',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#3f6212',
    fontWeight: '800',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  summaryCardGreen: {
    backgroundColor: '#15803d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCardBlue: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summarySubTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryMainValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconBoxBlue: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  summaryMiniStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryMiniDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  miniStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderNumberText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabelSmall: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  orderAmountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#16a34a',
  },
  orderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  orderDateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  subTabBtnActive: {
    backgroundColor: '#0284c7',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  subTabTextActive: {
    color: '#ffffff',
  },
  attendanceItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleDay: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  dateCircleMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  attDayText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  attFullDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  lateBadgeSmall: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  onTimeBadgeSmall: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onTimeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  attHoursRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    gap: 8,
  },
  hourBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  hourLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2,
  },
  hourValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  visitItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  visitItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  visitStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  visitTimeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  visitEarnedLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  visitEarnedValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#16a34a',
  },
  visitNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  visitNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  visitFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  visitStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  visitStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  visitUnitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8ec44a',
  },
  payrollCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  payrollCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  payrollNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  payrollPeriodText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  payrollBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payrollBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  payrollDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#475569',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalSalaryBox: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSalaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  totalSalaryNotice: {
    fontSize: 10,
    color: '#15803d',
    marginTop: 1,
  },
  totalSalaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f6fbf0',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3f6212',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  modalVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalCloseButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
