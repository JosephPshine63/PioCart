# Pio-Cart (Dream Shops)

Pio-Cart è il backend per una piattaforma di e-commerce moderna sviluppata interamente in **Java 17** e **Spring Boot 3**. Il progetto fornisce un set completo di API RESTful per gestire tutti gli aspetti fondamentali di un negozio online, come i prodotti, le categorie, un carrello degli acquisti, gli ordini e gli utenti.

## 🚀 Obiettivi del Progetto

Il progetto "Pio-Cart" funge da core engine per l'applicazione, offrendo:
- Strutturazione del dominio E-commerce (Prodotti, Categorie, Utenti, ecc.).
- Gestione di un Carrello dinamico per utente.
- Finalizzazione di un Ordine e gestione dello storico (Order / OrderItems).
- Persistenza dei dati in un database relazionale tramite **Spring Data JPA**.

## 🛠 Stack Tecnologico

- **Linguaggio**: Java 17
- **Framework**: Spring Boot 3.3.2
  - *Spring Web* (REST API)
  - *Spring Data JPA* (Gestione Data Access)
  - *Spring Validation* (Validazione degli input)
- **Database**: PostgreSQL (gestito tramite Docker per lo sviluppo locale)
- **Librerie di Supporto**:
  - **Lombok**: riduzione del codice boilerplate (getter/setter/costruttori).
  - **ModelMapper**: per una facile e pulita conversione automatica tra classi Entity e Data Transfer Object (DTO).
- **Ambiente & Deploy**: Docker & Docker Compose (per il database e i servizi correlati).

## 🗂 Struttura del Dominio e Entità Principali

Il progetto gestisce diverse entità cruciali per lo shop:
- **Product & Category**: Gestione dell'inventario. Ogni prodotto appartiene ad una determinata categoria.
- **Image**: Sistema per la gestione e l'upload delle immagini dei prodotti, le cui informazioni sono salvate a database e recuperabili tramite apposito endpoint.
- **Cart & CartItem**: Carrello della spesa interattivo. L'utente può aggiungere prodotti (CartItem), aggiornarne la quantita ed eliminarli.
- **Order & OrderItem**: Elaborazione del checkout. Permette di tracciare lo stato dell'ordine e di mantenere una "fotografia" del prezzo e dell'articolo al momento in cui l'utente ha completato l'acquisto. Il pagamento passa da **Stripe Checkout**: `POST /orders/checkout` crea l'ordine `PENDING` e la pagina di pagamento, `POST /orders/confirm?sessionId=...` verifica con Stripe che sia stato pagato l'importo giusto, scala le giacenze, svuota il carrello e porta l'ordine in `PROCESSING`. `GET /orders/me` restituisce lo storico dei soli ordini pagati, senza i checkout abbandonati. Gli amministratori vedono tutti gli ordini pagati con `GET /orders?status=` e li fanno avanzare con `PUT /orders/{id}/status?status=` (`PROCESSING` → `SHIPPED` → `DELIVERED`; annullare un ordine non ancora spedito rimborsa il pagamento e rimette gli articoli in magazzino).
- **User**: Gestione dell'anagrafica degli utenti della piattaforma. Interagisce direttamente con il Carrello di sua proprietà.

## ⚙️ Setup ed Esecuzione Locale

Per testare il progetto sul tuo computer, assicurati di avere installati **Java 17**, **Maven**, e **Docker Desktop** (o un demone Docker locale funzionante).

### 1. Inizializzare il Database
L'applicazione è configurata per usare **PostgreSQL**. Nella root del progetto è fornito un file `docker-compose.yml` pronto all'uso. 
Esegui il seguente comando nel tuo terminale, all'interno della medesima cartella:
```bash
docker-compose up -d
```
Questo scaricherà l'immagine di Postgres e la avvierà esponendo la porta `5432`, e creerà automaticamente un database chiamato `piocart_db` con utente e password limitati allo sviluppo (`postgres`/`postgres`).

### 2. Avvio dell'Applicazione
L'applicazione andrà in ascolto di default sulla porta `9191` come definito da `application.properties`.

Puoi lanciare l'applicativo direttamente tramite Maven dalla root del progetto:
```bash
mvn spring-boot:run
```
In alternativa puoi utilizzare il tuo IDE preferito avviando la classe principale `PioCartApplication.java`, che è il punto di ingresso per Spring Boot.

### 3. Pagamenti con Stripe (modalità test)
Il checkout usa una chiave segreta Stripe di test. Copia `.env.example` in `.env` (escluso da git) e inserisci la tua chiave `sk_test_...`, presa da https://dashboard.stripe.com/test/apikeys. All'avvio Spring Boot importa il file; una variabile d'ambiente `STRIPE_API_KEY` ha comunque la precedenza. Senza chiave il resto dell'app funziona, ma il checkout risponde `502`.

Per pagare in test usa la carta `4242 4242 4242 4242`, con una data di scadenza futura e un CVC qualsiasi. Il ritorno da Stripe arriva su `FRONTEND_URL/checkout/confirm`.

*Nota: Alla prima esecuzione, **Hibernate** andrà a generare e/o aggiornare in automatico in base alle entità Java tutte le tabelle nel database relazionale grazie alle impostazioni `ddl-auto=update`.*

## 🔗 Utilizzo delle API
Tutte le chiamate REST sono sotto il raggruppamento specificato da `api.prefix` nel file di properties, e quindi avranno endpoint base corrispondente a:
`http://localhost:9191/api/v1/...`

## 🚢 Deploy

Il backend gira con Docker su un server Ubuntu ed è pubblicato in HTTPS con **Tailscale Funnel**, senza dominio e senza aprire porte sul router. Lo storefront (`frontend/`) è su **Vercel** e chiama il backend solo lato server.

### Backend sul server

1. Installa Docker e clona il repository.
2. Copia `.env.example` in `.env` e compila le variabili della sezione server:
   - `JWT_SECRET`, generato con `openssl rand -base64 48`;
   - `DB_PASSWORD`;
   - `STRIPE_API_KEY`;
   - `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS`, entrambe con l'URL `https://<progetto>.vercel.app`;
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`, per creare il primo amministratore.
3. Avvia Postgres e l'app:
   ```bash
   docker compose --profile app up -d --build
   ```
   - Il profilo `dev` non va usato in produzione, perché crea account con password note.
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

Secret del repository da configurare su GitHub (Settings → Secrets and variables → Actions):

| Secret | Valore |
|---|---|
| `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_CLIENT_SECRET` | Client OAuth di Tailscale con scope `auth_keys` e tag `tag:ci` (gli stessi di GprFlow) |
| `DEPLOY_SSH_KEY` | Chiave privata autorizzata per `gpr-server@gpr-server` |
| `VERCEL_TOKEN` | Token da https://vercel.com/account/tokens |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Id del team e del progetto, nel file `.vercel/project.json` creato da `npx vercel link` oppure nelle impostazioni del progetto |

### Frontend su Vercel

Vedi `frontend/README.md`.
