/**
 * Territory & Sales PIC Auto-Detector for DAP B2B (Mobile App)
 * Mendeteksi Wilayah (Region) dan Sales PIC secara otomatis berdasarkan kata kunci alamat (kota/kabupaten/distrik).
 */

export interface DetectedTerritory {
  regionId: string;
  regionName: string;
  salesId: string;
  salesName: string;
  cityArea: string;
}

export const REGION_IDS = {
  PAPUA: 'c95f1cb6-b825-48d8-9523-39cd5a740fcb',
  MALUKU: 'c7386317-90a2-4023-bcd2-5f23909f2d71',
};

export const SALES_IDS = {
  SANDI_MANOKWARI: 'bd1b9e81-fe94-417b-9461-667d34ce26aa',
  VERDY_TIMIKA: 'a876d0bd-10ec-4ed3-a6af-bbc03e963298',
  DERIL_MERAUKE: 'ca7766d4-2682-49de-b132-981b343b12d6',
  AJI_NABIRE: 'd4d9cdf6-e20a-4612-8b6a-4a101ae633d6',
  FERDY_SENTANI: '18216431-2bbe-48fb-b24d-0b5f32cf805f',
  EDY_JAYAPURA: 'ccabe3cd-6b73-4423-9989-cb5b2bef0cfb',
  SALES_WAMENA: 'a6096e87-d022-4b66-86d3-fadf9917f292',
  SALES_BIAK_SERUI: '641b9f13-378b-4536-b83b-7380cdb6ca66',
  SALES_FAKFAK_KAIMANA: 'bf959fbc-ed28-4bf9-8983-20cbf36b0961',
  SALES_TERNATE: '0cff6c5c-a052-46e5-bf2b-aac45d9b9240',
  SALES_AMBON: 'd96df4d6-ab8c-4ea5-b009-33812ec320d5',
  SEPTI_SPV: 'acaa9ebb-de08-4869-8789-a3626778233f',
  WILLIAM_SPV: '402fc1f9-7cbc-4238-b92b-9a6a3a256cc4',
};

/**
 * Aturan pencocokan kata kunci area ke Sales PIC dan Wilayah
 */
const TERRITORY_RULES = [
  // 1. Manokwari, Manokwari Selatan, Bintuni, Wondama, Pegunungan Arfak -> Sandi Manokwari
  {
    salesId: SALES_IDS.SANDI_MANOKWARI,
    salesName: 'Sandi Manokwari',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Manokwari & Sekitarnya',
    keywords: [
      'MANOKWARI', 'WOSI', 'MAKALO', 'RANSIKI', 'PRAFI', 'ORANSBARI',
      'SIDEY', 'ANDAY', 'SANGGENG', 'ARFAK', 'WARMARE', 'MASNI', 'AMBAN',
      'BINTUNI', 'TELUK BINTUNI', 'WONDAMA', 'TELUK WONDAMA', 'TRIKORA',
      'GUNUNG SALJU', 'PASAR KENANGAN', 'MANOKWARI BARAT', 'MANOKWARI TIMUR',
      'MANOKWARI SELATAN'
    ]
  },

  // 2. Timika & Mimika -> Verdy Timika
  {
    salesId: SALES_IDS.VERDY_TIMIKA,
    salesName: 'Verdy Timika',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Timika / Mimika',
    keywords: [
      'TIMIKA', 'MIMIKA', 'KUALA KENCANA', 'TEMBAGAPURA', 'POMAKO',
      'KWAMKI', 'AGIMUGA', 'MIMIKA BARU', 'MIMIKA TIMUR', 'MIMIKA TENGAH',
      'BUDI UTOMO', 'CENDRAWASIH', 'HEATUBUN', 'BHAYANGKARA'
    ]
  },

  // 3. Merauke, Boven Digoel, Asmat, Mappi -> Deril Merauke
  {
    salesId: SALES_IDS.DERIL_MERAUKE,
    salesName: 'Deril Merauke',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Merauke & Sekitarnya',
    keywords: [
      'MERAUKE', 'BOVEN DIGOEL', 'MANDOBO', 'MAPPI', 'ASMAT', 'TANAH MERAH',
      'MINDIPTANA', 'KURIK', 'SEMITA', 'SOTA', 'BRAWIJAYA', 'SERINGGU',
      'PAULUS NAFI', 'MOERDANI'
    ]
  },

  // 4. Nabire, Paniai, Deiyai, Dogiyai -> Aji Nabire
  {
    salesId: SALES_IDS.AJI_NABIRE,
    salesName: 'Aji Nabire',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Nabire & Sekitarnya',
    keywords: [
      'NABIRE', 'PANIAI', 'DEIYAI', 'DOGIYAI', 'INTAN JAYA', 'ENAROTALI',
      'WANGGAR', 'YARO', 'NABIRE BARAT', 'MARTADINATA', 'MAMORIBO',
      'FRANS KAISEPO'
    ]
  },

  // 5. Sentani, Doyo, Waibu, Kab. Jayapura -> Ferdy Sentani
  {
    salesId: SALES_IDS.FERDY_SENTANI,
    salesName: 'Ferdy Sentani',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Sentani / Kab. Jayapura',
    keywords: [
      'SENTANI', 'DOYO', 'WAIBU', 'NIMBORAN', 'GENYEM', 'KEMTUK', 'DEMTA',
      'KABUPATEN JAYAPURA', 'KAB. JAYAPURA', 'DOYO BARU', 'YOUMAKHE',
      'PASAR BARU SENTANI'
    ]
  },

  // 6. Kota Jayapura, Abepura, Heram, Waena -> Edy Jayapura
  {
    salesId: SALES_IDS.EDY_JAYAPURA,
    salesName: 'Edy Jayapura',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Kota Jayapura & Abepura',
    keywords: [
      'KOTA JAYAPURA', 'JAYAPURA UTARA', 'JAYAPURA SELATAN', 'ABEPURA',
      'HERAM', 'WAENA', 'YOUTEFA', 'MUARA TAMI', 'HAMADI', 'ENTROP',
      'KAMBOLKER', 'KAMWOLKER', 'GARUDA ABEPURA', 'GERILYAWAN'
    ]
  },

  // 7. Wamena, Jayawijaya, Pegunungan Tengah -> Sales Wamena
  {
    salesId: SALES_IDS.SALES_WAMENA,
    salesName: 'Sales Wamena',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Wamena / Jayawijaya',
    keywords: [
      'WAMENA', 'JAYAWIJAYA', 'TOLIKARA', 'LANNY JAYA', 'NDUGA', 'YALIMO',
      'YAHUKIMO', 'PEGUNUNGAN BINTANG', 'KARUBAGA', 'TIOM', 'SAFRI DARWIN'
    ]
  },

  // 8. Biak, Serui, Yapen, Waropen -> Sales Biak Serui
  {
    salesId: SALES_IDS.SALES_BIAK_SERUI,
    salesName: 'Sales Biak Serui',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    cityArea: 'Biak & Serui',
    keywords: [
      'BIAK', 'SERUI', 'YAPEN', 'SUPIORI', 'WAROPEN', 'SAMOFA', 'NUMFOR',
      'KEPULAUAN YAPEN'
    ]
  },

  // 9. Fakfak & Kaimana -> Sales FakFak Kaimana
  {
    salesId: SALES_IDS.SALES_FAKFAK_KAIMANA,
    salesName: 'Sales FakFak Kaimana',
    regionId: REGION_IDS.MALUKU,
    regionName: 'MALUKU',
    cityArea: 'Fakfak & Kaimana',
    keywords: [
      'FAKFAK', 'FAK-FAK', 'FAK FAK', 'KAIMANA', 'KOKAS', 'BOMBERAY'
    ]
  },

  // 10. Ternate, Halmahera, Tidore, Morotai, Tobelo -> Sales Ternate
  {
    salesId: SALES_IDS.SALES_TERNATE,
    salesName: 'Sales Ternate',
    regionId: REGION_IDS.MALUKU,
    regionName: 'MALUKU',
    cityArea: 'Ternate & Maluku Utara',
    keywords: [
      'TERNATE', 'TIDORE', 'HALMAHERA', 'MOROTAI', 'TOBELO', 'JAILOLO',
      'BACAN', 'SOFIFI', 'SANANA', 'SULA', 'PULAU MOROTAI', 'TAPAK RAYA'
    ]
  },

  // 11. Ambon, Seram, Buru, Maluku Tengah -> Sales Ambon
  {
    salesId: SALES_IDS.SALES_AMBON,
    salesName: 'Sales Ambon',
    regionId: REGION_IDS.MALUKU,
    regionName: 'MALUKU',
    cityArea: 'Ambon & Maluku',
    keywords: [
      'AMBON', 'SERAM', 'BURU', 'MALUKU TENGAH', 'NAMLEA', 'MASOHI',
      'TUAL', 'ARU', 'TANIMBAR', 'SAUMLAKI', 'BANDA', 'KOTA AMBON'
    ]
  },
];

/**
 * Deteksi Wilayah dan Sales PIC dari teks alamat lengkap
 */
export function detectTerritoryFromAddress(address: string | null | undefined): DetectedTerritory | null {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return null;
  }

  const clean = address.toUpperCase().replace(/[,.-]/g, ' ');

  // 1. Cek aturan spesifik kota/kabupaten/area
  for (const rule of TERRITORY_RULES) {
    for (const kw of rule.keywords) {
      const pattern = new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i');
      if (pattern.test(clean) || clean.includes(kw)) {
        return {
          regionId: rule.regionId,
          regionName: rule.regionName,
          salesId: rule.salesId,
          salesName: rule.salesName,
          cityArea: rule.cityArea,
        };
      }
    }
  }

  // 2. Fallback Maluku Umum
  if (clean.includes('MALUKU')) {
    return {
      regionId: REGION_IDS.MALUKU,
      regionName: 'MALUKU',
      salesId: SALES_IDS.WILLIAM_SPV,
      salesName: 'William (SPV Maluku)',
      cityArea: 'Maluku',
    };
  }

  // 3. Fallback Papua Umum
  if (
    clean.includes('PAPUA') ||
    clean.includes('SORONG') ||
    clean.includes('TEMINABUAN') ||
    clean.includes('MAYBRAT') ||
    clean.includes('TAMBRAUW') ||
    clean.includes('RAJA AMPAT')
  ) {
    if (clean.includes('SORONG')) {
      return {
        regionId: REGION_IDS.PAPUA,
        regionName: 'PAPUA',
        salesId: SALES_IDS.SANDI_MANOKWARI,
        salesName: 'Sandi Manokwari',
        cityArea: 'Sorong / Papua Barat Daya',
      };
    }

    return {
      regionId: REGION_IDS.PAPUA,
      regionName: 'PAPUA',
      salesId: SALES_IDS.SEPTI_SPV,
      salesName: 'Septi (SPV Papua)',
      cityArea: 'Papua Umum',
    };
  }

  return null;
}
