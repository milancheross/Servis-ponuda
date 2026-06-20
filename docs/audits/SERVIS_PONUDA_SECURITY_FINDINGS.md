# Servis Ponuda — Security Findings

**Datum:** 2026-06-20  
**Metodologija:** Static code analysis, architecture review, data flow analysis

---

## CRITICAL (treba popraviti pre prodaje / javnog marketinga)

---

### [C-01] Supabase Service Role Key korišćen za sve upite

**Severity:** CRITICAL — BLOCKER  
**Fajl:** `web/src/lib/supabase.ts`, `.env.local`  
**Rizik:** Ako se key leakuje ili ako bilo koji API endpoint ima bug, napadač ima pun pristup celoj bazi podataka svih korisnika.

**Problem:**
```typescript
// lib/supabase.ts
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
// Service role key zaobilazi SVU Row Level Security politiku
```

Service role key je ekvivalent root pristupa bazi. Koristi se u svim API rutama. Cela bezbednost podataka zavisi isključivo od koda — nema DB-level zaštite.

**Fix opcija A (preporučena):** Prebaci na Supabase Auth (zamena custom JWT), koristi anon key + definiši RLS politike:
```sql
-- quotes: korisnik vidi samo svoje
CREATE POLICY "user_isolation" ON quotes
  USING (auth.uid() = user_id);
```

**Fix opcija B (brži):** Zadrži custom JWT, ali dodaj RLS politike i koristi anon key za čitanje. Za write operacije koristi service key samo u zaštićenim server rutama, ali dodaj RLS kao second line of defense.

---

### [C-02] Middleware ne štiti API rute

**Severity:** CRITICAL  
**Fajl:** `web/src/middleware.ts`  
**Rizik:** Svaki API endpoint koji slučajno nema `withAuth` wrapper je potpuno javno dostupan.

**Problem:**
```typescript
// middleware.ts — linija 14
if (pathname.startsWith('/api/') || ...) {
  return NextResponse.next()  // API rute se PRESKIDAJU bez auth check-a!
}
```

Middleware eksplicitno skip-uje sve API rute. Oslanjamo se isključivo na `withAuth` u svakom handler-u. Jedan zaboravljeni wrapper = otvorena ruta.

**Fix:** Dodaj API zaštitu u middleware:
```typescript
// Zaštiti API rute osim auth i public endpointa
const PUBLIC_API = ['/api/auth/login', '/api/auth/register', '/api/q/']
if (pathname.startsWith('/api/') && !PUBLIC_API.some(p => pathname.startsWith(p))) {
  const token = req.cookies.get('sp_token')?.value
    || req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { await jwtVerify(token, JWT_SECRET) } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
}
```

---

## HIGH (popraviti u narednih 7 dana)

---

### [H-01] Nema rate limiting ni na jednom endpointu

**Severity:** HIGH  
**Fajlovi:** Svi API endpointi  
**Rizik:**
- `/api/auth/login` — brute force napad na lozinke
- `/api/auth/register` — kreiranje hiljada lažnih naloga
- `/api/q/[token]/respond` — spamovanje statusa ponude
- `/api/quotes` — enumeracija

**Fix:** Vercel KV + `@vercel/kv` ili `upstash/ratelimit`:
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(5, '1m') })

// U login handler-u:
const { success } = await ratelimit.limit(email)
if (!success) return err('Previše pokušaja. Pokušajte za minut.', 429)
```

---

### [H-02] Input validacija ne postoji na API sloju

**Severity:** HIGH  
**Fajlovi:** `api/quotes/route.ts`, `api/clients/route.ts`, `api/price-items/route.ts`  
**Rizik:** Negativni iznosi, NaN vrednosti, prekoračenje u bazi, billing integrity problem.

**Konkretni primeri:**
```typescript
// quotes/route.ts — nije validirano
const { items = [], discount_percent = 0 } = body
// discount_percent = 150 → total postaje negativan
// item.price = -5000 → korisnik "plaća" klijentu
// item.quantity = 0 → NaN u totalu
```

**Fix (minimum bez Zod-a):**
```typescript
if (typeof discount_percent !== 'number' || discount_percent < 0 || discount_percent > 100)
  return err('Popust mora biti između 0 i 100')

for (const item of items) {
  if (typeof item.price !== 'number' || item.price < 0 || !isFinite(item.price))
    return err('Cena stavke mora biti pozitivan broj')
  if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity))
    return err('Količina mora biti pozitivan ceo broj')
}
```

**Fix (sa Zod-om — preporučeno):**
```typescript
import { z } from 'zod'

const QuoteSchema = z.object({
  client_id: z.string().uuid(),
  items: z.array(z.object({
    name: z.string().min(1).max(255),
    price: z.number().min(0).max(100_000_000),
    quantity: z.number().int().min(1).max(10_000),
    unit: z.string().max(20).optional(),
    category: z.enum(['rad', 'materijal', 'ostalo']).optional(),
  })).min(1),
  discount_percent: z.number().min(0).max(100).default(0),
  note: z.string().max(2000).optional(),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
```

---

### [H-03] JWT expiry od 30 dana, nema refresh tokena

**Severity:** HIGH  
**Fajl:** `web/src/lib/auth.ts`  
**Rizik:** Ukradeni token važi mesec dana. Nema načina da se invalidira bez restartovanja servera (stateless JWT).

```typescript
.setExpirationTime('30d')  // previše dugo
```

**Fix:**
1. Skrati na 7 dana (kratkoročno)
2. Implementiraj refresh token pattern:
   - Access token: 1h
   - Refresh token: 30 dana, čuvan u `refresh_tokens` tabeli
   - Refresh token se može invalidirati (logout sa svih uređaja)

---

### [H-04] Nema security HTTP headera

**Severity:** HIGH  
**Fajl:** `web/next.config.mjs`  
**Rizik:** Clickjacking, MIME sniffing, protokol downgrade.

**Fix:**
```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ...(process.env.NODE_ENV === 'production' ? [{
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }] : []),
      ],
    }]
  },
}
```

---

### [H-05] Race condition u generisanju brojeva ponuda i faktura

**Severity:** HIGH (data integrity)  
**Fajlovi:** `api/quotes/route.ts`, `api/quotes/[id]/convert/route.ts`  
**Rizik:** Duplirani SP-YYYY-NNN ili FA-YYYY-NNN brojevi.

```typescript
// NIJE atomično — dva paralelna zahteva daju isti broj
const { count } = await supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId)
const num = String((count || 0) + 1).padStart(3, '0')
```

**Fix A (brži):** Dodaj UNIQUE constraint na `(user_id, quote_number)` i retry na grešku.

**Fix B (bolji):** Supabase DB function:
```sql
CREATE SEQUENCE quote_number_seq;
CREATE OR REPLACE FUNCTION next_quote_number(uid uuid)
RETURNS text AS $$
  SELECT 'SP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('quote_number_seq')::text, 3, '0')
$$ LANGUAGE sql;
```

---

### [H-06] Quote konverzija bez status validacije

**Severity:** HIGH (business logic integrity)  
**Fajl:** `api/quotes/[id]/convert/route.ts`  
**Rizik:** Kreiranje više faktura za istu ponudu, konverzija odbijene ponude.

```typescript
// Nema provere statusa!
const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).eq('user_id', userId).single()
// Direktno kreira fakturu bez da proverava quote.status
```

**Fix:**
```typescript
if (!['poslata', 'prihvacena'].includes(quote.status)) {
  return err('Ponuda mora biti poslata ili prihvaćena da bi se konvertovala', 422)
}
// Proveri da nije već konvertovana
const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('quote_id', id)
if (count && count > 0) return err('Faktura za ovu ponudu već postoji', 409)
```

---

## MEDIUM (rešiti u narednih 30 dana)

---

### [M-01] `secure` flag na cookie samo u produkciji

**Severity:** MEDIUM  
**Fajl:** `api/auth/login/route.ts`  
**Rizik:** U development modu, cookie se šalje preko HTTP.

```typescript
res.cookies.set('sp_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // false u dev!
  sameSite: 'lax',
})
```

**Fix:** `secure: true` uvek, ili koristiti HTTPS u local devu (mkcert).

---

### [M-02] Nema validacije email formata

**Severity:** MEDIUM  
**Fajl:** `api/auth/register/route.ts`, `api/clients/route.ts`  

```typescript
const { email } = await req.json()
if (!email || !password) { ... }  // Samo null check, ne format check
```

**Fix:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) return err('Nevalidan email format')
```

---

### [M-03] Signature data čuvana kao base64 u bazi

**Severity:** MEDIUM  
**Fajl:** `api/q/[token]/respond/route.ts`  
**Rizik:** DB bloat, spore query-je, nema validacije veličine.

```typescript
// Client šalje:
const signature_data = canvasRef.current.toDataURL('image/png')  // 30–100KB
// Server čuva direktno u quotes.signature_data
```

**Fix:** Upload u Supabase Storage, čuvaj URL:
```typescript
const { data: upload } = await supabaseAdmin.storage
  .from('signatures')
  .upload(`${quoteId}/signature.png`, buffer, { contentType: 'image/png' })
updates.signature_url = upload.path  // čuvaj URL, ne base64
```

---

### [M-04] Javni quote endpoint vraća više nego što treba

**Severity:** MEDIUM  
**Fajl:** `app/q/[token]/page.tsx`  
**Rizik:** Leakuje interne podatke klijentu (payment_terms, billing_notes, user_id, tracking_token).

```typescript
// Vraća ceo quote objekat uključujući interne podatke
const { data: quote } = await supabase.from('quotes').select('*').eq('tracking_token', token).single()
```

**Fix:** Eksplicitni select samo potrebnih kolona za public view.

---

### [M-05] Nema max length na tekst poljima

**Severity:** MEDIUM  
**Fajlovi:** Svi API endpointi  
**Rizik:** Megabyte-dugi note/napomena stringovi u bazi. DoS kroz storage exhaustion.

**Fix:** Dodaj u DB schema:
```sql
ALTER TABLE quotes ADD CONSTRAINT note_length CHECK (length(note) <= 5000);
ALTER TABLE clients ADD CONSTRAINT name_length CHECK (length(name) <= 500);
```

I na API nivou validirati pre insert-a.

---

### [M-06] Quote items ostaju kao orphani kada se quote briše

**Severity:** MEDIUM (data integrity)  
**Fix:**
```sql
ALTER TABLE quote_items 
  ADD CONSTRAINT fk_quote_items_quote 
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
```

---

### [M-07] Nema CSRF tokena

**Severity:** MEDIUM  
**Rizik:** Cross-site request forgery za state-changing operacije (POST/PUT/DELETE).  
**Mitigacija:** SameSite=lax cookie smanjuje rizik ali ne eliminiše ga za same-site embedded contexts.  

**Fix:** Dodaj `SameSite=Strict` na cookie (proverite da li rompi auth flow), ili implementiraj CSRF token pattern.

---

## LOW (treba evidentirati, popraviti kad ima vremena)

---

### [L-01] Require potpis pre prihvatanja ponude

**Severity:** LOW  
**Fajl:** `app/q/[token]/QuotePortalClient.tsx`  

Trenutno je dovoljno uneti samo ime (bez potpisa) da bi se prihvatila ponuda. UX i pravna vrednost su upitni.

---

### [L-02] Internal error detalji u API odgovoru

**Severity:** LOW  
**Fajl:** `lib/api-helpers.ts`  

```typescript
return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
// e.message može biti Supabase internal error koji otkriva strukturu baze
```

**Fix:** Log pun error interno, vrati generičku poruku klijentu.

---

### [L-03] Nema audit trail za brisanje

**Severity:** LOW  
Kada se aktivnost, klijent ili ponuda obriše — nema zapisa ko je i kad obrisao.

---

### [L-04] Mobile app CORS

**Severity:** LOW  
Ako mobile Expo app poziva Next.js API sa drugog origina, može naići na CORS problem. Treba konfigurisan explicit CORS za mobile API pozive.

---

## Sažetak po prioritetu

| ID | Severity | Problem | Effort |
|----|----------|---------|--------|
| C-01 | CRITICAL | Service role key / nema RLS | Visok |
| C-02 | CRITICAL | Middleware preskida API rute | Nizak |
| H-01 | HIGH | Nema rate limiting | Nizak |
| H-02 | HIGH | Nema input validacije | Srednji |
| H-03 | HIGH | JWT 30 dana, nema refresh | Srednji |
| H-04 | HIGH | Nema security headera | Nizak |
| H-05 | HIGH | Race condition u numeraciji | Srednji |
| H-06 | HIGH | Konverzija bez status check | Nizak |
| M-01 | MEDIUM | Secure cookie samo u prod | Nizak |
| M-02 | MEDIUM | Nema email validacije | Nizak |
| M-03 | MEDIUM | Signature base64 u bazi | Srednji |
| M-04 | MEDIUM | Public quote leakuje podatke | Nizak |
| M-05 | MEDIUM | Nema max length na polji | Nizak |
| M-06 | MEDIUM | Orphaned quote items | Nizak |
| M-07 | MEDIUM | CSRF | Srednji |
