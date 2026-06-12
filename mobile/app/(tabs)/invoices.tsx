import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getInvoices, Invoice } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['sve', 'neplaceno', 'placeno'] as const;
type Filter = typeof FILTERS[number];
const filterLabels: Record<Filter, string> = { sve: 'Sve', neplaceno: 'Neplaćeno', placeno: 'Plaćeno' };

export default function InvoicesScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<Filter>('sve');
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadInvoices(); }, [loadInvoices]));

  const filtered = filter === 'sve' ? invoices : invoices.filter(i => i.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{filterLabels[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={<EmptyState icon="🧾" title="Nema faktura" message="Fakture se generišu iz prihvaćenih ponuda" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/invoice/${item.id}`)}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.invoiceNum}>#{item.invoice_number}</Text>
                <Text style={styles.clientName}>{item.client?.name || `Klijent #${item.client_id}`}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.date}>
                Izdato: {new Date(item.issued_at).toLocaleDateString('sr-RS')}
                {item.due_at ? ` • Rok: ${new Date(item.due_at).toLocaleDateString('sr-RS')}` : ''}
              </Text>
              <Text style={styles.total}>{item.total.toLocaleString('sr-RS')} RSD</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#f3f4f6' },
  filterTabActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  invoiceNum: { fontSize: 12, fontWeight: '700', color: '#2563EB', marginBottom: 2 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#9ca3af', flex: 1 },
  total: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
});
