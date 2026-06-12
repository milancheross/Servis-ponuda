# Servis Ponuda

Mobilna aplikacija za kreiranje ponuda i faktura za servisere i zanatlije (vodoinstalateri, električari, klima serviseri).

## Struktura projekta

```
├── backend/          Node.js + Express REST API
└── mobile/           Expo React Native aplikacija (iOS + Android)
```

## Backend

### Tech stack
- Node.js + Express
- Supabase (PostgreSQL + Auth)
- JWT autentifikacija
- Expo Push Notifications (server SDK)

### Setup

```bash
cd backend
cp .env.example .env   # popuni kredencijale
npm install
npm run dev            # http://localhost:3000
```

### Env varijable

| Varijabla | Opis |
|---|---|
| `SUPABASE_URL` | URL tvog Supabase projekta |
| `SUPABASE_SERVICE_KEY` | Service role key (zaobilazi RLS) |
| `JWT_SECRET` | Tajni ključ za potpisivanje JWT tokena (min 32 znaka) |
| `APP_URL` | Javna URL aplikacije (npr. `https://servisponuda.com`) |
| `PORT` | Port (default: 3000) |

### Baza podataka

Pokreni `backend/src/db/schema.sql` u Supabase SQL editoru da kreiraš sve tabele, indekse i RLS politike.

### API endpointi

| Metoda | Putanja | Opis |
|---|---|---|
| POST | `/auth/register` | Registracija |
| POST | `/auth/login` | Prijava, vraća JWT |
| GET/PUT | `/auth/profile` | Profil firme |
| GET/POST | `/clients` | Lista / kreiranje klijenata |
| PUT/DELETE | `/clients/:id` | Izmena / brisanje klijenta |
| GET/POST | `/price-items` | Cenovnik |
| PUT/DELETE | `/price-items/:id` | Izmena / brisanje stavke |
| GET/POST | `/quotes` | Lista / kreiranje ponuda |
| GET/PUT | `/quotes/:id` | Detalj / izmena ponude |
| POST | `/quotes/:id/send` | Slanje ponude (generiše tracking token) |
| POST | `/quotes/:id/convert-to-invoice` | Konverzija u fakturu |
| GET | `/q/:token` | **Javni** tracking endpoint (bez auth) |
| GET | `/invoices` | Lista faktura |
| GET | `/invoices/:id` | Detalj fakture |
| PUT | `/invoices/:id/mark-paid` | Označi kao plaćeno |

### Deploy (Railway)

```bash
# Poveži Railway sa GitHub repom, postavi env varijable u dashboardu
railway up
```

---

## Mobile (Expo)

### Tech stack
- Expo SDK 51 + expo-router
- TypeScript
- expo-print + expo-sharing za PDF
- expo-notifications za push obaveštenja

### Setup

```bash
cd mobile
npm install
npm start   # skenira QR kod u Expo Go
```

Postavi `EXPO_PUBLIC_API_URL` u `.env` fajlu u `mobile/` folderu:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   # tvoja lokalna IP za razvoj
```

### Ekrani

| Ekran | Putanja |
|---|---|
| Login / Registracija | `/(auth)/login`, `/(auth)/register` |
| Dashboard | `/(tabs)/` |
| Klijenti | `/(tabs)/clients` |
| Cenovnik | `/(tabs)/price-items` |
| Ponude | `/(tabs)/quotes` |
| Fakture | `/(tabs)/invoices` |
| Nova ponuda | `/quote/new` |
| Detalj ponude | `/quote/[id]` |
| Detalj klijenta | `/client/[id]` |
| Novi klijent | `/client/new` |
| Detalj fakture | `/invoice/[id]` |

---

## Redosled razvoja (MVP)

- [x] Nedelja 1–2: Supabase setup, Auth, Onboarding
- [x] Nedelja 3–4: Klijenti + Cenovnik CRUD
- [x] Nedelja 5–6: Kreiranje ponude + stavke
- [x] Nedelja 7: PDF generisanje + Share
- [x] Nedelja 8: Tracking sistem + Push notifikacije
- [x] Nedelja 9: Konverzija u fakturu
- [ ] Nedelja 10: QA, bugfix, testiranje

## Post-MVP

- Stripe pretplata
- Podsetnik 48h
- Statistike i dashboard
- SEF integracija
- Više korisnika po firmi
