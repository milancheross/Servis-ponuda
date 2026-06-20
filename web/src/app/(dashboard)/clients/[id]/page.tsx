'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LEGAL_FORM_LABELS, VAT_STATUS_LABELS, ENTREPRENEUR_TAX_MODE_LABELS,
  PAYMENT_TERMS_LABELS, INVOICE_PREFERENCE_LABELS, PRICE_DISPLAY_MODE_LABELS,
} from '@/lib/client-utils'
import { useToast } from '@/components/Toast'

type ClientType = 'person' | 'business'

const ACTIVITY_TYPES = [
  { value: 'poziv', label: '📞 Poziv' },
  { value: 'sastanak', label: '🤝 Sastanak' },
  { value: 'beleska', label: '📝 Beleška' },
]

const FIELD = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]'
const SELECT = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase font-medium">{label}</div>
      <div className="text-gray-900 mt-0.5 text-sm">{value}</div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1 pb-1 border-b border-gray-100">{title}</div>
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [clientType, setClientType] = useState<ClientType>('person')
  const [personForm, setPersonForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [bizForm, setBizForm] = useState({
    name: '', contact_person: '', phone: '', email: '',
    tax_id: '', registration_number: '',
    billing_address: '', job_site_address: '',
    legal_form: 'unknown', vat_status: 'unknown', entrepreneur_tax_mode: 'unknown',
    notes: '',
  })
  const [billingForm, setBillingForm] = useState({
    payment_terms: 'unknown',
    payment_terms_note: '',
    invoice_preference: 'unknown',
    preferred_price_display_mode: 'unknown',
    billing_notes: '',
  })
  const [activities, setActivities] = useState<any[]>([])
  const [actForm, setActForm] = useState({ type: 'poziv', note: '', activity_date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingAct, setAddingAct] = useState(false)
  const { toast } = useToast()

  function initFormFromClient(c: any) {
    const type: ClientType = c.client_type === 'business' ? 'business' : 'person'
    setClientType(type)
    setBillingForm({
      payment_terms: c.payment_terms || 'unknown',
      payment_terms_note: c.payment_terms_note || '',
      invoice_preference: c.invoice_preference || 'unknown',
      preferred_price_display_mode: c.preferred_price_display_mode || 'unknown',
      billing_notes: c.billing_notes || '',
    })
    if (type === 'person') {
      setPersonForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' })
    } else {
      setBizForm({
        name: c.company_name || c.name || '',
        contact_person: c.contact_person || '',
        phone: c.phone || '',
        email: c.email || '',
        tax_id: c.tax_id || '',
        registration_number: c.registration_number || '',
        billing_address: c.billing_address || '',
        job_site_address: c.job_site_address || '',
        legal_form: c.legal_form || 'unknown',
        vat_status: c.vat_status || 'unknown',
        entrepreneur_tax_mode: c.entrepreneur_tax_mode || 'unknown',
        notes: c.notes || '',
      })
    }
  }

  async function loadData() {
    const [cRes, aRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch(`/api/clients/${id}/activities`),
    ])
    if (cRes.ok) {
      const c = await cRes.json()
      setClient(c)
      initFormFromClient(c)
    }
    if (aRes.ok) setActivities(await aRes.json())
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = clientType === 'person'
      ? { client_type: 'person', ...personForm, ...billingForm }
      : {
          client_type: 'business',
          name: bizForm.name,
          company_name: bizForm.name,
          contact_person: bizForm.contact_person,
          phone: bizForm.phone,
          email: bizForm.email,
          tax_id: bizForm.tax_id,
          registration_number: bizForm.registration_number,
          billing_address: bizForm.billing_address,
          job_site_address: bizForm.job_site_address,
          legal_form: bizForm.legal_form,
          vat_status: bizForm.vat_status,
          entrepreneur_tax_mode: bizForm.entrepreneur_tax_mode,
          notes: bizForm.notes,
          ...billingForm,
        }
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { const c = await res.json(); setClient(c); initFormFromClient(c); setEditing(false); toast('Klijent sačuvan') }
    else toast('Greška pri čuvanju', 'error')
    setSaving(false)
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault()
    setAddingAct(true)
    const res = await fetch(`/api/clients/${id}/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actForm),
    })
    if (res.ok) {
      const a = await res.json()
      setActivities(prev => [a, ...prev])
      setActForm({ type: 'poziv', note: '', activity_date: new Date().toISOString().split('T')[0] })
      toast('Aktivnost dodana')
    } else toast('Greška', 'error')
    setAddingAct(false)
  }

  async function deleteActivity(actId: string) {
    const res = await fetch(`/api/clients/${id}/activities/${actId}`, { method: 'DELETE' })
    if (res.ok) setActivities(prev => prev.filter(a => a.id !== actId))
  }

  if (loading) return <div className="p-4 md:p-8"><div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4" /><div className="h-40 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!client) return <div className="p-4">Klijent nije pronađen</div>

  const isBusiness = (client.client_type || 'person') === 'business'
  const displayName = isBusiness ? (client.company_name || client.name) : client.name

  const hasBillingInfo = client.payment_terms !== 'unknown' || client.invoice_preference !== 'unknown' ||
    client.preferred_price_display_mode !== 'unknown' || client.billing_notes

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-gray-500 hover:text-gray-700">← Nazad</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${isBusiness ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {isBusiness ? 'Firma / preduzetnik' : 'Fizičko lice'}
          </span>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0">
            ✏️ Izmeni
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={saveEdit} className="bg-white rounded-xl p-4 space-y-3 mb-6 border border-gray-200">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Tip klijenta</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {([['person', '👤 Fizičko lice'], ['business', '🏢 Firma / preduzetnik']] as const).map(([type, label]) => (
                <button key={type} type="button" onClick={() => setClientType(type)}
                  className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors ${clientType === type ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-white text-gray-700 border-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {clientType === 'person' ? (
            <>
              {[
                { label: 'Ime i prezime *', key: 'name', type: 'text', required: true },
                { label: 'Telefon', key: 'phone', type: 'tel' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Adresa', key: 'address', type: 'text' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input required={required} type={type} value={(personForm as any)[key]}
                    onChange={e => setPersonForm(f => ({ ...f, [key]: e.target.value }))} className={FIELD} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Napomena</label>
                <textarea value={personForm.notes} onChange={e => setPersonForm(f => ({ ...f, notes: e.target.value }))} className={FIELD} rows={2} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Naziv firme / radnje *</label>
                <input required value={bizForm.name} onChange={e => setBizForm(f => ({ ...f, name: e.target.value }))} className={FIELD} />
              </div>
              {[
                { label: 'PIB', key: 'tax_id' },
                { label: 'Matični broj', key: 'registration_number' },
                { label: 'Adresa sedišta', key: 'billing_address' },
                { label: 'Kontakt osoba', key: 'contact_person' },
                { label: 'Telefon', key: 'phone' },
                { label: 'Email', key: 'email' },
                { label: 'Adresa objekta', key: 'job_site_address' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input value={(bizForm as any)[key]} onChange={e => setBizForm(f => ({ ...f, [key]: e.target.value }))} className={FIELD} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pravni oblik</label>
                <select value={bizForm.legal_form} onChange={e => setBizForm(f => ({ ...f, legal_form: e.target.value }))} className={SELECT}>
                  <option value="unknown">Nepoznato</option>
                  <option value="doo">DOO</option>
                  <option value="entrepreneur">Preduzetnik</option>
                  <option value="other">Ostalo</option>
                </select>
              </div>
              {bizForm.legal_form === 'entrepreneur' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tip preduzetnika</label>
                  <select value={bizForm.entrepreneur_tax_mode} onChange={e => setBizForm(f => ({ ...f, entrepreneur_tax_mode: e.target.value }))} className={SELECT}>
                    <option value="unknown">Nepoznato</option>
                    <option value="lump_sum">Paušalac</option>
                    <option value="books">Knjigaš</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">PDV status</label>
                <select value={bizForm.vat_status} onChange={e => setBizForm(f => ({ ...f, vat_status: e.target.value }))} className={SELECT}>
                  <option value="unknown">Nepoznato</option>
                  <option value="in_vat">U sistemu PDV-a</option>
                  <option value="out_of_vat">Nije u sistemu PDV-a</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Napomena</label>
                <textarea value={bizForm.notes} onChange={e => setBizForm(f => ({ ...f, notes: e.target.value }))} className={FIELD} rows={2} />
              </div>
            </>
          )}

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1 pb-1 border-b border-gray-100">Naplata i fakturisanje</div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Uslovi plaćanja</label>
            <select value={billingForm.payment_terms} onChange={e => setBillingForm(f => ({ ...f, payment_terms: e.target.value }))} className={SELECT}>
              <option value="unknown">Nije definisano</option>
              <option value="immediately">Odmah</option>
              <option value="advance">Avansno</option>
              <option value="7_days">7 dana</option>
              <option value="15_days">15 dana</option>
              <option value="30_days">30 dana</option>
              <option value="custom">Po dogovoru</option>
            </select>
          </div>
          {(billingForm.payment_terms === 'custom' || billingForm.payment_terms_note) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Napomena za plaćanje</label>
              <input value={billingForm.payment_terms_note} onChange={e => setBillingForm(f => ({ ...f, payment_terms_note: e.target.value }))} className={FIELD} placeholder="npr. 50% avans, ostatak po završetku" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tip dokumenta</label>
            <select value={billingForm.invoice_preference} onChange={e => setBillingForm(f => ({ ...f, invoice_preference: e.target.value }))} className={SELECT}>
              <option value="unknown">Nije definisano</option>
              <option value="simple_consumer">Obična naplata (fizičko lice)</option>
              <option value="business_invoice">Faktura na firmu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Podrazumevani prikaz cene na ponudi</label>
            <select value={billingForm.preferred_price_display_mode} onChange={e => setBillingForm(f => ({ ...f, preferred_price_display_mode: e.target.value }))} className={SELECT}>
              <option value="unknown">Nije definisano</option>
              <option value="total_only">Samo ukupna cena</option>
              <option value="subtotal_vat_total">Osnovica + PDV + ukupno</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Napomena za fakturisanje</label>
            <textarea value={billingForm.billing_notes} onChange={e => setBillingForm(f => ({ ...f, billing_notes: e.target.value }))} className={FIELD} rows={2}
              placeholder="npr. račun na firmu, navesti PIB..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button type="button" onClick={() => { setEditing(false); initFormFromClient(client) }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold">
              Otkaži
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 space-y-3">
          {isBusiness ? (
            <>
              <SectionHeader title="Poslovni podaci" />
              <InfoRow label="Naziv firme / radnje" value={client.company_name || client.name} />
              <InfoRow label="PIB" value={client.tax_id} />
              <InfoRow label="Matični broj" value={client.registration_number} />
              <InfoRow label="Adresa sedišta" value={client.billing_address} />
              <InfoRow label="Pravni oblik" value={client.legal_form && client.legal_form !== 'unknown' ? LEGAL_FORM_LABELS[client.legal_form] : undefined} />
              {client.legal_form === 'entrepreneur' && (
                <InfoRow label="Tip preduzetnika" value={client.entrepreneur_tax_mode && client.entrepreneur_tax_mode !== 'unknown' ? ENTREPRENEUR_TAX_MODE_LABELS[client.entrepreneur_tax_mode] : undefined} />
              )}
              <InfoRow label="PDV status" value={client.vat_status && client.vat_status !== 'unknown' ? VAT_STATUS_LABELS[client.vat_status] : undefined} />
              <SectionHeader title="Kontakt" />
              <InfoRow label="Kontakt osoba" value={client.contact_person} />
              <InfoRow label="Telefon" value={client.phone} />
              <InfoRow label="Email" value={client.email} />
              {client.job_site_address && (
                <>
                  <SectionHeader title="Objekat / radovi" />
                  <InfoRow label="Adresa objekta" value={client.job_site_address} />
                </>
              )}
            </>
          ) : (
            <>
              <InfoRow label="Telefon" value={client.phone} />
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Adresa" value={client.address} />
            </>
          )}
          {client.notes && (
            <>
              <SectionHeader title="Napomena" />
              <InfoRow label="" value={client.notes} />
            </>
          )}
          {hasBillingInfo && (
            <>
              <SectionHeader title="Naplata i fakturisanje" />
              <InfoRow label="Uslovi plaćanja" value={client.payment_terms && client.payment_terms !== 'unknown' ? PAYMENT_TERMS_LABELS[client.payment_terms] : undefined} />
              <InfoRow label="Napomena za plaćanje" value={client.payment_terms_note} />
              <InfoRow label="Tip dokumenta" value={client.invoice_preference && client.invoice_preference !== 'unknown' ? INVOICE_PREFERENCE_LABELS[client.invoice_preference] : undefined} />
              <InfoRow label="Prikaz cene na ponudi" value={client.preferred_price_display_mode && client.preferred_price_display_mode !== 'unknown' ? PRICE_DISPLAY_MODE_LABELS[client.preferred_price_display_mode] : undefined} />
              <InfoRow label="Napomena za fakturisanje" value={client.billing_notes} />
            </>
          )}
          <Link href={`/quotes/new?client=${id}`} className="block w-full text-center bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold mt-4">
            + Nova ponuda za ovog klijenta
          </Link>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">CRM aktivnosti</h2>
        <form onSubmit={addActivity} className="bg-white rounded-xl p-4 mb-4 border border-gray-200 space-y-3">
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map(t => (
              <button type="button" key={t.value} onClick={() => setActForm(f => ({ ...f, type: t.value }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${actForm.type === t.value ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea value={actForm.note} onChange={e => setActForm(f => ({ ...f, note: e.target.value }))} placeholder="Beleška..." rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] resize-none" />
          <div className="flex gap-3 items-center">
            <input type="date" value={actForm.activity_date} onChange={e => setActForm(f => ({ ...f, activity_date: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            <button type="submit" disabled={addingAct} className="flex-1 bg-[#1e3a8a] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
              {addingAct ? 'Dodavanje...' : 'Dodaj'}
            </button>
          </div>
        </form>
        {activities.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">Još nema aktivnosti</div>
        ) : (
          <div className="space-y-2">
            {activities.map((a: any) => (
              <div key={a.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                <span className="text-xl">{ACTIVITY_TYPES.find(t => t.value === a.type)?.label.split(' ')[0] || '📝'}</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 font-medium uppercase">{a.type} · {a.activity_date}</div>
                  {a.note && <div className="text-gray-800 text-sm mt-0.5">{a.note}</div>}
                </div>
                <button onClick={() => deleteActivity(a.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
