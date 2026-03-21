# 🍷 Vinkällaren – Lanseringsguide

Följ dessa steg i ordning. Räkna med 30–45 minuter första gången.

---

## Översikt

```
Din dator / Railway
    └── server.js          ← Node.js backend
         ├── /analyze      ← Proxy mot Anthropic API (vinanalys)
         ├── /create-checkout  ← Skapar Stripe-betalning
         ├── /verify-session   ← Bekräftar betalning & skapar session
         ├── /me           ← Kollar om användaren är premium
         ├── /webhook      ← Tar emot händelser från Stripe
         └── /public/*     ← Serverar HTML-filerna
              ├── index.html       ← Appen
              ├── landningssida.html
              └── success.html
```

---

## Steg 1 – Hämta din Anthropic API-nyckel

1. Gå till [console.anthropic.com](https://console.anthropic.com)
2. Skapa ett konto eller logga in
3. Gå till **Settings → API Keys → Create Key**
4. Kopiera nyckeln (börjar med `sk-ant-...`) — du ser den bara en gång!

---

## Steg 2 – Sätt upp Stripe

### 2a. Skapa konto
1. Gå till [stripe.com](https://stripe.com) och registrera dig
2. Fyll i företagsinformation (krävs för riktiga betalningar)

### 2b. Skapa produkter
Gå till **Produktkatalog → Lägg till produkt** och skapa tre produkter:

| Namn          | Pris      | Fakturering         |
|---------------|-----------|---------------------|
| Månadsvis     | 49 SEK    | Återkommande/månad  |
| Årsvis        | 348 SEK   | Återkommande/år     |
| Livstid       | 599 SEK   | Engångsbetalning    |

Kopiera **Price ID** för varje produkt (ser ut som `price_1ABC...`).

### 2c. Hämta hemlig nyckel
Gå till **Utvecklare → API-nycklar** och kopiera den hemliga nyckeln (`sk_live_...`).

---

## Steg 3 – Köra lokalt (testa innan du lanserar)

```bash
# 1. Installera beroenden
npm install

# 2. Skapa din .env-fil
cp .env.example .env

# 3. Öppna .env och fyll i dina nycklar

# 4. Starta servern
npm start
```

Öppna sedan [http://localhost:3000](http://localhost:3000).

### Testa Stripe lokalt med Stripe CLI

```bash
# Installera Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/webhook
```

Kopiera `webhook signing secret` och lägg in i `.env` som `STRIPE_WEBHOOK_SECRET`.

**Testkort:** `4242 4242 4242 4242` | valfritt datum & CVC

---

## Steg 4 – Deploya på Railway

Railway är gratis att börja med och hanterar HTTPS automatiskt.

### 4a. Skapa Railway-konto
1. Gå till [railway.app](https://railway.app) och logga in med GitHub
2. Klicka **New Project → Deploy from GitHub repo**
3. Välj eller ladda upp ditt projekt

### 4b. Lägg till miljövariabler i Railway
I ditt Railway-projekt → **Variables** → lägg till dessa:

```
ANTHROPIC_API_KEY    = sk-ant-...
STRIPE_SECRET_KEY    = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
PRICE_MONTHLY        = price_...
PRICE_YEARLY         = price_...
PRICE_LIFETIME       = price_...
BASE_URL             = https://din-app.railway.app
```

`BASE_URL` hittar du under **Settings → Domains** i Railway.

### 4c. Konfigurera Stripe Webhook i produktion
1. Gå till **Stripe Dashboard → Utvecklare → Webhooks → Lägg till endpoint**
2. URL: `https://din-app.railway.app/webhook`
3. Händelser att lyssna på:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Kopiera **Signing secret** → lägg in som `STRIPE_WEBHOOK_SECRET` i Railway

---

## Steg 5 – Kontrollista inför lansering

- [ ] Anthropic API-nyckel tillagd
- [ ] Stripe-konto verifierat (för riktiga betalningar)
- [ ] Tre produkter skapade i Stripe med rätt Price IDs
- [ ] Alla miljövariabler tillagda i Railway
- [ ] Webhook skapad i Stripe och pekar på din Railway-URL
- [ ] Testat en riktig betalning med testkort
- [ ] `BASE_URL` satt till din Railway-domän

---

## Databas

SQLite-databasen `vinkallaren.db` skapas automatiskt när servern startar.
Den innehåller två tabeller:
- **users** — e-post, Stripe-kund-ID, premium-status
- **sessions** — inloggningssessioner (HTTP-cookie)

På Railway lagras databasen på disk. Lägg till en **Volume** i Railway för att databasen ska överleva omstarter:
Railway-projekt → **Add Volume** → montera på `/app`

---

## Vanliga problem

| Problem | Lösning |
|---------|---------|
| `ANTHROPIC_API_KEY saknas` | Lägg till nyckeln i `.env` eller Railway Variables |
| `Stripe checkout misslyckas` | Kontrollera att Price IDs stämmer |
| `Webhook verifiering misslyckas` | Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt |
| `Databasen försvinner vid omstart` | Lägg till Railway Volume |
| `better-sqlite3 kompilerar inte` | Kör `npm rebuild` eller `npm install --build-from-source` |

---

## Support

Något som inte fungerar? Kontrollera Railway-loggar under **Deployments → Logs**.
