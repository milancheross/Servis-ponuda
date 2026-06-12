import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getQuotes, Quote } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';

const FILTERS = ['sve', 'nacrt', 'poslata', 'prihvacena', 'odbijena'] as const;
type Filter = typeof FILTERS[number];
const filterLabels: Record<Filter, string> = {
  sve: 'Sve', nacrt: 'Nacrt', poslata: 'Poslata', prihvacena: 'Prihvaćena', odbijena: 'Odbijena',
};

export default function QuotesScreen() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState<Filter>('sve');
  const [loading, setLoading] = useState(true);

  const loadQuotes = useCallback(async () => {
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadQuotes(); }, [loadQuotes]));

  const filtered = filter === 'sve' ? quotes : quotes.filter(q => q.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={f => f}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{filterLabels[f]}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={<EmptyState icon="📄" title="Nema ponuda" message={filter === 'sve' ? 'Kreirajte prvu ponudu' : 'Nema ponuda sa ovim statusom'} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/quote/${item.id}`)}>
            <View style={styles.cardTop}>
              <Text style={styles.clientName}>{item.client?.name || `Klijent #${item.client_id}`}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('sr-RS')}</Text>
              <Text style={styles.total}>{item.total.toLocaleString('sr-RS')} RSD</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/quote/new')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { backgroundColor: '#fff', paddingVertical: 10 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterTabActive: { backgroundColor: '#2563EB' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#9ca3af' },
  total: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
