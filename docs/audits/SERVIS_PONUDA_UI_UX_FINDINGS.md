# Servis Ponuda — UI / UX Findings

**Datum:** 2026-06-20

---

## 1. Core User Journey Audit

### Definicija uspešnog flow-a

Majstor u polju: telefon u džepu, poziva ga klijent, pita za cenu. Za 5 minuta treba da pošalje ponudu.

### Trenutni flow: Kreiranje i slanje prve ponude (cold start)

| Korak | Ekran | Problemi |
|-------|-------|----------|
| 1 | Registracija (6 polja) | Dug za cold start, PIB je opcionalan ali vizuelno isti |
| 2 | Login | OK |
| 3 | Dashboard (prazan) | Nema vodiča šta sledeće |
| 4 | Clients → New | Fizičko/Firma izbor, 5-10 polja |
| 5 | Quotes → New → Step 1 | Search klijenata — OK |
| 6 | Step 2: Stavke | Ako nema cenovnika — prazan, konfuzan |
| 7 | Step 3: Pregled | Dobro ali pretrpano billing sekcijom |
| 8 | Kreiranje | OK |
| 9 | Quote detail → Send | Extra klik |
| 10 | Copy link | Extra akcija |

**Ukupno:** 10 koraka, 3 zasebna ekrana, minimalno 15 tapova.  
**Benchmark:** Dobra SaaS tool za majstore treba max 6 koraka do poslate ponude.

### Najveća UX kočnica

**Klijent mora da postoji pre ponude.** To je najveći friction point. Mnogi majstori ne razmišljaju unapred — oni žele da naprave ponudu i onda dodate ko je primio. Ili da direktno unesu "Petar, tel: 065..." bez formalnog client profila.

**Preporuka:** Dozvoli "Quick client" u quote wizard-u — samo ime i telefon, bez kompletnog profila. Profil se može popuniti posle.

---

## 2. Onboarding

### Trenutno stanje

Nema onboardinga. Novi korisnik vidi:

```
Dobrodošli [Firma]
[Datum]

[ 0 Klijenata ]  [ 0 Ponuda ovaj mesec ]
[ 0 Neplaćenih ] [ 0 RSD čeka naplatu  ]

[ Još nema ponuda ]
[ Napravi prvu ponudu ]
```

To je OK jedino ako korisnik zna šta treba da uradi sledeće.

### Preporučeni onboarding

**Opcija A — Checklist na dashboardu (lako za implementaciju):**
```
✅ Kreiran nalog
□  Dodaj prvu stavku u cenovnik → [Cenovnik]
□  Dodaj prvog klijenta → [Novi klijent]
□  Napravi prvu ponudu → [Nova ponuda]
□  Pošalji ponudu klijentu
```
Sakrij po završetku svih stavki.

**Opcija B — Product tour (react-joyride):**
Vođeni tour kroz 5 ekrana pri prvoj prijavi.

**Preporuka:** Opcija A je MVP pristup — 2-3 sata posla, veliki impact.

---

## 3. Dashboard

### Problemi

#### 3.1 Stat kartice bez konteksta

```
[ 12 Klijenata ]  [ 3 Ponuda ovaj mesec ]
[ 2 Neplaćenih  ] [ 85.000 RSD čeka    ]
```

Brojevi su tu ali ne prikazuju trend. Je li 3 ponude dobro ili loše? Da li 85.000 RSD čeka dugo?

**Fix:** Dodaj mali delta `↑2 vs prošli mesec` ili `Prosek: 4-5 dana`.

#### 3.2 "Poslednje ponude" lista je pasivna

Prikazuje status ali ne sugeriše šta da se uradi. Ponuda sa statusom `poslata` koja čeka 10 dana treba CTA: **"Podseti klijenta"**.

#### 3.3 Nema shortcut za najčešće akcije

Na mobilnom dashboardu nema:
- FAB (floating action button) za "+ Nova ponuda"
- Quick link za "Pregled neplaćenih faktura"

---

## 4. Quote Creation Wizard

### Što radi dobro

- 3-step wizard sa progress indikatorom — odlično
- Step 2 grupisan po kategorijama (rad/materijal/ostalo) — logično
- Real-time preview totala — korisno
- Profit breakdown — differencirajuće, majstor vidi zaradu

### Problemi

#### 4.1 Step 1 — Klijent search

- Pretraga ne pretražuje po `company_name` (bug u filteredClients)
- Nema mogućnosti "novi klijent iz ove forme"
- Lista klijenata bez vizuelne distinkcije Firma vs Fizičko (samo text)

#### 4.2 Step 2 — Prazna lista

Ako cenovnik nije popunjen, korisnik vidi samo "Nema stavki u cenovniku" sa linkom na /price-items. To prekida flow.  
**Fix:** Ponudi 3-4 predefinisane stavke pri prvom pokretanju ("Dolazak i pregled: 1.500 RSD", "Sat rada: 2.500 RSD", itd.)

#### 4.3 Step 3 — Pretrpano billing sekcijom

Posle dodavanja billing preferences iz prethodne sesije, Step 3 ima:
- Profit breakdown
- Popust
- Napomena
- Prikaz cene
- Rok plaćanja
- Napomena za plaćanje
- Billing note

To je previše za jedan ekran.  
**Fix:** Sekcija "Plaćanje i prikaz cene" da bude collapsible `<details>` ili odvojeni "Napredni podešavanja" deo. Default je collapsed.

---

## 5. Quote Detail (Dashboard)

### Što radi dobro

- Status badge prominentan
- CTA dugmad u skladu sa statusom (Izmeni/Pošalji/Kreiraj fakturu)
- Tracking link jasno prikazan posle slanja
- Signature prikaz u zelenom bloku

### Problemi

- PDF dugme je ispod svega — na mobilnom treba scroll da se dođe do njega
- Nema history/timeline šta se dešavalo (sent at X, opened at Y, signed at Z)
- Nema "Duplicate ponude" action
- Nema "Pošalji podsetnik" za poslate ponude

---

## 6. Javni Quote Portal (Client View)

### Što radi dobro

- Čist, minimalistički dizajn
- Kompanija/logo na vrhu
- Lista stavki sa totalima
- Potpis canvas — funkcionalan
- Jasni Accept/Reject buttoni

### Problemi

- Logo kompanije se ne prikazuje (nema `company.logo_url` integracije)
- Nema datum isteka ponude prominentno (`valid_until`)
- Nema "Kontaktirajte nas" link/telefon ako klijent ima pitanja
- Potpis NIJE obavezan za prihvatanje — treba biti
- Na malom ekranu, canvas za potpis je mali i teško se potpisuje

---

## 7. Client Detail

### Što radi dobro

- Podela na sekcije (Poslovni podaci / Kontakt / Naplata) — jasno
- CRM aktivnosti su dobra differencirajuća feature
- "+ Nova ponuda za ovog klijenta" link — odlično

### Problemi

- Nema listu ponuda i faktura ovog klijenta na client detail stranici
- Nema ukupan prihod od klijenta
- Edit forma je ista stranica kao view — nema UX razdvajanja
- Nema "Delete klijenta" opcije

---

## 8. Invoice Detail

### Problemi

- Faktura prikazuje klijenta ali ne i stavke — samo total
- Nema due date prominentno
- Nema mogućnosti slanja fakture klijentu (email, WhatsApp link)
- "Označi kao plaćeno" jedina akcija — previše jednostavno

---

## 9. UI Konzistentnost

### Nekonzistentne boje

```css
/* Koriste se naizmenično: */
bg-[#1e3a8a]   /* navy — sidebar, buttons */
bg-[#2563EB]   /* bright blue — auth buttons */
bg-blue-700    /* tailwind blue-700 ≈ #1d4ed8 */
bg-blue-800    /* tailwind blue-800 ≈ #1e40af */
```

Sve treba biti jedan brand token: `bg-brand`.

### Nekonzistentni button stilovi

```jsx
/* Primarne akcije — 4 različite varijante: */
"py-3 rounded-xl font-semibold"          /* dashboard */
"py-3.5 rounded-xl font-semibold"        /* quote wizard */
"py-3 font-semibold text-sm"             /* auth */
"py-2 rounded-lg text-sm font-medium"    /* sidebar items */
```

### Nekonzistentni input stilovi

```jsx
/* clients/new: */
"border border-gray-300 rounded-xl px-4 py-3 text-base"
/* clients/[id] edit: */
"border border-gray-300 rounded-lg px-3 py-2.5 text-base"
```

### Preporuka

Definisati u `globals.css`:
```css
@layer components {
  .btn-primary { @apply w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold text-sm; }
  .btn-secondary { @apply w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold text-sm; }
  .input-field { @apply w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]; }
  .card { @apply bg-white rounded-xl border border-gray-100; }
}
```

---

## 10. Preporučeni UX quick wins

| Win | Impact | Effort |
|-----|--------|--------|
| Onboarding checklist na dashboardu | Visok — smanjuje churn | 3h |
| "Quick client" u quote wizard-u | Visok — skraćuje flow | 4h |
| Collapsible billing sekcija u Step 3 | Srednji — čišći UX | 1h |
| Toast notifikacije | Srednji — better feedback | 2h |
| Ponude/fakture klijenta na client detail | Srednji — context | 3h |
| Potpis obavezan pre prihvatanja | Nizak → Visok pravno | 1h |
| Predefinisane starter stavke u cenovniku | Srednji — skraćuje cold start | 2h |
| Quote history/timeline (sent/opened/signed) | Srednji — insight za korisnika | 4h |
| FAB na mobilnom dashboardu za novu ponudu | Srednji — brži pristup | 1h |
| Slanje fakture klijentu (link) | Visok — critical feature | 4h |
