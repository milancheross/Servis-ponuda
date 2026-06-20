# Servis Ponuda — Prioritized Action Plan

**Datum:** 2026-06-20  
**CTO perspektiva:** Šta bi trebalo uraditi i kojim redom u narednih 30 dana.

---

## A) Executive Summary

| Oblast | Ocena | Status |
|--------|-------|--------|
| Product idea | 8/10 | ✅ Dobar market fit |
| UX / flow | 6/10 | ⚠️ Nema onboarding, dashboard pasivan |
| Web codebase | 5/10 | ⚠️ Radi, ali krhko |
| Mobile codebase | 3/10 | ❌ Nije production ready |
| API sloj | 5/10 | ⚠️ Nema validacije, nema paginacije |
| Sigurnost | 3/10 | ❌ Više kritičnih propusta |
| Database | 4/10 | ❌ Nema RLS, FK, indeksa |
| Maintainability | 5/10 | ⚠️ Čitljiv ali krhak |
| Production readiness | 4/10 | ❌ Nema monitoring, rate limit |

**Ukupna procena:** Funkcionalan MVP, ali **nije production-safe za ozbiljnu prodaju**. Treba 2–3 nedelje fokusiranog rada na sigurnosti i stability.

---

## B) Top 10 Najvećih Problema

### 1. Nema RLS + Service Role Key
**Severity:** CRITICAL | **Impact:** Svi korisnički podaci | **Effort:** Visok  
Sujet sve bezbednosti oslonjen isključivo na aplikacioni kod. Jedan bug = data breach svih korisnika.  
**Fix:** Implementirati RLS politike u Supabase + prebaciti na anon key za browser pozive.

### 2. Middleware ne štiti API rute
**Severity:** CRITICAL | **Impact:** Svaki endpoint koji zaboravi withAuth | **Effort:** Nizak  
Linija `if (pathname.startsWith('/api/'))` u middleware-u znači da API nije zaštićen na transport nivou.  
**Fix:** 5 linija koda u middleware.ts (vidi Security Findings C-02).

### 3. Nema input validacije na API sloju
**Severity:** HIGH | **Impact:** Billing integrity, data corruption | **Effort:** Srednji  
Negativne cene, discount > 100%, NaN vrednosti mogu ući u bazu.  
**Fix:** Zod schema validacija na svakom POST/PUT endpointu.

### 4. Race condition u numeraciji ponuda/faktura
**Severity:** HIGH | **Impact:** Duplirani SP-YYYY-NNN/FA-YYYY-NNN | **Effort:** Srednji  
Dve paralelne akcije → isti broj. Nije hypothetično — dešava se na retry.

### 5. Nema rate limiting
**Severity:** HIGH | **Impact:** Brute force login, spam, DoS | **Effort:** Nizak  
Login endpoint nema zaštitu od brute force-a.

### 6. Nema security HTTP headera
**Severity:** HIGH | **Impact:** Clickjacking, protocol downgrade | **Effort:** Trivijalan  
10 linija u next.config.mjs rešava problem.

### 7. Quote konverzija bez status check-a
**Severity:** HIGH | **Impact:** Duplirane fakture, corruption | **Effort:** Nizak  
Može se kreirati više faktura za isti quote ili konvertovati odbijena ponuda.

### 8. Dashboard fetches sve podatke bez paginacije
**Severity:** MEDIUM | **Impact:** Performans pri scale | **Effort:** Nizak  
Pri 500+ ponuda, home page će biti spor i skup.

### 9. Nema error monitoring
**Severity:** MEDIUM | **Impact:** Slepi smo za produkcione crasheve | **Effort:** Trivijalan  
Sentry setup je 30 minuta i daje nemerljivu vrednost.

### 10. Nema onboarding flow-a
**Severity:** MEDIUM | **Impact:** Churn na dan 1 | **Effort:** Srednji  
Novi korisnik ne zna šta da uradi. Vidi prazan dashboard i odlazi.

---

## C) Top 10 Najbržih Win-ova (Visok ROI, Mali Effort)

| # | Win | Effort | Impact |
|---|-----|--------|--------|
| 1 | Security headeri u next.config.mjs | 15 min | Eliminiše clickjacking, MIME |
| 2 | Middleware zaštita API ruta | 30 min | Defense in depth za auth |
| 3 | Status check u quote convert | 30 min | Sprečava duplirane fakture |
| 4 | `/api/health` endpoint | 10 min | Uptime monitoring ready |
| 5 | Max length na API poljima | 1h | Sprečava storage abuse |
| 6 | Sentry integracija | 1h | Instant produkciona vidljivost |
| 7 | `/api/dashboard/stats` endpoint | 2h | Dashboard 10x brži pri scale |
| 8 | DB indeksi (migracija) | 1h | Query perf 10-100x brža |
| 9 | FK constraints + CASCADE | 1h | Data integrity odmah |
| 10 | Auth layout.tsx (zajednički) | 1h | DRY auth stranice |

---

## D) Plan po Prioritetima

### P0 — Uraditi odmah (kritično, pre sledećeg korisnika)

- [ ] **[C-02]** Middleware zaštita API ruta (`middleware.ts` — 5 linija)
- [ ] **[H-04]** Security HTTP headeri (`next.config.mjs` — 20 linija)
- [ ] **[H-06]** Status check pri konverziji quote → faktura
- [ ] **[H-02]** Osnovna validacija: discount 0-100, price > 0, quantity > 0
- [ ] **[H-05]** UNIQUE constraint na `(user_id, quote_number)` i `(user_id, invoice_number)`
- [ ] **[TD-C04]** DB indeksi na `user_id`, `tracking_token`, `status`
- [ ] **[TD-C05]** FK constraints sa CASCADE za `quote_items`

### P1 — Uraditi u narednih 7 dana

- [ ] **[H-01]** Rate limiting na login (max 5 pokušaja/minuti po IP/emailu)
- [ ] **[H-03]** JWT expiry sa 30d na 7d
- [ ] **[TD-E01]** Sentry error monitoring
- [ ] **[TD-C02]** `/api/dashboard/stats` endpoint + refactor home page
- [ ] **[TD-C01]** Paginacija na list endpointima (limit=50 default)
- [ ] **[M-02]** Email format validacija na register/clients
- [ ] **[TD-E05]** `/api/health` health check endpoint
- [ ] **[M-04]** Public quote endpoint — selektovati samo potrebna polja

### P2 — Uraditi u narednih 30 dana

- [ ] **[C-01]** Migracija sa service key na anon key + RLS politike (dugoročno, visok effort)
- [ ] **[M-03]** Signature u Supabase Storage umesto base64 u bazi
- [ ] **[TD-D01]** Toast notifikacije (react-hot-toast)
- [ ] **[TD-B03]** Auth layout.tsx zajednički
- [ ] **[TD-B05]** Error Boundary komponenta
- [ ] **[TD-A02]** Zod validacija na API sloju
- [ ] **[TD-E03]** Staging okruženje (Vercel Preview + dev Supabase)
- [ ] **[TD-E04]** Automatske migracije u CI/CD
- [ ] Onboarding flow za novog korisnika
- [ ] Email notifikacija kada klijent otvori/prihvati/odbije ponudu
- [ ] PDF fakture sa pravim poslovnim podacima (firma, PIB, žiro račun)

### P3 — Posle 30 dana / Post-MVP

- [ ] **[C-01]** Kompletna migracija na Supabase Auth
- [ ] **[H-03]** Refresh token sistem
- [ ] **[TD-C03]** `invoice_items` tabela (kopiranje stavki pri konverziji)
- [ ] **[TD-A02]** React Hook Form + Zod na svim formama
- [ ] **[TD-B02]** Razbiti velike komponente
- [ ] Timovi / multi-user accounts (organizacioni model)
- [ ] Mobile app paritet sa web-om
- [ ] Recurring quote templates
- [ ] Payment link integracija (Mollie, Stripe)
- [ ] SEO: sitemap.xml, OG image, schema.org
- [ ] Analytics (Plausible, PostHog)
- [ ] A/B testiranje landing CTA-ova

---

## E) Ako bih bio CTO sledećih 30 dana

### Nedelja 1 — Sigurnost i stability (ne dirati features)

**Dan 1–2:**
- Middleware API zaštita (30 min)
- Security headeri (20 min)
- Status check u convert (30 min)
- Osnovna price/quantity/discount validacija (2h)

**Dan 3–4:**
- DB indeksi — migracija (1h)
- FK constraints + CASCADE — migracija (1h)
- UNIQUE constraint na numeraciji (1h)
- Rate limiting na login sa Upstash (2h)

**Dan 5:**
- Sentry setup (1h)
- `/api/health` (15 min)
- JWT expiry na 7 dana (15 min)
- Email validacija (30 min)
- Deploy i testiranje

### Nedelja 2 — Performans i DX

- `/api/dashboard/stats` endpoint — home page refactor
- Paginacija na list endpointima
- Public quote — cleanup selektovanih polja
- Auth layout.tsx
- Error Boundary
- Toast notifikacije
- Sentry bugove popraviti na osnovu prve nedelje

### Nedelja 3 — Product gap-ovi

- Email notifikacija (quote opened, signed, rejected) — Resend ili Nodemailer
- Onboarding checklist za novog korisnika
- `/api/dashboard/stats` sa pending reminders
- PDF fakture sa poslovnim podacima (firma, PIB, adresa, žiro račun)
- Popraviti client search u quote wizard (company_name)

### Nedelja 4 — Foundation za rast

- Signature u Supabase Storage
- Staging environment
- Automatske migracije u CI
- OG image za landing
- Sitemap.xml
- Plan za RLS migraciju (ne implementacija, samo plan)

### Rezultat posle 30 dana

- Aplikacija je production-safe
- Podaci korisnika su zaštićeni
- Dashboard je brz i skalabilan
- Novi korisnik zna šta da uradi
- Email komunikacija radi
- Tim može raditi bez straha od crasheva
- Osnova za rast je postavljena
