import dynamic from 'next/dynamic';
import ProFeatureLock from '@/components/ProFeatureLock';

const Heatmap = dynamic(() => import('@/components/HeatmapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 font-medium border border-gray-200">Memuat Peta (OpenStreetMap)...</div>
});

export default function CustomersMapPage() {
  // Dummy location data (Jakarta region) [lat, lng, intensity]
  const dummyLocations = [
    [-6.2088, 106.8456, 1],
    [-6.2188, 106.8356, 0.8],
    [-6.1988, 106.8556, 1],
    [-6.2588, 106.8056, 0.6],
    [-6.1588, 106.9056, 0.9],
    [-6.2288, 106.8756, 0.5],
    [-6.1888, 106.8256, 0.7],
    [-6.2388, 106.8156, 0.8],
  ];

  return (
    <ProFeatureLock featureName="Peta Pelanggan">
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Peta Sebaran Pelanggan (Heatmap)</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Pantau kepadatan titik lokasi toko / dealer menggunakan OpenStreetMap.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,78,59,0.05)] border border-emerald-100/50 p-2" style={{ height: '70vh' }}>
          <Heatmap locations={dummyLocations as any} />
        </div>
      </div>
    </ProFeatureLock>
  );
}
