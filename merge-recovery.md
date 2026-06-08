# Merge Integrity Audit Report

## Summary

| Feature | Expected From | Status | Verdict |
|---------|--------------|--------|---------|
| Rate Limiting | rhikibranch | **PRESENT** (DB-backed, per-route) | ✅ No regression |
| Email Verification | rhikibranch | **PRESENT** (Nodemailer, bcrypt tokens) | ✅ No regression |
| Forgot/Reset Password | rhikibranch | **PRESENT** (bcrypt tokens, rate-limited) | ✅ No regression |
| Discount / Deal Codes | rhikibranch | **PRESENT** (AES-256-GCM encrypted, full flow) | ✅ No regression |
| Dynamic Points (streak multiplier) | main | **PRESENT** (1.0/1.2/1.5 streak multiplier) | ✅ No regression |
| Dynamic Points (event rates) | main | **NOT PRESENT** (no `currentRates` table or config) | ⚠️ May be missing |
| `src/middleware.ts` | rhikibranch | **NEVER EXISTED** in any branch | ✅ Not regressed |
| Real-time Event Listeners (SSE/WebSocket) | main | **NOT PRESENT** (no SSE/WebSocket endpoints) | ⚠️ May be missing |

---

## 1. Rate Limiting — PRESENT ✅

**File:** `src/lib/rate-limit.ts` (55 lines)

- DB-backed using `rateLimitsTable` (PostgreSQL upsert via `ON CONFLICT DO UPDATE`)
- Window expiration with automatic stale-row cleanup (2% sampled delete)
- TTL-based sliding window: count resets when window expires
- Returns `allowed: boolean` + `retryAfterSeconds`
- **Used in 6+ routes:**
  - `signup/route.ts` — 5/IP/hour
  - `[...nextauth]/route.ts` — 10/email, 30/IP per 15min
  - `forgot-password/route.ts` — 5/IP + 2/email per min
  - `verify-email/resend/route.ts` — 3/IP per min
  - `referral/bind/route.ts` — 3/user per min
  - `deals/[id]/redeem/route.ts` — 5/user per min

**No middleware.ts exists** — rate limiting was always per-route in this codebase (confirmed by checking both branches: neither `arbitary-1.0` nor `rhikibranch` had `src/middleware.ts`). The library is custom DB-backed (not Upstash or `limiter`).

**Verdict:** Fully functional. No regression.

---

## 2. Email Verification — PRESENT ✅

### Backend Routes:
| Route | File | Logic |
|-------|------|-------|
| Signup | `src/app/api/auth/signup/route.ts` | Generates UUID token, bcrypt hashes (salt 10), stores hash+expiry on user, sends Nodemailer email |
| Verify | `src/app/api/auth/verify-email/[token]/route.ts` | Brute-force compares against all unverified tokens, marks `isVerified: true` |
| Resend | `src/app/api/auth/verify-email/resend/route.ts` | Rate-limited (3/IP/min), same flow as signup |
| Login guard | `src/app/api/auth/[...nextauth]/route.ts` | Returns `VERIFY_EMAIL` error if `isVerified === false` at login |

### Email Provider:
- `src/lib/email.ts` — Real Nodemailer with Gmail SMTP (`EMAIL_USER`/`EMAIL_PASS` env vars)
- Templates: `src/lib/emails/verify-email.ts` and `src/lib/emails/reset-password.ts` — branded HTML

### Frontend Pages:
- `src/app/(auth)/signup/page.tsx` — Redirects to `/verify-email?email=...` after signup
- `src/app/(auth)/verify-email/page.tsx` — Pending page with resend button
- `src/app/(auth)/verify-email/[token]/page.tsx` — Validates token on mount
- `src/app/(auth)/login/page.tsx` — Displays "Please verify your email" error message

### Auth Compatibility Check (Cross-Chain):
- `src/auth.ts` line 139 sets `isVerified: true` for OAuth users (Google/Facebook)
- `src/auth.ts` credentials callback checks password via bcrypt (salt 12)
- `[...nextauth]/route.ts` checks `isVerified` before delegating to NextAuth handler
- The verification check is route-level (before NextAuth), not inside the credentials callback — so it correctly interrupts login before authentication proceeds
- **No conflict detected** between email verification and auth login flow

**Verdict:** Fully functional. No regression. Auth + verification are compatible.

---

## 3. Forgot / Reset Password — PRESENT ✅

- **POST `/api/auth/forgot-password`**: Rate-limited (5/IP + 2/email per min), bcrypt-hashed UUID token, 30-min expiry, silent 200 for unknown/OAuth accounts
- **GET `/api/auth/reset-password/[token]`**: Token validation, expired tokens cleaned up
- **POST `/api/auth/reset-password/[token]`**: Transaction — updates password (bcrypt salt 12) + marks token used
- **Change Password (non-email)**: `src/app/api/user/password/route.ts` — PATCH with current password verification

**Verdict:** Full password reset + change flow. No regression.

---

## 4. Discount / Deal Codes — PRESENT ✅

### Schema Tables (all in `src/db/schema.ts`):
- `dealsTable` — title, description, pointsCost, discountType/value/maxAmount, stock
- `dealCodesTable` — encrypted code, dealId, isRedeemed, claimedBy
- `redemptionsTable` — userId, dealId, pointsSpent, revealedCode, status

### Encryption:
- `src/services/security.service.ts` — AES-256-GCM with v1:iv:authTag:ciphertext format
- Key derived from `DEAL_CODE_ENCRYPTION_KEY || NEXTAUTH_SECRET`

### API Routes:
| Route | Function |
|-------|----------|
| `GET /api/deals` | List active deals with available code count |
| `POST /api/deals/validate` | Match user-entered code against encrypted stored codes |
| `POST /api/deals/[id]/redeem` | Purchase deal (points deduction, code release with `FOR UPDATE SKIP LOCKED`) |
| `POST /api/tickets/redeem` | Ticket purchase with optional `dealCode`/`dealId` |

### Ticket Redemption (`src/services/ticket.service.ts`):
- Decrypts stored codes, matches user input
- Discount info returned to frontend
- Row-level locking (`FOR UPDATE`) for point deduction
- Email confirmation sent via Nodemailer
- Deals manager UI: `src/app/admin/dashboard/_components/deals-manager.tsx`

**Verdict:** Full deal system with encrypted codes, point-based purchasing, ticket discounts. No regression.

---

## 5. Dynamic Points — Streak Multiplier PRESENT ✅ / Event Rates NOT PRESENT ⚠️

### Points Calculation (example from `task.service.ts:1133`):
```typescript
const multiplier = getStreakMultiplier(user?.currentStreak || 0);
const taskPoints = Math.round((task.points || 0) * multiplier);
```

### Streak Multiplier (`src/lib/gamification.ts`):
- 0–6 days: `1.0x`
- 7–29 days: `1.2x`  
- 30+ days: `1.5x`

### Streak Calculation (`src/lib/streak-helper.ts`):
- Milestone bonuses at 5 days (50pts), 7 days (100pts), 30 days (500pts)
- Gap resets streak to 1

### YouTube completion (`task.service.ts:983`): uses `multiplier`
### Facebook completion (`task.service.ts:924`): uses `multiplier`
### Daily login (`task.service.ts:864`): uses milestone bonus (not streak multiplier)
### Profile claim (`user.service.ts:159`): uses `multiplier`
### Referral bonus: flat 100pts (no multiplier)

### What's missing:
- **No `currentRates` table**: There is no database table or config object for dynamically adjusting point rates per event/per period
- **No event-based multiplier**: Points are based solely on `task.points` (admin-set) × streak multiplier
- **No time-based rate config**: No way to globally boost/lower point rates without editing each task

**Verdict:** Streak multiplier works correctly. If "Dynamic Points" was expected to include event-based or global rate configurations, that feature does not exist in this codebase and was never part of either branch.

---

## 6. Real-time Event Listeners (SSE/WebSocket) — NOT PRESENT ⚠️

- **No SSE endpoints** (`text/event-stream`) found anywhere in the codebase
- **No WebSocket** connections or upgrade handlers
- **No subscription/publish** patterns (no Redis Pub/Sub, no WebSocket rooms)
- `src/app/api/events/` routes are standard REST (GET/POST/PATCH/DELETE)
- Frontend polls events via `fetch('/api/events')` with manual refresh

**Verdict:** If real-time event listeners were expected from "main" branch, they were never present in this codebase. The `main` branch (`remotes/origin/main`) only has 2 commits — an initial commit and a single "Arbitary" commit — both far behind the current state.

---

## 7. Regressed Files — NONE DETECTED ✅

After comparing `remotes/origin/rhikibranch` (the feature branch) against current HEAD (merged state), no files were found where advanced logic was replaced by simpler placeholders. Specifically:

| Feature Area | Expected | Actual | Regressed? |
|-------------|----------|--------|-----------|
| Rate Limiting | DB-backed upsert | Same in both branches | ❌ No |
| Email sending | Real SMTP | Nodemailer + Gmail SMTP | ❌ No |
| Token hashing | bcrypt salt 10 | bcrypt salt 10 | ❌ No |
| Password hashing | bcrypt salt 12 | bcrypt salt 12 | ❌ No |
| Verify check in auth | Route-level | Route-level in `[...nextauth]/route.ts` | ❌ No |
| Discount code encryption | AES-256-GCM | AES-256-GCM in `SecurityService` | ❌ No |
| Points logging | `pointsLogTable` insert | Present on all award paths | ❌ No |
| `lifetimePoints` tracking | SQL template increment | Present on all award paths | ❌ No |
| Row-level locking | `FOR UPDATE` | Present on claim/daily-login/redeem | ❌ No |
| Streak calculation | Date-based + milestones | Present in `streak-helper.ts` | ❌ No |
| YouTube OAuth | `youtube.force-ssl` scope | Present in `src/auth.ts` | ❌ No |
| Google token encryption | AES-256-GCM | Present in `token-crypto.ts` | ❌ No |
| Referral system | 100pts bonus | Present in `referral.service.ts` | ❌ No |

---

## 8. Cross-Check: Auth + Verification Compatibility

The email verification flow and login auth flow are compatible:

1. **Signup** → creates user with `isVerified: false` + `verificationToken` hash
2. **Email sent** with verification link
3. **Login attempt** → `[...nextauth]/route.ts` checks `isVerified` before NextAuth handler → returns `VERIFY_EMAIL` error
4. **Verify link clicked** → `verify-email/[token]` route matches token, sets `isVerified: true`
5. **Login retry** → passes the check, proceeds to NextAuth credentials callback → bcrypt password check → JWT issued
6. **OAuth users** bypass steps 1–5 — set as `isVerified: true` at creation

**No conflicts detected.** The route-level guard in `[...nextauth]/route.ts` operates on the raw request before NextAuth processes it, so it doesn't interfere with NextAuth's internal callback flow. The `VERIFY_EMAIL` error is displayed on the login page via `src/app/(auth)/login/page.tsx`.

---

## Conclusion

**No regressions detected from the "Low" conflict resolution strategy in the merge.**

All expected features from `rhikibranch` are present and fully functional:
- Rate limiting (DB-backed, per-route)
- Email verification (Nodemailer, bcrypt tokens, login guard)
- Forgot/reset password (rate-limited, bcrypt tokens)
- Discount codes (AES-256-GCM encryption, deal system, ticket integration)

The two items marked as "NOT PRESENT" (`middleware.ts` and event listeners) were **never part of either branch** — `src/middleware.ts` doesn't exist in `rhikibranch` or `arbitary-1.0` git history, and event listeners (SSE/WebSocket) don't appear in any commit across branches.

If "Dynamic Points with Event Rates" was expected to include a configurable rates table or event multiplier, that feature would need to be implemented — it was not lost in the merge, it was never built.
