# Pio-Cart

Pio-Cart è una piattaforma di e-commerce composta da due parti:
- un backend REST in **Java 17** e **Spring Boot 3** che gestisce prodotti, categorie, immagini, carrelli, ordini e utenti;
- uno storefront in **Next.js 16** (cartella `frontend/`), descritto in `frontend/README.md`.

## 🚀 Obiettivi del Progetto

- Catalogo con ricerca, filtri per categoria e marca, ordinamento e paginazione.
- Registrazione e login con JWT, con ruoli `USER` e `ADMIN`.
- Un carrello per ogni utente.
- Pagamento con **Stripe Checkout** in modalità test e storico degli ordini.
- Area di amministrazione per catalogo e ordini.

## 🛠 Stack Tecnologico

- **Backend**: Java 17, Spring Boot 3.3.2
  - *Spring Web* (REST API)
  - *Spring Data JPA* (accesso ai dati)
  - *Spring Validation* (validazione degli input)
  - *Spring Security* con JWT (jjwt) e password cifrate con BCrypt
  - *Stripe Java* per i pagamenti
  - *springdoc-openapi* per Swagger UI
- **Database**: PostgreSQL 15, avviato con Docker
- **Librerie di supporto**:
  - **Lombok**: riduce il codice boilerplate (getter, setter, costruttori).
  - **ModelMapper**: converte le entità in DTO.
- **Test**: test di integrazione con MockMvc e **Testcontainers**
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4 e shadcn/ui
- **Deploy**: Docker Compose e Tailscale Funnel per il backend, Vercel per il frontend, GitHub Actions per la CI/CD

## 🗂 Struttura del Dominio e Entità Principali

- **Product & Category**: gestione dell'inventario. Ogni prodotto appartiene a una categoria, che viene creata automaticamente se non esiste. `GET /products` è la ricerca paginata, con i parametri `category`, `brand`, `q`, `page`, `size` e `sort`. Non si possono eliminare un prodotto già ordinato né una categoria che contiene prodotti.
- **Image**: le immagini dei prodotti sono salvate nel database (massimo 5 MB, solo `image/*`, niente SVG) e si scaricano da un apposito endpoint.
- **Cart & CartItem**: ogni utente ha il proprio carrello (`/carts/me`, `/cartItems/me/...`), ricavato dal token. Può aggiungere prodotti, cambiarne la quantità ed eliminarli.
- **Order & OrderItem**: l'ordine conserva una "fotografia" del prezzo e degli articoli al momento dell'acquisto. Il pagamento passa da **Stripe Checkout**:
  - `POST /orders/checkout` crea l'ordine `PENDING` e la pagina di pagamento;
  - `POST /orders/confirm?sessionId=...` verifica con Stripe che sia stato pagato l'importo giusto, scala le giacenze, svuota il carrello e porta l'ordine in `PROCESSING`;
  - `GET /orders/me` restituisce lo storico dei soli ordini pagati, senza i checkout abbandonati;
  - gli amministratori vedono tutti gli ordini pagati con `GET /orders?status=` e li fanno avanzare con `PUT /orders/{id}/status?status=`: `PROCESSING` → `SHIPPED` → `DELIVERED`. Annullare un ordine non ancora spedito rimborsa il pagamento e rimette gli articoli in magazzino.
- **User**: registrazione e login con `/auth/register` e `/auth/login`, profilo letto con `GET /auth/me` e modificato con `PUT /users/me`. La registrazione crea sempre utenti `USER`; il primo `ADMIN` si crea con `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

## 🔐 Autenticazione

`POST /auth/login` restituisce un JWT, da inviare nell'header `Authorization: Bearer <token>`.
- **Senza token**: le letture del catalogo (prodotti, categorie, immagini), la registrazione, il login e Swagger.
- **Ruolo `ADMIN`**: le modifiche al catalogo, la gestione degli utenti e quella degli ordini.
- **Qualsiasi utente autenticato**: tutto il resto.

Senza token si riceve `401`, con il ruolo sbagliato `403`.

## ⚙️ Setup ed Esecuzione Locale

Servono **Java 17** e **Docker**. Maven non serve, perché il progetto include il wrapper `./mvnw`. Per il frontend serve anche **Node.js 20** o superiore.

### 1. Inizializzare il Database
Dalla root del progetto avvia Postgres con il `docker-compose.yml` fornito:
```bash
docker compose up -d
```
- Il database `piocart_db` è esposto su `localhost:5432`, con utente e password di sviluppo `postgres`/`postgres`.
- Senza il profilo `app` parte solo Postgres.

### 2. Avvio dell'Applicazione
```bash
./mvnw spring-boot:run                                  # porta 9191
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev   # con dati di prova
```
Il profilo `dev` riempie un database vuoto con categorie e prodotti di esempio e crea due account:
- `admin@piocart.dev` / `admin1234`, con ruolo `ADMIN`;
- `user@piocart.dev` / `user1234`, con ruolo `USER`.

Per il catalogo completo, con 45 prodotti e le foto, usa invece `SEED_CATALOG=true` (vedi [Deploy](#backend-sul-server)).

*Nota: alla prima esecuzione **Hibernate** crea o aggiorna da solo le tabelle a partire dalle entità Java, grazie a `ddl-auto=update`.*

### 3. Pagamenti con Stripe (modalità test)
- Copia `.env.example` in `.env` (escluso da git) e inserisci la tua chiave `sk_test_...`, presa da https://dashboard.stripe.com/test/apikeys.
- All'avvio Spring Boot importa il file; una variabile d'ambiente `STRIPE_API_KEY` ha comunque la precedenza.
- Senza chiave il resto dell'app funziona, ma il checkout risponde `502`.
- Per pagare in test usa la carta `4242 4242 4242 4242`, con una data di scadenza futura e un CVC qualsiasi.
- Dopo il pagamento Stripe rimanda a `FRONTEND_URL/checkout/confirm`.

### 4. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3000
```

### 5. Test
```bash
./mvnw test
```
I test avviano un Postgres temporaneo con Testcontainers, quindi richiedono Docker ma non il database di `docker compose`. Stripe è sostituito da un mock.

## 🔗 Utilizzo delle API
Tutte le chiamate REST sono sotto il prefisso `api.prefix` definito nel file di properties, quindi l'URL base è:
`http://localhost:9191/api/v1/...`

- Ogni risposta ha la forma `{ "message": ..., "data": ... }`, anche in caso di errore.
- Fa eccezione il download delle immagini, che restituisce i byte del file.
- La documentazione interattiva è su Swagger UI, `http://localhost:9191/swagger-ui.html`.

## 🚢 Deploy

Il backend gira con Docker su un server Ubuntu ed è pubblicato in HTTPS con **Tailscale Funnel**, senza dominio e senza aprire porte sul router. Lo storefront (`frontend/`) è su **Vercel** e chiama il backend solo lato server.

### Backend sul server

1. Installa Docker e clona il repository.
2. Copia `.env.example` in `.env` e compila le variabili della sezione server:
   - `JWT_SECRET`, generato con `openssl rand -base64 48`;
   - `DB_PASSWORD`;
   - `STRIPE_API_KEY`;
   - `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS`, entrambe con l'URL `https://<progetto>.vercel.app`;
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`, per creare il primo amministratore;
   - `SEED_CATALOG=true`, se vuoi un catalogo di prova: 45 prodotti in 6 categorie, definiti in `src/main/resources/seed/catalog.json`, con le foto scaricate da Unsplash all'avvio. I prodotti già presenti (stesso nome e marca) vengono saltati, quindi la variabile può restare attiva. Se una foto non si scarica, il prodotto resta senza immagine.
3. Avvia Postgres e l'app:
   ```bash
   docker compose --profile app up -d --build
   ```
   - Il profilo `dev` non va usato in produzione, perché crea account con password note. Per popolare il catalogo usa `SEED_CATALOG`.
   - Le porte sono legate a `127.0.0.1`. Se `5432` o `9191` sono già occupate, cambiale con `DB_PORT` e `APP_PORT`.
   - L'immagine viene compilata senza test, quindi esegui `./mvnw test` prima del deploy.
4. Pubblica il backend con Tailscale Funnel:
   - nella console di Tailscale abilita **MagicDNS**, i **certificati HTTPS** e l'attributo `funnel` nella policy;
   - poi esegui:
     ```bash
     sudo tailscale funnel --bg 9191
     tailscale funnel status
     ```
   - il backend risponde su `https://<macchina>.<tailnet>.ts.net/api/v1/...`.
5. Per aggiornare a mano esegui `git pull` e poi di nuovo `docker compose --profile app up -d --build`. I dati restano nel volume `postgres_data`.

### CI/CD

`.github/workflows/ci.yml` gira su ogni pull request e su ogni push su `main`:
- **Backend:** `./mvnw test` (Testcontainers) e build dell'immagine Docker.
- **Frontend:** `npm run lint` e `npm run typecheck`.
- **Deploy del backend** (solo su `main`, a test passati):
  - entra nella tailnet con un client OAuth di Tailscale, con tag `tag:ci`;
  - via SSH su `gpr-server` esegue `git pull` e `docker compose --profile app up --build -d --wait` in `~/Applications/PioCart`;
  - se la build fallisce o l'app non diventa healthy, torna al commit precedente.
- **Deploy del frontend:** dopo il backend, `vercel deploy --prod`. I deploy automatici di Vercel da Git sono disattivati in `frontend/vercel.json`, così si pubblica solo codice testato.

Secret del repository da configurare su GitHub (Settings → Secrets and variables → Actions). Finché mancano, i job di deploy falliscono al passo "Connect to Tailscale", mentre test e build passano comunque:

| Secret | Valore |
|---|---|
| `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_CLIENT_SECRET` | Client OAuth di Tailscale con scope `auth_keys` e tag `tag:ci` (gli stessi di GprFlow) |
| `DEPLOY_SSH_KEY` | Chiave privata autorizzata per `gpr-server@gpr-server` |
| `VERCEL_TOKEN` | Token da https://vercel.com/account/tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Id del team e del progetto, nel file `.vercel/project.json` creato da `npx vercel link` oppure nelle impostazioni del progetto |

### Frontend su Vercel

Vedi `frontend/README.md`.
