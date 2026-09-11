import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface DealerProgram {
  id: string;
  title: string;
  program_type: 'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK';
  description: string;
  target_amount: number;
  reward_description: string;
  banner_url?: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
}

interface ParticipantRecord {
  id: string;
  program_id: string;
  dealer_id: string;
  current_progress_amount: number;
  status: 'ENROLLED' | 'ACHIEVED' | 'CLAIMED' | 'REJECTED';
  claim_notes?: string;
  admin_notes?: string;
}

export default function DealerProgramsScreen() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<DealerProgram[]>([]);
  const [myParticipants, setMyParticipants] = useState<ParticipantRecord[]>([]);
  const [currentDealerId, setCurrentDealerId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK' | 'MY_PROGRAMS'>('ALL');

  // Claim Modal State
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [activeClaimProgram, setActiveClaimProgram] = useState<{ program: DealerProgram; participant: ParticipantRecord } | null>(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      let dId: string | null = null;
      let totalCompletedOrders = 0;

      // 1. Get dealer profile
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

        if (dealerData) {
          dId = dealerData.id;
          setCurrentDealerId(dealerData.id);

          // Calculate completed order accumulation
          const { data: orderData } = await supabase
            .from('orders')
            .select('final_amount, total_amount')
            .eq('dealer_id', dealerData.id)
            .in('status', ['COMPLETED', 'SHIPPED']);

          if (orderData) {
            totalCompletedOrders = orderData.reduce((sum, o) => sum + (Number(o.final_amount || o.total_amount) || 0), 0);
          }
        }

      // 2. Fetch Active Programs
      const { data: progData, error: progErr } = await supabase
        .from('dealer_programs')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (!progErr && progData && progData.length > 0) {
        setPrograms(progData as any);
      } else {
        // Fallback default programs
        setPrograms([
          {
            id: '11111111-1111-1111-1111-111111111111',
            title: 'Program Etalase & Display Support Toko 2026',
            program_type: 'BARANG_SUPPORT',
            description:
              'Dapatkan 1 unit etalase kaca display resmi DAP lengkap dengan neon box akrilik untuk mempercantik outlet Anda setelah mencapai target akumulasi order.',
            target_amount: 25000000,
            reward_description:
              '1 Unit Etalase Kaca Display DAP Premium (P 120cm x T 100cm) + 1 Neon Box Akrilik LED',
            banner_url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600',
            start_date: '2026-09-01',
            end_date: '2026-11-30',
            status: 'ACTIVE',
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            title: 'Mega Trip Liburan Eksklusif ke Bangkok 4D3N',
            program_type: 'TRIP',
            description:
              'Kumpulkan omset belanja aksesoris Anda dan nikmati liburan mewah ke Bangkok Thailand bersama seluruh dealer terbaik DAP. Seluruh biaya tiket, hotel bintang 5 & tur ditanggung penuh!',
            target_amount: 120000000,
            reward_description:
              '1 Tiket All-In Tour Bangkok 4H3M (Tiket PP, Hotel Bintang 5, Full Board Meals, City Tour & Visa)',
            banner_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
            start_date: '2026-09-01',
            end_date: '2027-02-28',
            status: 'ACTIVE',
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            title: 'Program Super Cashback Loyalty 5%',
            program_type: 'CASHBACK',
            description:
              'Program akselerasi keuntungan dealer! Capai target belanja minimum Rp 40 Juta dan dapatkan cashback tunai 5% langsung cair ke rekening atau dipotongkan pada tagihan nota berikutnya.',
            target_amount: 40000000,
            reward_description:
              'Cashback Tunai 5% (Senilai Rp 2.000.000) langsung cair ke rekening bank pemilik toko',
            banner_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600',
            start_date: '2026-09-01',
            end_date: '2026-10-31',
            status: 'ACTIVE',
          },
        ]);
      }

      // 3. Fetch Participants for current dealer
      if (dId) {
        const { data: partData } = await supabase
          .from('dealer_program_participants')
          .select('*')
          .eq('dealer_id', dId);

        if (partData && partData.length > 0) {
          // Update progress amount from orders if higher
          const enrichedParts = partData.map((p: any) => {
            const calculatedProgress = Math.max(Number(p.current_progress_amount) || 0, totalCompletedOrders);
            const matchedProg = programs.find((pr) => pr.id === p.program_id);
            const target = matchedProg ? matchedProg.target_amount : 999999999;
            const isAchieved = calculatedProgress >= target;
            return {
              ...p,
              current_progress_amount: calculatedProgress,
              status: isAchieved && p.status === 'ENROLLED' ? 'ACHIEVED' : p.status,
            };
          });
          setMyParticipants(enrichedParts);
        } else {
          setMyParticipants([]);
        }
      } else {
        // Fallback demo participant state
        setMyParticipants([
          {
            id: 'demo-p-1',
            program_id: '11111111-1111-1111-1111-111111111111',
            dealer_id: 'demo-dealer-id',
            current_progress_amount: 18500000, // 74%
            status: 'ENROLLED',
          },
          {
            id: 'demo-p-3',
            program_id: '33333333-3333-3333-3333-333333333333',
            dealer_id: 'demo-dealer-id',
            current_progress_amount: 40000000, // 100% Achieved
            status: 'ACHIEVED',
          },
        ]);
      }
    } catch (err) {
      console.error('Error init dealer programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollProgram = async (program: DealerProgram) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let targetDealerId = currentDealerId;
      if (!targetDealerId && user) {
        const { data: d } = await supabase
          .from('dealers')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();
        if (d) targetDealerId = d.id;
      }

      if (!targetDealerId) {
        // Demo mode fallback enrollment
        const newRecord: ParticipantRecord = {
          id: 'part-' + Date.now(),
          program_id: program.id,
          dealer_id: 'demo-dealer-id',
          current_progress_amount: 0,
          status: 'ENROLLED',
        };
        setMyParticipants([newRecord, ...myParticipants]);
        const msg = `Selamat! Toko Anda telah resmi terdaftar pada program "${program.title}". Belanja dan raih hadiahnya!`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Berhasil Bergabung 🎉', msg);
        return;
      }

      const { data, error } = await supabase
        .from('dealer_program_participants')
        .insert([
          {
            program_id: program.id,
            dealer_id: targetDealerId,
            current_progress_amount: 0,
            status: 'ENROLLED',
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setMyParticipants([...myParticipants, data[0] as any]);
      }

      const msg = `Selamat! Toko Anda telah resmi terdaftar pada program "${program.title}". Kumpulkan transaksi belanja Anda sekarang!`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Berhasil Bergabung 🎉', msg);
    } catch (err: any) {
      const errText = err.message || 'Gagal mendaftar program.';
      if (Platform.OS === 'web') window.alert(errText);
      else Alert.alert('Perhatian', errText);
    }
  };

  const openClaimModal = (program: DealerProgram, participant: ParticipantRecord) => {
    setActiveClaimProgram({ program, participant });
    if (program.program_type === 'BARANG_SUPPORT') {
      setClaimNotes('Alamat Pengiriman Barang: ');
    } else if (program.program_type === 'TRIP') {
      setClaimNotes('Nama Peserta (Sesuai KTP/Paspor): \nNo HP / WA: ');
    } else {
      setClaimNotes('Nomor Rekening Bank: \nNama Bank: \nAtas Nama: ');
    }
    setClaimModalVisible(true);
  };

  const handleSubmitClaim = async () => {
    if (!activeClaimProgram || !claimNotes.trim()) {
      alert('Harap isi catatan detail pengajuan klaim hadiah.');
      return;
    }

    setSubmittingClaim(true);
    try {
      const payload: any = {
        status: 'CLAIMED',
        claim_notes: claimNotes.trim(),
        claimed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('dealer_program_participants')
        .update(payload)
        .eq('id', activeClaimProgram.participant.id);

      // Local update
      setMyParticipants(
        myParticipants.map((p) =>
          p.id === activeClaimProgram.participant.id ? { ...p, ...payload } : p
        )
      );

      setClaimModalVisible(false);
      const msg =
        'Klaim hadiah Anda berhasil diajukan! 🎉\nAdmin akan segera memverifikasi dan memproses pengiriman hadiah Anda.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Klaim Terkirim', msg);
    } catch (err: any) {
      alert('Gagal mengajukan klaim: ' + err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Filter programs
  const filteredPrograms = programs.filter((p) => {
    if (selectedFilter === 'MY_PROGRAMS') {
      return myParticipants.some((mp) => mp.program_id === p.id);
    }
    if (selectedFilter !== 'ALL') {
      return p.program_type === selectedFilter;
    }
    return true;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BARANG_SUPPORT':
        return {
          label: 'Barang Support Toko',
          icon: 'package',
          color: '#15803d',
          bg: '#dcfce7',
          border: '#bbf7d0',
        };
      case 'TRIP':
        return {
          label: 'Trip Jalan-jalan',
          icon: 'map',
          color: '#0369a1',
          bg: '#e0f2fe',
          border: '#bae6fd',
        };
      case 'CASHBACK':
        return {
          label: 'Program Cashback',
          icon: 'dollar-sign',
          color: '#b45309',
          bg: '#fef3c7',
          border: '#fde68a',
        };
      default:
        return {
          label: type,
          icon: 'award',
          color: '#475569',
          bg: '#f1f5f9',
          border: '#e2e8f0',
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(dealer)/home')} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Program Reward & Target</Text>
          <Text style={styles.headerSubtitle}>Capai target belanja dan menangkan reward eksklusif</Text>
        </View>
        <TouchableOpacity onPress={initData} style={styles.refreshBtn}>
          <Feather name="rotate-cw" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {[
            { key: 'ALL', label: 'Semua Program' },
            { key: 'BARANG_SUPPORT', label: '🎁 Barang Support' },
            { key: 'TRIP', label: '✈️ Trip Liburan' },
            { key: 'CASHBACK', label: '💰 Cashback' },
            { key: 'MY_PROGRAMS', label: `🏆 Program Saya (${myParticipants.length})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, selectedFilter === tab.key && styles.filterTabActive]}
              onPress={() => setSelectedFilter(tab.key as any)}
            >
              <Text style={[styles.filterTabText, selectedFilter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PROGRAMS LIST */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8ec44a" />
          <Text style={styles.loadingText}>Memuat program target...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredPrograms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="award" size={54} color="#a3e635" />
              <Text style={styles.emptyTitle}>Belum Ada Program</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'MY_PROGRAMS'
                  ? 'Anda belum mengikuti program reward apa pun. Pilih program di tab lain dan klik "Ikuti Program"!'
                  : 'Tidak ada program aktif pada kategori ini.'}
              </Text>
            </View>
          ) : (
            filteredPrograms.map((prog) => {
              const badge = getTypeBadge(prog.program_type);
              const participant = myParticipants.find((p) => p.program_id === prog.id);
              const isEnrolled = !!participant;

              const currentAmount = participant ? participant.current_progress_amount : 0;
              const percent = Math.min(100, Math.round((currentAmount / prog.target_amount) * 100));
              const isAchieved = percent >= 100 || participant?.status === 'ACHIEVED' || participant?.status === 'CLAIMED';

              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(prog.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              );

              return (
                <View key={prog.id} style={styles.programCard}>
                  {/* Banner Image */}
                  <View style={styles.bannerWrapper}>
                    <Image
                      source={{
                        uri:
                          prog.banner_url ||
                          (prog.program_type === 'BARANG_SUPPORT'
                            ? 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600'
                            : prog.program_type === 'TRIP'
                            ? 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600'
                            : 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600'),
                      }}
                      style={styles.bannerImage}
                      contentFit="cover"
                    />
                    <View style={[styles.typeBadgeWrapper, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Feather name={badge.icon as any} size={13} color={badge.color} />
                      <Text style={[styles.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>

                    <View style={styles.countdownBadge}>
                      <Feather name="clock" size={11} color="white" />
                      <Text style={styles.countdownText}>
                        {daysLeft > 0 ? `Sisa ${daysLeft} hari` : 'Berakhir'}
                      </Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardBody}>
                    <Text style={styles.programTitle}>{prog.title}</Text>

                    {/* Reward Box */}
                    <View style={styles.rewardBox}>
                      <View style={styles.rewardHeader}>
                        <Feather name="gift" size={15} color="#4a6b22" />
                        <Text style={styles.rewardHeaderTitle}>Hadiah Reward Toko:</Text>
                      </View>
                      <Text style={styles.rewardDesc}>{prog.reward_description}</Text>
                    </View>

                    {/* Target Amount */}
                    <View style={styles.targetRow}>
                      <Text style={styles.targetLabel}>Target Belanja Akumulasi:</Text>
                      <Text style={styles.targetAmount}>
                        Rp {Number(prog.target_amount).toLocaleString('id-ID')}
                      </Text>
                    </View>

                    {/* PROGRESS SECTION (IF ENROLLED) */}
                    {isEnrolled && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressTopRow}>
                          <Text style={styles.progressLabel}>Progres Belanja Toko Anda:</Text>
                          <Text style={styles.progressPercent}>{percent}%</Text>
                        </View>

                        {/* Progress Bar Track */}
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${percent}%`,
                                backgroundColor: isAchieved ? '#16a34a' : '#3b82f6',
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.progressBottomRow}>
                          <Text style={styles.progressValues}>
                            Rp {Number(currentAmount).toLocaleString('id-ID')} / Rp{' '}
                            {Number(prog.target_amount).toLocaleString('id-ID')}
                          </Text>
                          {percent < 100 && (
                            <Text style={styles.progressRemaining}>
                              (Kurang Rp {Number(prog.target_amount - currentAmount).toLocaleString('id-ID')})
                            </Text>
                          )}
                        </View>

                        {/* STATUS NOTIFICATION BADGES */}
                        {isAchieved && participant?.status === 'ENROLLED' && (
                          <View style={styles.achievedNotice}>
                            <Feather name="check-circle" size={16} color="#15803d" />
                            <Text style={styles.achievedNoticeText}>
                              Selamat! Target belanja telah tercapai 100%. Silakan ajukan klaim hadiah Anda!
                            </Text>
                          </View>
                        )}

                        {participant?.status === 'CLAIMED' && (
                          <View style={styles.claimedNotice}>
                            <Feather name="clock" size={16} color="#7e22ce" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.claimedNoticeTitle}>Klaim Hadiah Telah Diajukan</Text>
                              <Text style={styles.claimedNoticeSub}>
                                Hadiah sedang dipersiapkan/dikirim oleh Admin.
                              </Text>
                              {participant.admin_notes ? (
                                <Text style={styles.adminNotesText}>
                                  Catatan Admin: {participant.admin_notes}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    <Text style={styles.programDesc}>{prog.description}</Text>

                    {/* ACTION BUTTONS */}
                    <View style={styles.cardActions}>
                      {!isEnrolled ? (
                        <TouchableOpacity
                          style={styles.enrollBtn}
                          onPress={() => handleEnrollProgram(prog)}
                        >
                          <Feather name="plus-circle" size={16} color="white" />
                          <Text style={styles.enrollBtnText}>Ikuti Program Ini</Text>
                        </TouchableOpacity>
                      ) : isAchieved && participant?.status !== 'CLAIMED' ? (
                        <TouchableOpacity
                          style={styles.claimRewardBtn}
                          onPress={() => openClaimModal(prog, participant!)}
                        >
                          <Feather name="gift" size={16} color="white" />
                          <Text style={styles.claimRewardBtnText}>🎉 Klaim Hadiah Sekarang</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.enrolledStatusPill}>
                          <Feather name="check" size={14} color="#15803d" />
                          <Text style={styles.enrolledStatusPillText}>
                            {participant?.status === 'CLAIMED'
                              ? 'Klaim Sedang Diproses'
                              : 'Anda Telah Terdaftar (Kumpulkan Omset)'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* MODAL: KLAIM HADIAH REWARD */}
      <Modal visible={claimModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {activeClaimProgram && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Klaim Hadiah Target</Text>
                    <Text style={styles.modalSubtitle}>{activeClaimProgram.program.title}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setClaimModalVisible(false)}
                  >
                    <Feather name="x" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <View style={styles.modalRewardHighlight}>
                    <Feather name="gift" size={24} color="#4a6b22" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRewardHighlightTitle}>Hadiah yang Anda Dapatkan:</Text>
                      <Text style={styles.modalRewardHighlightDesc}>
                        {activeClaimProgram.program.reward_description}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalInputLabel}>
                    {activeClaimProgram.program.program_type === 'BARANG_SUPPORT'
                      ? 'Alamat Pengiriman Barang Support & No Kontak Toko:'
                      : activeClaimProgram.program.program_type === 'TRIP'
                      ? 'Data Identitas Peserta Tour (Nama Sesuai Paspor/KTP & No WA):'
                      : 'Data Rekening Bank Pencairan Cashback (Bank, No Rek, Atas Nama):'}
                  </Text>
                  <TextInput
                    style={styles.modalTextarea}
                    multiline
                    numberOfLines={4}
                    value={claimNotes}
                    onChangeText={setClaimNotes}
                    placeholder="Tuliskan detail informasi penerima reward di sini..."
                  />

                  <TouchableOpacity
                    style={styles.submitClaimBtn}
                    onPress={handleSubmitClaim}
                    disabled={submittingClaim}
                  >
                    {submittingClaim ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Feather name="send" size={16} color="white" />
                        <Text style={styles.submitClaimBtnText}>Kirimkan Pengajuan Hadiah</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fbf0',
  },
  header: {
    backgroundColor: '#4a6b22',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dcf0c3',
    marginTop: 2,
  },
  tabScrollContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: '#8ec44a',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 18,
    paddingBottom: 50,
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerWrapper: {
    height: 140,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  typeBadgeWrapper: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  countdownBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countdownText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  programTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  rewardBox: {
    backgroundColor: '#f7fee7',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rewardHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#365314',
  },
  rewardDesc: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
    lineHeight: 18,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  targetLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  programDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 14,
  },
  progressContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressValues: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  progressRemaining: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  achievedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  achievedNoticeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803d',
    flex: 1,
  },
  claimedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3e8ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  claimedNoticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7e22ce',
  },
  claimedNoticeSub: {
    fontSize: 11,
    color: '#6b21a8',
    marginTop: 1,
  },
  adminNotesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  cardActions: {
    marginTop: 4,
  },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4a6b22',
    paddingVertical: 12,
    borderRadius: 12,
  },
  enrollBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  claimRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 12,
  },
  claimRewardBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  enrolledStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  enrolledStatusPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  // Claim Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  modalScroll: {
    padding: 20,
  },
  modalRewardHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7fee7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 16,
  },
  modalRewardHighlightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#365314',
  },
  modalRewardHighlightDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
    marginTop: 2,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalTextarea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  submitClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitClaimBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
