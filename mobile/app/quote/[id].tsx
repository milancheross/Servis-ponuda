import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { getQuote, sendQuote, convertToInvoice, Quote, getClients, Client } from '../../lib/api';
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

  const loadQuote = useCallback(async () => {
    try {
      const q = await getQuote(Number(id));
      setQuote(q);
      if (q.client) {
        setClient(q.client);
      } else {
        const clients = await getClients();
        setClient(clients.find(c => c.id === q.client_id) || null);
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.quoteNum}>Ponuda #{String(quote.id).padStart(4, '0')}</Text>
            <StatusBadge status={quote.status} />
          </View>
          <Text style={styles.totalAmount}>{quote.total.toLocaleString('sr-RS')} RSD</Text>
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
          {quote.items.map((item, idx) => (
            <QuoteItemRow key={idx} item={item} index={idx} readOnly />
          ))}

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Osnovica:</Text>
              <Text style={styles.totalValue}>{quote.subtotal.toLocaleString('sr-RS')} RSD</Text>
            </View>
            {disc > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#ef4444' }]}>Popust ({disc}%):</Text>
                <Text style={[styles.totalValue, { color: '#ef4444' }]}>
                  -{(quote.subtotal * disc / 100).toLocaleString('sr-RS')} RSD
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>UKUPNO:</Text>
              <Text style={styles.grandTotalValue}>{quote.total.toLocaleString('sr-RS')} RSD</Text>
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
          {quote.status === 'nacrt' && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/quote/new`)}
              >
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

          {quote.status === 'poslata' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn, actionLoading && styles.disabledBtn]}
                onPress={handleConvert}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={[styles.actionBtnText, styles.primaryBtnText]}>🧾 Konvertuj u fakturu</Text>}
              </TouchableOpacity>
            </>
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
  headerCard: {
    backgroundColor: '#1e3a8a', borderRadius: 16, padding: 20, marginBottom: 12,
  },
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
  actionBtn: {
    backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  primaryBtn: { backgroundColor: '#2563EB' },
  primaryBtnText: { color: '#fff' },
  pdfBtn: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac' },
  pdfBtnText: { color: '#166534' },
  disabledBtn: { opacity: 0.6 },
});
