import React from 'react'
import { Document, Page, Text, View, StyleSheet, DocumentProps } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', padding: 40, fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  company: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' },
  companyDetail: { fontSize: 9, color: '#555', marginTop: 2 },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1e3a8a', textAlign: 'right' },
  docNumber: { fontSize: 11, color: '#555', textAlign: 'right', marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  clientName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  clientDetail: { fontSize: 9, color: '#555', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a', color: 'white', padding: '6 8', borderRadius: 4 },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottomWidth: 1, borderBottomColor: '#eee' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  col5: { flex: 1.5, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  totalLabel: { fontSize: 10, color: '#555', width: 80, textAlign: 'right' },
  totalValue: { fontSize: 10, width: 80, textAlign: 'right' },
  grandTotal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' },
  note: { marginTop: 24, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4 },
  noteLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#888', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#aaa' },
})

export interface PdfData {
  type: 'quote' | 'invoice'
  number: string
  date: string
  dueDate?: string
  company: { name: string; address?: string; phone?: string; pib?: string }
  client: { name: string; address?: string; phone?: string; email?: string }
  items: { name: string; unit: string; quantity: number; price: number; total: number }[]
  total: number
  discountPercent?: number
  note?: string
}

export function buildQuotePdf(data: PdfData): React.ReactElement<DocumentProps> {
  const subtotal = data.items.reduce((s, i) => s + i.total, 0)
  const discountAmt = data.discountPercent ? subtotal * data.discountPercent / 100 : 0
  const title = data.type === 'quote' ? 'PONUDA' : 'FAKTURA'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>{data.company.name}</Text>
            {data.company.address && <Text style={styles.companyDetail}>{data.company.address}</Text>}
            {data.company.phone && <Text style={styles.companyDetail}>Tel: {data.company.phone}</Text>}
            {data.company.pib && <Text style={styles.companyDetail}>PIB: {data.company.pib}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.docNumber}>Br. {data.number}</Text>
            <Text style={[styles.docNumber, { marginTop: 2 }]}>Datum: {data.date}</Text>
            {data.dueDate && <Text style={[styles.docNumber, { marginTop: 2 }]}>Rok: {data.dueDate}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Klijent</Text>
          <Text style={styles.clientName}>{data.client.name}</Text>
          {data.client.address && <Text style={styles.clientDetail}>{data.client.address}</Text>}
          {data.client.phone && <Text style={styles.clientDetail}>Tel: {data.client.phone}</Text>}
          {data.client.email && <Text style={styles.clientDetail}>{data.client.email}</Text>}
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.col1, { color: 'white', fontFamily: 'Helvetica-Bold' }]}>Opis</Text>
          <Text style={[styles.col2, { color: 'white', fontFamily: 'Helvetica-Bold' }]}>Jed.</Text>
          <Text style={[styles.col3, { color: 'white', fontFamily: 'Helvetica-Bold' }]}>Kol.</Text>
          <Text style={[styles.col4, { color: 'white', fontFamily: 'Helvetica-Bold' }]}>Cena</Text>
          <Text style={[styles.col5, { color: 'white', fontFamily: 'Helvetica-Bold' }]}>Ukupno</Text>
        </View>

        {data.items.map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? { backgroundColor: '#f9f9f9' } : {}]}>
            <Text style={styles.col1}>{item.name}</Text>
            <Text style={styles.col2}>{item.unit}</Text>
            <Text style={styles.col3}>{item.quantity}</Text>
            <Text style={styles.col4}>{item.price.toLocaleString('sr-RS')} RSD</Text>
            <Text style={styles.col5}>{item.total.toLocaleString('sr-RS')} RSD</Text>
          </View>
        ))}

        <View style={styles.totals}>
          {data.discountPercent ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Međuzbir:</Text>
                <Text style={styles.totalValue}>{subtotal.toLocaleString('sr-RS')} RSD</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Popust ({data.discountPercent}%):</Text>
                <Text style={styles.totalValue}>-{discountAmt.toLocaleString('sr-RS')} RSD</Text>
              </View>
            </>
          ) : null}
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>UKUPNO:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{data.total.toLocaleString('sr-RS')} RSD</Text>
          </View>
        </View>

        {data.note && (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>NAPOMENA</Text>
            <Text>{data.note}</Text>
          </View>
        )}

        <Text style={styles.footer}>Servis Ponuda · Generisano automatski</Text>
      </Page>
    </Document>
  ) as React.ReactElement<DocumentProps>
}
