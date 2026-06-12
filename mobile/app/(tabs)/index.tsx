import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { getQuotes, Quote } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

interface Stats {
  monthQuotes: number;
  activeValue: number;
  accepted: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({ monthQuotes: 0, activeValue: 0, accepted: 0 });

  const loadData = useCallback(async () => {
    try {
      const data = await getQuotes();
      setQuotes(data);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthQuotes = data.filter(q => new Date(q.created_at) >= monthStart).length;
      const activeValue = data
        .filter(q => q.status === 'poslata')
        .reduce((sum, q) => sum + q.total, 0);
      const accepted = data.filter(q => q.status === 'prihvacena').length;
      setStats({ monthQuotes, activeValue, accepted });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  function formatCurrency(n: number) {
    return n.toLocaleString('sr-RS', { minimumFractionDigits: 0 }) + ' RSD';
  }

  const recent = [...quotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
    >
      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>Dobrodošli,</Text>
        <Text style={styles.companyName}>{user?.company_name || 'Korisnik'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: '#2563EB' }]}>
          <Text style={styles.statValue}>{stats.monthQuotes}</Text>
          <Text style={styles.statLabel}>Ponude ovaj mesec</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={[styles.statValue, { fontSize: 15 }]}>{formatCurrency(stats.activeValue)}</Text>
          <Text style={styles.statLabel}>Vrednost u toku</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#10b981' }]}>
          <Text style={styles.statValue}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>Prihvaćene ponude</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nedavna aktivnost</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Još uvek nema ponuda</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/quote/new')}>
              <Text style={styles.createBtnText}>Kreiraj prvu ponudu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recent.map(quote => (
            <TouchableOpacity
              key={quote.id}
              style={styles.activityRow}
              onPress={() => router.push(`/quote/${quote.id}`)}
            >
              <View style={styles.activityLeft}>
                <Text style={styles.activityClient}>{quote.client?.name || `Klijent #${quote.client_id}`}</Text>
                <Text style={styles.activityDate}>{new Date(quote.created_at).toLocaleDateString('sr-RS')}</Text>
              </View>
              <View style={styles.activityRight}>
                <Text style={styles.activityAmount}>{formatCurrency(quote.total)}</Text>
                <StatusBadge status={quote.status} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/quote/new')}>
        <Text style={styles.fabText}>+ Nova ponuda</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcome: { padding: 20, paddingBottom: 8 },
  welcomeText: { fontSize: 14, color: '#6b7280' },
  companyName: { fontSize: 22, fontWeight: '800', color: '#1e3a8a' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6b7280', lineHeight: 14 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a8a', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  emptyText: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
  createBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  activityRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  activityLeft: { flex: 1 },
  activityClient: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  activityDate: { fontSize: 12, color: '#9ca3af' },
  activityRight: { alignItems: 'flex-end', gap: 6 },
  activityAmount: { fontSize: 14, fontWeight: '700', color: '#1e3a8a' },
  fab: {
    backgroundColor: '#2563EB', margin: 16, borderRadius: 12, padding: 16,
    alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
