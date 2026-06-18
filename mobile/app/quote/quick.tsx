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
      const companyName = user?.company_name || 'Servis';
      const today = new Date().toLocaleDateString('sr-RS');
      const formattedPrice = parsedPrice.toLocaleString('sr-RS', { minimumFractionDigits: 2 }) + ' RSD';
      const clientNameVal = clientName.trim();
      const descriptionVal = description.trim();
      const clientPhoneVal = clientPhone.trim();

      // Simple HTML without flex/table — maximum expo-print compatibility
      const html = `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a2e; font-size: 14px; }
    h1 { font-size: 26px; color: #1a56db; margin: 0; }
    .company { font-size: 18px; font-weight: bold; color: #1a56db; }
    .date { font-size: 12px; color: #777; margin-top: 4px; }
    hr { border: none; border-top: 3px solid #1a56db; margin: 16px 0; }
    .block { background: #f7f9fc; border-left: 4px solid #1a56db; padding: 12px 14px; margin-bottom: 16px; }
    .block-label { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; letter-spacing: 1px; }
    .block-value { font-size: 15px; font-weight: bold; }
    .block-sub { font-size: 13px; color: #555; margin-top: 4px; }
    .item-box { border: 1px solid #e8ecf0; padding: 12px 14px; margin-bottom: 4px; background: #fafafa; }
    .item-name { font-size: 14px; color: #111; }
    .item-price { font-size: 13px; color: #555; margin-top: 4px; }
    .total-box { background: #1a56db; color: #fff; padding: 14px; margin-top: 4px; }
    .total-label { font-size: 13px; }
    .total-value { font-size: 20px; font-weight: bold; margin-top: 4px; }
    .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #e8ecf0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="company">${companyName}</div>
  <h1>PONUDA</h1>
  <div class="date">Datum: ${today}</div>
  <hr/>

  <div class="block">
    <div class="block-label">Klijent</div>
    <div class="block-value">${clientNameVal}</div>
    ${clientPhoneVal ? `<div class="block-sub">Tel: ${clientPhoneVal}</div>` : ''}
  </div>

  <div class="block-label" style="margin-bottom:8px;">Opis usluge</div>
  <div class="item-box">
    <div class="item-name">${descriptionVal}</div>
    <div class="item-price">Iznos: ${formattedPrice}</div>
  </div>
  <div class="total-box">
    <div class="total-label">UKUPNO ZA UPLATU:</div>
    <div class="total-value">${formattedPrice}</div>
  </div>

  <div class="footer">Dokument generisan automatski &middot; ${companyName}</div>
</body>
</html>`;

      // Fire API call (non-blocking for PDF)
      const apiPromise = quickQuote({
        client_name: clientNameVal,
        client_phone: clientPhoneVal || undefined,
        description: descriptionVal,
        price: parsedPrice,
      }).catch(err => {
        console.warn('Quick quote API error:', err.message);
        return null;
      });

      // Generate and share PDF
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Ponuda — ${clientNameVal}`,
        UTI: 'com.adobe.pdf',
      });

      const result = await apiPromise;
      if (result?.quote_id) {
        router.replace(`/quote/${result.quote_id}`);
      } else {
        router.replace('/(tabs)');
      }
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

        <View style={styles.header}>
          <Text style={styles.title}>Brza ponuda</Text>
          <Text style={styles.subtitle}>Popuni 4 polja i pošalji za 60 sekundi</Text>
        </View>

        <View style={styles.timerHint}>
          <Text style={styles.timerText}>⚡ Prosečno vreme: 45 sekundi</Text>
        </View>

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

        {total > 0 && (
          <View style={styles.totalPreview}>
            <Text style={styles.totalLabel}>Iznos ponude:</Text>
            <Text style={styles.totalValue}>{total.toLocaleString('sr-RS')} RSD</Text>
          </View>
        )}

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
