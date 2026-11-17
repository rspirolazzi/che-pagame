# ChePagame

> Para que la guita no sea un problema.

Group expense splitting for Web and Mobile. This repository has three sibling projects:

| Folder | Stack | What it is |
|---|---|---|
| `backend/` | Python 3.13, FastAPI, PyMongo (async) | REST API under `/api/v1`, the only issuer of JWTs |
| `web/` | Next.js 16, React 19, Auth.js v5, next-intl | Web app; works as a BFF, so backend tokens never reach the browser |
| `mobile/` | Expo SDK 56, React Native Paper, Expo Router | iOS and Android app (development build) |

Specs, plans and tasks live in `specs/` (Spec Kit). The project rules are in
`.specify/memory/constitution.md`.

## Prerequisites

- Docker Engine 24.0.x and Docker Compose v2.22.x, on a CPU with AVX (MongoDB 8.0).
- Node.js v22.13.0 (`.nvmrc`) and, to run the backend outside Docker, Python 3.13 with [uv](https://docs.astral.sh/uv/).
- For Mobile: Android Studio or Xcode. Google Sign-In does not work in Expo Go.

## Configuration

1. Copy `.env.example` to `.env` and fill in the values. Secrets only live in `.env`: never commit
   them or paste them anywhere.
2. Mobile reads its own `mobile/.env` (Expo only loads env files from the project folder). Copy
   the `EXPO_PUBLIC_*`, `GOOGLE_IOS_URL_SCHEME` and `EXPO_NO_TELEMETRY` variables there.
3. With `EMAIL_DELIVERY=console` (development only) emails are not sent: they are appended to
   `backend/.dev-outbox/emails.jsonl`, where you can read the codes. They never go to the logs.

## Run

```bash
docker compose up -d --build
```

- API: http://localhost:8000/api/v1 (OpenAPI at `/api/v1/openapi.json`, docs at `/api/v1/docs`)
- Web: http://localhost:3000
- Mobile: `cd mobile && npx expo run:android` (or `run:ios`). Needs JDK 17 and the Android SDK
  (`ANDROID_HOME`). Inside the emulator `localhost` is the emulator itself: set
  `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api/v1` in `mobile/.env`, or keep `localhost` and
  run `adb reverse tcp:8000 tcp:8000` after starting the emulator.

## Accounts and invitations (feature 002)

- Web: "My Accounts" at `/accounts`, a new account at `/accounts/new`, invitations at
  `/invite/<code>` (signing in or up from there comes back to the invitation) and `/join` to paste a
  code.
- Mobile: the same screens under "Mis Cuentas"; invitations open with the deep link
  `chepagame://invite/<code>` or by pasting the code in "Join with a code". Shared links use
  `EXPO_PUBLIC_WEB_BASE_URL`.

## Expenses (feature 003)

- Web: opening an account (`/accounts/<id>`) shows its expenses: the total on top and the list
  grouped by day, 50 at a time, with a "Refresh" button. The account settings from feature 002
  (data, participants, invitation, close, delete) moved to `/accounts/<id>/settings`. Expenses live
  at `/accounts/<id>/expenses/new`, `/accounts/<id>/expenses/<expenseId>` (detail with each share
  and the change history) and `/accounts/<id>/expenses/<expenseId>/edit`.
- Mobile: the same screens under each account; pull down to refresh. The date picker uses
  `@react-native-community/datetimepicker`, a native module: rebuild the development build after
  pulling this feature (`npx expo run:android` or `npx expo run:ios`).
- Amounts are exact: integer minor units in MongoDB and decimal text (`"100.50"`) in the API.

## Balances and settlements (feature 004)

- Each account has two tabs: "Gastos" (`/accounts/<id>`) and "Saldos"
  (`/accounts/<id>/balances`). The balances tab shows each participant's balance, the suggested
  settlements with "Mark as paid" (a fixed confirmation dialog) and the settlements list, 50 at a
  time. Manual settlements live at `/accounts/<id>/settlements/new`. Mobile has the same screens.
- API: `GET /api/v1/accounts/{id}/balances` (balances, suggestions and the pending expenses
  count), and `GET`, `POST` and `DELETE /api/v1/accounts/{id}/settlements`. `GET /accounts` adds
  `myBalance` and `currencyDecimals` to each account; the dashboard adds "You are owed" and "You
  owe" per currency, closed accounts included.
- Balances are computed on every read (`backend/app/services/balance_math.py`) and always add up
  to zero. Pending expenses and settlements of a removed participant do not count.
- Suggestions: exact-amount pairs first, then the largest debtor pays the largest creditor; ties
  follow the account's participant order. At most N−1 transfers, always the same for the same
  balances.
- Settlements are not edited: a wrong one is deleted (logical delete, audited) and recorded again.
  A closed account is read only.

## Data export (feature 005)

- Any member exports an account, open or closed, with "Exportar" next to the "Gastos" and "Saldos"
  tabs; the profile has "Export my data" with the profile and every account the user is a member
  of. Formats: CSV (a ZIP with one file per table: account, participants, expenses, shares,
  settlements, balances and suggestions; one folder per account for "all my data") and JSON (one
  document with stable keys and amounts as decimal text).
- API: `GET /api/v1/accounts/{id}/export?format=csv|json` and `GET /api/v1/users/me/export?format=csv|json`.
  The file is built on the fly from one consistent read and never stored; every export is audited
  (`account.exported`, `user.data_exported`). Files never include other users' emails or ids,
  invite codes or tokens.
- Web downloads through the BFF (`POST /api/exports/...`), so backend tokens stay on the server.
  Mobile opens the system share sheet with `expo-sharing`: rebuild the development build after
  pulling this feature (`npx expo run:android` or `npx expo run:ios`).
- CSV always uses `,` and a decimal point, whatever the language. A spreadsheet set to Spanish may
  need "Import CSV" (with a dot as the decimal separator) instead of a double click.

## Visual identity (feature 006)

- The "Celeste y sol" identity lives in one place: `design/tokens.json` (colors per role for light
  and dark, typography, spacing, radius and touch target size, plus the contrast pairs).
- `npm run tokens` (from `mobile/`) validates it and writes `mobile/src/theme/tokens.generated.ts`
  (plus a `.json` copy of the colors for `app.config.ts`) and `web/src/styles/tokens.generated.css`.
  They are committed and never edited by hand.
- `npm run icons` (from `mobile/`) draws the approved wordmark and the "Che" app icon from the
  tokens and the brand typeface (Sora, SIL OFL, in `mobile/assets/fonts/`): the SVG sources in
  `design/logo/` and the icon, adaptive icon, monochrome icon, splash and logo PNGs. Changing the
  icon or splash needs a rebuilt development build (`npx expo run:android`).
- The App navigates with a bottom bar (Inicio, Cuentas, Perfil); expense and settlement forms
  open full screen without it.
- `npm run tokens:check` writes nothing and fails if a text pair is below 4.5:1, a control pair
  below 3:1, or a generated file is out of date. Mobile's Jest suite also checks contrast and fails
  on any color literal outside `mobile/src/theme/`.
- The Web uses the same source (feature 007): `web/src/styles/tokens.generated.css` (plus a `.json`
  copy of the colors for the web manifest). `npm run icons` also copies Sora to
  `web/src/app/fonts/` and writes the site icon, the iOS icon and the manifest icons. Web tests
  run on the host (`tokens.test.ts` reads `design/tokens.json`, which the web container does not
  mount).
- `CONTACT_EMAIL` (optional, in `.env`) is the public email shown on the Contact page.

## Donations (feature 008)

- "Apoyá ChePagame" opens the project's donation page (Cafecito) outside ChePagame: a plain link,
  no widget or third-party script, no referrer. ChePagame never handles payments.
- Web: `DONATION_URL` (read on the server) shows the link in the footer, on About and on the
  Profile. App: `EXPO_PUBLIC_DONATION_URL` (embedded at build time) shows a section on the
  Profile. Only a valid `https` link is used; empty or anything else hides the button.
- Store builds: Google Play and the App Store may reject an external donation link to the
  developer. Build the App for the stores with `EXPO_PUBLIC_DONATION_URL` empty (and keep it
  empty in the `production` profile once `eas.json` exists).

## Deploy (feature 009)

Two GitHub Actions workflows publish production images to Docker Hub and update the
DigitalOcean server:

- `.github/workflows/deploy-backend.yml` runs on every push to `main` that touches `backend/`.
- `.github/workflows/deploy-web.yml` runs on every push to `main` that touches `web/`.

Each one first runs its component's lint and tests (`verify`). Only if they pass does it build
the image from `Dockerfile.prod`, push it as `latest` and `sha-<commit>`, and recreate that one
service on the server, waiting until its healthcheck passes. A change in one component never
restarts the other. Both can also be started by hand (Actions → workflow → **Run workflow**);
a manual run from a branch other than `main` only runs `verify` and never deploys.

Each image carries its build information: version (`package.json` / `pyproject.toml`), build
number, UTC date, release tag (`main-<build>`) and short commit. It is shown on "Quiénes somos"
and returned by `GET /api/v1/health` (backend) and `GET /api/health` (web).

### GitHub configuration

Settings → Secrets and variables → Actions. Values never go in the repository.

| Name | Kind | What it is |
|------|------|------------|
| `DOCKERHUB_USERNAME` | Secret | Docker Hub user that pushes the images |
| `DOCKERHUB_TOKEN` | Secret | Docker Hub access token with Read & Write permission |
| `DROPLET_IP` | Secret | Server address |
| `DROPLET_USER` | Secret | SSH user on the server |
| `SSH_PRIVATE_KEY` | Secret | Private key dedicated to deploys (its public key is in the server's `authorized_keys`) |
| `DROPLET_SSH_FINGERPRINT` | Secret | Server host key fingerprint: only the `SHA256:…` field printed by `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` |
| `DOCKERHUB_NAMESPACE` | Variable | Docker Hub account of the images (`<namespace>/chepagame-backend`, `<namespace>/chepagame-frontend`) |
| `DEPLOY_PATH` | Variable | Folder on the server that holds the production compose file, e.g. `/root/projects` |

If one is missing, the run fails at "Check configuration" naming it, without printing values.
The Docker Hub repositories are public: images contain no secrets or `.env` files.

### Server setup (once)

1. Install Docker Engine and Docker Compose v2.22+.
2. Create an SSH key pair only for deploys and add the public key to the deploy user's
   `~/.ssh/authorized_keys`.
3. Copy `deploy/docker-compose.prod.yml` to `DEPLOY_PATH/docker-compose.yml` and
   `deploy/.env.production.example` to `DEPLOY_PATH/.env`, and fill in `.env` on the server.
4. Run `docker compose up -d` in `DEPLOY_PATH` (the first deploy of each workflow pulls the
   images).

MongoDB publishes no ports. The backend and the web app publish `8000` and `3000` on
`PUBLISH_ADDRESS` (`127.0.0.1` by default) for a reverse proxy on the host; HTTPS, the domain
and the proxy are handled by the server, outside this repository. The current production server
(shared nginx, Let's Encrypt, `api.` subdomain) is documented step by step in
[deploy/DIGITALOCEAN.md](deploy/DIGITALOCEAN.md).

Changes to `deploy/` are not applied by the workflows: copy the files to the server again and
run `docker compose up -d`.

### Rollback

1. Pick the previous `sha-<commit>` tag (Docker Hub or the list of workflow runs).
2. On the server, set `BACKEND_TAG=sha-<commit>` (or `FRONTEND_TAG`) in `DEPLOY_PATH/.env`.
3. Run `docker compose up -d --no-deps --wait chepagame-backend` (or `chepagame-frontend`).
4. To follow deploys again, set the tag back to `latest` and run the same command (or wait for
   the next deploy).

While a tag is pinned, deploys still publish new images but the server keeps the pinned one;
the last lines of the SSH step (`docker compose images`) show the tag that is running.

## Tests

```bash
cd backend && uv run pytest          # needs the compose MongoDB running; uses chepagame_test
cd backend && uv run pytest -m perf  # latency goals (optional)
cd web && npm test
cd mobile && npm test
```

Lint and format: `uv run ruff check . && uv run ruff format --check .` (backend), `npm run lint`
(web and mobile).

## API types

Web and Mobile generate their TypeScript types from the backend OpenAPI. With the backend
running:

```bash
cd web && npm run gen:api
cd mobile && npm run gen:api
```

## Feature validation

End-to-end scenarios: [001](specs/001-user-auth-profile/quickstart.md),
[002](specs/002-account-management/quickstart.md),
[003](specs/003-expense-management/quickstart.md),
[004](specs/004-balances-settlements/quickstart.md) and
[005](specs/005-data-export/quickstart.md).
