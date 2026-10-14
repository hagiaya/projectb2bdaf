import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSED = 3;
  readyState = 3; url = ''; protocol = '';
  onopen = null; onmessage = null; onclose = null; onerror = null;
  constructor() {} close() {} send() {} addEventListener() {} removeEventListener() {} dispatchEvent() { return false; }
}
globalThis.WebSocket = MockWebSocket;

const REGION_IDS = {
  PAPUA: 'c95f1cb6-b825-48d8-9523-39cd5a740fcb',
  MALUKU: 'c7386317-90a2-4023-bcd2-5f23909f2d71',
};

const SALES_IDS = {
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

const TERRITORY_RULES = [
  {
    salesId: SALES_IDS.SANDI_MANOKWARI,
    salesName: 'Sandi Manokwari',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'MANOKWARI', 'WOSI', 'MAKALO', 'RANSIKI', 'PRAFI', 'ORANSBARI',
      'SIDEY', 'ANDAY', 'SANGGENG', 'ARFAK', 'WARMARE', 'MASNI', 'AMBAN',
      'BINTUNI', 'TELUK BINTUNI', 'WONDAMA', 'TELUK WONDAMA', 'TRIKORA',
      'GUNUNG SALJU', 'PASAR KENANGAN', 'MANOKWARI BARAT', 'MANOKWARI TIMUR',
      'MANOKWARI SELATAN'
    ]
  },
  {
    salesId: SALES_IDS.VERDY_TIMIKA,
    salesName: 'Verdy Timika',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'TIMIKA', 'MIMIKA', 'KUALA KENCANA', 'TEMBAGAPURA', 'POMAKO',
      'KWAMKI', 'AGIMUGA', 'MIMIKA BARU', 'MIMIKA TIMUR', 'MIMIKA TENGAH',
      'BUDI UTOMO', 'CENDRAWASIH', 'HEATUBUN', 'BHAYANGKARA'
    ]
  },
  {
    salesId: SALES_IDS.DERIL_MERAUKE,
    salesName: 'Deril Merauke',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'MERAUKE', 'BOVEN DIGOEL', 'MANDOBO', 'MAPPI', 'ASMAT', 'TANAH MERAH',
      'MINDIPTANA', 'KURIK', 'SEMITA', 'SOTA', 'BRAWIJAYA', 'SERINGGU',
      'PAULUS NAFI', 'MOERDANI'
    ]
  },
  {
    salesId: SALES_IDS.AJI_NABIRE,
    salesName: 'Aji Nabire',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'NABIRE', 'PANIAI', 'DEIYAI', 'DOGIYAI', 'INTAN JAYA', 'ENAROTALI',
      'WANGGAR', 'YARO', 'NABIRE BARAT', 'MARTADINATA', 'MAMORIBO',
      'FRANS KAISEPO'
    ]
  },
  {
    salesId: SALES_IDS.FERDY_SENTANI,
    salesName: 'Ferdy Sentani',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'SENTANI', 'DOYO', 'WAIBU', 'NIMBORAN', 'GENYEM', 'KEMTUK', 'DEMTA',
      'KABUPATEN JAYAPURA', 'KAB. JAYAPURA', 'DOYO BARU', 'YOUMAKHE',
      'PASAR BARU SENTANI'
    ]
  },
  {
    salesId: SALES_IDS.EDY_JAYAPURA,
    salesName: 'Edy Jayapura',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'KOTA JAYAPURA', 'JAYAPURA UTARA', 'JAYAPURA SELATAN', 'ABEPURA',
      'HERAM', 'WAENA', 'YOUTEFA', 'MUARA TAMI', 'HAMADI', 'ENTROP',
      'KAMBOLKER', 'KAMWOLKER', 'GARUDA ABEPURA', 'GERILYAWAN'
    ]
  },
  {
    salesId: SALES_IDS.SALES_WAMENA,
    salesName: 'Sales Wamena',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'WAMENA', 'JAYAWIJAYA', 'TOLIKARA', 'LANNY JAYA', 'NDUGA', 'YALIMO',
      'YAHUKIMO', 'PEGUNUNGAN BINTANG', 'KARUBAGA', 'TIOM', 'SAFRI DARWIN'
    ]
  },
  {
    salesId: SALES_IDS.SALES_BIAK_SERUI,
    salesName: 'Sales Biak Serui',
    regionId: REGION_IDS.PAPUA,
    regionName: 'PAPUA',
    keywords: [
      'BIAK', 'SERUI', 'YAPEN', 'SUPIORI', 'WAROPEN', 'SAMOFA', 'NUMFOR',
      'KEPULAUAN YAPEN'
    ]
  },
  {
    salesId: SALES_IDS.SALES_FAKFAK_KAIMANA,
    salesName: 'Sales FakFak Kaimana',
    regionId: REGION_IDS.MALUKU,
    regionName: 'MALUKU',
    keywords: [
      'FAKFAK', 'FAK-FAK', 'FAK FAK', 'KAIMANA', 'KOKAS', 'BOMBERAY'
    ]
  },
  {
    salesId: SALES_IDS.SALES_TERNATE,
    salesName: 'Sales Ternate',
    regionId: REGION_IDS.MALUKU,
    regionName: 'MALUKU',
    keywords: [
      'TERNATE', 'TIDORE', 'HALMAHERA', 'MOROTAI', 'TOBELO', 'JAILOLO',
      'BACAN', 'SOFIFI', 'SANANA', 'SULA', 'PULAU MOROTAI', 'TAPAK RAYA'
    ]
  },
  {
    salesId: SALES_IDS.SALES_AMBON,
    salesName: 'Sales Ambon',
    regionId: REGION_IDS.MALUKU,
    regionName: 'MALUKU',
    keywords: [
      'AMBON', 'SERAM', 'BURU', 'MALUKU TENGAH', 'NAMLEA', 'MASOHI',
      'TUAL', 'ARU', 'TANIMBAR', 'SAUMLAKI', 'BANDA', 'KOTA AMBON'
    ]
  },
];

export function detectTerritoryFromAddress(address) {
  if (!address || typeof address !== 'string' || address.trim() === '') return null;
  const clean = address.toUpperCase().replace(/[,.-]/g, ' ');

  for (const rule of TERRITORY_RULES) {
    for (const kw of rule.keywords) {
      const pattern = new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i');
      if (pattern.test(clean) || clean.includes(kw)) {
        return {
          regionId: rule.regionId,
          regionName: rule.regionName,
          salesId: rule.salesId,
          salesName: rule.salesName,
        };
      }
    }
  }

  if (clean.includes('MALUKU')) {
    return {
      regionId: REGION_IDS.MALUKU,
      regionName: 'MALUKU',
      salesId: SALES_IDS.WILLIAM_SPV,
      salesName: 'William (SPV Maluku)',
    };
  }

  if (clean.includes('PAPUA') || clean.includes('SORONG')) {
    return {
      regionId: REGION_IDS.PAPUA,
      regionName: 'PAPUA',
      salesId: clean.includes('SORONG') ? SALES_IDS.SANDI_MANOKWARI : SALES_IDS.SEPTI_SPV,
      salesName: clean.includes('SORONG') ? 'Sandi Manokwari' : 'Septi (SPV Papua)',
    };
  }

  return null;
}

async function run() {
  const supabase = createClient('https://mvpwgzkvmadtsspewxtu.supabase.co', 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj');
  await supabase.auth.signInWithPassword({ email: 'ditoapp@atomicmail.io', password: 'admin123' });

  const { data: list } = await supabase.from('dealers').select('id, store_name, address, region_id, sales_id');
  
  let updatedCount = 0;
  for (const d of list) {
    if (!d.region_id || !d.sales_id) {
      const detected = detectTerritoryFromAddress(d.address || d.store_name);
      if (detected) {
        const updatePayload = {};
        if (!d.region_id) updatePayload.region_id = detected.regionId;
        if (!d.sales_id) updatePayload.sales_id = detected.salesId;
        
        console.log(`Updating [${d.store_name}] -> Region: ${detected.regionName}, Sales: ${detected.salesName}`);
        const { error } = await supabase.from('dealers').update(updatePayload).eq('id', d.id);
        if (error) console.error('  Error updating:', error);
        else updatedCount++;
      }
    }
  }
  console.log(`\nReconciliation completed! Successfully auto-assigned ${updatedCount} dealers.`);
}

run();
