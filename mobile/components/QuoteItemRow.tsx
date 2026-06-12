import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QuoteItem } from '../lib/api';

interface Props {
  item: QuoteItem;
  index: number;
  onEdit?: (item: QuoteItem, index: number) => void;
  onDelete?: (index: number) => void;
  readOnly?: boolean;
}

export default function QuoteItemRow({ item, index, onEdit, onDelete, readOnly = false }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.main}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>
          {item.quantity} {item.unit} × {item.price.toLocaleString('sr-RS')} RSD
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.total}>{item.total.toLocaleString('sr-RS')} RSD</Text>
        {!readOnly && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(item, index)} style={styles.actionBtn}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(index)} style={styles.actionBtn}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center',
  },
  main: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  detail: { fontSize: 12, color: '#6b7280' },
  right: { alignItems: 'flex-end' },
  total: { fontSize: 14, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  editIcon: { fontSize: 15 },
  deleteIcon: { fontSize: 15 },
});
