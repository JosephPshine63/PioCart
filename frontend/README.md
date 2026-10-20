# PioCart – Frontend

Storefront di PioCart scritto con Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 e shadcn/ui.

Il browser non chiama mai direttamente il backend Spring Boot: tutte le richieste passano dal server Next.js (Server Components, Server Actions e route handler), che le inoltra a `BACKEND_URL`. Il JWT viene salvato nel cookie `httpOnly` `piocart_token` e inviato al backend come header `Authorization: Bearer`.

## Requisiti

- Node.js 20 o superiore
- Backend PioCart in esecuzione (di default su `http://localhost:9191`)

## Avvio in locale

```bash
cp .env.example .env.local   # poi modifica i valori se serve
npm install
npm run dev                  # http://localhost:3000
```

Per avere dati di prova avvia il backend con il profilo `dev` dalla cartella principale del progetto:

```bash
docker-compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## Variabili d'ambiente

| Variabile | Descrizione |
|---|---|
| `BACKEND_URL` | URL del backend, usato solo lato server (es. `http://localhost:9191`) |
| `NEXT_PUBLIC_SITE_URL` | URL pubblico del sito, usato per i metadata |

## Comandi

```bash
npm run dev     # server di sviluppo
npm run build   # build di produzione (richiede il backend raggiungibile)
npm run start   # avvia la build di produzione
npm run lint    # ESLint
```

## Struttura

- `app/` – pagine, Server Actions (`app/actions`) e proxy delle immagini (`app/api/images/[id]`)
- `app/(auth)/login`, `app/(auth)/register` – accesso e registrazione con Server Actions (`app/actions/auth.ts`), validazione zod (`lib/auth-schema.ts`) e ritorno alla pagina di partenza con `returnTo`
- `app/products`, `app/categories/[name]` – catalogo con filtri, ordinamento e paginazione nei `searchParams`, pagina prodotto
- `components/` – header, footer, griglia e vista catalogo, galleria prodotto e componenti shadcn/ui (`components/ui`)
- `lib/api/` – client HTTP verso il backend, tipi dei DTO e funzioni del catalogo con cache
- `lib/catalog-params.ts` – lettura e costruzione degli URL del catalogo (filtri, ordinamento, pagina)
- `public/brand/`, `app/icon.png` – logo e icona dell'app
- `lib/auth.ts`, `lib/session.ts` – cookie del token, utente corrente e carrello
- `proxy.ts` – protegge `/account`, `/checkout` e `/admin` reindirizzando al login
