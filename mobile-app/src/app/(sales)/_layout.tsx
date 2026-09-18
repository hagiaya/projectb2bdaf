import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React from 'react';

export default function SalesLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8ec44a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'Toko & Visit',
          tabBarIcon: ({ color, size }) => <Feather name="map-pin" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Pendapatan',
          tabBarIcon: ({ color, size }) => <Feather name="trending-up" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-order"
        options={{
          title: 'Order Toko',
          tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null, // Hidden alias
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          title: 'Cuti / Sakit',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="active-visit"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="new-dealer"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
    </Tabs>
  );
}
