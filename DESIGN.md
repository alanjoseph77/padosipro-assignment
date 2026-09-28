# Design

## Architecture

```
Expo app (React Native) ──HTTP/JSON───▶ Express API (TypeScript) ──Prisma──▶ PostgreSQL
                                             │
                                             └──SMTP──▶ Mailpit (local inbox)
```

### Backend

The backend is a small layered Express 5 app:
- **Routes** validate input with **Zod** and return data.
- **`otp.service`** holds the security-critical OTP logic.
- A single **error handler** turns Zod errors, `AppError`s and unexpected failures into one JSON shape: `{ error: { code, message, fields? } }`. The app shows `message` directly and puts `fields` messages under the matching inputs.

There are five tables:
- `User` (email, bcrypt hash, `isVerified`, `profileCompleted`)
- `Profile` (1:1 with User)
- `EmailOtp` (one row per issued code)
- `Task`
- `UserTask` (the many-to-many selection)

The task catalogue is seeded on API start. The seed skips if tasks already exist, so restarts don't wipe users' selections.

### Mobile

The mobile app is one navigator whose screens depend on the auth state:
- `AuthContext` keeps the JWT in **SecureStore**. On launch it calls `/me` and ends in one of four states: `loading`, `signedOut`, `signedIn` or `error`.
- `RootNavigator` chooses the screens from those states and from the **server's** `profileCompleted` and `hasSelectedTasks` flags. So "profile shown once" survives reinstalling the app and changing phones, and no screen triggers the next step itself.
- A single axios client adds the token to requests, turns network failures and timeouts into readable messages, and logs the user out on a 401.

## Key decisions and trade-offs

- **Passwords:** bcrypt with cost 12. It's standard, well understood and fast enough for a login endpoint.
- **How OTP codes are stored:** as HMAC-SHA256 with a server secret, not bcrypt.
  - A 6-digit code has only a million possible values, so a slow hash gives little protection once the database leaks. A keyed HMAC means leaked hashes are useless without `OTP_SECRET`.
  - Codes are compared in constant time.
  - They are generated with `crypto.randomInt` and zero-padded, so `004821` is a valid code.
- **OTP rules:** one row per code.
  - Issuing a new code invalidates any unused old one.
  - A code is consumed on success, which makes it single use.
  - Wrong attempts are counted on the code, and it locks after 5.
  - The 30-second cooldown is enforced on the server; the app's countdown only mirrors it.
  - Verifying a code and marking the user verified happen in one transaction.
- **Testable time:** `issueOtp` and `verifyOtp` take a `now` argument, so the tests check the 10-minute expiry and 30-second cooldown precisely, without waiting or faking timers.
- **Login rules:**
  - A wrong password and an unknown email return the same 401, so the endpoint doesn't reveal which emails are registered.
  - An unverified user gets a 403 and a fresh code, and the app sends them straight to Verify.
- **Stateless JWT (7 days) instead of server sessions:** simpler to run, and the brief allows it. The cost is that logging out only deletes the token on the device; the server cannot revoke it early.
- **Saving task selections:** `PUT /me/tasks` replaces the whole selection in one transaction, with a delete then insert. This is simpler and safer than sending add and remove changes, and a user's selection is small.
- **What the server owns vs. the app:** category icons and one-line descriptions live in the app. They're display choices; the server owns the task data.
- **React Navigation instead of Expo Router:** onboarding is a state machine (signed in, then profile, then tasks), not a set of URLs, and conditional stacks show that directly.
- **Real Postgres in tests instead of mocks:** the tests reset a separate `padosipro_test` database, so they also cover the Prisma queries and transactions.

## What I left out

- **Rate limiting** per IP or email. The 30-second cooldown and the 5-attempt lock limit OTP guessing, but login has no throttling yet.
- **`/auth/resend-otp` reveals unverified accounts:** it is designed to give the same response whatever the email, but during the cooldown it returns a 429, which shows that an unverified account exists.
- **Features:** password reset, editing the profile after onboarding, refresh tokens and server-side logout.
- **HTTPS and a real SMTP provider.** Locally everything is plain HTTP and Mailpit.
- **Mobile tests:** the automated tests cover the backend. The app was tested by hand on a real Android phone.
- **iOS build:** the brief says Android alone is fine.

## With another week

1. **Rate limiting:** add `express-rate-limit` backed by Redis, and make resend always return the same response.
2. **Sessions:** short-lived access tokens with rotating refresh tokens stored server-side. That enables real logout and "sign out of all devices".
3. **Account features:** password reset through the same OTP service, and profile editing from Account.
4. **End-to-end tests:** Maestro flows for register, verify, onboarding and logout, plus CI that runs them and the backend tests on every push.
5. **Deployment:** the API over HTTPS with managed Postgres and a transactional email provider such as SES or Postmark, and EAS builds that point at it.
6. **Polish:** accessibility testing (screen readers, font scaling), an offline banner, and caching the task catalogue.
