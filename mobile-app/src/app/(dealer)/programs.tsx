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
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';

const catalogPoster = require('../../../assets/katalog-program-support.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SupportItem {
  id: string;
  code: string;
  name: string;
  min_purchase: number;
  dimensions?: string;
  category?: string;
  description?: string;
}

export const DEFAULT_SUPPORT_ITEMS: SupportItem[] = [
  {
    id: 'dlp13',
    code: 'DLP13',
    name: 'KURSI PLASTIK DAP',
    min_purchase: 500000,
    dimensions: 'Standar Kursi Toko',
    category: 'Fasilitas Toko',
    description: 'Kursi plastik hijau branding DAP resmi untuk ruang tunggu pelanggan toko Anda.',
  },
  {
    id: 'dlp16',
    code: 'DLP16',
    name: 'RAK MINI (Smart Accessories Center)',
    min_purchase: 2500000,
    dimensions: 'Display Meja Kasir Akrilik',
    category: 'Display Meja',
    description: 'Rak display meja akrilik hijau DAP untuk gantungan kabel data, charger, dan earphone.',
  },
  {
    id: 'logo-gantung',
    code: 'LOGO GANTUNG',
    name: 'LOGO GANTUNG DAP LED',
    min_purchase: 3500000,
    dimensions: '120cm x 30.5cm',
    category: 'Signage Plafon',
    description: 'Signage gantung akrilik resmi DAP Accessories berlampu untuk digantung di langit-langit toko.',
  },
  {
    id: 'dlp30',
    code: 'DLP30',
    name: 'RAK PUTAR AKSESORIS',
    min_purchase: 4500000,
    dimensions: 'Rak Putar Multi-Sisi Portable',
    category: 'Display Lantai',
    description: 'Rak display putar modern untuk gantungan handsfree, case, dan tempered glass 360 derajat.',
  },
  {
    id: 'dlp09',
    code: 'DLP09',
    name: 'RAK DINDING TOKO',
    min_purchase: 5000000,
    dimensions: 'Tinggi 100cm x Lebar 100cm',
    category: 'Display Dinding',
    description: 'Panel besi ram hitam kokoh dengan header hijau DAP untuk menempel rapi di dinding toko.',
  },
  {
    id: 'dlp01',
    code: 'DLP01',
    name: 'RAK BESAR 220cm',
    min_purchase: 6000000,
    dimensions: 'Tinggi 220cm x Lebar 100cm',
    category: 'Display Lantai',
    description: 'Rak display floorstanding 220cm dengan ram besi gantung, papan ambalan bawah, dan header DAP.',
  },
  {
    id: 'dlp14',
    code: 'DLP14',
    name: 'RUNNING TEXT (NOW OPEN DAP LED)',
    min_purchase: 6000000,
    dimensions: '130cm x 20cm',
    category: 'Signage Digital',
    description: 'Layar running text digital LED merah terang 130cm x 20cm bertuliskan NOW OPEN & DAP DAY DAY UP.',
  },
  {
    id: 'dlp17',
    code: 'DLP17',
    name: 'RAK JUMBO 240cm',
    min_purchase: 8000000,
    dimensions: 'Tinggi 240cm x Lebar 100cm',
    category: 'Display Lantai',
    description: 'Rak display jumbo tertinggi 240cm dengan kapasitas terlengkap dan ambalan display produk.',
  },
  {
    id: 'dlp18',
    code: 'DLP18',
    name: 'RAK TENGAH ISLAND 5 TINGKAT',
    min_purchase: 10000000,
    dimensions: '1280mm x 900mm x 750mm',
    category: 'Display Island',
    description: 'Gondola display island tingkat 5 mewah untuk diletakkan di tengah toko dengan branding DAP.',
  },
  {
    id: 'etalase-showcase',
    code: 'ETALASE SHOWCASE',
    name: 'ETALASE SHOWCASE DISPLAY',
    min_purchase: 25000000,
    dimensions: '110cm x 120cm x 50cm',
    category: 'Etalase Showcase',
    description: 'Etalase kaca display showcase mewah resmi DAP berlogo akrilik hijau dengan lampu LED display dan kunci pengaman.',
  },
];

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
  support_items?: SupportItem[];
}

interface ParticipantRecord {
  id: string;
  program_id: string;
  dealer_id: string;
  current_progress_amount: number;
  status: 'ENROLLED' | 'ACHIEVED' | 'CLAIMED' | 'REJECTED' | 'SHIPPED' | 'INSTALLED' | 'COMPLETED';
  claim_notes?: string;
  admin_notes?: string;
  claimed_at?: string;
  selected_item_id?: string;
  selected_item_name?: string;
  custom_target_amount?: number;
  photo_before_url?: string;
  photo_after_url?: string;
  shipping_receipt_no?: string;
  installed_at?: string;
  applicant_name?: string;
  applicant_store_name?: string;
  applicant_location?: string;
  applicant_phone?: string;
}

export default function DealerProgramsScreen() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<DealerProgram[]>([]);
  const [myParticipants, setMyParticipants] = useState<ParticipantRecord[]>([]);
  const [currentDealerId, setCurrentDealerId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [currentDealerProfile, setCurrentDealerProfile] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'BARANG_SUPPORT' | 'TRIP' | 'CASHBACK' | 'MY_PROGRAMS'>('ALL');

  // Support Item Form State (Pendaftaran / Pengajuan)
  const [applicationModalVisible, setApplicationModalVisible] = useState(false);
  const [programToEnroll, setProgramToEnroll] = useState<DealerProgram | null>(null);
  const [selectedSupportItem, setSelectedSupportItem] = useState<SupportItem>(DEFAULT_SUPPORT_ITEMS[7]); // Default DLP17
  const [placementNotes, setPlacementNotes] = useState('');
  const [beforePhotoUri, setBeforePhotoUri] = useState<string | null>(null);
  const [beforePhotoBase64, setBeforePhotoBase64] = useState<string | null>(null);

  // Documentation After Modal State (Setelah Barang Tiba)
  const [afterModalVisible, setAfterModalVisible] = useState(false);
  const [activeAfterParticipant, setActiveAfterParticipant] = useState<ParticipantRecord | null>(null);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);
  const [afterPhotoBase64, setAfterPhotoBase64] = useState<string | null>(null);
  const [afterNotes, setAfterNotes] = useState('');
  const [submittingAfter, setSubmittingAfter] = useState(false);

  // DAP Poster Modal
  const [posterModalVisible, setPosterModalVisible] = useState(false);

  // Image Zoom Lightbox
  const [lightboxImageUri, setLightboxImageUri] = useState<string | null>(null);

  // Claim Modal State
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [activeClaimProgram, setActiveClaimProgram] = useState<{ program: DealerProgram; participant: ParticipantRecord } | null>(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

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

      // 1. Get profile & dealer details
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (pData) {
        setCurrentUserProfile(pData);
      }

      const { data: dealerData } = await supabase
        .from('dealers')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (dealerData) {
        dId = dealerData.id;
        setCurrentDealerId(dealerData.id);
        setCurrentDealerProfile(dealerData);

        // Calculate completed order accumulation
        const { data: orderData } = await supabase
          .from('orders')
          .select('final_amount, total_amount')
          .eq('dealer_id', dealerData.id)
          .in('status', ['COMPLETED', 'SHIPPED']);

        if (orderData) {
          totalCompletedOrders = orderData.reduce(
            (sum, o) => sum + (Number(o.final_amount || o.total_amount) || 0),
            0
          );
        }
      }

      // 2. Fetch Active Programs
      const { data: progData, error: progErr } = await supabase
        .from('dealer_programs')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      let loadedPrograms: DealerProgram[] = [];
      if (!progErr && progData && progData.length > 0) {
        loadedPrograms = progData.map((p: any) => ({
          ...p,
          support_items:
            p.support_items && p.support_items.length > 0
              ? p.support_items
              : p.program_type === 'BARANG_SUPPORT'
              ? DEFAULT_SUPPORT_ITEMS
              : undefined,
        }));
      } else {
        // Fallback default programs
        loadedPrograms = [
          {
            id: '11111111-1111-1111-1111-111111111111',
            title: 'Katalog Program Support DAP (Etalase & Display Toko)',
            program_type: 'BARANG_SUPPORT',
            description:
              'Program bantuan etalase kaca & display resmi DAP! Pilih hadiah display toko Anda (Kursi, Rak Mini Kasir, Logo Gantung LED, Rak Putar, Rak Dinding, Rak Besar, Running Text LED, Rak Jumbo, Rak Island, hingga Etalase Showcase DAP) dengan akumulasi belanja pesanan.',
            target_amount: 8000000,
            reward_description:
              '1 Unit Display/Etalase Pilihan Resmi DAP (Sesuai minimal akumulasi belanja yang dipilih)',
            banner_url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=600',
            start_date: '2026-09-01',
            end_date: '2026-12-31',
            status: 'ACTIVE',
            support_items: DEFAULT_SUPPORT_ITEMS,
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            title: 'Mega Trip Liburan Eksklusif ke Bangkok 4D3N',
            program_type: 'TRIP',
            description:
              'Kumpulkan omset belanja aksesoris Anda dan nikmati liburan mewah ke Bangkok Thailand bersama seluruh dealer terbaik DAP. Seluruh tiket pesawat PP, hotel bintang 5 & tur ditanggung penuh!',
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
              'Program akselerasi keuntungan dealer! Capai target belanja minimum Rp 40 Juta dan dapatkan cashback tunai 5% langsung cair ke rekening atau dipotongkan pada nota berikutnya.',
            target_amount: 40000000,
            reward_description:
              'Cashback Tunai 5% (Senilai Rp 2.000.000) langsung ditransfer ke rekening bank pemilik toko',
            banner_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600',
            start_date: '2026-09-01',
            end_date: '2026-10-31',
            status: 'ACTIVE',
          },
        ];
      }
      setPrograms(loadedPrograms);

      // 3. Fetch Participants for current dealer
      if (dId) {
        const { data: partData } = await supabase
          .from('dealer_program_participants')
          .select('*')
          .eq('dealer_id', dId);

        if (partData && partData.length > 0) {
          const enrichedParts = partData.map((p: any) => {
            const calculatedProgress = Math.max(
              Number(p.current_progress_amount) || 0,
              totalCompletedOrders
            );
            const matchedProg = loadedPrograms.find((pr) => pr.id === p.program_id);
            const target =
              p.custom_target_amount || (matchedProg ? matchedProg.target_amount : 999999999);
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
        // Fallback demo participant
        setMyParticipants([
          {
            id: 'demo-p-1',
            program_id: '11111111-1111-1111-1111-111111111111',
            dealer_id: 'demo-dealer-id',
            current_progress_amount: 6000000,
            status: 'ENROLLED',
            selected_item_id: 'dlp17',
            selected_item_name: 'DLP17 - RAK JUMBO 240cm',
            custom_target_amount: 8000000,
            photo_before_url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500',
            applicant_name: 'Lie Sudito',
            applicant_store_name: 'CV. JAVA CELLULER',
            applicant_location: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
            applicant_phone: '08114991888',
            claim_notes:
              '[PILIHAN ITEM: DLP17 - RAK JUMBO 240cm | Min. Belanja: Rp 8.000.000]\n[FOTO BEFORE: Lokasi pojok kiri depan kasir toko]',
          },
        ]);
      }
    } catch (err) {
      console.error('Error init dealer programs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse participant item & photos
  const parseParticipantItem = (participant?: ParticipantRecord | null) => {
    if (!participant) return null;
    if (participant.selected_item_name) {
      return {
        name: participant.selected_item_name,
        target: participant.custom_target_amount,
      };
    }
    if (participant.claim_notes && participant.claim_notes.includes('[PILIHAN ITEM:')) {
      const match = participant.claim_notes.match(
        /\[PILIHAN ITEM:\s*([^|\]]+)(?:\|\s*Min\.\s*Belanja:\s*Rp\s*([^\]]+))?\]/
      );
      if (match) {
        return {
          name: match[1]?.trim() || '',
          target: match[2] ? parseFloat(match[2].replace(/[^0-9]/g, '')) : undefined,
        };
      }
    }
    return null;
  };

  // RULE 1: Only 1 active program at any time
  const activeParticipant = myParticipants.find(
    (p) =>
      p.status === 'ENROLLED' ||
      p.status === 'ACHIEVED' ||
      p.status === 'CLAIMED' ||
      p.status === 'SHIPPED' ||
      p.status === 'INSTALLED'
  );
  const activeEnrolledProgram = activeParticipant
    ? programs.find((pr) => pr.id === activeParticipant.program_id)
    : null;

  // Handle take photo (Camera or Gallery)
  const handleCapturePhoto = async (type: 'before' | 'after', source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Izin Kamera Dibutuhkan',
            'Izinkan akses kamera untuk mengambil foto dokumentasi toko Anda.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Izin Galeri Dibutuhkan',
            'Izinkan akses galeri untuk memilih foto dokumentasi toko Anda.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (type === 'before') {
          setBeforePhotoUri(asset.uri);
          setBeforePhotoBase64(asset.base64 || null);
        } else {
          setAfterPhotoUri(asset.uri);
          setAfterPhotoBase64(asset.base64 || null);
        }
      }
    } catch (err: any) {
      console.warn('Error capturing photo:', err);
      Alert.alert('Gagal Mengambil Foto', err.message || 'Terjadi kesalahan saat membuka kamera/galeri.');
    }
  };

  // Helper to upload image to Supabase storage
  const uploadPhotoToStorage = async (
    base64: string | null,
    uri: string | null,
    prefix: string
  ): Promise<string | null> => {
    if (!currentDealerId) return uri || null;
    try {
      if (base64) {
        const filePath = `programs/${currentDealerId}/${prefix}_${Date.now()}.jpg`;
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
        const { error: uploadError } = await supabase.storage
          .from('dealer_documents')
          .upload(filePath, decode(cleanBase64), { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) {
          return supabase.storage.from('dealer_documents').getPublicUrl(filePath).data.publicUrl;
        }
      }
    } catch (e) {
      console.warn('Storage upload error, using local URI fallback:', e);
    }
    return uri || null;
  };

  // Start enrollment
  const handleStartEnrollment = (program: DealerProgram) => {
    // Check if enrolled in other program
    if (activeParticipant && activeParticipant.program_id !== program.id) {
      const alertMsg = `Toko Anda sedang mengikuti program aktif:\n"${activeEnrolledProgram?.title || 'Program Reward'}".\n\nSesuai ketentuan, setiap toko hanya dapat mengikuti 1 program dalam satu periode. Anda tetap dapat melihat syarat program ini, namun tidak dapat mendaftar sebelum program aktif Anda selesai.`;
      if (Platform.OS === 'web') window.alert(alertMsg);
      else Alert.alert('Ketentuan 1 Program Aktif 🔒', alertMsg);
      return;
    }

    if (program.program_type === 'BARANG_SUPPORT') {
      const items =
        program.support_items && program.support_items.length > 0
          ? program.support_items
          : DEFAULT_SUPPORT_ITEMS;
      setProgramToEnroll(program);
      setSelectedSupportItem(items[7]); // Default DLP17 Rak Jumbo
      setBeforePhotoUri(null);
      setBeforePhotoBase64(null);
      setPlacementNotes('');
      setApplicationModalVisible(true);
      return;
    }

    // Direct enrollment for TRIP or CASHBACK
    const confirmPrompt = `Konfirmasi Pendaftaran:\n\nAnda akan bergabung pada "${program.title}" dengan target belanja Rp ${Number(
      program.target_amount
    ).toLocaleString('id-ID')}.\n\nPerhatian: Anda hanya dapat mengikuti 1 program aktif. Lanjutkan?`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmPrompt)) {
        submitGeneralEnrollment(program);
      }
    } else {
      Alert.alert('Konfirmasi Pendaftaran Program', confirmPrompt, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Daftar Sekarang', style: 'default', onPress: () => submitGeneralEnrollment(program) },
      ]);
    }
  };

  // Submit enrollment for TRIP or CASHBACK
  const submitGeneralEnrollment = async (program: DealerProgram) => {
    setEnrolling(true);
    try {
      const payload: any = {
        program_id: program.id,
        dealer_id: currentDealerId || 'demo-dealer-id',
        current_progress_amount: 0,
        status: 'ENROLLED',
        applicant_name: currentUserProfile?.full_name || 'Dealer',
        applicant_store_name: currentDealerProfile?.store_name || 'Toko',
        applicant_location: currentDealerProfile?.address || '',
        applicant_phone: currentUserProfile?.phone_number || currentDealerProfile?.phone || '',
      };

      if (!currentDealerId) {
        setMyParticipants([
          {
            id: 'part-' + Date.now(),
            ...payload,
          },
          ...myParticipants,
        ]);
        Alert.alert('Pendaftaran Berhasil 🎉', `Toko Anda telah terdaftar pada program "${program.title}".`);
        return;
      }

      const { data, error } = await supabase
        .from('dealer_program_participants')
        .insert([payload])
        .select();

      if (error) throw error;
      if (data) {
        setMyParticipants([...myParticipants, data[0] as any]);
      }
      Alert.alert('Pendaftaran Berhasil 🎉', `Toko Anda telah terdaftar pada program "${program.title}". Kumpulkan omset belanja Anda!`);
    } catch (err: any) {
      Alert.alert('Gagal Mendaftar', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setEnrolling(false);
    }
  };

  // Submit Support Item Application (WITH BEFORE PHOTO)
  const submitSupportItemApplication = async () => {
    if (!programToEnroll || !selectedSupportItem) return;

    // VALIDATION: Wajib ada foto dokumentasi before!
    if (!beforePhotoUri) {
      const alertMsg =
        'Wajib Melampirkan Foto Dokumentasi BEFORE!\n\nSilakan ambil foto lokasi / tempat di mana barang support (rak/etalase) akan diletakkan di toko Anda menggunakan tombol kamera atau galeri.';
      if (Platform.OS === 'web') window.alert(alertMsg);
      else Alert.alert('Foto Dokumentasi Wajib 📸', alertMsg);
      return;
    }

    setEnrolling(true);
    try {
      // 1. Upload Before Photo
      const uploadedBeforeUrl = await uploadPhotoToStorage(
        beforePhotoBase64,
        beforePhotoUri,
        'support_before'
      );

      const applicantName = currentUserProfile?.full_name || 'Pemilik Toko';
      const storeName = currentDealerProfile?.store_name || 'Toko Dealer';
      const storeLocation = currentDealerProfile?.address
        ? `${currentDealerProfile.address}, ${currentDealerProfile.city || ''}`
        : 'Lokasi Sesuai Akun';
      const storePhone =
        currentUserProfile?.phone_number || currentDealerProfile?.phone || '-';

      const targetAmount = selectedSupportItem.min_purchase;
      const itemName = `${selectedSupportItem.code} - ${selectedSupportItem.name}`;
      const snapshotNotes = `[PENGAJUAN PROGRAM SUPPORT DAP]\nNama: ${applicantName}\nToko: ${storeName}\nLokasi: ${storeLocation}\nKontak: ${storePhone}\nItem Pilihan: ${itemName}\nTarget Min. Belanja: Rp ${targetAmount.toLocaleString('id-ID')}\nCatatan Penempatan: ${placementNotes.trim() || 'Sesuai foto before'}\nFoto Before: ${uploadedBeforeUrl || 'Terlampir'}`;

      if (!currentDealerId) {
        // Fallback demo mode
        const newRecord: ParticipantRecord = {
          id: 'part-' + Date.now(),
          program_id: programToEnroll.id,
          dealer_id: 'demo-dealer-id',
          current_progress_amount: 0,
          status: 'ENROLLED',
          selected_item_id: selectedSupportItem.id,
          selected_item_name: itemName,
          custom_target_amount: targetAmount,
          photo_before_url: uploadedBeforeUrl || beforePhotoUri,
          applicant_name: applicantName,
          applicant_store_name: storeName,
          applicant_location: storeLocation,
          applicant_phone: storePhone,
          claim_notes: snapshotNotes,
        };
        setMyParticipants([newRecord, ...myParticipants]);
        setApplicationModalVisible(false);
        const msg = `Pengajuan Program Support Berhasil! 🎉\n\nItem Pilihan: ${itemName}\nTarget Belanja: Rp ${targetAmount.toLocaleString('id-ID')}\nFoto dokumentasi lokasi penempatan telah tersimpan.`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Pengajuan Berhasil 🎉', msg);
        return;
      }

      // 2. Prepare database payload
      const payload: any = {
        program_id: programToEnroll.id,
        dealer_id: currentDealerId,
        current_progress_amount: 0,
        status: 'ENROLLED',
        selected_item_id: selectedSupportItem.id,
        selected_item_name: itemName,
        custom_target_amount: targetAmount,
        photo_before_url: uploadedBeforeUrl,
        applicant_name: applicantName,
        applicant_store_name: storeName,
        applicant_location: storeLocation,
        applicant_phone: storePhone,
        claim_notes: snapshotNotes,
      };

      let insertResult: any = null;
      const { data, error } = await supabase
        .from('dealer_program_participants')
        .insert([payload])
        .select();

      if (error) {
        console.warn('Fallback insert without new columns:', error.message);
        // Fallback with standard columns
        const fallbackPayload: any = {
          program_id: programToEnroll.id,
          dealer_id: currentDealerId,
          current_progress_amount: 0,
          status: 'ENROLLED',
          claim_notes: snapshotNotes,
        };
        const { data: fbData, error: fbError } = await supabase
          .from('dealer_program_participants')
          .insert([fallbackPayload])
          .select();
        if (fbError) throw fbError;
        insertResult = fbData ? fbData[0] : null;
      } else {
        insertResult = data ? data[0] : null;
      }

      if (insertResult) {
        setMyParticipants([
          ...myParticipants,
          {
            ...insertResult,
            selected_item_id: selectedSupportItem.id,
            selected_item_name: itemName,
            custom_target_amount: targetAmount,
            photo_before_url: uploadedBeforeUrl || beforePhotoUri,
            claim_notes: snapshotNotes,
          },
        ]);
      }

      setApplicationModalVisible(false);
      const msg = `Pengajuan Program Support Berhasil! 🎉\n\nItem Pilihan: ${itemName}\nTarget Belanja: Rp ${targetAmount.toLocaleString('id-ID')}\n\nFoto dokumentasi lokasi toko telah tersimpan. Belanja dan capai targetnya!`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Pengajuan Berhasil 🎉', msg);
    } catch (err: any) {
      Alert.alert('Gagal Mengajukan', err.message || 'Terjadi kesalahan pengajuan.');
    } finally {
      setEnrolling(false);
    }
  };

  // Submit Documentation AFTER (Ketika Barang Support Tiba & Dipasang)
  const submitAfterDocumentation = async () => {
    if (!activeAfterParticipant) return;

    if (!afterPhotoUri) {
      const msg =
        'Wajib Melampirkan Foto Dokumentasi AFTER!\n\nSilakan ambil foto bukti bahwa barang support (rak/etalase) resmi DAP telah selesai dipasang dan ditempatkan di toko Anda.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Foto Dokumentasi Wajib 📸', msg);
      return;
    }

    setSubmittingAfter(true);
    try {
      const uploadedAfterUrl = await uploadPhotoToStorage(
        afterPhotoBase64,
        afterPhotoUri,
        'support_after'
      );

      const appendNotes = `\n[FOTO AFTER TERPASANG: ${uploadedAfterUrl || 'Terlampir'}]\nCatatan Pemasangan Toko: ${afterNotes.trim() || 'Barang telah dipasang & ditempatkan rapi di toko'}`;

      const payload: any = {
        photo_after_url: uploadedAfterUrl || afterPhotoUri,
        installed_at: new Date().toISOString(),
        status: 'COMPLETED',
        claim_notes: (activeAfterParticipant.claim_notes || '') + appendNotes,
      };

      if (currentDealerId) {
        const { error } = await supabase
          .from('dealer_program_participants')
          .update(payload)
          .eq('id', activeAfterParticipant.id);

        if (error) {
          console.warn('Fallback update photo_after:', error.message);
          // Fallback if photo_after_url column not present
          await supabase
            .from('dealer_program_participants')
            .update({
              status: 'COMPLETED',
              claim_notes: (activeAfterParticipant.claim_notes || '') + appendNotes,
            })
            .eq('id', activeAfterParticipant.id);
        }
      }

      // Update local state
      setMyParticipants(
        myParticipants.map((p) =>
          p.id === activeAfterParticipant.id
            ? { ...p, ...payload, photo_after_url: uploadedAfterUrl || afterPhotoUri }
            : p
        )
      );

      setAfterModalVisible(false);
      setAfterPhotoUri(null);
      setAfterPhotoBase64(null);
      setAfterNotes('');

      const successMsg =
        'Dokumentasi AFTER Berhasil Dikirim! 🎉\n\nTerima kasih telah melampirkan foto barang support yang sudah terpasang. Program reward display toko Anda kini telah sukses dan tuntas!';
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert('Program Selesai & Terpasang 🎉', successMsg);
    } catch (err: any) {
      Alert.alert('Gagal Mengirim Dokumentasi', err.message || 'Terjadi kesalahan pengiriman.');
    } finally {
      setSubmittingAfter(false);
    }
  };

  const openClaimModal = (program: DealerProgram, participant: ParticipantRecord) => {
    setActiveClaimProgram({ program, participant });
    const chosen = parseParticipantItem(participant);

    if (program.program_type === 'BARANG_SUPPORT') {
      const prefix = chosen?.name ? `[PILIHAN ITEM: ${chosen.name}]\n` : '';
      setClaimNotes(
        `${prefix}Nama Penerima di Toko: ${currentUserProfile?.full_name || ''}\nNo HP / WA: ${currentUserProfile?.phone_number || currentDealerProfile?.phone || ''}\nAlamat Lengkap Pengiriman Display Toko: ${currentDealerProfile?.address || ''}\nPatokan Toko: `
      );
    } else if (program.program_type === 'TRIP') {
      setClaimNotes('Nama Peserta (Sesuai KTP/Paspor): \nNo HP / WA: \nEmail: ');
    } else {
      setClaimNotes('Nomor Rekening Bank: \nNama Bank: \nAtas Nama Rekening: ');
    }
    setClaimModalVisible(true);
  };

  const handleSubmitClaim = async () => {
    if (!activeClaimProgram || !claimNotes.trim()) {
      const msg = 'Harap isi catatan detail pengajuan klaim hadiah & alamat pengiriman.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Perhatian', msg);
      return;
    }

    setSubmittingClaim(true);
    try {
      const payload: any = {
        status: 'CLAIMED',
        claim_notes: claimNotes.trim(),
        claimed_at: new Date().toISOString(),
      };

      if (currentDealerId) {
        const { error } = await supabase
          .from('dealer_program_participants')
          .update(payload)
          .eq('id', activeClaimProgram.participant.id);
        if (error) throw error;
      }

      // Local update
      setMyParticipants(
        myParticipants.map((p) =>
          p.id === activeClaimProgram.participant.id ? { ...p, ...payload } : p
        )
      );

      setClaimModalVisible(false);
      const msg =
        'Klaim hadiah Anda berhasil diajukan! 🎉\nAdmin akan segera memverifikasi dan memproses pengiriman hadiah display toko Anda.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Klaim Terkirim', msg);
    } catch (err: any) {
      const msg = 'Gagal mengajukan klaim: ' + err.message;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Gagal', msg);
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
          label: 'Display & Etalase Support',
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
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(dealer)/home'))}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Program Target & Reward</Text>
          <Text style={styles.headerSubtitle}>Capai target belanja dan raih reward display eksklusif</Text>
        </View>
        <TouchableOpacity onPress={initData} style={styles.refreshBtn}>
          <Feather name="rotate-cw" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* ACTIVE PARTICIPATION INFO BANNER (RULE 1 STATUS) */}
      {activeParticipant && (
        <View style={styles.topActiveBanner}>
          <View style={styles.topActiveIconWrapper}>
            <Feather name="check-circle" size={18} color="#15803d" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.topActiveHeaderRow}>
              <Text style={styles.topActiveTitle}>Anda Mengikuti 1 Program Aktif</Text>
              <View style={styles.topActiveBadge}>
                <Text style={styles.topActiveBadgeText}>1 Program</Text>
              </View>
            </View>
            <Text style={styles.topActiveDesc} numberOfLines={1}>
              {activeEnrolledProgram?.title || 'Program Reward Pilihan Anda'}
            </Text>
            <Text style={styles.topActiveSub}>
              Program lain terkunci selama program ini aktif (Hanya bisa melihat rincian).
            </Text>
          </View>
        </View>
      )}

      {/* FILTER TABS */}
      <View style={styles.tabScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {[
            { key: 'ALL', label: 'Semua Program' },
            { key: 'BARANG_SUPPORT', label: '🎁 Display & Etalase' },
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
          <Text style={styles.loadingText}>Memuat program target & reward...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredPrograms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="award" size={54} color="#a3e635" />
              <Text style={styles.emptyTitle}>Belum Ada Program</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'MY_PROGRAMS'
                  ? 'Anda belum mengikuti program reward. Pilih salah satu program pada kategori dan klik "Ikuti Program"!'
                  : 'Tidak ada program aktif pada kategori ini.'}
              </Text>
            </View>
          ) : (
            filteredPrograms.map((prog) => {
              const badge = getTypeBadge(prog.program_type);
              const participant = myParticipants.find((p) => p.program_id === prog.id);
              const isEnrolledInThisProg = !!participant;

              // Rule 1: Is user enrolled in another program?
              const isLockedByOtherProgram = !isEnrolledInThisProg && !!activeParticipant;

              // Extract chosen item details if any
              const chosenItem = parseParticipantItem(participant);
              const effectiveTarget =
                chosenItem?.target || participant?.custom_target_amount || prog.target_amount;
              const currentAmount = participant ? participant.current_progress_amount : 0;
              const percent = Math.min(100, Math.round((currentAmount / effectiveTarget) * 100));
              const isAchieved =
                percent >= 100 ||
                participant?.status === 'ACHIEVED' ||
                participant?.status === 'CLAIMED' ||
                participant?.status === 'SHIPPED' ||
                participant?.status === 'COMPLETED';

              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(prog.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              );

              // Status after delivery flow
              const isShippedOrApproved =
                participant?.status === 'SHIPPED' ||
                (participant?.status === 'CLAIMED' && !!participant?.admin_notes);
              const hasAfterPhoto = !!participant?.photo_after_url;

              return (
                <View
                  key={prog.id}
                  style={[
                    styles.programCard,
                    isEnrolledInThisProg && styles.programCardActive,
                    isLockedByOtherProgram && styles.programCardLocked,
                  ]}
                >
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

                    {/* Locked watermark badge on banner */}
                    {isLockedByOtherProgram && (
                      <View style={styles.lockedWatermarkBadge}>
                        <Feather name="lock" size={12} color="white" />
                        <Text style={styles.lockedWatermarkText}>Terkunci (Sedang Ikut 1 Program)</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.programTitle}>{prog.title}</Text>

                    {/* REWARD BOX */}
                    <View style={styles.rewardBox}>
                      <View style={styles.rewardHeader}>
                        <Feather name="gift" size={15} color="#4a6b22" />
                        <Text style={styles.rewardHeaderTitle}>Hadiah Reward Toko:</Text>
                      </View>
                      <Text style={styles.rewardDesc}>{prog.reward_description}</Text>
                    </View>

                    {/* KHUSUS PROGRAM BARANG_SUPPORT: Pilihan Katalog 10 Item & Tombol Brosur */}
                    {prog.program_type === 'BARANG_SUPPORT' && (
                      <View style={styles.supportCatalogNoticeBox}>
                        <View style={styles.supportCatalogNoticeTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.supportCatalogNoticeTitle}>
                              🎁 Katalog 10 Item Etalase & Display Resmi DAP
                            </Text>
                            <Text style={styles.supportCatalogNoticeSub}>
                              Tersedia 10 pilihan: Kursi Toko, Rak Meja, Rak Dinding, Rak Putar, Rak Besar, Running Text LED, Rak Jumbo, Rak Island, hingga Etalase Showcase. Wajib sertakan foto BEFORE lokasi penempatan barang saat mendaftar!
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.viewPosterBtn}
                          onPress={() => setPosterModalVisible(true)}
                        >
                          <Feather name="image" size={14} color="#15803d" />
                          <Text style={styles.viewPosterBtnText}>Lihat Poster Brosur Resmi DAP</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* CHOSEN ITEM DISPLAY (IF ENROLLED) */}
                    {isEnrolledInThisProg && chosenItem?.name && (
                      <View style={styles.chosenItemBox}>
                        <View style={styles.chosenItemHeader}>
                          <Feather name="check-circle" size={15} color="#16a34a" />
                          <Text style={styles.chosenItemHeaderTitle}>Item Support Pilihan Toko Anda:</Text>
                        </View>
                        <Text style={styles.chosenItemName}>{chosenItem.name}</Text>
                        <View style={styles.chosenItemTargetRow}>
                          <Text style={styles.chosenItemTargetLabel}>Target Khusus Item Ini:</Text>
                          <Text style={styles.chosenItemTargetValue}>
                            Rp {Number(effectiveTarget).toLocaleString('id-ID')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* DOKUMENTASI FOTO SECTION (BEFORE & AFTER) IF ENROLLED */}
                    {isEnrolledInThisProg && (participant?.photo_before_url || participant?.photo_after_url) && (
                      <View style={styles.photoDocumentationCard}>
                        <Text style={styles.photoDocumentationTitle}>Dokumentasi Foto Toko:</Text>
                        <View style={styles.photoDocumentationRow}>
                          {/* Foto Before */}
                          {participant?.photo_before_url && (
                            <TouchableOpacity
                              style={styles.photoThumbContainer}
                              onPress={() => setLightboxImageUri(participant.photo_before_url!)}
                            >
                              <Image
                                source={{ uri: participant.photo_before_url }}
                                style={styles.photoThumb}
                                contentFit="cover"
                              />
                              <View style={styles.photoThumbBadgeBefore}>
                                <Text style={styles.photoThumbBadgeText}>📷 Foto BEFORE (Lokasi)</Text>
                              </View>
                            </TouchableOpacity>
                          )}

                          {/* Foto After */}
                          {participant?.photo_after_url ? (
                            <TouchableOpacity
                              style={styles.photoThumbContainer}
                              onPress={() => setLightboxImageUri(participant.photo_after_url!)}
                            >
                              <Image
                                source={{ uri: participant.photo_after_url }}
                                style={styles.photoThumb}
                                contentFit="cover"
                              />
                              <View style={styles.photoThumbBadgeAfter}>
                                <Text style={styles.photoThumbBadgeText}>✨ Foto AFTER (Terpasang)</Text>
                              </View>
                            </TouchableOpacity>
                          ) : isShippedOrApproved ? (
                            <View style={styles.photoThumbPlaceholder}>
                              <Feather name="camera" size={24} color="#f59e0b" />
                              <Text style={styles.photoThumbPlaceholderText}>Menunggu Foto After Toko</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                    {/* TARGET BELANJA ROW */}
                    <View style={styles.targetRow}>
                      <Text style={styles.targetLabel}>
                        {isEnrolledInThisProg && chosenItem?.name
                          ? 'Target Belanja Item Pilihan:'
                          : prog.program_type === 'BARANG_SUPPORT'
                          ? 'Mulai Pembelian:'
                          : 'Target Belanja Akumulasi:'}
                      </Text>
                      <Text style={styles.targetAmount}>
                        Rp {Number(effectiveTarget).toLocaleString('id-ID')}
                        {prog.program_type === 'BARANG_SUPPORT' && !isEnrolledInThisProg && ' (s/d 25 Jt)'}
                      </Text>
                    </View>

                    {/* PROGRESS SECTION (IF ENROLLED) */}
                    {isEnrolledInThisProg && (
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
                            {Number(effectiveTarget).toLocaleString('id-ID')}
                          </Text>
                          {percent < 100 && (
                            <Text style={styles.progressRemaining}>
                              (Kurang Rp {Number(Math.max(0, effectiveTarget - currentAmount)).toLocaleString('id-ID')})
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
                                  Catatan Admin / Resi: {participant.admin_notes}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        )}

                        {/* WAJIB UPLOAD DOKUMENTASI AFTER BANNER (KETIKA BARANG DIKIRIM / TIBA) */}
                        {isShippedOrApproved && prog.program_type === 'BARANG_SUPPORT' && !hasAfterPhoto && (
                          <View style={styles.afterUploadRequiredBox}>
                            <View style={styles.afterUploadRequiredHeader}>
                              <Feather name="alert-triangle" size={18} color="#b45309" />
                              <Text style={styles.afterUploadRequiredTitle}>
                                Wajib Upload Dokumentasi AFTER
                              </Text>
                            </View>
                            <Text style={styles.afterUploadRequiredDesc}>
                              Barang support (rak/etalase) telah dikirim oleh Admin. Jika barang sudah tiba dan selesai dipasang/ditempatkan di toko, Anda wajib mengunggah foto dokumentasi AFTER untuk menyelesaikan program ini.
                            </Text>
                            <TouchableOpacity
                              style={styles.afterUploadActionBtn}
                              onPress={() => {
                                setActiveAfterParticipant(participant);
                                setAfterPhotoUri(null);
                                setAfterPhotoBase64(null);
                                setAfterNotes('');
                                setAfterModalVisible(true);
                              }}
                            >
                              <Feather name="camera" size={16} color="white" />
                              <Text style={styles.afterUploadActionBtnText}>
                                📸 Upload Foto AFTER (Setelah Dipasang)
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* PROGRAM SUDAH SELESAI & FOTO AFTER TERVERIFIKASI */}
                        {hasAfterPhoto && (
                          <View style={styles.completedNotice}>
                            <Feather name="award" size={16} color="#15803d" />
                            <Text style={styles.completedNoticeText}>
                              Dokumentasi AFTER Terpasang! Program support display untuk toko Anda telah selesai & terverifikasi resmi oleh DAP.
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    <Text style={styles.programDesc}>{prog.description}</Text>

                    {/* ACTION FOOTER */}
                    <View style={styles.cardActions}>
                      {isEnrolledInThisProg ? (
                        isAchieved && participant?.status === 'ENROLLED' ? (
                          <TouchableOpacity
                            style={styles.claimRewardBtn}
                            onPress={() => openClaimModal(prog, participant!)}
                          >
                            <Feather name="gift" size={16} color="white" />
                            <Text style={styles.claimRewardBtnText}>🎉 Klaim Hadiah Sekarang</Text>
                          </TouchableOpacity>
                        ) : isShippedOrApproved && prog.program_type === 'BARANG_SUPPORT' && !hasAfterPhoto ? (
                          <TouchableOpacity
                            style={styles.uploadAfterBtnSecondary}
                            onPress={() => {
                              setActiveAfterParticipant(participant);
                              setAfterPhotoUri(null);
                              setAfterPhotoBase64(null);
                              setAfterNotes('');
                              setAfterModalVisible(true);
                            }}
                          >
                            <Feather name="camera" size={16} color="white" />
                            <Text style={styles.uploadAfterBtnSecondaryText}>
                              Upload Dokumentasi After Pemasangan
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.enrolledStatusPill}>
                            <Feather name="check-circle" size={14} color="#15803d" />
                            <Text style={styles.enrolledStatusPillText}>
                              {hasAfterPhoto
                                ? 'Program Selesai & Terpasang Sempurna'
                                : participant?.status === 'CLAIMED'
                                ? 'Klaim Hadiah Sedang Diproses'
                                : 'Anda Telah Terdaftar (Kumpulkan Omset)'}
                            </Text>
                          </View>
                        )
                      ) : isLockedByOtherProgram ? (
                        <View style={styles.lockedSectionBox}>
                          <View style={styles.lockedSectionRow}>
                            <Feather name="lock" size={15} color="#b45309" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.lockedSectionTitle}>Program Terkunci</Text>
                              <Text style={styles.lockedSectionDesc}>
                                Anda sedang mengikuti program{' '}
                                <Text style={{ fontWeight: 'bold', color: '#78350f' }}>
                                  "{activeEnrolledProgram?.title || 'Program Lain'}"
                                </Text>
                                . Setiap toko hanya dapat mengikuti 1 program aktif dalam satu periode.
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.lockedDisabledBtn}
                            activeOpacity={0.7}
                            onPress={() => {
                              const alertMsg = `Toko Anda sedang aktif pada program:\n"${activeEnrolledProgram?.title || 'Program Reward'}".\n\nSesuai ketentuan, Anda hanya dapat mengikuti 1 program dalam satu periode. Anda dapat melihat rincian program ini, namun tidak dapat mendaftar sebelum program aktif Anda diselesaikan atau diklaim.`;
                              if (Platform.OS === 'web') window.alert(alertMsg);
                              else Alert.alert('Hanya 1 Program Aktif 🔒', alertMsg);
                            }}
                          >
                            <Feather name="lock" size={14} color="#94a3b8" />
                            <Text style={styles.lockedDisabledBtnText}>
                              Tidak Bisa Memilih (Sedang Ikut 1 Program)
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.enrollBtn}
                          onPress={() => handleStartEnrollment(prog)}
                        >
                          <Feather name="plus-circle" size={16} color="white" />
                          <Text style={styles.enrollBtnText}>
                            {prog.program_type === 'BARANG_SUPPORT'
                              ? 'Ajukan Program Support (Rak / Etalase)'
                              : 'Ikuti Program Ini'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORM PENGAJUAN PROGRAM SUPPORT DENGAN FOTO BEFORE (WAJIB KAMERA) */}
      {/* ========================================================================= */}
      <Modal visible={applicationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '92%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle}>Form Pengajuan Program Support</Text>
                <Text style={styles.modalSubtitle}>
                  Lengkapi data toko dan ambil foto dokumentasi BEFORE lokasi penempatan barang support di toko Anda.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setApplicationModalVisible(false)}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* 1. DATA AKUN DEALER (OTOMATIS SESUAI AKUN) */}
              <View style={styles.formSectionBox}>
                <View style={styles.formSectionHeader}>
                  <Feather name="user-check" size={15} color="#15803d" />
                  <Text style={styles.formSectionTitle}>Data Toko (Sesuai Akun Anda)</Text>
                </View>

                <View style={styles.accountDataGrid}>
                  <View style={styles.accountDataRow}>
                    <Text style={styles.accountDataLabel}>Nama Pemilik / Akun:</Text>
                    <Text style={styles.accountDataValue}>
                      {currentUserProfile?.full_name || 'Lie Sudito'}
                    </Text>
                  </View>
                  <View style={styles.accountDataRow}>
                    <Text style={styles.accountDataLabel}>Nama Toko:</Text>
                    <Text style={styles.accountDataValue}>
                      {currentDealerProfile?.store_name || 'CV. JAVA CELLULER'}
                    </Text>
                  </View>
                  <View style={styles.accountDataRow}>
                    <Text style={styles.accountDataLabel}>Lokasi / Alamat Toko:</Text>
                    <Text style={styles.accountDataValue}>
                      {currentDealerProfile?.address
                        ? `${currentDealerProfile.address}, ${currentDealerProfile.city || ''}`
                        : 'Jl. Gatot Subroto No. 45, Jakarta Selatan'}
                    </Text>
                  </View>
                  <View style={styles.accountDataRow}>
                    <Text style={styles.accountDataLabel}>No. HP / WhatsApp:</Text>
                    <Text style={styles.accountDataValue}>
                      {currentUserProfile?.phone_number || currentDealerProfile?.phone || '08114991888'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 2. PILIH PRODUK SUPPORT / DISPLAY */}
              <View style={styles.formSectionBox}>
                <View style={styles.formSectionHeader}>
                  <Feather name="gift" size={15} color="#15803d" />
                  <Text style={styles.formSectionTitle}>Pilih Produk Support / Etalase</Text>
                  <TouchableOpacity
                    onPress={() => setPosterModalVisible(true)}
                    style={styles.miniPosterBtn}
                  >
                    <Text style={styles.miniPosterBtnText}>Lihat Poster ➔</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.formSectionSub}>
                  Target akumulasi belanja toko Anda akan mengikuti minimal pembelian item yang Anda pilih:
                </Text>

                {/* 10 Items List */}
                <View style={{ gap: 8, marginTop: 8 }}>
                  {(programToEnroll?.support_items && programToEnroll.support_items.length > 0
                    ? programToEnroll.support_items
                    : DEFAULT_SUPPORT_ITEMS
                  ).map((item) => {
                    const isSelected = selectedSupportItem?.id === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.85}
                        style={[
                          styles.supportItemCard,
                          isSelected && styles.supportItemCardSelected,
                        ]}
                        onPress={() => setSelectedSupportItem(item)}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.itemCodeRow}>
                            <View style={styles.itemCodeBadge}>
                              <Text style={styles.itemCodeBadgeText}>{item.code}</Text>
                            </View>
                            {item.category && (
                              <Text style={styles.itemCategoryText}>{item.category}</Text>
                            )}
                          </View>

                          <Text style={styles.supportItemName}>{item.name}</Text>
                          {item.dimensions && (
                            <Text style={styles.supportItemDim}>Ukuran: {item.dimensions}</Text>
                          )}

                          <View style={styles.minPurchaseBadge}>
                            <Text style={styles.minPurchaseBadgeLabel}>MIN. PEMBELIAN:</Text>
                            <Text style={styles.minPurchaseBadgeValue}>
                              Rp {Number(item.min_purchase).toLocaleString('id-ID')}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 3. UPLOAD FOTO DOKUMENTASI BEFORE (WAJIB INPUT KAMERA/GALERI) */}
              <View style={[styles.formSectionBox, { borderColor: beforePhotoUri ? '#86efac' : '#fde047' }]}>
                <View style={styles.formSectionHeader}>
                  <Feather name="camera" size={16} color="#15803d" />
                  <Text style={styles.formSectionTitle}>
                    Foto Dokumentasi BEFORE (Lokasi Penempatan)
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>WAJIB</Text>
                  </View>
                </View>
                <Text style={styles.formSectionSub}>
                  Ambil foto sudut / lokasi ruangan toko Anda di mana barang support (rak / etalase) ini akan ditempatkan:
                </Text>

                {/* Photo Preview or Capture Buttons */}
                {beforePhotoUri ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image
                      source={{ uri: beforePhotoUri }}
                      style={styles.photoPreviewImage}
                      contentFit="cover"
                    />
                    <View style={styles.photoPreviewOverlay}>
                      <View style={styles.photoSuccessTag}>
                        <Feather name="check" size={13} color="white" />
                        <Text style={styles.photoSuccessTagText}>Foto Before Siap Diunggah</Text>
                      </View>
                      <View style={styles.photoActionButtonsRow}>
                        <TouchableOpacity
                          style={styles.retakePhotoBtn}
                          onPress={() => handleCapturePhoto('before', 'camera')}
                        >
                          <Feather name="camera" size={13} color="white" />
                          <Text style={styles.retakePhotoBtnText}>Foto Ulang</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deletePhotoBtn}
                          onPress={() => {
                            setBeforePhotoUri(null);
                            setBeforePhotoBase64(null);
                          }}
                        >
                          <Feather name="trash-2" size={13} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoEmptyUploadBox}>
                    <Feather name="image" size={36} color="#94a3b8" />
                    <Text style={styles.photoEmptyUploadTitle}>Belum Ada Foto Dokumentasi Lokasi</Text>
                    <Text style={styles.photoEmptyUploadSub}>
                      Pilih salah satu tombol di bawah untuk mengambil foto langsung di toko:
                    </Text>

                    <View style={styles.photoButtonsGrid}>
                      <TouchableOpacity
                        style={styles.cameraBtn}
                        onPress={() => handleCapturePhoto('before', 'camera')}
                      >
                        <Feather name="camera" size={18} color="white" />
                        <Text style={styles.cameraBtnText}>Buka Kamera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={() => handleCapturePhoto('before', 'gallery')}
                      >
                        <Feather name="image" size={18} color="#1e293b" />
                        <Text style={styles.galleryBtnText}>Pilih Galeri</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Catatan Tambahan Penempatan */}
                <Text style={[styles.accountDataLabel, { marginTop: 12, marginBottom: 4 }]}>
                  Catatan Rencana Penempatan Toko (Opsional):
                </Text>
                <TextInput
                  style={styles.placementTextInput}
                  placeholder="misal: Diletakkan di samping etalase kaca depan kasir..."
                  value={placementNotes}
                  onChangeText={setPlacementNotes}
                />
              </View>
            </ScrollView>

            {/* Selection Confirmation Footer */}
            <View style={styles.selectionFooter}>
              <View style={styles.selectionFooterInfo}>
                <Text style={styles.selectionFooterLabel}>Item Pilihan:</Text>
                <Text style={styles.selectionFooterName} numberOfLines={1}>
                  {selectedSupportItem?.code} - {selectedSupportItem?.name}
                </Text>
                <Text style={styles.selectionFooterTarget}>
                  Target Belanja: Rp {Number(selectedSupportItem?.min_purchase || 0).toLocaleString('id-ID')}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmSelectionBtn,
                  !beforePhotoUri && { backgroundColor: '#94a3b8' },
                ]}
                onPress={submitSupportItemApplication}
                disabled={enrolling}
              >
                {enrolling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="white" />
                    <Text style={styles.confirmSelectionBtnText}>
                      {beforePhotoUri ? 'Kirim Pengajuan & Ikuti Program' : 'Wajib Ambil Foto Before'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD DOKUMENTASI AFTER (SETELAH BARANG TIBA & DIPASANG) */}
      {/* ========================================================================= */}
      <Modal visible={afterModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalTitle}>Upload Foto Dokumentasi AFTER</Text>
                <Text style={styles.modalSubtitle}>
                  Barang support telah tiba? Ambil foto bukti bahwa barang rak / etalase telah dirakit dan terpasang di toko Anda.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAfterModalVisible(false)}
              >
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Review Foto Before */}
              {activeAfterParticipant?.photo_before_url && (
                <View style={styles.beforeReviewCard}>
                  <Text style={styles.beforeReviewLabel}>Foto BEFORE Lokasi Awal Saat Mendaftar:</Text>
                  <Image
                    source={{ uri: activeAfterParticipant.photo_before_url }}
                    style={styles.beforeReviewImage}
                    contentFit="cover"
                  />
                </View>
              )}

              {/* Input Foto After */}
              <View style={[styles.formSectionBox, { marginTop: 12 }]}>
                <View style={styles.formSectionHeader}>
                  <Feather name="camera" size={16} color="#15803d" />
                  <Text style={styles.formSectionTitle}>Foto Barang AFTER (Terpasang di Toko)</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>WAJIB</Text>
                  </View>
                </View>

                {afterPhotoUri ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image
                      source={{ uri: afterPhotoUri }}
                      style={styles.photoPreviewImage}
                      contentFit="cover"
                    />
                    <View style={styles.photoPreviewOverlay}>
                      <View style={styles.photoSuccessTag}>
                        <Feather name="check" size={13} color="white" />
                        <Text style={styles.photoSuccessTagText}>Foto After Siap Diunggah</Text>
                      </View>
                      <View style={styles.photoActionButtonsRow}>
                        <TouchableOpacity
                          style={styles.retakePhotoBtn}
                          onPress={() => handleCapturePhoto('after', 'camera')}
                        >
                          <Feather name="camera" size={13} color="white" />
                          <Text style={styles.retakePhotoBtnText}>Foto Ulang</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deletePhotoBtn}
                          onPress={() => {
                            setAfterPhotoUri(null);
                            setAfterPhotoBase64(null);
                          }}
                        >
                          <Feather name="trash-2" size={13} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoEmptyUploadBox}>
                    <Feather name="camera" size={36} color="#94a3b8" />
                    <Text style={styles.photoEmptyUploadTitle}>Ambil Foto Barang Support yang Sudah Dipasang</Text>
                    <Text style={styles.photoEmptyUploadSub}>
                      Pastikan barang rak/etalase tampak jelas terpasang di dalam toko Anda:
                    </Text>

                    <View style={styles.photoButtonsGrid}>
                      <TouchableOpacity
                        style={styles.cameraBtn}
                        onPress={() => handleCapturePhoto('after', 'camera')}
                      >
                        <Feather name="camera" size={18} color="white" />
                        <Text style={styles.cameraBtnText}>Buka Kamera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={() => handleCapturePhoto('after', 'gallery')}
                      >
                        <Feather name="image" size={18} color="#1e293b" />
                        <Text style={styles.galleryBtnText}>Pilih Galeri</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={[styles.accountDataLabel, { marginTop: 12, marginBottom: 4 }]}>
                  Catatan Pemasangan / Konfirmasi Penerimaan:
                </Text>
                <TextInput
                  style={styles.placementTextInput}
                  placeholder="misal: Barang tiba dalam kondisi baik dan sudah selesai dirakit di toko..."
                  value={afterNotes}
                  onChangeText={setAfterNotes}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitAfterBtn,
                  !afterPhotoUri && { backgroundColor: '#94a3b8' },
                ]}
                onPress={submitAfterDocumentation}
                disabled={submittingAfter || !afterPhotoUri}
              >
                {submittingAfter ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="white" />
                    <Text style={styles.submitAfterBtnText}>
                      Kirim Dokumentasi AFTER & Selesaikan Program
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: BROSUR POSTER KATALOG DAP RESMI */}
      {/* ========================================================================= */}
      <Modal visible={posterModalVisible} transparent animationType="fade">
        <View style={styles.posterModalOverlay}>
          <View style={styles.posterModalContainer}>
            <View style={styles.posterModalHeader}>
              <Text style={styles.posterModalTitle}>Katalog Resmi Program Support DAP</Text>
              <TouchableOpacity
                style={styles.posterModalCloseBtn}
                onPress={() => setPosterModalVisible(false)}
              >
                <Feather name="x" size={22} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flex: 1 }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Image
                source={catalogPoster}
                style={{
                  width: SCREEN_WIDTH - 24,
                  height: ((SCREEN_WIDTH - 24) * 1414) / 1000,
                  borderRadius: 12,
                }}
                contentFit="contain"
              />
            </ScrollView>
            <View style={styles.posterModalFooter}>
              <Text style={styles.posterModalFooterText}>
                Hubungi Area Manager / Admin DAP untuk spesifikasi detail dan jadwal pengiriman item display.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: LIGHTBOX PREVIEW FOTO HIGH RESOLUTION */}
      {/* ========================================================================= */}
      <Modal visible={!!lightboxImageUri} transparent animationType="fade">
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={styles.lightboxCloseBtn}
            onPress={() => setLightboxImageUri(null)}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          {lightboxImageUri && (
            <Image
              source={{ uri: lightboxImageUri }}
              style={styles.lightboxImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: KLAIM HADIAH REWARD (ALAMAT PENGIRIMAN) */}
      {/* ========================================================================= */}
      <Modal visible={claimModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {activeClaimProgram && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.modalTitle}>Klaim Hadiah Program</Text>
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
                      <Text style={styles.modalRewardHighlightTitle}>Hadiah yang Anda Menangkan:</Text>
                      <Text style={styles.modalRewardHighlightDesc}>
                        {activeClaimProgram.program.reward_description}
                      </Text>
                      {activeClaimProgram.participant.selected_item_name && (
                        <Text style={styles.modalChosenItemHighlight}>
                          Item Pilihan: {activeClaimProgram.participant.selected_item_name}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text style={styles.modalInputLabel}>
                    {activeClaimProgram.program.program_type === 'BARANG_SUPPORT'
                      ? 'Alamat Pengiriman Barang Support & Kontak Toko:'
                      : activeClaimProgram.program.program_type === 'TRIP'
                      ? 'Data Identitas Peserta Tour (Nama KTP/Paspor & No WA):'
                      : 'Data Rekening Bank Pencairan Cashback (Bank, No Rek, Atas Nama):'}
                  </Text>
                  <TextInput
                    style={styles.modalTextarea}
                    multiline
                    numberOfLines={5}
                    value={claimNotes}
                    onChangeText={setClaimNotes}
                    placeholder="Tuliskan detail penerima hadiah atau alamat pengiriman di sini..."
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
                        <Text style={styles.submitClaimBtnText}>Kirimkan Pengajuan Klaim Hadiah</Text>
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
    paddingBottom: 18,
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
    fontSize: 19,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#dcf0c3',
    marginTop: 2,
  },

  // Active Program Top Banner
  topActiveBanner: {
    backgroundColor: '#ecfdf5',
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topActiveIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topActiveTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  topActiveBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  topActiveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topActiveDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginTop: 1,
  },
  topActiveSub: {
    fontSize: 10,
    color: '#059669',
    marginTop: 1,
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
  programCardActive: {
    borderColor: '#8ec44a',
    borderWidth: 2,
  },
  programCardLocked: {
    borderColor: '#e2e8f0',
    opacity: 0.95,
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
  lockedWatermarkBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(180, 83, 9, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lockedWatermarkText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 16,
  },
  programTitle: {
    fontSize: 16,
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

  // Support Catalog Banner Box
  supportCatalogNoticeBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  supportCatalogNoticeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  supportCatalogNoticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 3,
  },
  supportCatalogNoticeSub: {
    fontSize: 11,
    color: '#15803d',
    lineHeight: 15,
  },
  viewPosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewPosterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },

  // Chosen Item Box
  chosenItemBox: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fde047',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  chosenItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chosenItemHeaderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#854d0e',
    textTransform: 'uppercase',
  },
  chosenItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#713f12',
    marginBottom: 4,
  },
  chosenItemTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chosenItemTargetLabel: {
    fontSize: 11,
    color: '#a16207',
  },
  chosenItemTargetValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#854d0e',
  },

  // Photo Documentation Card
  photoDocumentationCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  photoDocumentationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  photoDocumentationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumbContainer: {
    flex: 1,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoThumbBadgeBefore: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  photoThumbBadgeAfter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(21, 128, 61, 0.85)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  photoThumbBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  photoThumbPlaceholder: {
    flex: 1,
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
  },
  photoThumbPlaceholderText: {
    fontSize: 10,
    color: '#b45309',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },

  // Target Row
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

  // Progress Section
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

  // Required After Upload Box
  afterUploadRequiredBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  afterUploadRequiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  afterUploadRequiredTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  afterUploadRequiredDesc: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 15,
    marginBottom: 10,
  },
  afterUploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    paddingVertical: 10,
    borderRadius: 10,
  },
  afterUploadActionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  completedNoticeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803d',
    flex: 1,
  },

  // Actions
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
  uploadAfterBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadAfterBtnSecondaryText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  enrolledStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  enrolledStatusPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },

  // Locked Section (Rule 1)
  lockedSectionBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  lockedSectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lockedSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
  },
  lockedSectionDesc: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 15,
    marginTop: 1,
  },
  lockedDisabledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    borderRadius: 10,
  },
  lockedDisabledBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
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

  // Modals Overlay & Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Form Section Box
  formSectionBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  formSectionSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginTop: 2,
  },
  miniPosterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  miniPosterBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d',
  },
  requiredBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Account Data Display
  accountDataGrid: {
    marginTop: 8,
    gap: 6,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accountDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  accountDataLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  accountDataValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    textAlign: 'right',
  },

  // Support Item Selector Card
  supportItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
  },
  supportItemCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#16a34a',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  itemCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  itemCodeBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  itemCodeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemCategoryText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  supportItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  supportItemDim: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  minPurchaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef08a',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  minPurchaseBadgeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#713f12',
  },
  minPurchaseBadgeValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#854d0e',
  },

  // Photo Input Styles
  photoEmptyUploadBox: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  photoEmptyUploadTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  photoEmptyUploadSub: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  photoButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingVertical: 10,
    borderRadius: 10,
  },
  cameraBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  galleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  galleryBtnText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoPreviewWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10,
    backgroundColor: '#0f172a',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoPreviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  photoSuccessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoSuccessTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  photoActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retakePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retakePhotoBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deletePhotoBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    padding: 6,
    borderRadius: 6,
  },
  placementTextInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },

  // Selection Footer
  selectionFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: 'white',
  },
  selectionFooterInfo: {
    marginBottom: 10,
  },
  selectionFooterLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectionFooterName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  selectionFooterTarget: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 1,
  },
  confirmSelectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmSelectionBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Modal After Styles
  beforeReviewCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  beforeReviewLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
  },
  beforeReviewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  submitAfterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  submitAfterBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // DAP Poster Modal
  posterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    paddingTop: 40,
  },
  posterModalContainer: {
    flex: 1,
  },
  posterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  posterModalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  posterModalCloseBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  posterModalFooter: {
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  posterModalFooterText: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Lightbox
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  lightboxImage: {
    width: SCREEN_WIDTH - 20,
    height: '75%',
  },

  // Claim Modal Specific
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
  modalChosenItemHighlight: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
    marginTop: 4,
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
