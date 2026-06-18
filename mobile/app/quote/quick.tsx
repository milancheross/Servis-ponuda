import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { quickQuote } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function QuickQuoteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = clientName.trim().length > 0 && description.trim().length > 0 && parseFloat(price) > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const parsedPrice = parseFloat(price);
      const result = await quickQuote({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || undefined,
        description: description.trim(),
        price: parsedPrice,
      });

      // Generate PDF and share
      const companyName = user?.company_name || 'Servis';
      const today = new Date().toLocaleDateString('sr-RS');
      const formattedPrice = parsedPrice.toLocaleString('sr-RS', { minimumFractionDigits: 2 }) + ' RSD';

      const html = `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; }
    .header { border-bottom: 3px solid #1a56db; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .company { font-size: 22px; font-weight: 700; color: #1a56db; }
    .title { font-size: 28px; font-weight: 800; color: #1a56db; text-align: right; }
    .date { font-size: 12px; color: #777; text-align: right; }
    .section { background: #f7f9fc; border-left: 4px solid #1a56db; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
    .value { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    thead { background: #1a56db; color: #fff; }
    th { padding: 10px 12px; text-align: left; font-size: 12px; }
    td { padding: 10px 12px; border-bottom: 1px solid #e8ecf0; }
    .total-row { background: #1a56db; color: #fff; font-weight: 700; font-size: 16px; }
    .total-row td { padding: 14px 12px; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #e8ecf0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">${companyName}</div>
    <div>
      <div class="title">PONUDA</div>
      <div class="date">Datum: ${today}</div>
    </div>
  </div>
  <div class="section">
    <div class="label">Klijent</div>
    <div class="value">${clientName.trim()}</div>
    ${clientPhone ? `<div style="font-size:13px;margin-top:4px">📞 ${clientPhone.trim()}</div>` : ''}
  </div>
  <table>
    <thead><tr><th>Opis usluge</th><th style="text-align:right">Iznos</th></tr></thead>
    <tbody>
      <tr><td>${description.trim()}</td><td style="text-align:right">${formattedPrice}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row"><td>UKUPNO ZA UPLATU:</td><td style="text-align:right">${formattedPrice}</td></tr>
    </tfoot>
  </table>
  <div class="footer">Dokument generisan automatski · ${companyName}</div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Ponuda — ${clientName.trim()}`,
        UTI: 'com.adobe.pdf',
      });

      router.replace(`/quote/${result.quote_id}`);
    } catch (err: any) {
      Alert.alert('Greška', err.message || 'Nije moguće kreirati ponudu.');
    } finally {
      setLoading(false);
    }
  }

  const total = parseFloat(price) || 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Brza ponuda</Text>
          <Text style={styles.subtitle}>Popuni 4 polja i pošalji za 60 sekundi</Text>
        </View>

        {/* Timer hint */}
        <View style={styles.timerHint}>
          <Text style={styles.timerText}>⚡ Prosečno vreme: 45 sekundi</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.label}>Ime klijenta *</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="npr. Marko Petrović"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Telefon klijenta</Text>
          <TextInput
            style={styles.input}
            value={clientPhone}
            onChangeText={setClientPhone}
            placeholder="npr. 064/123-4567"
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <Text style={styles.label}>Opis posla *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="npr. Zamena bojlera 80L, montaža, odvoz starog"
            multiline
            numberOfLines={3}
            returnKeyType="next"
          />

          <Text style={styles.label}>Cena (RSD) *</Text>
          <TextInput
            style={[styles.input, styles.priceInput]}
            value={price}
            onChangeText={setPrice}
            placeholder="npr. 25000"
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* Live total preview */}
        {total > 0 && (
          <View style={styles.totalPreview}>
            <Text style={styles.totalLabel}>Iznos ponude:</Text>
            <Text style={styles.totalValue}>{total.toLocaleString('sr-RS')} RSD</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Kreiraj i pošalji ponudu</Text>
              <Text style={styles.submitBtnSub}>Generiše PDF → Viber / WhatsApp / email</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullBtn} onPress={() => router.push('/quote/new')}>
          <Text style={styles.fullBtnText}>Naprednija ponuda (3 koraka)</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e3a8a' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  timerHint: {
    backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe',
  },
  timerText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827',
    backgroundColor: '#fafafa',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  priceInput: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
  totalPreview: {
    backgroundColor: '#1e3a8a', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: { color: '#93c5fd', fontSize: 14, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  submitBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, padding: 18, alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8, marginBottom: 12,
  },
  submitBtnDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  submitBtnSub: { color: '#bfdbfe', fontSize: 12, marginTop: 3 },
  fullBtn: {
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  fullBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});
