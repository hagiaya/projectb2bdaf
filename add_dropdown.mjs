import fs from 'fs';

let content = fs.readFileSync('admin-web/src/app/sales/page.tsx', 'utf8');
content = content.replace(
  'onChange={(e) => setEditPhone(e.target.value)}\n                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"\n                  required\n                />\n              </div>\n\n              <div>\n                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru (Opsional)</label>',
  `onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Penempatan (Wilayah)</label>
                <select
                  value={editRegionId}
                  onChange={(e) => setEditRegionId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Tanpa Wilayah --</option>
                  {regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} {reg.city_name ? \`- \${reg.city_name}\` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru (Opsional)</label>`
);

fs.writeFileSync('admin-web/src/app/sales/page.tsx', content, 'utf8');
