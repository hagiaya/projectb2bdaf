import fs from 'fs';

let content = fs.readFileSync('admin-web/src/app/sales/page.tsx', 'utf8');

// Replace regions in queries
content = content.replace(
  /regions:regions!sales_region_id_fkey \(id, name\)/g,
  'regions:regions!sales_region_id_fkey (id, name, city_name, district_name)'
);

// Replace UI display 1
content = content.replace(
  "<span>{sales.regions?.name || 'Belum diatur'}</span>",
  "<span>{sales.regions?.name ? `${sales.regions.name} ${sales.regions.city_name ? '- ' + sales.regions.city_name : ''}` : 'Belum diatur'}</span>"
);

// Replace UI display 2 (line 1579 & 1963)
content = content.replace(
  /SPV {spv\.profiles\?\.full_name} \({spv\.regions\?\.name \|\| 'Seluruh Area'}\)/g,
  "SPV {spv.profiles?.full_name} ({spv.regions?.name ? `${spv.regions.name} ${spv.regions.city_name ? '- ' + spv.regions.city_name : ''}` : 'Seluruh Area'})"
);

// Replace UI display 3 (line 1906)
content = content.replace(
  "Personil: <b className=\"text-slate-900\">{activeSalesForSpv.profiles?.full_name}</b> ({activeSalesForSpv.regions?.name || 'Tanpa Wilayah'})",
  "Personil: <b className=\"text-slate-900\">{activeSalesForSpv.profiles?.full_name}</b> ({activeSalesForSpv.regions?.name ? `${activeSalesForSpv.regions.name} ${activeSalesForSpv.regions.city_name ? '- ' + activeSalesForSpv.regions.city_name : ''}` : 'Tanpa Wilayah'})"
);

fs.writeFileSync('admin-web/src/app/sales/page.tsx', content, 'utf8');
console.log('Fixed regions display');
