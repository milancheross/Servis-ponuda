import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, FlatList, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getClients, getPriceItems, createQuote, Client, PriceItem, QuoteItem } from '../../lib/api';

type Step = 1 | 2 | 3;

interface DraftItem extends QuoteItem {
  _key: string;
}

export default function NewQuoteScreen() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1: client
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingClients, setLoadingClients] = useState(true);

  // Step 2: items
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [note, setNote] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [priceSearch, setPriceSearch] = useState('');

  // Manual item form
  const [manualName, setManualName] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualPrice, setManualPrice] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Saving
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
    loadPriceItems();
  }, []);

  async function loadClients() {
    try {
      const data = await getClients();
      setClients(data);
    } catch (err: any) {
      Alert.alert('Greška', err.message);
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadPriceItems() {
    try {
      const data = await getPriceItems();
      setPriceItems(data);
    } catch {}
  }

  const filteredClients = clientSearch
    ? clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.phone || '').includes(clientSearch)
      )
    : clients;

  const filteredPriceItems = priceSearch
    ? priceItems.filter(p => p.name.toLowerCase().includes(priceSearch.toLowerCase()))
    : priceItems;

  function calcSubtotal() {
    return draftItems.reduce((sum, i) => sum + i.total, 0);
  }

  function calcTotal() {
    const sub = calcSubtotal();
    const disc = parseFloat(discountPercent) || 0;
    return sub * (1 - disc / 100);
  }

  function addFromPriceItem(item: PriceItem) {
    const draftItem: DraftItem = {
      _key: Math.random().toString(36).slice(2),
      price_item_id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: 1,
      price: item.price,
      total: item.price,
    };
    setDraftItems(prev => [...prev, draftItem]);
    setShowPriceModal(false);
    setPriceSearch('');
  }

  function openManualAdd() {
    setEditingIndex(null);
    setManualName(''); setManualUnit('kom'); setManualQty('1'); setManualPrice('');
    setShowManualModal(true);
  }

  function openManualEdit(item: DraftItem, idx: number) {
    setEditingIndex(idx);
    setManualName(item.name);
    setManualUnit(item.unit);
    setManualQty(String(item.quantity));
    setManualPrice(String(item.price));
    setShowManualModal(true);
  }

  function saveManualItem() {
    if (!manualName.trim() || !manualUnit.trim()) {
      Alert.alert('Greška', 'Naziv i jedinica mere su obavezni');
      return;
    }
    const qty = parseFloat(manualQty.replace(',', '.')) || 0;
    const price = parseFloat(manualPrice.replace(',', '.')) || 0;
    if (qty <= 0) { Alert.alert('Greška', 'Količina mora biti veća od 0'); return; }

    const item: DraftItem = {
      _key: editingIndex !== null ? draftItems[editingIndex]._key : Math.random().toString(36).slice(2),
      name: manualName.trim(),
      unit: manualUnit.trim(),
      quantity: qty,
      price,
      total: qty * price,
    };

    if (editingIndex !== null) {
      setDraftItems(prev => prev.map((di, i) => i === editingIndex ? item : di));
    } else {
      setDraftItems(prev => [...prev, item]);
    }
    setShowManualModal(false);
  }

  function removeItem(idx: number) {
    setDraftItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave(send: boolean) {
    if (!selectedClient) { Alert.alert('Greška', 'Odaberite klijenta'); return; }
    if (draftItems.length === 0) { Alert.alert('Greška', 'Dodajte bar jednu stavku'); return; }

    setSaving(true);
    try {
      const disc = parseFloat(discountPercent) || undefined;
      const quote = await createQuote({
        client_id: selectedClient.id,
        items: draftItems.map(({ name, unit, quantity, price, price_item_id }) => ({
          name, unit, quantity, price, price_item_id,
        })),
        discount_percent: disc,
        valid_until: validUntil || undefined,
        note: note || undefined,
      });

      if (send) {
        // Navigate to detail which will allow sending
        router.replace(`/quote/${quote.id}`);
      } else {
        router.replace(`/quote/${quote.id}`);
      }
    } catch (err: any) {
      Alert.alert('Greška', err.message);
      setSaving(false);
    }
  }

  // ---- STEP 1 ----
  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepIndicator}>Korak 1 od 3</Text>
          <Text style={styles.stepTitle}>Odaberite klijenta</Text>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={clientSearch}
            onChangeText={setClientSearch}
            placeholder="Pretraži klijente..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        {loadingClients ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Nema klijenata. Najpre dodajte klijenta.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.clientCard, selectedClient?.id === item.id && styles.clientCardSelected]}
                onPress={() => setSelectedClient(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{item.name}</Text>
                  {item.phone && <Text style={styles.clientDetail}>📞 {item.phone}</Text>}
                </View>
                {selectedClient?.id === item.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.nextBtn, !selectedClient && styles.nextBtnDisabled]}
            onPress={() => selectedClient && setStep(2)}
            disabled={!selectedClient}
          >
            <Text style={styles.nextBtnText}>Dalje: Stavke →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---- STEP 2 ----
  if (step === 2) {
    const subtotal = calcSubtotal();
    const total = calcTotal();
    const disc = parseFloat(discountPercent) || 0;

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepIndicator}>Korak 2 od 3 — {selectedClient?.name}</Text>
          <Text style={styles.stepTitle}>Dodajte stavke</Text>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 200 }}>
          <View style={styles.addButtons}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowPriceModal(true)}>
              <Text style={styles.addBtnIcon}>📋</Text>
              <Text style={styles.addBtnText}>Iz cenovnika</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={openManualAdd}>
              <Text style={styles.addBtnIcon}>✏️</Text>
              <Text style={styles.addBtnText}>Ručni unos</Text>
            </TouchableOpacity>
          </View>

          {draftItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>Još nema stavki</Text>
            </View>
          ) : (
            <View style={styles.itemsCard}>
              {draftItems.map((item, idx) => (
                <View key={item._key} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetail}>{item.quantity} {item.unit} × {item.price.toLocaleString('sr-RS')} RSD</Text>
                  </View>
                  <Text style={styles.itemTotal}>{item.total.toLocaleString('sr-RS')} RSD</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => openManualEdit(item, idx)} style={styles.iconBtn}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeItem(idx)} style={styles.iconBtn}>
                      <Text>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Popust (%)</Text>
              <TextInput
                style={styles.optionInput}
                value={discountPercent}
                onChangeText={setDiscountPercent}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Važi do (datum)</Text>
              <TextInput
                style={styles.optionInput}
                value={validUntil}
                onChangeText={setValidUntil}
                placeholder="npr. 2024-12-31"
              />
            </View>
            <View style={[styles.optionRow, { alignItems: 'flex-start' }]}>
              <Text style={[styles.optionLabel, { marginTop: 10 }]}>Napomena</Text>
              <TextInput
                style={[styles.optionInput, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Opciona napomena..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.totalCard}>
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
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
            <Text style={styles.backBtnText}>← Nazad</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, { flex: 1 }, draftItems.length === 0 && styles.nextBtnDisabled]}
            onPress={() => draftItems.length > 0 && setStep(3)}
            disabled={draftItems.length === 0}
          >
            <Text style={styles.nextBtnText}>Pregled →</Text>
          </TouchableOpacity>
        </View>

        {/* Price Items Modal */}
        <Modal visible={showPriceModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Odaberite iz cenovnika</Text>
              <TouchableOpacity onPress={() => { setShowPriceModal(false); setPriceSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={priceSearch}
                onChangeText={setPriceSearch}
                placeholder="Pretraži..."
                placeholderTextColor="#9ca3af"
              />
            </View>
            <FlatList
              data={filteredPriceItems}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.priceItemRow} onPress={() => addFromPriceItem(item)}>
                  <View style={styles.flex}>
                    <Text style={styles.priceItemName}>{item.name}</Text>
                    <Text style={styles.priceItemUnit}>{item.unit}</Text>
                  </View>
                  <Text style={styles.priceItemPrice}>{item.price.toLocaleString('sr-RS')} RSD</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.centered}><Text style={styles.emptyText}>Nema stavki u cenovniku</Text></View>
              }
            />
          </View>
        </Modal>

        {/* Manual Item Modal */}
        <Modal visible={showManualModal} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingIndex !== null ? 'Uredi stavku' : 'Ručni unos'}</Text>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Naziv *</Text>
                <TextInput style={styles.input} value={manualName} onChangeText={setManualName} placeholder="Naziv usluge ili materijala" />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Jed. mere *</Text>
                  <TextInput style={styles.input} value={manualUnit} onChangeText={setManualUnit} placeholder="kom, m, h" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Količina *</Text>
                  <TextInput style={styles.input} value={manualQty} onChangeText={setManualQty}
                    placeholder="1" keyboardType="decimal-pad" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cena po jed. (RSD) *</Text>
                <TextInput style={styles.input} value={manualPrice} onChangeText={setManualPrice}
                  placeholder="0.00" keyboardType="decimal-pad" />
              </View>
              {manualQty && manualPrice ? (
                <Text style={styles.calcPreview}>
                  Ukupno: {((parseFloat(manualQty.replace(',', '.')) || 0) * (parseFloat(manualPrice.replace(',', '.')) || 0)).toLocaleString('sr-RS')} RSD
                </Text>
              ) : null}
              <TouchableOpacity style={styles.saveBtn} onPress={saveManualItem}>
                <Text style={styles.saveBtnText}>Dodaj stavku</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // ---- STEP 3: Preview ----
  const subtotal = calcSubtotal();
  const total = calcTotal();
  const disc = parseFloat(discountPercent) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepIndicator}>Korak 3 od 3</Text>
        <Text style={styles.stepTitle}>Pregled ponude</Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={{ padding: 16, paddingBottom: 200 }}>
        <View style={styles.previewCard}>
          <Text style={styles.previewSection}>Klijent</Text>
          <Text style={styles.previewValue}>{selectedClient?.name}</Text>
          {selectedClient?.phone && <Text style={styles.previewMeta}>📞 {selectedClient.phone}</Text>}
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewSection}>Stavke ({draftItems.length})</Text>
          {draftItems.map((item, idx) => (
            <View key={item._key} style={styles.previewItemRow}>
              <View style={styles.flex}>
                <Text style={styles.previewItemName}>{item.name}</Text>
                <Text style={styles.previewItemDetail}>{item.quantity} {item.unit} × {item.price.toLocaleString('sr-RS')} RSD</Text>
              </View>
              <Text style={styles.previewItemTotal}>{item.total.toLocaleString('sr-RS')} RSD</Text>
            </View>
          ))}
          <View style={styles.divider} />
          {disc > 0 && (
            <View style={styles.previewTotalRow}>
              <Text style={styles.previewTotalLabel}>Popust ({disc}%):</Text>
              <Text style={[styles.previewTotalValue, { color: '#ef4444' }]}>
                -{(subtotal * disc / 100).toLocaleString('sr-RS')} RSD
              </Text>
            </View>
          )}
          <View style={styles.previewTotalRow}>
            <Text style={styles.grandTotalLabel}>UKUPNO:</Text>
            <Text style={styles.grandTotalValue}>{total.toLocaleString('sr-RS')} RSD</Text>
          </View>
        </View>

        {(validUntil || note) && (
          <View style={styles.previewCard}>
            {validUntil ? <Text style={styles.previewMeta}>📅 Važi do: {validUntil}</Text> : null}
            {note ? <Text style={styles.previewMeta}>📝 {note}</Text> : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
          <Text style={styles.backBtnText}>← Nazad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.draftBtn, saving && styles.nextBtnDisabled]}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          <Text style={styles.draftBtnText}>Sačuvaj nacrt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stepHeader: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  stepIndicator: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 12, borderRadius: 12, paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  list: { paddingHorizontal: 12, paddingBottom: 120 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  clientCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  clientCardSelected: { borderColor: '#2563EB', backgroundColor: '#eff6ff' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  clientDetail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  checkmark: { fontSize: 20, color: '#2563EB', fontWeight: '700' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    padding: 16, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  nextBtn: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center' },
  backBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  draftBtn: { flex: 1, backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  draftBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  addButtons: { flexDirection: 'row', gap: 12, padding: 12 },
  addBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  addBtnIcon: { fontSize: 24, marginBottom: 6 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  emptyItems: { margin: 12, padding: 32, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  emptyItemsText: { fontSize: 14, color: '#9ca3af' },
  itemsCard: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 4, overflow: 'hidden' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  itemMain: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemDetail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1e3a8a', marginRight: 8 },
  itemActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  optionsCard: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  optionLabel: { fontSize: 14, color: '#374151', flex: 1 },
  optionInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827',
  },
  noteInput: { height: 64, textAlignVertical: 'top' },
  totalCard: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
  grandTotalRow: { paddingTop: 10, borderTopWidth: 2, borderTopColor: '#2563EB', marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#1e3a8a' },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  // Modal
  modal: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
  modalClose: { fontSize: 20, color: '#9ca3af', padding: 4 },
  priceItemRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  priceItemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  priceItemUnit: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  priceItemPrice: { fontSize: 15, fontWeight: '700', color: '#1e3a8a' },
  // Manual form
  inputGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  calcPreview: { fontSize: 14, color: '#2563EB', fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Preview
  previewCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  previewSection: { fontSize: 11, fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  previewValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  previewMeta: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  previewItemRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  previewItemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  previewItemDetail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  previewItemTotal: { fontSize: 14, fontWeight: '700', color: '#1e3a8a' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  previewTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  previewTotalLabel: { fontSize: 14, color: '#6b7280' },
  previewTotalValue: { fontSize: 14, fontWeight: '600' },
});
