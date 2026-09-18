import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, Modal, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function SalesHome() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesData, setSalesData] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    completedVisits: 0,
    activeVisits: 0,
    totalDealers: 0,
  });

  // Check-out Modal State
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [checkoutSelfie, setCheckoutSelfie] = useState<{ uri: string; base64?: string } | null>(null);
  const [checkoutDisplay1, setCheckoutDisplay1] = useState<{ uri: string; base64?: string } | null>(null);
  const [checkoutDisplay2, setCheckoutDisplay2] = useState<{ uri: string; base64?: string } | null>(null);
  const [unitPercentage, setUnitPercentage] = useState('80');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Image zoom preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().split('T')[0];

      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // 2. Fetch Sales Record
      const { data: sData } = await supabase
        .from('sales')
        .select('*, regions(name)')
        .eq('profile_id', user.id)
        .maybeSingle();
      setSalesData(sData);

      if (sData) {
        // 3. Fetch Today's Attendance
        const { data: attData } = await supabase
          .from('sales_attendance')
          .select('*')
          .eq('sales_id', sData.id)
          .eq('attendance_date', today)
          .maybeSingle();
        setTodayAttendance(attData);

        // 4. Fetch Stats: visits today
        const { count: completedCount } = await supabase
          .from('sales_visits')
          .select('id', { count: 'exact', head: true })
          .eq('sales_id', sData.id)
          .eq('status', 'COMPLETED')
          .gte('created_at', `${today}T00:00:00Z`);

        const { count: activeCount } = await supabase
          .from('sales_visits')
          .select('id', { count: 'exact', head: true })
          .eq('sales_id', sData.id)
          .eq('status', 'IN_PROGRESS');

        const { count: dealerCount } = await supabase
          .from('dealers')
          .select('id', { count: 'exact', head: true })
          .eq('sales_id', sData.id);

        setStats({
          completedVisits: completedCount || 0,
          activeVisits: activeCount || 0,
          totalDealers: dealerCount || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleCheckIn = async () => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < 10 || currentHour >= 19) {
      Alert.alert(
        'Di Luar Jam Kerja',
        'Presensi masuk (Check-in) hanya dapat dilakukan antara pukul 10:00 hingga 19:00 WIB.'
      );
      return;
    }

    setLoading(true);
    try {
      const today = now.toISOString().split('T')[0];
      const checkInTime = now.toISOString();
      const isLate = currentHour >= 10 && now.getMinutes() > 0;

      if (!salesData?.id || salesData.id === 'dummy-sales-id') {
        setTodayAttendance({
          attendance_date: today,
          check_in_time: checkInTime,
          check_out_time: null,
          is_late: isLate,
          status: 'PRESENT',
        });
        Alert.alert('Sukses', 'Berhasil Check-in hari ini!');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('sales_attendance')
        .insert({
          sales_id: salesData.id,
          attendance_date: today,
          check_in_time: checkInTime,
          is_late: isLate,
          status: 'PRESENT',
        });

      if (error) throw error;

      Alert.alert('Sukses', 'Berhasil Check-in hari ini!');
      fetchDashboardData();
    } catch (err: any) {
      Alert.alert('Error Check-in', err.message || 'Gagal menyimpan presensi.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'selfie' | 'display1' | 'display2') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      let result;

      if (status === 'granted') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
        });
      }

      if (!result || result.canceled || !result.assets || result.assets.length === 0) {
        // Fallback to gallery
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const payload = { uri: asset.uri, base64: asset.base64 || undefined };
        if (type === 'selfie') setCheckoutSelfie(payload);
        else if (type === 'display1') setCheckoutDisplay1(payload);
        else if (type === 'display2') setCheckoutDisplay2(payload);
      }
    } catch (err: any) {
      console.error('Image pick error:', err);
      Alert.alert('Error', 'Gagal mengambil gambar: ' + err.message);
    }
  };

  const openCheckoutModal = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Batas upload paling terlambat pulang yakni jam 9 malam (21:00 WIB)
    if (currentHour >= 21) {
      Alert.alert(
        '⚠️ Batas Waktu Terlewati',
        'Batas upload presensi pulang maksimal adalah pukul 21:00 (Jam 9 Malam) WIB. Anda terhitung sangat terlambat check-out.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lanjutkan Check-out', onPress: () => setCheckoutModalVisible(true) }
        ]
      );
      return;
    }

    setCheckoutModalVisible(true);
  };

  const uploadFileToSupabase = async (fileObj: { uri: string; base64?: string }, prefix: string) => {
    try {
      const uId = userId || 'anonymous';
      const filePath = `sales/${uId}/${prefix}_${Date.now()}.jpg`;

      if (fileObj.base64) {
        const cleanBase64 = fileObj.base64.replace(/^data:image\/\w+;base64,/, '');
        const { error } = await supabase.storage
          .from('dealer_documents')
          .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg', upsert: true });

        if (error) {
          console.warn('Storage upload error:', error);
          return null;
        }
        return supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
      }
      return null;
    } catch (e) {
      console.error('Error uploading file:', e);
      return null;
    }
  };

  const handleSubmitCheckout = async () => {
    if (!checkoutSelfie) {
      Alert.alert('Wajib Diisi', 'Harap lampirkan Foto Selfie sebelum pulang.');
      return;
    }
    if (!checkoutDisplay1 || !checkoutDisplay2) {
      Alert.alert('Wajib Diisi', 'Harap lampirkan 2 Foto Display produk di outlet.');
      return;
    }
    if (!unitPercentage) {
      Alert.alert('Wajib Diisi', 'Harap cantumkan perkiraan Persentase Ketersediaan Produk (%).');
      return;
    }

    setSubmittingCheckout(true);
    try {
      const now = new Date();
      const checkOutTime = now.toISOString();

      // 1. Upload all 3 photos
      const [selfieUrl, display1Url, display2Url] = await Promise.all([
        uploadFileToSupabase(checkoutSelfie, 'selfie_pulang'),
        uploadFileToSupabase(checkoutDisplay1, 'display_1'),
        uploadFileToSupabase(checkoutDisplay2, 'display_2'),
      ]);

      const payload = {
        check_out_time: checkOutTime,
        selfie_url: selfieUrl || checkoutSelfie.uri,
        display_image_1_url: display1Url || checkoutDisplay1.uri,
        display_image_2_url: display2Url || checkoutDisplay2.uri,
        unit_percentage: parseInt(unitPercentage) || 0,
        notes: checkoutNotes.trim() || null,
      };

      if (!salesData?.id || salesData.id === 'dummy-sales-id') {
        setTodayAttendance((prev: any) => ({ ...prev, ...payload }));
        Alert.alert('Presensi Pulang Berhasil!', 'Laporan presensi dan foto display tersimpan.');
        setCheckoutModalVisible(false);
        setSubmittingCheckout(false);
        return;
      }

      const { error } = await supabase
        .from('sales_attendance')
        .update(payload)
        .eq('id', todayAttendance.id);

      if (error) throw error;

      Alert.alert('Presensi Pulang Berhasil!', 'Terima kasih atas dedikasi dan kerja keras hari ini.');
      setCheckoutModalVisible(false);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Gagal Check-out', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8ec44a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8ec44a']} />}
    >
      {/* Header Profile */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>SALES FORCE</Text>
          </View>
          <Text style={styles.greeting} numberOfLines={1}>{profile?.full_name || 'Tim Sales'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
        >
          <Feather name="log-out" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Balance & Commission Card with Direct Access to Earnings History */}
      <TouchableOpacity
        style={styles.balanceCard}
        activeOpacity={0.88}
        onPress={() => router.push('/(sales)/earnings' as any)}
      >
        <View style={styles.balanceHeader}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.balanceTitle}>Saldo Reward & Komisi</Text>
              <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={styles.balanceAmount}>{formatRupiah(salesData?.balance || 0)}</Text>
          </View>
          <View style={styles.balanceIconBox}>
            <Feather name="trending-up" size={26} color="white" />
          </View>
        </View>
        <View style={styles.balanceFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Feather name="pie-chart" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.balanceSub}>Cek Histori: 1. Penjualan • 2. Absensi</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Lihat Rincian →</Text>
        </View>
      </TouchableOpacity>

      {/* Attendance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presensi Harian</Text>
        
        {!todayAttendance ? (
          <View style={styles.attendanceCard}>
            <View style={styles.attIconCircle}>
              <Feather name="clock" size={28} color="#8ec44a" />
            </View>
            <Text style={styles.attTitle}>Belum Presensi Masuk</Text>
            <Text style={styles.attendanceDesc}>
              Batas waktu jam kerja adalah pukul 10:00 - 19:00 WIB. Presensi di atas jam 10:00 terhitung terlambat. Batas upload paling terlambat pulang yakni jam 21:00 (Jam 9 Malam).
            </Text>
            <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
              <Feather name="log-in" size={18} color="white" />
              <Text style={styles.checkInText}>Check-in Sekarang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.attendanceCardActive}>
            <View style={styles.attStatusRow}>
              <View style={[styles.statusDot, todayAttendance.check_out_time && { backgroundColor: '#10b981' }]} />
              <Text style={styles.attendanceStatus}>
                {todayAttendance.check_out_time ? 'Presensi Hari Ini Selesai' : 'Sedang Bertugas'}
              </Text>
              {todayAttendance.is_late && (
                <View style={styles.lateBadge}>
                  <Text style={styles.lateText}>Terlambat</Text>
                </View>
              )}
            </View>

            <View style={styles.timeInfoRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Jam Masuk</Text>
                <Text style={styles.timeVal}>
                  {new Date(todayAttendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>Jam Keluar</Text>
                <Text style={styles.timeVal}>
                  {todayAttendance.check_out_time
                    ? new Date(todayAttendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : 'Belum Pulang'}
                </Text>
              </View>
            </View>

            {/* If Already Checked Out, Show 2 Display Photos + Selfie + Percentage under display */}
            {todayAttendance.check_out_time && (
              <View style={styles.recordedReportBox}>
                <Text style={styles.recordedReportTitle}>Laporan Display & Presensi Pulang:</Text>
                <View style={styles.photoThumbRow}>
                  {todayAttendance.selfie_url && (
                    <TouchableOpacity
                      style={styles.thumbWrap}
                      onPress={() => setPreviewImage(todayAttendance.selfie_url)}
                    >
                      <Image source={{ uri: todayAttendance.selfie_url }} style={styles.thumbImg} contentFit="cover" />
                      <Text style={styles.thumbLabel}>Selfie</Text>
                    </TouchableOpacity>
                  )}
                  {todayAttendance.display_image_1_url && (
                    <TouchableOpacity
                      style={styles.thumbWrap}
                      onPress={() => setPreviewImage(todayAttendance.display_image_1_url)}
                    >
                      <Image source={{ uri: todayAttendance.display_image_1_url }} style={styles.thumbImg} contentFit="cover" />
                      <Text style={styles.thumbLabel}>Display 1</Text>
                    </TouchableOpacity>
                  )}
                  {todayAttendance.display_image_2_url && (
                    <TouchableOpacity
                      style={styles.thumbWrap}
                      onPress={() => setPreviewImage(todayAttendance.display_image_2_url)}
                    >
                      <Image source={{ uri: todayAttendance.display_image_2_url }} style={styles.thumbImg} contentFit="cover" />
                      <Text style={styles.thumbLabel}>Display 2</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {/* Tertulis di bawah berapa persen jumlah produk */}
                <View style={styles.displayPercentBadge}>
                  <Feather name="pie-chart" size={15} color="#16a34a" />
                  <Text style={styles.displayPercentText}>
                    Ketersediaan Display Produk: <Text style={{ fontWeight: '900', color: '#15803d' }}>{todayAttendance.unit_percentage ?? 0}%</Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Check-out Button if not checked out */}
            {!todayAttendance.check_out_time && (
              <View style={{ marginTop: 14 }}>
                <View style={styles.deadlineNotice}>
                  <Feather name="alert-circle" size={14} color="#d97706" />
                  <Text style={styles.deadlineNoticeText}>
                    Batas upload paling terlambat pulang yakni pukul 21:00 (Jam 9 Malam)
                  </Text>
                </View>
                <TouchableOpacity style={styles.checkOutBtn} onPress={openCheckoutModal}>
                  <Feather name="camera" size={16} color="#ef4444" />
                  <Text style={styles.checkOutText}>Upload Display & Check-out Pulang</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Quick Action Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Operasional Sales</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(sales)/earnings' as any)}>
            <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
              <Feather name="dollar-sign" size={24} color="#16a34a" />
            </View>
            <Text style={styles.menuTitle}>Pendapatan</Text>
            <Text style={styles.menuSub}>Komisi & Absensi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(sales)/visits')}>
            <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
              <Feather name="map-pin" size={24} color="#16a34a" />
            </View>
            <Text style={styles.menuTitle}>Kunjungan Toko</Text>
            <Text style={styles.menuSub}>Daftar outlet binaan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(sales)/create-order')}>
            <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
              <Feather name="file-text" size={24} color="#d97706" />
            </View>
            <Text style={styles.menuTitle}>Pesanan Toko</Text>
            <Text style={styles.menuSub}>Detail order binaan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(sales)/new-dealer')}>
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Feather name="user-plus" size={24} color="#2563eb" />
            </View>
            <Text style={styles.menuTitle}>Toko Baru</Text>
            <Text style={styles.menuSub}>Registrasi prospek</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(sales)/leave')}>
            <View style={[styles.menuIcon, { backgroundColor: '#fdf2f8' }]}>
              <Feather name="calendar" size={24} color="#db2777" />
            </View>
            <Text style={styles.menuTitle}>Cuti & Izin</Text>
            <Text style={styles.menuSub}>Pengajuan sakit/izin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Performance Summary Section */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>Aktivitas Lapangan</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalDealers}</Text>
            <Text style={styles.statLabel}>Toko Binaan</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#8ec44a' }]}>{stats.completedVisits}</Text>
            <Text style={styles.statLabel}>Visit Selesai</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: stats.activeVisits > 0 ? '#ca8a04' : '#64748b' }]}>
              {stats.activeVisits}
            </Text>
            <Text style={styles.statLabel}>Sedang Visit</Text>
          </View>
        </View>
      </View>

      {/* MODAL CHECK-OUT PULANG DENGAN 2 FOTO DISPLAY + 1 FOTO SELFIE */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Presensi Pulang & Foto Display</Text>
                <Text style={styles.modalSubTitle}>Batas upload paling lambat pukul 21:00 WIB</Text>
              </View>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* Batas Waktu Banner */}
              <View style={styles.timeWarningBox}>
                <Feather name="clock" size={16} color="#b45309" />
                <Text style={styles.timeWarningText}>
                  Waktu Saat Ini: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.
                  {new Date().getHours() >= 21 ? ' (Melebihi batas jam 9 malam!)' : ' (Sesuai ketentuan jam kerja).'}
                </Text>
              </View>

              {/* 1. Foto Selfie */}
              <Text style={styles.inputGroupTitle}>1. Foto Selfie Presensi Pulang *</Text>
              <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('selfie')}>
                {checkoutSelfie ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: checkoutSelfie.uri }} style={styles.imagePreview} contentFit="cover" />
                    <View style={styles.changeBadge}><Text style={styles.changeBadgeText}>Ganti</Text></View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Feather name="camera" size={26} color="#8ec44a" />
                    <Text style={styles.uploadPrompt}>Ambil Foto Selfie Pulang</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 2. Dua Foto Display Produk */}
              <Text style={styles.inputGroupTitle}>2. Dua (2) Foto Display Produk *</Text>
              <View style={styles.twoDisplayGrid}>
                {/* Display 1 */}
                <TouchableOpacity style={styles.displayCard} onPress={() => pickImage('display1')}>
                  {checkoutDisplay1 ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image source={{ uri: checkoutDisplay1.uri }} style={styles.displayPreview} contentFit="cover" />
                      <Text style={styles.displayCardLabel}>Display 1 ✓</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholderSmall}>
                      <Feather name="image" size={24} color="#64748b" />
                      <Text style={styles.smallPrompt}>Foto Display 1</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Display 2 */}
                <TouchableOpacity style={styles.displayCard} onPress={() => pickImage('display2')}>
                  {checkoutDisplay2 ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image source={{ uri: checkoutDisplay2.uri }} style={styles.displayPreview} contentFit="cover" />
                      <Text style={styles.displayCardLabel}>Display 2 ✓</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholderSmall}>
                      <Feather name="image" size={24} color="#64748b" />
                      <Text style={styles.smallPrompt}>Foto Display 2</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Persentase Jumlah Produk tertulis di bawah foto display */}
              <View style={styles.percentageBox}>
                <Text style={styles.percentageLabel}>Berapa Persen Ketersediaan Display Produk? (%) *</Text>
                <View style={styles.percentageInputRow}>
                  <TextInput
                    style={styles.percentageInput}
                    value={unitPercentage}
                    onChangeText={setUnitPercentage}
                    placeholder="Contoh: 85"
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>

                {/* Teks di bawah foto display */}
                <View style={styles.displayCaptionBox}>
                  <Feather name="info" size={13} color="#15803d" />
                  <Text style={styles.displayCaptionText}>
                    Tertulis: Ketersediaan Display Produk Toko adalah{' '}
                    <Text style={{ fontWeight: 'bold' }}>{unitPercentage || 0}%</Text>
                  </Text>
                </View>
              </View>

              {/* Catatan Harian */}
              <Text style={[styles.inputGroupTitle, { marginTop: 14 }]}>3. Catatan Kerja Hari Ini (Opsional)</Text>
              <TextInput
                style={styles.notesInput}
                value={checkoutNotes}
                onChangeText={setCheckoutNotes}
                placeholder="Rangkuman aktivitas penjualan hari ini..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCheckoutModalVisible(false)}
                disabled={submittingCheckout}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitCheckOutBtn, submittingCheckout && { opacity: 0.6 }]}
                onPress={handleSubmitCheckout}
                disabled={submittingCheckout}
              >
                {submittingCheckout ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Feather name="check-circle" size={16} color="white" />
                    <Text style={styles.submitBtnText}>Kirim & Check-out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL IMAGE PREVIEW MODAL */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomClose} onPress={() => setPreviewImage(null)}>
            <Feather name="x" size={26} color="white" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.zoomImg} contentFit="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  roleBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803d', letterSpacing: 0.5 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  dateText: { fontSize: 13, color: '#64748b', marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    margin: 20,
    padding: 22,
    backgroundColor: '#8ec44a',
    borderRadius: 20,
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  balanceAmount: { color: 'white', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  balanceIconBox: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: 10,
    borderRadius: 14,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    gap: 6,
  },
  balanceSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  section: { paddingHorizontal: 20, marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  attendanceCard: {
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  attIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  attTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  attendanceDesc: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8ec44a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  checkInText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  attendanceCardActive: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  attStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8ec44a' },
  attendanceStatus: { fontSize: 14, fontWeight: '800', color: '#1e293b', flex: 1 },
  lateBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  lateText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  timeVal: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  timeDivider: { width: 1, height: 28, backgroundColor: '#cbd5e1' },
  deadlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  deadlineNoticeText: { fontSize: 11, color: '#b45309', fontWeight: '600', flex: 1 },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  checkOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  recordedReportBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  recordedReportTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  photoThumbRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  thumbWrap: { flex: 1, alignItems: 'center' },
  thumbImg: { width: '100%', height: 75, borderRadius: 10, backgroundColor: '#e2e8f0' },
  thumbLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 4 },
  displayPercentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  displayPercentText: { fontSize: 12, color: '#166534', fontWeight: '600' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  menuSub: { fontSize: 11, color: '#64748b' },
  statsContainer: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statNumber: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  modalSubTitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  closeBtn: { padding: 4 },
  timeWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  timeWarningText: { fontSize: 11, color: '#92400e', fontWeight: '600', flex: 1 },
  inputGroupTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  uploadCard: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    minHeight: 110,
  },
  uploadPlaceholder: { alignItems: 'center', gap: 6 },
  uploadPrompt: { fontSize: 12, fontWeight: '700', color: '#8ec44a' },
  imagePreviewWrap: { width: '100%', height: 110, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  changeBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  twoDisplayGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  displayCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    minHeight: 100,
    overflow: 'hidden',
  },
  uploadPlaceholderSmall: { alignItems: 'center', gap: 4 },
  smallPrompt: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  displayPreview: { width: '100%', height: 100 },
  displayCardLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#16a34a',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  percentageBox: {
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
  },
  percentageLabel: { fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 8 },
  percentageInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percentageInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
    width: 90,
    textAlign: 'center',
  },
  percentSymbol: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  displayCaptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  displayCaptionText: { fontSize: 11, color: '#15803d' },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1e293b',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionRow: { flexDirection: 'row', gap: 12, paddingTop: 10 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  submitCheckOutBtn: {
    flex: 2,
    backgroundColor: '#8ec44a',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  zoomImg: { width: '100%', height: '80%' },
});
