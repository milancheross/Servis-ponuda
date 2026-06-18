import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { getQuote, sendQuote, convertToInvoice, Quote, getClients, Client, createJob } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { shareQuotePDF } from '../../lib/pdf';
import StatusBadge from '../../components/StatusBadge';
import QuoteItemRow from '../../components/QuoteItemRow';

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const loadQuote = useCallback(async () => {
    try {
      // Pass id directly as string — UUIDs must not be converted to Number
      const q = await getQuote(id);
      setQuote(q);
      if (q.client) {
        setClient(q.client);
      } else if (q.client_id) {
        const clients = await getClients();
        setClient(clients.find(c => String(c.id) === String(q.client_id)) || null);
      }
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadQuote(); }, [loadQuote]));

  async function handleSend() {
    if (!quote) return;
    Alert.alert('Pošalji ponudu', 'Promeniti status u "Poslata"?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Pošalji', onPress: async () => {
          setActionLoading(true);
          try {
            const updated = await sendQuote(quote.id);
            setQuote(updated);
          } catch (err: any) {
            Alert.alert('Greška', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  async function handleConvert() {
    if (!quote) return;
    Alert.alert('Konvertuj u fakturu', 'Kreirati fakturu iz ove ponude?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Kreiraj fakturu', onPress: async () => {
          setActionLoading(true);
          try {
            const invoice = await convertToInvoice(quote.id);
            router.replace(`/invoice/${invoice.id}`);
          } catch (err: any) {
            Alert.alert('Greška', err.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  function needsFollowUp(): boolean {
    if (!quote || quote.status !== 'poslata') return false;
    if (!quote.opened_at) return false;
    const hoursOpen = (Date.now() - new Date(quote.opened_at).getTime()) / (1000 * 60 * 60);
    return hoursOpen >= 48;
  }

  async function sendFollowUp() {
    if (!quote) return;
    const clientName = quote.client?.name || 'klijente';
    const message = `Poštovanje ${clientName},\n\nSamo proveravam da li ste stigli da pogledate ponudu.\n\nSrdačan pozdrav.`;
    await Share.share({ message });
  }

  async function createJobFromQuote() {
    if (!quote || !quote.client_id) return;
    setCreatingJob(true);
    try {
      const job = await createJob({
        quote_id: quote.id,
        client_id: quote.client_id,
        title: quote.client?.name ? `Posao — ${quote.client.name}` : 'Novi posao',
      });
      setJobId(job.id);
      Alert.alert('Posao kreiran', 'Ponuda je pretvorena u posao.', [
        { text: 'Vidi posao', onPress: () => router.push(`/job/${job.id}`) },
        { text: 'OK' },
      ]);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setCreatingJob(false);
    }
  }

  async function handleSharePDF() {
    if (!quote || !client || !user) return;
    try {
      await shareQuotePDF(quote, client, user);
    } catch (err: any) {
      Alert.alert('Greška', 'Nije moguće generisati PDF: ' + err.message);
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!quote) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ponuda nije pronađena</Text>
      </View>
    );
  }

  const disc = quote.discount_percent || 0;
  const total = quote.total ?? 0;
  const subtotal = quote.subtotal ?? total;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.quoteNum}>Ponuda #{String(quote.id).slice(0, 8)}</Text>
            <StatusBadge status={quote.status} />
          </View>
          <Text style={styles.totalAmount}>{total.toLocaleString('sr-RS')} RSD</Text>
          <Text style={styles.headerDate}>
            Kreirano: {new Date(quote.created_at).toLocaleDateString('sr-RS')}
            {quote.sent_at ? ` • Poslato: ${new Date(quote.sent_at).toLocaleDateString('sr-RS')}` : ''}
          </Text>
          {quote.opened_at && (
            <Text style={styles.openedText}>👁 Otvoreno: {new Date(quote.opened_at).toLocaleDateString('sr-RS')}</Text>
          )}
        </View>

        {/* Client Card */}
        {client && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Klijent</Text>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.phone && <Text style={styles.clientDetail}>📞 {client.phone}</Text>}
            {client.email && <Text style={styles.clientDetail}>✉️ {client.email}</Text>}
            {client.address && <Text style={styles.clientDetail}>📍 {client.address}</Text>}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stavke</Text>
          {(quote.items || []).map((item, idx) => (
            <QuoteItemRow key={idx} item={item} index={idx} readOnly />
          ))}

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Osnovica:</Text>
              <Text style={styles.totalValue}>{subtotal.toLocaleString('sr-RS')} RSD</Text>
            </View>
            {disc > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#ef4444' }]}>Popust ({disc}%):</Text>
                <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                  -{(subtotal * disc / 100).toLocaleString('sr-RS')} RSD
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>UKUPNO:</Text>
              <Text style={styles.grandTotalValue}>{total.toLocaleString('sr-RS')} RSD</Text>
            </View>
          </View>
        </View>

        {/* Meta */}
        {(quote.valid_until || quote.note) && (
          <View style={styles.card}>
            {quote.valid_until && (
              <Text style={styles.metaText}>📅 Važi do: {new Date(quote.valid_until).toLocaleDateString('sr-RS')}</Text>
            )}
            {quote.note && (
              <Text style={styles.metaText}>📝 {quote.note}</Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {needsFollowUp() && (
            <View style={followUpStyles.banner}>
              <View style={{ flex: 1 }}>
                <Text style={followUpStyles.bannerTitle}>Otvoreno pre 2+ dana</Text>
                <Text style={followUpStyles.bannerSub}>Klijent nije odgovorio.</Text>
              </View>
              <TouchableOpacity style={followUpStyles.btn} onPress={sendFollowUp}>
                <Text style={followUpStyles.btnText}>Pošalji podsetnik</Text>
              </TouchableOpacity>
            </View>
          )}

          {(quote?.status === 'accepted' || quote?.status === 'prihvacena') && !jobId && (
            <TouchableOpacity
              style={jobStyles.createJobBtn}
              onPress={createJobFromQuote}
              disabled={creatingJob}
            >
              {creatingJob
                ? <ActivityIndicator color="#fff" />
                : <Text style={jobStyles.createJobBtnText}>Pretvori u Posao →</Text>
              }
            </TouchableOpacity>
          )}
          {jobId && (
            <TouchableOpacity style={jobStyles.viewJobBtn} onPress={() => router.push(`/job/${jobId}`)}
            >
              <Text style={jobStyles.viewJobBtnText}>Vidi posao</Text>
            </TouchableOpacity>
          )}

          {(quote.status === 'nacrt' || quote.status === 'draft') && (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/quote/new`)}>
                <Text style={styles.actionBtnText}>✏️ Uredi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn, actionLoading && styles.disabledBtn]}
                onPress={handleSend}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={[styles.actionBtnText, styles.primaryBtnText]}>📤 Pošalji ponudu</Text>}
              </TouchableOpacity>
            </>
          )}

          {(quote.status === 'poslata' || quote.status === 'sent') && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn, actionLoading && styles.disabledBtn]}
              onPress={handleConvert}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator color="#fff" size="small" /> :
                <Text style={[styles.actionBtnText, styles.primaryBtnText]}>🧾 Konvertuj u fakturu</Text>}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionBtn, styles.pdfBtn]} onPress={handleSharePDF}>
            <Text style={[styles.actionBtnText, styles.pdfBtnText]}>📄 Preuzmi / Podeli PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#9ca3af' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerCard: { backgroundColor: '#1e3a8a', borderRadius: 16, padding: 20, marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  quoteNum: { fontSize: 14, fontWeight: '700', color: '#93c5fd' },
  totalAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 6 },
  headerDate: { fontSize: 12, color: '#93c5fd' },
  openedText: { fontSize: 12, color: '#6ee7b7', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  clientDetail: { fontSize: 13, color: '#6b7280', marginTop: 3 },
  totalsSection: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
  grandTotalRow: { paddingTop: 8, borderTopWidth: 2, borderTopColor: '#2563EB', marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1e3a8a' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  metaText: { fontSize: 13, color: '#374151', marginBottom: 4 },
  actionsCard: { gap: 10 },
  actionBtn: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  primaryBtn: { backgroundColor: '#2563EB' },
  primaryBtnText: { color: '#fff' },
  pdfBtn: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac' },
  pdfBtnText: { color: '#166534' },
  disabledBtn: { opacity: 0.6 },
});

const followUpStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#fffbeb', borderWidth: 1.5, borderColor: '#fbbf24',
    borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 10,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  bannerSub: { fontSize: 11, color: '#b45309', marginTop: 2 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

const jobStyles = StyleSheet.create({
  createJobBtn: {
    backgroundColor: '#059669', borderRadius: 12, padding: 16, alignItems: 'center',
    marginBottom: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
  },
  createJobBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  viewJobBtn: {
    borderWidth: 1.5, borderColor: '#059669', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 8,
  },
  viewJobBtnText: { color: '#059669', fontSize: 14, fontWeight: '600' },
});
