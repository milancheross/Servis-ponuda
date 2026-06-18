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
      const found = clients.find(c => String(c.id) === String(id));
      if (found) {
        setClient(found);
        setName(found.name);
        setPhone(found.phone || '');
        setEmail(found.email || '');
        setAddress(found.address || '');
      }
      setQuotes(allQuotes.filter(q => String(q.client_id) === String(id)));
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
      const updated = await updateClient(id as any, {
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
            await deleteClient(id as any);
            router.back();
          } catch (err: any) {
            Alert.alert('Greška', err.message);
          }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Klijent nije pronađen</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {editing ? (
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ime klijenta"
                />
              ) : (
                <Text style={styles.clientName}>{client.name}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>{editing ? 'Otkaži' : '✏️ Uredi'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editFields}>
              <TextInput style={styles.fieldInput} value={phone} onChangeText={setPhone} placeholder="Telefon" keyboardType="phone-pad" />
              <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
              <TextInput style={styles.fieldInput} value={address} onChangeText={setAddress} placeholder="Adresa" />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Snimanje...' : 'Sačuvaj izmene'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactInfo}>
              {client.phone && <Text style={styles.contactRow}>📞 {client.phone}</Text>}
              {client.email && <Text style={styles.contactRow}>✉️ {client.email}</Text>}
              {client.address && <Text style={styles.contactRow}>📍 {client.address}</Text>}
            </View>
          )}
        </View>

        {/* Quotes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ponude ({quotes.length})</Text>
          {quotes.length === 0 ? (
            <Text style={styles.emptyText}>Nema ponuda za ovog klijenta</Text>
          ) : (
            quotes.map(q => (
              <TouchableOpacity
                key={q.id}
                style={styles.quoteRow}
                onPress={() => router.push(`/quote/${q.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteDate}>{new Date(q.created_at).toLocaleDateString('sr-RS')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.quoteAmount}>{(q.total ?? 0).toLocaleString('sr-RS')} RSD</Text>
                  <StatusBadge status={q.status} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Danger zone */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑 Obriši klijenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 16, color: '#6b7280' },
  backBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  headerCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  clientName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  nameInput: {
    fontSize: 18, fontWeight: '700', color: '#111827', borderBottomWidth: 2,
    borderBottomColor: '#2563EB', paddingBottom: 4,
  },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  editBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  contactInfo: { gap: 6 },
  contactRow: { fontSize: 14, color: '#374151' },
  editFields: { gap: 8, marginTop: 8 },
  fieldInput: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', backgroundColor: '#f9fafb',
  },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginBottom: 10 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
  quoteRow: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  quoteDate: { fontSize: 13, color: '#6b7280' },
  quoteAmount: { fontSize: 14, fontWeight: '700', color: '#1e3a8a' },

  deleteBtn: {
    borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
});
