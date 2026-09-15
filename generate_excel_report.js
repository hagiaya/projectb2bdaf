const XLSX = require('xlsx');
const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          apikey: 'sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj',
          Authorization: 'Bearer sb_publishable_q8MhULti42S-YqSHyA0aNw_Mrh-_jyj',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    ).on('error', reject);
  });
}

async function generate() {
  console.log('Mengambil data dari Supabase...');
  const categories = await fetchJson(
    'https://mvpwgzkvmadtsspewxtu.supabase.co/rest/v1/categories?select=id,name'
  );
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const products = await fetchJson(
    'https://mvpwgzkvmadtsspewxtu.supabase.co/rest/v1/products?select=id,name,sku,price,stock,image_url,category_id,status&order=name.asc'
  );

  const sheet1Data = []; // Tanpa Foto (59)
  const sheet2Data = []; // Nama 'nan' (38)
  const sheet3Data = []; // All Combined Unique Issues (72)

  const uniqueIssues = new Map();

  let no1 = 1;
  let no2 = 1;

  for (const p of products) {
    const category = catMap[p.category_id] || 'Tanpa Kategori';
    const img = p.image_url || '';
    const isPlaceholder =
      !img ||
      img.includes('placehold.co') ||
      img.toLowerCase().includes('placeholder');
    const isNanName = p.name && p.name.trim().toLowerCase() === 'nan';

    if (isPlaceholder) {
      sheet1Data.push({
        No: no1++,
        SKU: p.sku,
        Kategori: category,
        'Nama Produk Saat Ini': isNanName ? '[KOSONG / nan]' : p.name,
        'Harga (Rp)': p.price,
        Stok: p.stock,
        'Status Foto': 'Belum Ada Foto (Placeholder)',
        'Status Nama': isNanName ? 'Perlu Dilengkapi (nan)' : 'Normal',
        'Kolom Input: Nama Baru (Jika Ada)': '',
        'Kolom Input: Nama File Foto': '',
      });
    }

    if (isNanName) {
      sheet2Data.push({
        No: no2++,
        SKU: p.sku,
        Kategori: category,
        'Nama Produk Saat Ini': '[KOSONG / nan]',
        'Harga (Rp)': p.price,
        Stok: p.stock,
        'Status Foto': isPlaceholder
          ? 'Belum Ada Foto'
          : 'Foto Sudah Ada di Cloud R2',
        'Kolom Input: Nama Lengkap Baru': '',
      });
    }

    if (isPlaceholder || isNanName) {
      let issueType = '';
      if (isPlaceholder && isNanName) {
        issueType = 'Foto Belum Ada & Nama Kosong (nan)';
      } else if (isPlaceholder) {
        issueType = 'Foto Belum Ada';
      } else {
        issueType = 'Nama Kosong (nan) - Foto Sudah Ada';
      }

      uniqueIssues.set(p.sku, {
        SKU: p.sku,
        Kategori: category,
        'Nama Produk Saat Ini': isNanName ? '[KOSONG / nan]' : p.name,
        'Harga (Rp)': p.price,
        Stok: p.stock,
        'Keterangan Masalah': issueType,
        'Status Foto': isPlaceholder ? 'Belum Ada' : 'Sudah Ada di Cloud R2',
        'Kolom Input: Nama Lengkap Baru': '',
        'Kolom Input: Nama File Foto': '',
      });
    }
  }

  let no3 = 1;
  for (const item of uniqueIssues.values()) {
    sheet3Data.push({ No: no3++, ...item });
  }

  // 1. Create Excel Workbook (.xlsx)
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  const ws3 = XLSX.utils.json_to_sheet(sheet3Data);

  const colWidths = [
    { wch: 6 }, // No
    { wch: 18 }, // SKU
    { wch: 25 }, // Kategori
    { wch: 35 }, // Nama
    { wch: 15 }, // Harga
    { wch: 8 }, // Stok
    { wch: 32 }, // Status / Masalah
    { wch: 30 }, // Status Nama
    { wch: 35 }, // Kolom Input 1
    { wch: 35 }, // Kolom Input 2
  ];

  ws1['!cols'] = colWidths;
  ws2['!cols'] = colWidths;
  ws3['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws1, '59 Produk Belum Ada Foto');
  XLSX.utils.book_append_sheet(wb, ws2, '38 Produk Nama nan');
  XLSX.utils.book_append_sheet(wb, ws3, 'Rekap Lengkap (72 Produk)');

  const excelPath = './daftar_produk_perlu_dilengkapi.xlsx';
  XLSX.writeFile(wb, excelPath);
  console.log('Berhasil membuat file Excel:', excelPath);

  // 2. Create CSV files (.csv)
  const csvContent1 = XLSX.utils.sheet_to_csv(ws1);
  fs.writeFileSync('./daftar_produk_tanpa_foto.csv', csvContent1, 'utf-8');
  console.log('Berhasil membuat CSV: ./daftar_produk_tanpa_foto.csv');

  const csvContent3 = XLSX.utils.sheet_to_csv(ws3);
  fs.writeFileSync('./daftar_produk_perlu_dilengkapi.csv', csvContent3, 'utf-8');
  console.log('Berhasil membuat CSV: ./daftar_produk_perlu_dilengkapi.csv');

  console.log('\nSelesai! Total baris:', {
    'Tanpa Foto': sheet1Data.length,
    'Nama nan': sheet2Data.length,
    'Total Gabungan': sheet3Data.length,
  });
}

generate();
