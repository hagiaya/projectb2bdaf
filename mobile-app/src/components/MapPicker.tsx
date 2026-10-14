import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Platform, TextInput, ActivityIndicator, FlatList,
  Keyboard, Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useSafeBottom } from '../hooks/useSafeBottom';

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, address?: string) => void;
  initialLocation?: { lat: number; lng: number } | null;
  initialAddress?: string;
}

interface SearchPlaceItem {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

export default function MapPicker({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
  initialAddress,
}: MapPickerProps) {
  const bottomPadding = useSafeBottom();
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);

  // Default coordinate (Jakarta fallback if GPS not available)
  const defaultLat = -6.2088;
  const defaultLng = 106.8456;

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.lat || defaultLat,
    lng: initialLocation?.lng || defaultLng,
  });
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress || '');
  const [isLocating, setIsLocating] = useState(false);

  // Search Address States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPlaceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // HTML Leaflet Map Template with Google Maps Tiles (Free, No API Key required)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        html, body, #map { height: 100%; width: 100%; background: #e2e8f0; }
        .leaflet-control-attribution { font-size: 9px; opacity: 0.85; background: rgba(255,255,255,0.85) !important; padding: 2px 6px !important; border-radius: 4px; }
        .leaflet-bar a { width: 34px; height: 34px; line-height: 34px; font-size: 18px; border-radius: 8px !important; }
        .custom-pin {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <script>
        var initialLat = ${selectedCoords.lat};
        var initialLng = ${selectedCoords.lng};

        var map = L.map('map', { 
          zoomControl: false,
          attributionControl: true
        }).setView([initialLat, initialLng], 16);
        
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Google Maps Standard Roadmap Layer (Gratis, Resmi Google Tiles XYZ)
        var googleRoadmap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        });

        // Google Maps Satelit / Hybrid Layer
        var googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        });

        googleRoadmap.addTo(map);

        var baseMaps = {
          "Google Maps": googleRoadmap,
          "Google Satelit": googleHybrid
        };
        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);
        
        var marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

        function notifyPosition(lat, lng) {
          var payload = JSON.stringify({ type: 'MARKER_MOVED', lat: lat, lng: lng });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
          } else if (window.parent) {
            window.parent.postMessage(payload, '*');
          }
        }

        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          notifyPosition(pos.lat, pos.lng);
        });
        
        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          notifyPosition(e.latlng.lat, e.latlng.lng);
        });

        // Function invoked by React Native to smoothly fly & reposition
        window.moveToLocation = function(lat, lng, zoomLevel) {
          var z = zoomLevel || 16;
          map.flyTo([lat, lng], z, { duration: 1.2 });
          marker.setLatLng([lat, lng]);
        };

        window.addEventListener('message', function(e) {
          try {
            var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            if (data.type === 'MOVE_TO') {
              window.moveToLocation(data.lat, data.lng, data.zoom);
            }
          } catch(err) {}
        });
      </script>
    </body>
    </html>
  `;

  // Inject movement command to map
  const injectMove = (lat: number, lng: number, zoom = 16) => {
    const js = `if (window.moveToLocation) { window.moveToLocation(${lat}, ${lng}, ${zoom}); } true;`;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'MOVE_TO', lat, lng, zoom }), '*');
    } else {
      webViewRef.current?.injectJavaScript(js);
    }
  };

  // Reverse geocode to get clean address from coordinates
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const [details] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (details) {
        const parts = [
          details.name,
          details.street,
          details.district,
          details.city || details.subregion,
          details.region
        ].filter(Boolean);
        const full = parts.join(', ');
        if (full) {
          setSelectedAddress(full);
          return;
        }
      }
      setSelectedAddress(`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch (e) {
      setSelectedAddress(`Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // Detect real GPS location automatically
  const handleDetectCurrentLocation = async (isInitial = false) => {
    setIsLocating(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!isInitial) {
            Alert.alert('Izin Ditolak', 'Dibutuhkan izin lokasi untuk mendeteksi posisi GPS Anda secara presisi.');
          }
          setIsLocating(false);
          return;
        }
      }

      // 1. Coba ambil posisi terakhir terlebih dahulu (instan tanpa delay)
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          const lLat = lastKnown.coords.latitude;
          const lLng = lastKnown.coords.longitude;
          setSelectedCoords({ lat: lLat, lng: lLng });
          fetchAddress(lLat, lLng);
          injectMove(lLat, lLng, 16);
        }
      } catch (e) {
        // Abaikan jika last known belum ada
      }

      // 2. Ambil posisi GPS real-time dengan akurasi tinggi (High Accuracy)
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLat = loc.coords.latitude;
      const newLng = loc.coords.longitude;
      setSelectedCoords({ lat: newLat, lng: newLng });

      // Get address of current GPS location
      fetchAddress(newLat, newLng);

      // Move map to exact GPS coordinate
      setTimeout(() => {
        injectMove(newLat, newLng, 17);
      }, isInitial ? 500 : 50);

    } catch (error: any) {
      console.warn('GPS location error:', error);
      if (!isInitial) {
        Alert.alert('Gagal Mendeteksi Lokasi', 'Pastikan fitur GPS / Layanan Lokasi di HP Anda sudah dinyalakan.');
      }
    } finally {
      setIsLocating(false);
    }
  };

  // Triggered when modal opens
  useEffect(() => {
    if (visible) {
      if (initialLocation && initialLocation.lat && initialLocation.lng) {
        setSelectedCoords(initialLocation);
        if (initialAddress) {
          setSelectedAddress(initialAddress);
        } else {
          fetchAddress(initialLocation.lat, initialLocation.lng);
        }
        setTimeout(() => {
          injectMove(initialLocation.lat, initialLocation.lng, 16);
        }, 800);
      } else {
        // Auto-detect high precision GPS on initial open!
        handleDetectCurrentLocation(true);
      }
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible]);

  // Search Address via OpenStreetMap Nominatim with Indonesia boundary
  const searchPlaces = async (text: string) => {
    const q = text.trim();
    if (!q || q.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=id&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DAPB2BApp/1.0' }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data.map((item: any) => ({
          id: String(item.place_id || Math.random()),
          title: item.name || item.display_name.split(',')[0],
          subtitle: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        })));
        return;
      }

      // Fallback Expo Geocode
      const geo = await Location.geocodeAsync(q);
      if (geo && geo.length > 0) {
        setSearchResults(geo.map((g, idx) => ({
          id: `expo_${idx}`,
          title: q,
          subtitle: `Koordinat: ${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}`,
          lat: g.latitude,
          lng: g.longitude,
        })));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Place search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 450);
  };

  const handleSelectSearchResult = (item: SearchPlaceItem) => {
    Keyboard.dismiss();
    setSearchResults([]);
    setSearchQuery(item.title);
    setSelectedCoords({ lat: item.lat, lng: item.lng });
    setSelectedAddress(item.subtitle);
    injectMove(item.lat, item.lng, 16);
  };

  const handleMarkerMoved = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    fetchAddress(lat, lng);
  };

  // Web message listener
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'MARKER_MOVED' && data.lat && data.lng) {
            handleMarkerMoved(data.lat, data.lng);
          }
        } catch(e) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrapper}>
              <Feather name="map-pin" size={18} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Titik Lokasi (Google Maps)</Text>
              <Text style={styles.headerSubtitle}>Koordinat presisi GPS toko Anda</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>Batal</Text>
          </TouchableOpacity>
        </View>

        {/* Map View & Floating Controls Container */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe 
              ref={iframeRef as any}
              srcDoc={htmlContent}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            React.createElement(WebView as any, {
              ref: webViewRef,
              source: { html: htmlContent },
              onMessage: (event: any) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'MARKER_MOVED' && data.lat && data.lng) {
                    handleMarkerMoved(data.lat, data.lng);
                  }
                } catch(e) {}
              }
            })
          )}

          {/* ======================================================== */}
          {/* FLOATING SEARCH BAR (GOOGLE MAPS STYLE)                   */}
          {/* ======================================================== */}
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari jalan, nama toko, kota, kecamatan..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                onSubmitEditing={() => searchPlaces(searchQuery)}
                returnKeyType="search"
              />
              {isSearching ? (
                <ActivityIndicator size="small" color="#16a34a" style={styles.searchActionBtn} />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  style={styles.searchActionBtn}
                >
                  <Feather name="x" size={16} color="#64748b" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSearchResult(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionIcon}>
                        <Feather name="map-pin" size={16} color="#16a34a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          {/* ======================================================== */}
          {/* FLOATING "LOKASI SAYA" (GPS) BUTTON                       */}
          {/* ======================================================== */}
          <TouchableOpacity 
            style={[styles.myLocationBtn, isLocating && styles.myLocationBtnActive]}
            onPress={() => handleDetectCurrentLocation(false)}
            activeOpacity={0.8}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#0284c7" />
            ) : (
              <Feather name="crosshair" size={22} color="#0284c7" />
            )}
          </TouchableOpacity>

          {/* ======================================================== */}
          {/* BOTTOM INFORMATION & CONFIRMATION CARD                   */}
          {/* ======================================================== */}
          <View style={[styles.bottomCard, { paddingBottom: Math.max(bottomPadding, 16) + 12 }]}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.locationPinBadge}>
                <Feather name="navigation" size={14} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bottomCardLabel}>Titik Lokasi Toko</Text>
                <Text style={styles.bottomCardAddress} numberOfLines={2}>
                  {selectedAddress || `Koordinat: ${selectedCoords.lat.toFixed(5)}, ${selectedCoords.lng.toFixed(5)}`}
                </Text>
              </View>
            </View>

            <Text style={styles.bottomCardHint}>
              💡 Ketuk peta atau geser pin merah untuk menandai posisi toko secara presisi.
            </Text>

            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={() => onSelectLocation(selectedCoords.lat, selectedCoords.lng, selectedAddress)}
              activeOpacity={0.85}
            >
              <Feather name="check" size={18} color="white" strokeWidth={3} />
              <Text style={styles.confirmBtnText}>Pilih Titik Lokasi Ini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 46,
    paddingBottom: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  closeText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  searchBarWrapper: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  searchActionBtn: {
    padding: 6,
  },
  suggestionsContainer: {
    marginTop: 6,
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: 220,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 195,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 90,
  },
  myLocationBtnActive: {
    backgroundColor: '#f0f9ff',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    zIndex: 95,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  locationPinBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  bottomCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomCardAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
    lineHeight: 18,
  },
  bottomCardHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 16,
  },
  confirmBtn: {
    backgroundColor: '#8ec44a',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8ec44a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});
