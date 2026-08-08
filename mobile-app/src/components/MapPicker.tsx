import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
}

export default function MapPicker({ visible, onClose, onSelectLocation }: MapPickerProps) {
  const [lat] = useState(-6.2088);
  const [lng] = useState(106.8456);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; font-family: sans-serif; }
        html, body, #map { height: 100%; width: 100%; }
        .confirm-btn {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          z-index: 1000; background: #10b981; color: white; border: none;
          padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <button class="confirm-btn" onclick="confirmLocation()">Pilih Lokasi Ini</button>
      
      <script>
        var map = L.map('map').setView([${lat}, ${lng}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        
        var marker = L.marker([${lat}, ${lng}], {draggable: true}).addTo(map);
        
        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
        });
        
        function confirmLocation() {
          var pos = marker.getLatLng();
          if(window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({lat: pos.lat, lng: pos.lng}));
          } else {
            window.parent.postMessage(JSON.stringify({type: 'MAP_SELECT', lat: pos.lat, lng: pos.lng}), '*');
          }
        }
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MAP_SELECT' && data.lat && data.lng) {
            onSelectLocation(data.lat, data.lng);
          }
        } catch(e) {}
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onSelectLocation]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tandai Peta (OpenStreetMap)</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Batal</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe 
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <WebView 
            source={{ html: htmlContent }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.lat && data.lng) {
                  onSelectLocation(data.lat, data.lng);
                }
              } catch(e) {}
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  closeBtn: {
    padding: 8
  },
  closeText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  }
});
