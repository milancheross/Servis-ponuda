import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e5e7eb', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#1e3a8a',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerTitle: 'Servis Ponuda',
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Klijenti',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
          headerTitle: 'Klijenti',
        }}
      />
      <Tabs.Screen
        name="price-items"
        options={{
          title: 'Cenovnik',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
          headerTitle: 'Cenovnik usluga',
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'Ponude',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📄" focused={focused} />,
          headerTitle: 'Ponude',
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Fakture',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" focused={focused} />,
          headerTitle: 'Fakture',
        }}
      />
    </Tabs>
  );
}
