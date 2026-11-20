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
  run `adb reverse tcp:8000 tcp:8000` after starting the emulator. Development builds do not need
  the release key; to build an APK or AAB to share, see
  [Android release build](#android-release-build-feature-010).

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

### Income entries (feature 012)

The expense list shows expenses and settlements together (`GET /accounts/{id}/movements`, one
keyset cursor for both). "+" offers **Gasto** or **Ingreso**; an income is a settlement of
feature 004 (same rules, audit and balances), shown with its own icon and label. Its detail
(`GET /accounts/{id}/settlements/{settlementId}`) shows who recorded it and allows deleting it;
settlements are never edited.

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

## SEO and public pages (feature 011)

- Every public page (home, how it works, about, contact, FAQ, privacy, terms, delete account) has
  its own title, description, canonical URL and social preview (`web/public/og-image.png`).
  Private, authentication and invitation pages send `noindex`.
- `/robots.txt` and `/sitemap.xml` are generated from `PUBLIC_PAGES` in `web/src/lib/seo.ts`; update
  its `lastModified` when a page's content changes.
- The home page describes the app and the FAQ page its questions with JSON-LD.
- `SITE_URL` (optional, falls back to `AUTH_URL`) is the origin used in canonical links and the
  sitemap.
- Spanish is the indexed version: crawlers send no `Accept-Language`, so they get Spanish.
- The App shows the same pages in Profile → "Acerca de".
- After the deploy, add the site to Google Search Console and submit
  `https://chepagame.com.ar/sitemap.xml`.
- The social image and `favicon.ico` come from `design/build-icons.ts`.

## Contact and anti-bot check (feature 017)

The Contact page (Web and App) sends the message to the maintainer's WhatsApp through CallMeBot,
after an explicit consent checkbox. Sign-up and Contact are protected by Cloudflare Turnstile.

Both only run with `ENVIRONMENT=production`. Variables, with no values in the repository (put them
only in the server `.env`):

| Variable | Used by |
|----------|---------|
| `CALLMEBOT_URL` (https), `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | API, WhatsApp relay |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | API, server-side token check |
| `CLOUDFLARE_TURNSTILE_SITE_KEY` | Web (read at runtime) and `GET /public-config` for the App |

- **Production:** the API refuses to start if any variable is missing and names it. The forms show
  the widget and the API rejects requests without a valid token (`403 bot_check_failed`). Contact
  is limited to 5 messages per email and 30 in total per hour; a CallMeBot failure gives
  `502 contact_unavailable` and keeps what was typed.
- **Development and tests:** no widget, no calls to Cloudflare or CallMeBot. A contact message is
  accepted (`202`) and only logged without its content. `GET /public-config` returns
  `{"turnstileSiteKey": null}`.
- **App:** the widget runs in a WebView that loads `${EXPO_PUBLIC_WEB_BASE_URL}/turnstile`, so the
  APK needs that variable and a rebuild (it now includes `react-native-webview`).
- In Cloudflare, allow the `chepagame.com.ar` hostname for the widget.

To try it locally, open `/contact` in the Web or *Profile → About → Contact* in the App, send a
message and look for it in the backend log.

## Delete my account (feature 015)

- Profile → "Eliminar mi cuenta" on Web (`/profile/delete`) and in the App. The user confirms with
  a one-time code sent by email (same expiry, attempts and limits as the login code), so it works
  for password and Google-only users alike.
- API: `POST /api/v1/users/me/deletion` (202, sends the code) and
  `POST /api/v1/users/me/deletion/confirm` with `{ "code" }` (204). One transaction deletes the
  user document, its sessions, codes and pending registrations; in shared accounts its participant
  becomes "Usuario eliminado" / "Deleted user" (balances do not change) and the Owner role moves
  to the member who joined first; accounts without other registered members are deleted
  (soft delete). The user's email and names are replaced by `[deleted]` in existing audit entries,
  the only change audit entries ever get (constitution 4.9.0).
- Public page (no session) for Google Play's Data safety form:
  `https://chepagame.com.ar/delete-account`. The Privacy page links it.

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

## Android release build (feature 010)

Release builds are signed with the project's own upload key, never with the debug key, block the
permissions the App does not use and shrink code with R8. `mobile/android/` is generated, so all of
this comes from `mobile/app.config.ts` and `mobile/plugins/withReleaseSigning.js`. Full validation
steps: [specs/010-android-release-hardening/quickstart.md](specs/010-android-release-hardening/quickstart.md).

1. **Create the key once, outside the repository.** `keytool` asks for the passwords, so they never
   end up in the shell history:

   ```bash
   keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias chepagame-upload -keystore ~/keys/chepagame-upload.jks
   ```

   Back up the `.jks` and its passwords somewhere safe: without them you cannot publish updates of
   the same App.
2. **Configure `mobile/.env`** (never committed) with `ANDROID_UPLOAD_STORE_FILE` (absolute path to
   the `.jks`, forward slashes also work on Windows), `ANDROID_UPLOAD_STORE_PASSWORD`,
   `ANDROID_UPLOAD_KEY_ALIAS` and `ANDROID_UPLOAD_KEY_PASSWORD`. Environment variables win over the
   file. Without them, release builds fail with `Release signing is not configured` and the list
   of missing variables; development builds keep working.
3. **Build** (in `mobile/`):

   | Goal | Command | Output |
   |---|---|---|
   | Regenerate the native project | `npx expo prebuild --platform android --clean` | `android/` |
   | APK for phones (arm64) | `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` | `android/app/build/outputs/apk/release/app-release.apk` |
   | AAB for Google Play | `cd android && ./gradlew bundleRelease` | `android/app/build/outputs/bundle/release/app-release.aab` |

   The Android `versionCode` comes from `version` in `app.config.ts` (`1.2.3` → `10203`): bump the
   version for every release you distribute.
4. **Google Sign-In:** Google checks the SHA-1 of the signing key. Get it with
   `cd android && ./gradlew signingReport` (variant `release`) and add it to an OAuth client of
   type **Android** (package `com.chepagame.app`) in Google Cloud. The Web client ID does not change.
5. **Install:** Android does not update an App signed with another key, so uninstall the
   debug-signed ChePagame first.
6. **Check before sharing:** upload the APK to [VirusTotal](https://www.virustotal.com). If an
   engine still flags it, report the false positive to that vendor with the SHA-256 of the file;
   do not change the App to dodge a scanner.

### Build on GitHub

`.github/workflows/release-android.yml` builds, signs and publishes the App on GitHub Actions
(about 20–30 minutes). Configure it once in Settings → Secrets and variables → Actions:

- **Secrets:** `ANDROID_UPLOAD_KEYSTORE_BASE64` (the `.jks` in base64), `ANDROID_UPLOAD_STORE_PASSWORD`,
  `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`. To copy the keystore in base64 without
  showing it (PowerShell):
  `[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\keys\chepagame-upload.jks")) | Set-Clipboard`
- **Variables** (public, they end up inside the APK): `EXPO_PUBLIC_API_BASE_URL`
  (e.g. `https://api.chepagame.com.ar/v1`), `EXPO_PUBLIC_WEB_BASE_URL`
  (e.g. `https://chepagame.com.ar`), `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and, optionally,
  `EXPO_PUBLIC_DONATION_URL`.

To publish a version: bump `version` in `mobile/app.config.ts`, commit and push, then tag that
commit with the same version and push the tag:

```bash
git tag mobile-v1.0.1
```

```bash
git push origin mobile-v1.0.1
```

The run checks lint, types and tests, fails if the tag does not match the version, and creates a
GitHub Release with `chepagame-<version>-arm64.apk`, `chepagame-<version>.aab` and their SHA-256.
A manual run (Actions → Android release → Run workflow) only uploads them as an artifact.

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
