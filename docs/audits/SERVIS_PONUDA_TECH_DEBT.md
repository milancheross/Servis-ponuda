# Servis Ponuda — Technical Debt Register

**Datum:** 2026-06-20

---

## Kategorije

- **TD-A** — Validacija i tipovi
- **TD-B** — Arhitektura i organizacija
- **TD-C** — Database i API design
- **TD-D** — Frontend / UX patterns
- **TD-E** — DevOps i observability

---

## TD-A: Validacija i tipovi

### A-01 · `any` tip dominira UI komponentama

**Gde:** Sve dashboard stranice  
**Primer:**
```typescript
// quotes/[id]/page.tsx
const [quote, setQuote] = useState<any>(null)
const items = quote.items || []
items.map((item: any, i: number) => ...)
```
**Tipovi postoje u `lib/types.ts` ali se ne koriste u komponentama.**  
**Fix:** Zameniti `any` sa `Quote`, `QuoteItem`, `Client` iz `lib/types.ts`.  
**Effort:** Srednji (svaka stranica odvojeno)

---

### A-02 · Nema form validation library-a

**Gde:** Sve forme (clients/new, clients/[id] edit, quotes/new step 3)  
**Problem:** Validacija je ručna, neujednačena, nema accessibility atributa.  
**Fix:** React Hook Form + Zod. Zod schema se može deliti između API-ja i UI-ja.  
**Effort:** Visok (jednokratno ulaganje, zatim brže pisanje formi)

---

### A-03 · Status stringovi nisu typesafe svuda

**Gde:** Ceo projekat  
**Problem:** `'nacrt'`, `'poslata'`, `'prihvacena'`, `'neplaceno'` su stringovi direktno u JSX.  
**Tipovi postoje** (`QuoteStatus`, `InvoiceStatus`) ali ih neke komponente ne koriste.  
**Fix:** Uvesti QUOTE_STATUS i INVOICE_STATUS konstante i koristiti ih dosledno.  
**Effort:** Nizak

---

### A-04 · Nema validacije env varijabli na startup-u

**Gde:** `lib/supabase.ts`, `lib/auth.ts`  
**Problem:**
```typescript
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
// ! znači TS veruje da postoji — ali ako nije setovano, runtime crash
```
**Fix:**
```typescript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error('JWT_SECRET mora biti setovan i duži od 32 karaktera')
```
**Effort:** Nizak

---

## TD-B: Arhitektura i organizacija

### B-01 · Nema shared API client hook-a

**Gde:** Svaka dashboard stranica  
**Problem:** `fetch('/api/quotes')` se direktno poziva u 5+ komponenti. Promena URL-a, headera ili error handling-a zahteva editovanje svakog mesta.  
**Fix:** `lib/api.ts` ili custom hooks:
```typescript
export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } })
  if (!res.ok) throw new Error(await res.json().then(d => d.error))
  return res.json()
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  useEffect(() => { apiFetch<Quote[]>('/quotes').then(setQuotes) }, [])
  return quotes
}
```
**Effort:** Srednji

---

### B-02 · Dashboard stranice su prevelike single-file komponente

**Gde:**
- `clients/[id]/page.tsx` — 345 linija
- `quotes/new/page.tsx` — 328 linija
- `quotes/[id]/page.tsx` — 240 linija

**Problem:** Teško za testiranje, teško za review, teško za izmenu jednog dela.  
**Fix:** Extract u manje komponente:
- `QuoteDetailHeader`, `QuoteDetailItems`, `QuoteDetailPayment`, `QuoteDetailActions`
- `ClientViewPanel`, `ClientEditForm`, `ClientActivitiesFeed`

**Effort:** Srednji

---

### B-03 · Auth i Dashboard nemaju sopstvene layout.tsx

**Gde:** `app/(auth)/`  
**Problem:** Login i Register svaki za sebe definišu celu stranicu sa gradijentom. Duplication.  
**Fix:** `app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
```
**Effort:** Nizak

---

### B-04 · Nema shared UI konstanti za boje i stilove

**Gde:** Ceo projekat  
**Problem:** `#1e3a8a` se pojavljuje direktno 50+ puta. `rounded-xl`, `border-gray-100` ponavljaju se bez sistema.  
**Fix:** `tailwind.config.ts` proširiti sa:
```typescript
colors: { brand: { DEFAULT: '#1e3a8a', dark: '#152b6b', light: '#2563EB' } }
```
I definisati `@layer components` klase: `.btn-primary`, `.card`, `.input-field`  
**Effort:** Srednji

---

### B-05 · Nema Error Boundary komponente

**Gde:** Sve dashboard stranice  
**Problem:** JS crash u jednoj komponenti = bela stranica za korisnika.  
**Fix:**
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div>Nešto je pošlo naopako. Osvežite stranicu.</div>
    return this.props.children
  }
}
```
Koristiti u `dashboard/layout.tsx`.  
**Effort:** Nizak

---

## TD-C: Database i API design

### C-01 · Nema paginacije na list endpointima

**Gde:** `GET /api/quotes`, `GET /api/clients`, `GET /api/invoices`, `GET /api/price-items`  
**Problem:** Vraćaju sve rezultate. Korisnik sa 1000 ponuda = spor dashboard.  
**Fix:** `?limit=50&offset=0` query parametri sa DB `.range(offset, offset+limit-1)`  
**Effort:** Nizak

---

### C-02 · Dashboard stats query je nefikasan

**Gde:** `home/page.tsx`  
**Problem:** Fetch svi quotes, svi clients, svi invoices samo da bi prikazali 4 broja.  
**Fix:** `GET /api/dashboard/stats` koji vraća:
```typescript
{ clientCount, quotesThisMonth, unpaidCount, unpaidTotal, pendingReminders }
```
Sa SQL agregacijom: `SELECT COUNT(*), SUM(total_amount)` umesto fetch-all.
  
**Effort:** Nizak

---

### C-03 · Faktura ne kopira stavke pri konverziji

**Gde:** `api/quotes/[id]/convert/route.ts`  
**Problem:** Faktura nema sopstvene `invoice_items`. PDF fakture čita `quote_items`. Ako se quote izmeni, faktura se retroaktivno menja.  
**Fix:** Kopirati `quote_items` u `invoice_items` pri konverziji i kreirati `invoice_items` tabelu.  
**Effort:** Visok (schema migration + API + PDF template)

---

### C-04 · Nema indeksa na frequently queried kolonama

**Gde:** Supabase schema  
**Problem:** Svaki `SELECT WHERE user_id = ...` je full table scan.  
**Fix:**
```sql
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_tracking_token ON quotes(tracking_token);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
```
**Effort:** Nizak (migracija)

---

### C-05 · Nema Foreign Key constraint-a sa CASCADE

**Gde:** Supabase schema  
**Problem:** Brisanje klijenta ne briše njegove ponude. Brisanje ponude ne briše stavke.  
**Fix:**
```sql
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
ALTER TABLE quote_items ADD CONSTRAINT fk_items_quote 
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
```
**Effort:** Nizak (migracija)

---

### C-06 · Signature data kao base64 u quotes tabeli

**Gde:** `quotes.signature_data`  
**Problem:** 30-100KB po potpisu direktno u DB. `SELECT *` uvek vuče signature.  
**Fix:** Supabase Storage + URL u bazi.  
**Effort:** Srednji

---

## TD-D: Frontend / UX patterns

### D-01 · Nema toast notifikacija

**Gde:** Sve akcije (čuvanje klijenta, slanje ponude, plaćanje fakture)  
**Problem:** Korisnik ne dobija feedback posle uspešnih akcija. Mora sam da zaključi da je nešto urađeno.  
**Fix:** `react-hot-toast` ili Radix Toast. Wrap u `ToastProvider` u root layout-u.  
**Effort:** Nizak

---

### D-02 · Nema optimistic UI updates

**Gde:** Mark as paid, send quote, mark activity  
**Problem:** Korisnik čeka server response pre nego što se UI ažurira. Na sporoj mreži deluje lagano.  
**Fix:** Update lokalni state odmah, rollback na grešku.  
**Effort:** Srednji (per akcija)

---

### D-03 · Client search u quote creation ne pretražuje company_name

**Gde:** `quotes/new/page.tsx` — Step 1  
**Problem:**
```typescript
const filteredClients = clients.filter(c => 
  c.name.toLowerCase().includes(clientSearch.toLowerCase())
  // Nedostaje: || (c.company_name || '').toLowerCase().includes(clientSearch.toLowerCase())
)
```
Biznis klijent se ne može naći po imenu firme.
  
**Effort:** Nizak (1 linija fix)

---

### D-04 · Mobile bottom nav prikazuje emojije umesto SVG ikona

**Gde:** `Sidebar.tsx` mobile bottom nav  
**Problem:** Emoji ikone nisu konzistentne na svim Android/iOS verzijama. SVG ikone su pouzdanije i profesionalnije.  
**Fix:** Lucide React ili Heroicons.  
**Effort:** Srednji

---

## TD-E: DevOps i observability

### E-01 · Nema error monitoring (Sentry)

**Gde:** Ceo projekat  
**Problem:** Crash u produkciji se ne vidi. Korisnik se samo žali.  
**Fix:** `@sentry/nextjs` — 30 minuta setup.  
**Effort:** Nizak

---

### E-02 · Nema strukturiranog logginga

**Gde:** `lib/api-helpers.ts`, `api/auth/login/route.ts`  
**Problem:** `console.error('[login]', e)` ode na Vercel Logs ali bez strukture, bez request ID, bez korelacije.  
**Fix:** `pino` ili Axiom za structured JSON logging.  
**Effort:** Srednji

---

### E-03 · Nema staging okruženja

**Gde:** Deploy konfiguracija  
**Problem:** Svaka promena ide direktno na produkciju. Nije moguće testirati bez rizika.  
**Fix:** Vercel Preview Deployments + zasebna Supabase dev baza.  
**Effort:** Srednji

---

### E-04 · Migracije se pokreću ručno

**Gde:** `supabase/migrations/`  
**Problem:** Nema automatskog pokretanja migracija pri deploy-u.  
**Fix:** GitHub Action koji pokrće `supabase db push` posle svakog merge na main.  
**Effort:** Nizak

---

### E-05 · Nema health check endpointa

**Gde:** API  
**Problem:** Nema načina da uptime monitor proveri da li app radi.  
**Fix:**
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', ts: new Date().toISOString() })
}
```
**Effort:** Trivijalan

---

## Refactor kandidati (redosledom prioriteta)

1. `home/page.tsx` → extract `/api/dashboard/stats` endpoint + refactor component
2. `clients/[id]/page.tsx` → split na ViewPanel + EditForm + ActivitiesFeed
3. `quotes/new/page.tsx` → extract Step1, Step2, Step3 u odvojene komponente
4. `lib/api-helpers.ts` → dodati typed `apiFetch` helper
5. Sve forme → migrirati na React Hook Form + Zod
6. Sidebar ikone → zameniti emoji sa SVG ikona bibliotekom
7. Auth stranice → zajednički layout.tsx
8. Tailwind boje → centralizovati u config
