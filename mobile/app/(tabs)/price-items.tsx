import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPriceItems, createPriceItem, updatePriceItem, deletePriceItem, PriceItem } from '../../lib/api';
import EmptyState from '../../components/EmptyState';

const CATEGORIES = ['sve', 'rad', 'materijal', 'ostalo'] as const;
type CategoryFilter = typeof CATEGORIES[number];

const categoryLabels: Record<string, string> = {
  sve: 'Sve', rad: 'Rad', materijal: 'Materijal', ostalo: 'Ostalo',
};

export default function PriceItemsScreen() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [category, setCategory] = useState<CategoryFilter>('sve');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<PriceItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [itemCategory, setItemCategory] = useState<'rad' | 'materijal' | 'ostalo'>('rad');

  const loadItems = useCallback(async () => {
    try {
      const data = await getPriceItems();
      setItems(data);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  const filtered = category === 'sve' ? items : items.filter(i => i.category === category);

  function openAdd() {
    setEditItem(null);
    setName(''); setUnit(''); setPrice(''); setItemCategory('rad');
    setModalVisible(true);
  }

  function openEdit(item: PriceItem) {
    setEditItem(item);
    setName(item.name); setUnit(item.unit); setPrice(String(item.price)); setItemCategory(item.category);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim() || !unit.trim() || !price.trim()) {
      Alert.alert('Greška', 'Naziv, jedinica mere i cena su obavezni');
      return;
    }
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Greška', 'Unesite ispravnu cenu');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const updated = await updatePriceItem(editItem.id, { name: name.trim(), unit: unit.trim(), price: priceNum, category: itemCategory });
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await createPriceItem({ name: name.trim(), unit: unit.trim(), price: priceNum, category: itemCategory });
        setItems(prev => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PriceItem) {
    Alert.alert('Brisanje', `Obrišite "${item.name}"?`, [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Obriši', style: 'destructive',
        onPress: async () => {
          try {
            await deletePriceItem(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
          } catch (err: any) {
            Alert.alert('Greška', err.message);
          }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, category === cat && styles.tabActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.tabText, category === cat && styles.tabTextActive]}>
              {categoryLabels[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={<EmptyState icon="📋" title="Nema stavki" message="Dodajte prvu stavku cenovnika" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
            <View style={styles.cardLeft}>
              <Text style={styles.catBadge}>{categoryLabels[item.category]}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemUnit}>Jed. mere: {item.unit}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.itemPrice}>{item.price.toLocaleString('sr-RS')} RSD</Text>
              <Text style={styles.perUnit}>/ {item.unit}</Text>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? 'Uredi stavku' : 'Nova stavka'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Naziv *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Npr. Zamena česme" />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Jed. mere *</Text>
              <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="kom, m, h" />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Cena (RSD) *</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice}
                placeholder="0.00" keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategorija</Text>
            <View style={styles.catRow}>
              {(['rad', 'materijal', 'ostalo'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, itemCategory === cat && styles.catBtnActive]}
                  onPress={() => setItemCategory(cat)}
                >
                  <Text style={[styles.catBtnText, itemCategory === cat && styles.catBtnTextActive]}>
                    {categoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Čuvanje...' : 'Sačuvaj'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardLeft: { flex: 1 },
  catBadge: { fontSize: 10, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', marginBottom: 4 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  itemUnit: { fontSize: 12, color: '#9ca3af' },
  cardRight: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
  perUnit: { fontSize: 11, color: '#9ca3af', marginBottom: 6 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  modal: { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e3a8a' },
  modalClose: { fontSize: 20, color: '#9ca3af', padding: 4 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  catRow: { flexDirection: 'row', gap: 8 },
  catBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#d1d5db' },
  catBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  catBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  catBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
