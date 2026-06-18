import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { getQuotes, getAnalyticsFunnel, Quote, FunnelData } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [quotesData, analyticsData] = await Promise.all([
        getQuotes(),
        getAnalyticsFunnel().catch(() => null),
      ]);
      setQuotes(quotesData);
      if (analyticsData) setFunnel(analyticsData.funnel);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function onRefresh() { setRefreshing(true); loadData(); }

  function fmt(n: number | undefined | null) {
    return ((n ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 0 })) + ' RSD';
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthQuotes = quotes.filter(q => new Date(q.created_at) >= monthStart).length;
  const activeValue = quotes.filter(q => q.status === 'poslata').reduce((s, q) => s + (q.total ?? 0), 0);
  const recent = [...quotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  const isFirstRun = quotes.length === 0;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
    >
      {/* Welcome */}
      <View style={styles.welcome}>
        <Text style={styles.welcomeSub}>Dobrodošli,</Text>
        <Text style={styles.companyName}>{user?.company_name || 'Korisnik'}</Text>
      </View>

      {/* ── FIRST RUN EXPERIENCE ── */}
      {isFirstRun ? (
        <View style={styles.firstRunCard}>
          <Text style={styles.firstRunEmoji}>🚀</Text>
          <Text style={styles.firstRunTitle}>Napravite prvu ponudu</Text>
          <Text style={styles.firstRunSub}>
            Za manje od 60 sekundi možete kreirati i poslati profesionalnu ponudu klijentu.
          </Text>
          <TouchableOpacity style={styles.firstRunBtn} onPress={() => router.push('/quote/quick')}>
            <Text style={styles.firstRunBtnText}>⚡  Brza ponuda — 60 sekundi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.firstRunBtnOutline} onPress={() => router.push('/quote/new')}>
            <Text style={styles.firstRunBtnOutlineText}>Naprednija ponuda (3 koraka)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderTopColor: '#2563EB' }]}>
              <Text style={styles.statValue}>{monthQuotes}</Text>
              <Text style={styles.statLabel}>Ovaj mesec</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#f59e0b' }]}>
              <Text style={[styles.statValue, { fontSize: 14 }]}>{fmt(activeValue)}</Text>
              <Text style={styles.statLabel}>U toku</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#10b981' }]}>
              <Text style={styles.statValue}>{funnel?.accepted ?? 0}</Text>
              <Text style={styles.statLabel}>Prihvaćene</Text>
            </View>
          </View>

          {/* Funnel */}
          {funnel && funnel.sent > 0 && (
            <View style={styles.funnelCard}>
              <Text style={styles.funnelTitle}>Konverzija ponuda</Text>
              <View style={styles.funnelRow}>
                <FunnelStep label="Poslato" value={funnel.sent} color="#2563EB" />
                <FunnelArrow rate={funnel.open_rate} />
                <FunnelStep label="Otvoreno" value={funnel.opened} color="#f59e0b" />
                <FunnelArrow rate={funnel.accept_rate} />
                <FunnelStep label="Prihvaćeno" value={funnel.accepted} color="#10b981" />
              </View>
            </View>
          )}

          {/* Quick action */}
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/quote/quick')}>
            <Text style={styles.quickBtnText}>⚡  Nova brza ponuda</Text>
          </TouchableOpacity>

          {/* Recent activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nedavna aktivnost</Text>
            {recent.map(q => (
              <TouchableOpacity
                key={q.id}
                style={styles.activityRow}
                onPress={() => router.push(`/quote/${q.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityClient}>{q.client?.name ?? `Klijent #${q.client_id}`}</Text>
                  <Text style={styles.activityDate}>{new Date(q.created_at).toLocaleDateString('sr-RS')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.activityAmount}>{fmt(q.total)}</Text>
                  <StatusBadge status={q.status} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function FunnelStep({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={[funnelStyles.bubble, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[funnelStyles.bubbleNum, { color }]}>{value}</Text>
      </View>
      <Text style={funnelStyles.bubbleLabel}>{label}</Text>
    </View>
  );
}

function FunnelArrow({ rate }: { rate: number }) {
  return (
    <View style={{ alignItems: 'center', marginTop: -8 }}>
      <Text style={funnelStyles.arrow}>→</Text>
      <Text style={funnelStyles.rate}>{rate}%</Text>
    </View>
  );
}

const funnelStyles = StyleSheet.create({
  bubble: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  bubbleNum: { fontSize: 18, fontWeight: '800' },
  bubbleLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600', textAlign: 'center' },
  arrow: { fontSize: 18, color: '#9ca3af', marginHorizontal: 4 },
  rate: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcome: { padding: 20, paddingBottom: 8 },
  welcomeSub: { fontSize: 13, color: '#6b7280' },
  companyName: { fontSize: 22, fontWeight: '800', color: '#1e3a8a' },

  // First run
  firstRunCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  firstRunEmoji: { fontSize: 48, marginBottom: 12 },
  firstRunTitle: { fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  firstRunSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  firstRunBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24,
    width: '100%', alignItems: 'center', marginBottom: 10,
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  firstRunBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  firstRunBtnOutline: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingVertical: 13, paddingHorizontal: 24, width: '100%', alignItems: 'center',
  },
  firstRunBtnOutlineText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 12 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#6b7280', lineHeight: 13 },

  // Funnel
  funnelCard: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  funnelTitle: { fontSize: 13, fontWeight: '700', color: '#1e3a8a', marginBottom: 14 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Quick action
  quickBtn: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#2563EB', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  quickBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Recent
  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginBottom: 10 },
  activityRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  activityClient: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  activityDate: { fontSize: 11, color: '#9ca3af' },
  activityAmount: { fontSize: 13, fontWeight: '700', color: '#1e3a8a' },
});
