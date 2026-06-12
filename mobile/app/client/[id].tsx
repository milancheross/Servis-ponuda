import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { getClients, updateClient, deleteClient, getQuotes, Client, Quote } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [clients, allQuotes] = await Promise.all([getClients(), getQuotes()]);
      const found = clients.find(c => c.id === Number(id));
      if (found) {
        setClient(found);
        setName(found.name);
        setPhone(found.phone || '');
        setEmail(found.email || '');
        setAddress(found.address || '');
      }
      setQuotes(allQuotes.filter(q => q.client_id === Number(id)));
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Greška', 'Ime je obavezno'); return; }
    setSaving(true);
    try {
      const updated = await updateClient(Number(id), {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      setClient(updated);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Brisanje klijenta', `Obrisati klijenta "${client?.name}"? Ova akcija se ne može poništiti.`, [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Obriši', style: 'destructive', onPress: async () => {
          try {
            await deleteClient(Number(id));
            router.back();
          } catch (err: any) {
            Alert.alert('Greška', err.message);
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!client) {
    return <View style={styles.centered}><Text style={styles.errorText}>Klijent nije pronađen</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Podaci klijenta</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️ Uredi</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ime *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ime i prezime" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+381..." keyboardType="phone-pad" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@..." keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresa</Text>
                <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="Ulica, grad" multiline />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setName(client.name); setPhone(client.phone || ''); setEmail(client.email || ''); setAddress(client.address || ''); }}>
                  <Text style={styles.cancelBtnText}>Otkaži</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Sačuvaj</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.phone && <Text style={styles.detail}>📞 {client.phone}</Text>}
              {client.email && <Text style={styles.detail}>✉️ {client.email}</Text>}
              {client.address && <Text style={styles.detail}>📍 {client.address}</Text>}
              <Text style={styles.memberSince}>Klijent od: {new Date(client.created_at).toLocaleDateString('sr-RS')}</Text>
            </>
          )}
        </View>

        {/* Quotes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ponude ({quotes.length})</Text>
          {quotes.length === 0 ? (
            <Text style={styles.emptyText}>Nema ponuda za ovog klijenta</Text>
          ) : (
            quotes
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(quote => (
                <TouchableOpacity
                  key={quote.id}
                  style={styles.quoteRow}
                  onPress={() => router.push(`/quote/${quote.id}`)}
                >
                  <View style={styles.quoteLeft}>
                    <Text style={styles.quoteDate}>{new Date(quote.created_at).toLocaleDateString('sr-RS')}</Text>
                    <Text style={styles.quoteAmount}>{quote.total.toLocaleString('sr-RS')} RSD</Text>
                  </View>
                  <StatusBadge status={quote.status} small />
                </TouchableOpacity>
              ))
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑 Obriši klijenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#9ca3af' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5 },
  editBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#dbeafe',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#2563EB' },
  clientName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  detail: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  memberSince: { fontSize: 12, color: '#d1d5db', marginTop: 8 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  textArea: { height: 72, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  saveBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },
  quoteRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  quoteLeft: {},
  quoteDate: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  quoteAmount: { fontSize: 15, fontWeight: '700', color: '#1e3a8a' },
  deleteBtn: {
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fecaca',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
