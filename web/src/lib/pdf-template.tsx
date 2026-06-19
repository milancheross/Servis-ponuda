import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' },
  companyMeta: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  badge: { backgroundColor: '#1e3a8a', color: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 16 },
  label: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  clientMeta: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 4, fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#6b7280' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  totalBox: { backgroundColor: '#f9fafb', borderRadius: 6, padding: 12, marginTop: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, fontSize: 9, color: '#6b7280' },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1e3a8a', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#d1d5db' },
  note: { marginTop: 20, padding: 10, backgroundColor: '#eff6ff', borderRadius: 6, fontSize: 9, color: '#1e40af' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
})

interface PdfData {
  type: 'ponuda' | 'faktura'
  number?: string
  date: string
  companyName: string
  companyAddress?: string
  companyPhone?: string
  client: { name: string; phone?: string; email?: string; address?: string }
  items: { name: string; unit: string; quantity: number; price: number; total: number }[]
  total: number
  discountPercent?: number
  note?: string
}

function fmt(n: number) {
  return n.toLocaleString('de-DE') + ' RSD'
}

export function QuotePdf({ data }: { data: PdfData }) {
  const subtotal = data.items.reduce((s, i) => s + i.total, 0)
  const discountAmt = data.discountPercent ? subtotal * data.discountPercent / 100 : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{data.companyName}</Text>
            {data.companyAddress && <Text style={styles.companyMeta}>{data.companyAddress}</Text>}
            {data.companyPhone && <Text style={styles.companyMeta}>{data.companyPhone}</Text>}
          </View>
          <View>
            <Text style={styles.badge}>{data.type.toUpperCase()}{data.number ? ` #${data.number}` : ''}</Text>
            <Text style={[styles.companyMeta, { marginTop: 6, textAlign: 'right' }]}>{data.date}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.label}>Klijent</Text>
          <Text style={styles.clientName}>{data.client.name}</Text>
          {data.client.phone && <Text style={styles.clientMeta}>Tel: {data.client.phone}</Text>}
          {data.client.email && <Text style={styles.clientMeta}>Email: {data.client.email}</Text>}
          {data.client.address && <Text style={styles.clientMeta}>{data.client.address}</Text>}
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.label}>Stavke</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Naziv</Text>
            <Text style={styles.col2}>Kol. / Jed.</Text>
            <Text style={styles.col3}>Ukupno</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.name}</Text>
              <Text style={styles.col2}>{item.quantity} {item.unit}</Text>
              <Text style={styles.col3}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text>Osnovica:</Text><Text>{fmt(subtotal)}</Text>
          </View>
          {discountAmt > 0 && (
            <View style={styles.totalRow}>
              <Text>Popust ({data.discountPercent}%):</Text><Text>- {fmt(discountAmt)}</Text>
            </View>
          )}
          <View style={styles.totalFinal}>
            <Text>UKUPNO:</Text><Text>{fmt(data.total)}</Text>
          </View>
        </View>

        {/* Note */}
        {data.note && (
          <View style={styles.note}>
            <Text>Napomena: {data.note}</Text>
          </View>
        )}

        <Text style={styles.footer}>Generisano • {data.companyName}</Text>
      </Page>
    </Document>
  )
}
