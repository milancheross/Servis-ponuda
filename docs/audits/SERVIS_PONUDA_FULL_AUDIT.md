# Servis Ponuda — Full CTO / Architecture / Product Audit

**Datum:** 2026-06-20  
**Auditor:** Senior technical review  
**Stack:** Next.js 14.2.5 · Supabase (PostgreSQL) · Custom JWT auth · Vercel · Expo (mobile)  
**Verzija repoa:** main @ cbb2510

---

## Executive Summary

Servis Ponuda je funkcionalan, deployovan MVP. Srž proizvoda — kreiranje ponude, slanje klijentu, digitalni potpis, konverzija u fakturu — **radi**. UI je čist i mobile-friendly. Arhitektura je razumljiva i svaka osoba koja zna Next.js može da uđe u kod.

Međutim, projekat ima **više ozbiljnih sigurnosnih problema** koji moraju biti rešeni pre ozbiljnijeg skaliranja ili prodaje. Ima i arhitekturalne slabosti koje će postati skuplje za popravku što duže čekaju.

**Projekat je: ozbiljan MVP koji treba 2–3 nedelje čišćenja da bi bio production-safe.**

---

## Ocena po oblastima (1–10)

| Oblast | Ocena | Komentar |
|--------|-------|----------|
| Product idea | 8/10 | Jasan market fit, konkretni use case |
| UX / flow | 6/10 | Osnova dobra, nema onboardinga, dashboard siromašan |
| Web codebase | 5/10 | Radi, ali puno `any`, loše validacije, sve client-side |
| Mobile codebase | 3/10 | Postoji, ali nije dovoljno istražen / završen |
| API sloj | 5/10 | Konzistentan, ali bez validacije i paginacije |
| Sigurnost | 3/10 | Više kritičnih propusta, vidi Security audit |
| Database | 4/10 | Nema RLS, nema FK, nema kaskade, nema indeksa |
| Maintainability | 5/10 | Čitljiv ali krhak — `any` posvuda, nema testova |
| Production readiness | 4/10 | Deploji se ali nema monitoring, rate limit, log |

---

## 1. Product / UX / Flow Audit

### Šta radi dobro

- **Osnovi flow je logičan**: klijent → ponuda → slanje → potpis → faktura
- **Javni quote portal** (tracking token) je odličan UX za klijenta — ne treba mu nalog
- **Digitalni potpis** je diferencirajuća feature za majstore
- **Mobile-first Tailwind** layout radi dobro na telefonu
- **Podsetnici** na dashboardu za ponude koje čekaju odgovor > 7 dana — dobra ideja

### Problemi

#### 1.1 Nema onboardinga za novog korisnika
Novi korisnik se registruje i vidi prazan dashboard. Ne postoji:
- welcome tour
- "napravi prvu ponudu za 2 minuta" flow
- popunjeni primeri
- checklist (dodaj cenovnik → dodaj klijenta → napravi ponudu)

**Impact:** Visok churn na dan 1. Majstor ne zna šta da radi sledeće.

#### 1.2 Dashboard je informativan ali pasivan
Dashboard prikazuje 4 stat-kartice + poslednje ponude. Ne pomaže korisniku da nešto **uradi**. Nema:
- quick action dugmadi ("+ Nova ponuda" prominentno)
- recent activity feed
- overdue fakture prominentno
- revenue trend

#### 1.3 Time to first value je predug
Broji korake do prve poslate ponude od nulte baze:
1. Register (6 polja)
2. Login
3. Clients → New client (10+ polja za firmu)
4. Quotes → New quote → Select client → Add items → Review → Create
5. Quote detail → Send

**Ukupno: 3 zasebna ekrana, 15+ akcija.** Za majstora na terenu je to previše.

**Quick win:** Dozvoli kreiranje ponude BEZ unapred sačuvanog klijenta — unesi ime direktno u quote wizard.

#### 1.4 Cenovnik je opcionalan ali neophodan za UX
Ukoliko korisnik nema popunjen cenovnik, step 2 quote wizarda je prazan i konfuzan. Nema guided setup za cenovnik.

#### 1.5 Nema email notifikacija
Kada klijent otvori, prihvati ili odbije ponudu — korisnik ne dobija nikakav push/email. Mora sam da ulazi u app da proveri.

#### 1.6 Faktura je minimalistička
Faktura je suštinski kopija ponude + broj FA-YYYY-NNN. Nema:
- DUE DATE vidljiv korisniku
- PDF koji izgleda kao pravi račun (firma, adresa, PIB, broj bankovnog računa)
- Mogućnost označavanja delimičnog plaćanja

#### 1.7 Quote creation step 3 je pregust
U poslednjoj sesiji dodate billing/payment preference opcije u Step 3 "Pregled". Taj ekran sada ima:
- stavke
- profit breakdown
- popust
- napomenu
- prikaz cene na ponudi
- rok plaćanja
- napomenu za plaćanje
- napomenu za fakturisanje

**To je previše za jednu stranicu.** Razmisli o tome da payment preferences budu collapsible sekcija ili da se pomeraju posle kreiranja.

---

## 2. Web App Audit (Next.js)

### Routing i layout

```
app/
  (marketing)/     → public landing, layout je pass-through
  (auth)/          → login, register (nema layout.tsx!)
  (dashboard)/     → app shell sa Sidebar
  q/[token]/       → public quote portal
  api/             → Next.js API routes
```

**Problem:** `(auth)` nema sopstveni `layout.tsx`. Login i Register svaki za sebe renderuju celu stranicu. Promena auth UI-a zahteva editing 2 fajla.

**Fix:** Napravi `/app/(auth)/layout.tsx` sa gradijentom i centriranjem — children postaje samo forma.

### Server/Client granica

**Sve dashboard stranice su `'use client'`**. Ovo je anti-pattern u Next.js 14:
- Nema server-side data fetching
- Svaki ekran čini N fetch poziva na mount, sa loading spinnerima
- Nema cache-inga između navigacija
- SEO nije moguć (irelevantan za dashboard, ali pattern je loš)

Dashboard home je posebno loš:
```typescript
// home/page.tsx — 4 paralelna fetch-a na mount
const [profileRes, clientsRes, quotesRes, invoicesRes] = await Promise.all([
  fetch('/api/auth/profile'),
  fetch('/api/clients'),    // vraća SVE klijente
  fetch('/api/quotes'),     // vraća SVE ponude
  fetch('/api/invoices'),   // vraća SVE fakture
])
```
Kada bude 500+ ponuda, ovo će biti sporo i skupo.

### Forme i validacija

Nema form validation library-a (Zod, React Hook Form, valibot). Svaka forma ručno prikuplja state. Posledica:
- Nema tipske validacije na client strani
- Nema konzistentnih error poruka
- Nema accessible error states (aria-invalid, aria-describedby)
- Nema debounce-a na search poljima

### Loading i error states

- Loading states postoje (skeleton/pulse) ✓
- Error states su minimalistički: samo `<div>Nije pronađeno</div>`
- Nema React Error Boundary — crash jedne komponente može slomiti celu stranicu
- Nema `toast` notifikacija za uspešne akcije

### TypeScript

`any` tip se koristi agresivno:
```typescript
// quotes/new/page.tsx
const [clients, setClients] = useState<any[]>([])
const [quote, setQuote] = useState<any>(null)
// u svim dashboard stranicama
```

Postoje tipovi u `lib/types.ts` ali se retko koriste u komponentama.

### Komponente

Neke stranice su prevelike:
- `clients/[id]/page.tsx` — 345 linija
- `quotes/new/page.tsx` — 328 linija
- `quotes/[id]/page.tsx` — 240 linija

Nema custom hookova za data fetching. Nema `useQuotes()`, `useClients()` hookova.

### Metadata / SEO

```typescript
// layout.tsx
export const metadata = {
  title: { default: 'Servis Ponuda — Ponude i fakture za majstore', template: '%s | Servis Ponuda' },
  description: '...',
  icons: { icon: '/logo-servis-ponuda.png', apple: '/logo-servis-ponuda.png' },
}
```

- Nema OG image
- Nema canonical URL
- Nema sitemap.xml
- Nema robots.txt
- Nema structured data (schema.org)
- Landing stranica nema per-page metadata override

---

## 3. Mobile App Audit (Expo)

Mobile app postoji u `/mobile/` ali na osnovu pregleda je u ranoj fazi. Bez detaljnog uvida u sve ekrane, nemoguće je dati kompletan audit, ali jasno je:

- Nije na istom nivou zrelosti kao web app
- API integracija verovatno koristi isti backend (Next.js API)
- **CORS nije konfigurisan** — mobile app koji poziva web API sa drugog origin-a može imati probleme
- Nema deployment pipeline za mobile (App Store / Play Store)

**Preporuka:** Mobile app tretirati kao P3 — prvo stabilizovati web.

---

## 4. Backend / API Audit

### Struktura

```
api/
  auth/login, register, logout, profile
  clients/route.ts, [id]/route.ts, [id]/activities/
  quotes/route.ts, [id]/route.ts, [id]/send, [id]/convert, [id]/pdf
  invoices/route.ts, [id]/route.ts, [id]/pay, [id]/pdf
  price-items/route.ts, [id]/route.ts
  q/[token]/route.ts, [token]/respond/route.ts
```

### Što radi dobro

- `withAuth` wrapper konzistentno korišćen na svim zaštićenim endpointima ✓
- Ownership check `.eq('user_id', userId)` na svakom upitu ✓
- Generic error poruka za login (ne leakuje da li postoji user) ✓
- Odvojeni runtime za PDF (`export const runtime = 'nodejs'`) ✓

### Problemi

#### 4.1 Nema input validacije na API sloju

API prima podatke i direktno ih šalje u Supabase:
```typescript
// quotes/route.ts
const { items = [], discount_percent = 0 } = body
// quantity može biti -1000, discount_percent može biti 999, price može biti NaN
const total = items.reduce((s, i) => s + (i.quantity * i.price), 0)
```

Rezultat: negativni totali, NaN u bazi, arithmetic overflow.

#### 4.2 Race condition u numeraciji

```typescript
// quotes/route.ts i invoices/convert/route.ts
const { count } = await supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId)
const num = String((count || 0) + 1).padStart(3, '0')
const quote_number = `SP-${year}-${num}`
```

Dve ponude kreirane u isto vreme dobijaju isti broj. **Nije hypothetičan problem** — dupliranja su moguća i pri normalnoj upotrebi na mobilnoj mreži (retry).

**Fix:** Koristiti DB sekvencu ili unique constraint + retry.

#### 4.3 Nema paginacije

Svi list endpointi vraćaju neograničen broj rezultata:
- `GET /api/quotes` — vraća sve ponude (može biti hiljada)
- `GET /api/clients` — sve
- `GET /api/invoices` — sve
- `GET /api/clients/[id]/activities` — sve

#### 4.4 Quote convert bez status check-a

```typescript
// quotes/[id]/convert/route.ts
export const POST = withAuth(async (_req, userId, ctx) => {
  const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).eq('user_id', userId).single()
  // Nema provere da li je quote u ispravnom statusu!
  // Može se konvertovati nacrt, odbijena ponuda, već konvertovana ponuda
```

Može se kreirati više faktura za iste ponude.

#### 4.5 Konverzija ne kopira stavke u fakturu

```typescript
// convert/route.ts — insert u invoices
.insert({
  user_id: userId,
  client_id: quote.client_id,
  quote_id: quote.id,
  total_amount: quote.total_amount,
  // Nema kopiranja invoice_items!
})
```

Faktura nema sopstvene stavke — za PDF mora da pita quote_items. Ovo je acceptable za MVP ali je loš design: ako se quote izmeni posle konverzije, faktura se menja retroaktivno.

#### 4.6 Nema idempotency

Dvostruki klik na "Kreiraj fakturu" ili network retry može kreirati duplikat.

---

## 5. Database / Supabase / Multi-tenancy Audit

### Schema (iz migracija)

Osnovne tabele: `users`, `clients`, `quotes`, `quote_items`, `invoices`, `client_activities`, `price_items`

### Kritični problemi

#### 5.1 Nema Row Level Security (RLS)

Projekt koristi `SUPABASE_SERVICE_KEY` (service role) za sve upite. Service role **zaobilazi kompletnu RLS politiku**. Ovo znači:

- Zaštita podataka je **isključivo** na nivou aplikacionog koda
- Ako bilo koji API endpoint ima bug i ne pita `.eq('user_id', userId)` — podaci su izloženi
- Direktan DB pristup bez koda = apsolutno nema zaštite

#### 5.2 Nema Foreign Key constraints u migracijama

Migracije koje smo videli samo dodaju kolone. Nema definisanih FK relacija:
```sql
-- Ovo NE postoji u migracijama:
ALTER TABLE quotes ADD CONSTRAINT fk_quote_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
ALTER TABLE quote_items ADD CONSTRAINT fk_item_quote 
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
```

Rezultat: moguće brisanje klijenta bez brisanja njegovih ponuda → orphaned records.

#### 5.3 Quote items se ne brišu sa quote

Kada se quote briše, `quote_items` ostaju u bazi kao orphani. Bez FK CASCADE.

#### 5.4 Nema indeksa

Nema definisanih indeksa ni na jednom polju osim primarnih ključeva (Supabase auto). Polja koja se stalno koriste u WHERE:
- `quotes.user_id`
- `quotes.status`
- `quotes.tracking_token`
- `clients.user_id`
- `invoices.user_id`
- `quote_items.quote_id`

Bez indeksa, svaki query nad tim tabelama je full table scan.

#### 5.5 Signature data u bazi

`quotes.signature_data` čuva PNG potpis kao base64 string (DataURL). Jedan potpis može biti 30–100KB. Uz 1000 potpisanih ponuda = 30–100MB samo u jednoj koloni.

**Fix:** Supabase Storage, čuvaj URL u bazi.

#### 5.6 Multi-tenancy model

Model je jednostavan: `user_id` kolona na svakoj tabeli. Svaki query mora imati `.eq('user_id', userId)`. Radi za single-user accounts.

**Nije skalabilno za:** timove, organizacije, sub-accounts, agency use-case.

---

## 6. Code Quality

### Top 10 code quality problema

1. **`any` everywhere** — `useState<any>`, `(item: any)`, `(q: any)`. Tipovi postoje u `lib/types.ts` ali se ne koriste.
2. **Nema validacije na API-ju** — ni client ni server validacija. Zod bi rešio oba odjednom.
3. **Duplicate fetch patterns** — svaka stranica samostalno poziva API. Nema shared hooks.
4. **Prevelike komponente** — `clients/[id]/page.tsx` je 345 linija, sve u jednom fajlu.
5. **console.error u produkciji** — `[API Error]`, `[login]` loggovi idu na Vercel logs ali bez structured logging.
6. **Hardcoded strings** — `'nacrt'`, `'poslata'`, `'neplaceno'` su string literali posvuda. Nema enum-a ni konstanti.
7. **Inline business logic u komponentama** — filtriranje podsetnika, računanje statsa je u `home/page.tsx`, treba u API.
8. **Magic numbers** — `7 * 86400000` za 7 dana, hardcoded `30d` za JWT expiry, bez konstanti.
9. **Nema error boundaries** — crash = bela stranica za korisnika.
10. **Nema loadash/date-fns** — datum manipulacija ručno (`Date.now() - 7 * 86400000`).

### Top 10 maintainability problema

1. **Nema testova** — ni unit, ni integration, ni e2e. Svaka promena je ručno testiranje.
2. **Nema shared API client** — svaki component direktno poziva `fetch('/api/...')`. Promena URL-a = menjanje 20 mesta.
3. **Nema form library** — React Hook Form + Zod bi eliminisali 60% koda za forme.
4. **Auth u svakom API route-u ručno** — `withAuth` radi, ali ako se zaboravi, nema fallback.
5. **Nema environment validation** — ako `JWT_SECRET` nije setovan, app crashuje sa `TypeError` ne sa smislenom greškom.
6. **Migracije su additive-only** — nema rollback strategije.
7. **Nema enum-a u TypeScript** — status vrednosti su stringovi svuda.
8. **Nema shared constants** — `#1e3a8a` se pojavljuje 50+ puta direktno u JSX.
9. **Duplirani UI patterns** — `InfoRow`, `SectionHeader` pattern u više fajlova.
10. **Mobile app nije integrisan u CI** — buildi su odvojeni, nema zajedničkih tipova.

---

## 7. Performance Audit

### Web

#### Dashboard problem (HIGH)

```typescript
// home/page.tsx — poziva 4 API-ja na svaki mount
const [profileRes, clientsRes, quotesRes, invoicesRes] = await Promise.all([
  fetch('/api/auth/profile'),
  fetch('/api/clients'),    // sve — neograničeno
  fetch('/api/quotes'),     // sve — neograničeno
  fetch('/api/invoices'),   // sve — neograničeno
])
```

Pri 500 klijenata i 2000 ponuda, dashboard će transferovati **megabajte podataka** za prikazivanje 4 broja. Server upit je O(N) bez indeksa.

**Fix:** Dedikovan `/api/dashboard/stats` endpoint koji vraća samo agregiranu statistiku sa SQL COUNT/SUM.

#### Bundle size

`@react-pdf/renderer` je heavy library (~500KB). Učitava se u client bundle ako ikoja stranica importuje PDF komponente. Treba biti server-only.

#### N+1 potencijal

Quote list endpoint vraća `client:clients(id, name, ...)` JOIN — ovo je dobro. Ali ako se to nariše u više koraka, može biti N+1.

### Database

- Nema indeksa → full table scan na svim upitima
- Signature base64 u SELECT * → uvek se transferuje čak i kad nije potreban
- Count-based numeracija → 2 upita umesto 1 za kreiranje ponude

---

## 8. Design System / UI Consistency

### Što je konzistentno

- Tailwind klase su dosledne u primarnoj boji (`#1e3a8a`)
- Kartica pattern (bg-white rounded-xl border border-gray-100) je konzistentan
- StatusBadge komponenta centralizuje badge stilove ✓

### Nekonzistentnosti

- **Boja plave nije konzistentna**: koristi se `#1e3a8a`, `#2563EB`, `blue-700`, `blue-800` — tri različita tona
- **Border radius**: `rounded-lg`, `rounded-xl`, `rounded-2xl` mešano
- **Spacing**: `p-4`, `px-4 py-3`, `p-8` bez sistema
- **Input stilovi**: `/clients/new` koristi `rounded-xl px-4 py-3`, `/clients/[id]` edit koristi `rounded-lg px-3 py-2.5`
- **Buttons**: `py-3 rounded-xl` vs `py-2 rounded-lg` vs `py-3.5 rounded-xl` — nije standardizovano
- **Auth stranice** izgledaju drugačije od dashboarda (drugačiji font size, drugačiji border radius)

**Fix:** Definisati 5-6 Tailwind @apply klasa: `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`, `.section-header`.

---

## 9. Landing / SEO / Conversion Audit

### Šta radi dobro

- Headline je konkretan i funkcionalan
- How it works sekcija postoji
- FAQ sekcija postoji
- Pricing je jasan (jedna opcija, bez konfuzije)
- Javna demo ponuda (QuotePreviewSection) pokazuje output

### Problemi

- **Nema OG image** — deljenje na WhatsApp/Viber izgleda loše (samo URL)
- **Nema sitemap.xml** → Google ne zna šta da crawluje
- **Nema robots.txt**
- **Nema canonical URL**
- **Nema schema.org markup** (SoftwareApplication type bi pomogao)
- **Nema social proof** — ni jedan testimonial, ni jedan screenshot iz realne upotrebe
- **Landing se previše bavi feature listom** — treba više konkretnih scenarija ("Električar šalje ponudu sa terena za 2 minuta")
- **CTA na heroiju nije A/B testiran** — jedna varijanta za sve
- **Nema analytics** — ne zna se gde korisnici napuštaju funnel

---

## 10. Deploy / DevOps / Production Readiness

### Setup

- Vercel za web (`rootDirectory: "web"`) ✓
- Env varijable na Vercel-u ✓
- Supabase kao managed DB ✓

### Problemi

- **Nema error monitoring** (Sentry, Highlight, Axiom)
- **Nema structured logging** — samo `console.error`
- **Nema health check endpoint** (`/api/health`)
- **Nema rate limiting** — Vercel nema built-in rate limiting po default-u
- **Nema backup strategije** — Supabase ima auto backup, ali nema plana za restore
- **Nema staging environment** — promena ide direktno na produkciju
- **Migracije se ručno pokreću** — nema automatskog pokretanja na deploy
- **Nema preview deployments za DB migracije** — opasno
- **Mobile app nema CI/CD pipeline**
- **Nema cron jobova** — budući feature (podsetnici emailom) će zahtevati background jobs

---

## Što je urađeno dobro (nije sve crno)

✅ Ownership check na svakom DB upitu — tenants su izolovani na app nivou  
✅ httpOnly cookie za JWT — ne može JS da ga ukrade  
✅ Generic error poruka za login — ne leakuje da li email postoji  
✅ bcryptjs sa rounds=10 — adekvatno za sada  
✅ `runtime = 'nodejs'` na PDF routama — nema edge runtime crash  
✅ Tracking token za public quote — UUID-based, nije enumerable  
✅ TypeScript je uključen i koristi se  
✅ Supabase je managed — backup, scaling, SSL dolaze besplatno  
✅ Vercel deploy je jednostavan i automatski  
✅ Mobile-first UI — dashboard radi na telefonu  
✅ Empty states postoje na svim listama  
✅ StatusBadge komponenta je centralizovana  
