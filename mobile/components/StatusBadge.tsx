import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Status = 'nacrt' | 'poslata' | 'prihvacena' | 'odbijena' | 'placeno' | 'neplaceno';

interface Props {
  status: Status;
  small?: boolean;
}

const statusConfig: Record<Status, { label: string; bg: string; color: string }> = {
  nacrt:     { label: 'Nacrt',      bg: '#f3f4f6', color: '#6b7280' },
  poslata:   { label: 'Poslata',    bg: '#dbeafe', color: '#1d4ed8' },
  prihvacena:{ label: 'Prihvaćena', bg: '#d1fae5', color: '#065f46' },
  odbijena:  { label: 'Odbijena',   bg: '#fee2e2', color: '#991b1b' },
  placeno:   { label: 'Plaćeno',    bg: '#d1fae5', color: '#065f46' },
  neplaceno: { label: 'Neplaćeno',  bg: '#fef3c7', color: '#92400e' },
};

export default function StatusBadge({ status, small = false }: Props) {
  const config = statusConfig[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: config.color }, small && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  small: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '700' },
  smallText: { fontSize: 10 },
});
