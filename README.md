# PadosiPro — onboarding app

A native mobile app and its backend for PadosiPro's first customer journey. A new user:

1. registers with email and password,
2. verifies the email with a 6-digit code,
3. logs in,
4. fills in their profile once,
5. picks the tasks they want handled,
6. lands on a home screen listing those tasks.

| Part | Stack |
|---|---|
| Backend | Node.js 20, TypeScript, Express 5, Prisma, PostgreSQL 16 |
| Email | [Mailpit](https://mailpit.axllent.org/), a local mail catcher. No real email is sent. |
| Mobile | React Native 0.86 with Expo SDK 57, React Navigation |
| Tests | Vitest and Supertest, run against a real Postgres test database |

See [DESIGN.md](DESIGN.md) for the architecture and trade-offs.

## Quick start with the prebuilt APK

1. Start the backend: `docker compose up --build` (see [section 1](#1-run-the-backend-one-command)).
2. Download `PadosiPro.apk` from this repository's **Releases** page (v1.0).
3. Start an **Android emulator** and drag the APK onto it to install.
4. Open PadosiPro and register. The verification code arrives in Mailpit at http://localhost:8025.

The APK is built for the emulator: it calls `http://10.0.2.2:4000`, which is the emulator's address for your computer. To use a real phone instead, rebuild the APK with your computer's LAN IP (see [section 3](#3-build-the-apk)), or run the app with Expo Go (see [section 2](#2-run-the-mobile-app)).

---

## Prerequisites

- **Docker Desktop**, for Postgres, Mailpit and the API.
- **Node.js 20+** and npm, for the mobile app and the backend tests.
- One of the following to run the app:
  - an **Android emulator** (Android Studio), or
  - an Android phone with **Expo Go** (SDK 57), on the same Wi-Fi as your computer.

---

## 1. Run the backend (one command)

From the repository root:

```bash
docker compose up --build
```

This starts three containers:

| Service | URL | What it is |
|---|---|---|
| `api` | http://localhost:4000 | REST API. On start it applies migrations and seeds the task catalogue. |
| `mailpit` | http://localhost:8025 | Inbox for every email the app sends, including OTP codes |
| `db` | `localhost:5434` | PostgreSQL. It uses port 5434 so it doesn't clash with a Postgres you may already have on 5432. |

To check it's running, open http://localhost:4000/health. It should return `{"status":"ok"}`.

No `.env` file is needed for Docker, because `docker-compose.yml` has safe local defaults. To override them, copy `backend/.env.example` to `backend/.env`.

### Where the verification code goes

Every OTP email lands in **Mailpit at http://localhost:8025**. Open it after registering to find the 6-digit code.

To use a real mailbox instead, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASS` in `backend/.env`.

---

## 2. Run the mobile app

```bash
cd mobile
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npx expo start -c
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to where the phone can reach the API:

| Where the app runs | Value |
|---|---|
| Android emulator | `http://10.0.2.2:4000`. This is the default in `.env.example`. |
| Real phone with Expo Go | `http://<your-computer's-LAN-IP>:4000`, for example `http://192.168.1.5:4000` |

To find your LAN IP, use `ipconfig` on Windows (the IPv4 Address under Wi-Fi) or `ipconfig getifaddr en0` on macOS.

Then open the app:
- **Emulator:** press `a` in the Expo terminal.
- **Real phone:** scan the QR code with Expo Go.

After changing `.env`, always restart Expo with `-c`, because the value is read when the app is bundled.

> **Real phone can't connect?**
> 1. Open `http://<LAN-IP>:4000/health` in the phone's browser.
> 2. If that page doesn't load either, allow inbound TCP port 4000 in your computer's firewall.
> 3. If it still fails, the Wi-Fi may block devices from talking to each other (common on campus and office networks). Put both devices on a phone hotspot.

### Walk through the flow

1. **Register:** use any email address, since all mail goes to Mailpit. The password needs 8+ characters with a letter and a number.
2. **Verify:** copy the code from http://localhost:8025. It auto-submits after the 6th digit.
3. **Log in:** you're taken to the Profile form. It's shown only once.
4. **Pick tasks:** choose some, confirm, then open Home.
5. **Stay logged in:** close and reopen the app, and you're still logged in.
6. **Log out:** from the avatar on Home, which opens Account.

---

## 3. Build the APK

The API address is **built into the APK** and can't be changed after building. The API is served over plain HTTP, so the app allows cleartext traffic (`expo-build-properties` in `app.json`).

- **EAS build:** the address comes from `EXPO_PUBLIC_API_URL` in `mobile/eas.json` (default `http://10.0.2.2:4000`, for the emulator). EAS does not read `mobile/.env`.
- **Local build:** the address comes from `mobile/.env`.

For a real phone, set the address to `http://<your-computer's-LAN-IP>:4000` before building.

### Option A: EAS cloud build (recommended, no Android SDK needed)

```bash
cd mobile
npx eas-cli@latest login                                  # free Expo account
npx eas-cli@latest build -p android --profile preview
```

The `preview` profile in `eas.json` produces an installable `.apk`. EAS prints a download link when the build finishes.

### Option B: local build

This needs JDK 17 and the Android SDK (Android Studio).

```bash
cd mobile
npx expo prebuild -p android
cd android
./gradlew assembleRelease           # Windows: .\gradlew.bat assembleRelease
```

The APK is written to `mobile/android/app/build/outputs/apk/release/app-release.apk`. It is signed with the debug keystore, which is fine for testing but not for the Play Store.

---

## 4. Run the tests

The tests cover the risky logic:
- OTP generation, hashing, expiry, single use, the 5-attempt lock and the 30-second resend cooldown;
- the register and login rules: passwords stored hashed, unverified users rejected, and the same error for a wrong password and an unknown email.

```bash
docker compose up -d db            # tests need Postgres
cd backend
npm install
npm test
```

The tests use a **separate database, `padosipro_test`**, configured in `backend/.env.test`. It is dropped and recreated at the start of every run. A safety check refuses to run if the database name doesn't contain `_test`. The mailer is mocked, so tests send no email.

---

## Environment variables

### Backend (`backend/.env`, template in `backend/.env.example`)

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://app:app@localhost:5434/padosipro` | Postgres connection |
| `JWT_SECRET` | long random string | Signs login tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `OTP_SECRET` | long random string | Key for hashing OTP codes (HMAC-SHA256) |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Mail server (Mailpit locally) |
| `SMTP_USER` / `SMTP_PASS` | *(empty)* | Only for a real SMTP server |
| `MAIL_FROM` | `no-reply@padosipro.local` | Sender address |
| `PORT` | `4000` | API port (optional) |

`backend/.env.test` holds the test settings. It contains only dummy values and is committed on purpose.

### Mobile (`mobile/.env`, template in `mobile/.env.example`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the API, as reachable from the device |

No real secrets are committed anywhere.

---

## Running the backend without Docker (optional, for development)

```bash
docker compose up -d db mailpit
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev                          # http://localhost:4000, reloads on change
```

`backend/requests.http` has ready-made requests for every endpoint. It works with the VS Code "REST Client" extension.

---

## API

Errors always use the same shape:
`{ "error": { "code": "OTP_INVALID", "message": "Incorrect code. 4 attempts left.", "fields": { ... } } }`.
`fields` is present only for validation errors (HTTP 422), with one message per invalid field.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | none | Create an account and email a code |
| POST | `/auth/verify-otp` | none | Verify the email with the 6-digit code |
| POST | `/auth/resend-otp` | none | Send a new code (30-second cooldown) |
| POST | `/auth/login` | none | Returns a JWT. Unverified users get `403 EMAIL_NOT_VERIFIED` and a fresh code. |
| GET | `/me` | Bearer | Current user and onboarding state |
| PUT | `/me/profile` | Bearer | Save name, mobile, address and business name |
| GET | `/tasks` | Bearer | Task catalogue grouped by category |
| GET | `/me/tasks` | Bearer | Tasks the user picked |
| PUT | `/me/tasks` | Bearer | Replace the user's selection (profile required first) |
| GET | `/health` | none | Health check |

### Validation rules

- **Email:** a valid address, trimmed and lower-cased.
- **Password:** 8 to 72 characters, with at least one letter and one number. 72 is bcrypt's input limit.
- **Mobile:** an Indian mobile number of 10 digits starting with 6 to 9. `+91`, `91` or `0` prefixes, spaces and dashes are accepted and stripped. It is stored as 10 digits and returned as `+91XXXXXXXXXX`.
- **Name:** 2 to 100 characters. **Address:** 10 to 300 characters. **Business name:** optional, up to 100 characters.

**Why Business Name is optional:** most PadosiPro customers are households, not businesses. Making it required would push people to type "N/A" just to get past the form. Name, mobile and address are what a Lifestyle Manager needs to reach someone and plan visits, so those are required.

---

## Project structure

```
backend/
  prisma/            schema.prisma, migrations, seed.ts (26 tasks, 6 categories)
  src/
    app.ts           Express app: middleware, routes, 404 and error handler
    index.ts         starts the server
    routes/          auth, me (profile and selected tasks), tasks (catalogue)
    services/        otp.service.ts: code generation, hashing, expiry, attempts, cooldown
    middleware/      requireAuth (JWT), errorHandler (one error format)
    lib/             prisma client, mailer, AppError
  tests/             otp.service.test.ts, auth.test.ts
mobile/
  App.tsx            providers and navigation container
  src/
    api/client.ts    axios instance, token header, error normalising
    context/         AuthContext: token in SecureStore, boot and restore, /me
    navigation/      RootNavigator: screens chosen from the login and onboarding state
    screens/         Login, Register, VerifyOtp, Profile, TaskSelection, ConfirmTasks, Home, Account
    components/      Screen, TextField, PrimaryButton, Feedback banners, Avatar
docker-compose.yml   db, mailpit, api
```
