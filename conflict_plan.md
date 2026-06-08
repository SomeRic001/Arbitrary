# Merge Conflict Resolution Plan

**Branches:** `arbitary-1.0` (HEAD — upstream pulled) ← merging `rhikibranch` (our feature branch)  
**Git convention in this file:** "Ours" = HEAD (upstream), "Theirs" = rhikibranch (our branch)  
**Conflicts:** 61 conflict blocks across 23 files  
**Goal:** Keep features from both sides, resolve properly without breaking functionality

---

## Priority Decisions (resolve these first — they affect everything else)

### 1. Role Casing — `'admin'`/`'user'` vs `'ADMIN'`/`'USER'`

| Branch | Value |
|--------|-------|
| Ours | `'ADMIN'`, `'USER'` (uppercase) |
| Theirs | `'admin'`, `'user'` (lowercase) |

**Decision: Use lowercase `'admin'`/`'user'`**  
Theirs has more code relying on lowercase (proxy.ts, admin routes, schema defaults). Switching to uppercase would break their admin dashboard. Our code only uses role for comparison, so lowercase works fine.

**Change needed:** None in the merge — just use their side for `proxy.ts` and `user-queries.ts`.

### 2. YouTube Verification — Heartbeat + Session Hybrid

| Branch | Approach |
|--------|----------|
| HEAD (upstream) | Heartbeat (`watchedSeconds`, `fingerprint`, `youtubeSessionsTable`) |
| rhikibranch | Session-based (`watchSessionsTable`, `startSession`/`reportProgress`) + API like/sub/comment checking |

**Decision: Keep BOTH — hybrid heartbeat+session approach**

The `watchSessionsTable` (rhikibranch) is used for session storage. The algorithm:

```
startSession  → fetch video duration from YouTube API, store in session
every 30s     → heartbeat arrives, server records timestamp,
                updates accumulatedWatchTime if gap is valid
complete      → accumulatedWatchTime >= videoDuration * 0.85
                AND heartbeat coverage >= 75%
                AND no single gap > 2 intervals (60s)
```

| Feature | Source | Why |
|---------|--------|-----|
| Session storage | `watchSessionsTable` (rhikibranch) | Tracks `videoDuration`, `accumulatedWatchTime`, heartbeat log |
| Heartbeat validation | Server-side timestamp + gap check | Prevents client-sent fake durations |
| Video duration | Fetched from YouTube API on `startSession` | Source of truth for completion threshold |
| Completion check | `accumulatedWatchTime >= videoDuration * 0.85` | Requires 85% watched |
| Coverage check | Heartbeats cover >= 75% of expected intervals | Prevents sparse/patchy watching |
| Gap tolerance | No single gap > 2 intervals (60s) | Prevents pause-and-skip cheating |
| Like verification | `YouTubeService.verifyLike` (rhikibranch) | YouTube API `videos/getRating` |
| Subscribe verification | `YouTubeService.verifySubscription` (rhikibranch) | YouTube API, 403 fallback to screenshot |
| Comment verification | `YouTubeService.verifyComment` (rhikibranch) | YouTube API `commentThreads` |
| Fingerprint dedup | `submissionFingerprint` (HEAD) | Stored on `userTasksTable` on complete — prevents replay |
| Points transaction | rhikibranch (row-level locking, `lifetimePoints`, `pointsLog`, referral) | Race-condition safe + audit trail |

**Key affected files:** `watchSessionsTable` in schema, `youtube-modal.tsx`, `task-card.tsx`, `task.service.ts` (`completeYoutubeTask`), `validation/task.ts` (`youtubeCompleteSchema`), `youtube-complete/route.ts`

### 3. Ticket Redemption — Quantity + Deal Codes

| Branch | Feature |
|--------|---------|
| Ours | `quantity` parameter, Zod validation (`redeemBodySchema`) |
| Theirs | `dealCode`/`dealId` parameters, discount code decryption |

**Decision: Keep BOTH — merge features**  
Support optional deal codes with quantity fallback. Quantity is needed for bulk purchase. Deal codes are needed for discounts.

**Affected files:** `tickets/redeem/route.ts`, `ticket.service.ts`, `events/[id]/page.tsx`

### 4. Points System — Tiers vs LifetimePoints + PointsLog

| Branch | Features |
|--------|----------|
| Ours | Tiers removed, basic points tracking |
| Theirs | `lifetimePoints`, `pointsLog` table, row-level locking |

**Decision: Use theirs (lifetimePoints + pointsLog)**  
Row-level locking (`FOR UPDATE`) prevents race conditions. `pointsLog` provides audit trail. Theirs is objectively more robust.

**Affected files:** `user.service.ts`, `task.service.ts`, `ticket.service.ts`

---

## File-by-File Resolution

### package.json & package-lock.json
**Strategy:** Use rhikibranch's as base (it has the superset of deps). Verify:
- `nodemailer` + `@types/nodemailer` present (rhikibranch already has these — Nodemailer, not Resend)
- `resend` absent (already removed in rhikibranch)
- Any HEAD-only deps are added back if missing
- **Action:** Re-run `npm install` after merge to reconcile lockfile.

---

### Core Schema & Infrastructure

#### `src/db/schema.ts` — ⚠️ High Risk
**3 blocks, massive structural overlap**

| HEAD (upstream) adds | rhikibranch adds |
|-----------|-------------|
| `youtubeSessionsTable` (heartbeat approach — will be replaced by `watchSessionsTable`) | `pointsLogTable` — points audit trail |
| `shareTasksTable`, `shareClicksTable` | `watchSessionsTable` — heartbeat+session storage |
| Basic user columns (no verification/refresh token) | `rateLimitsTable` — DB-backed rate limiting |
| `fraudRiskScore`, `isFlagged` on users (anti-fraud) | `passwordResetTokensTable` — forgot/reset password |
| `submissionFingerprint`, `completionDurationSeconds` on userTasks (anti-cheat) | `dealsTable`, `dealCodesTable`, `redemptionsTable` — deals system |
| | User columns: `isVerified`, `verificationToken`, `verificationTokenExpiresAt`, `googleRefreshToken`, `lifetimePoints`, `referredBy`, `referralRewarded` |
| | Relations for all new tables |

**Resolution:** Use THEIR side (rhikibranch) as the base — it has all auth/security features PLUS deals/points infrastructure. Then:
1. Add HEAD's `fraudRiskScore`, `isFlagged` columns back on usersTable
2. Keep `submissionFingerprint` and `completionDurationSeconds` on userTasksTable
3. Keep `shareTasksTable` and `shareClicksTable` (HEAD has them, verify rhikibranch also does)
4. Drop `youtubeSessionsTable` — replaced by `watchSessionsTable` for the hybrid heartbeat+session approach
5. Use lowercase `'user'`/`'admin'` role defaults (rhikibranch)
6. Fix `location` column — rhikibranch uses lowercase `"location"`, HEAD has capital `"Location"` (typo)

#### `src/proxy.ts` — Medium
**3 blocks: role casing, try/catch, dashboard protection**

**Resolution:** Take rhikibranch's version as base, then:
1. Keep their `try/catch` wrapper — safer
2. Use lowercase `'admin'` per decision above (rhikibranch already has this)
3. Keep their `isUserDashboard` protection
4. Ensure login page redirect still works (HEAD has this too, just structured differently)

#### `src/db/user-queries.ts` — Low
**1 block: role casing + sort column**

**Resolution:** Use `'user'` lowercase (rhikibranch's) for role filter. Use `lifetimePoints` (rhikibranch's) for sorting — more accurate for leaderboards.

---

### Auth & Security

#### `src/app/api/auth/signup/route.ts` — Medium
**2 blocks: imports + verification token flow**

| HEAD (upstream) | rhikibranch |
|------|--------|
| Uses `toNextResponse` helper | Uses inline `NextResponse.json` |
| Minimal signup, NO rate limiting | Rate limited (5/60min per IP) |
| No verification | Full verification token generation + email sending + `sendVerificationEmail()` |

**Resolution:** Take THEIR side (rhikibranch) — it has the complete flow: rate limiting + verification token generation + email sending + proper redirect. Keep the `toNextResponse` helper pattern from HEAD if preferred, but functionally use rhikibranch's logic.

#### `src/auth.ts` — Already resolved (no conflict markers)
Already has rhikibranch's full Google OAuth config. Key features preserved:
- `youtube.force-ssl` scope + `access_type: 'offline'` + `prompt: 'consent'` on Google provider
- `encryptToken()` stores Google refresh token in DB on sign-in
- JWT callback auto-refreshes expired Google access tokens using stored refresh token
- Duplicate `googleId` check (prevents same Google ID linked to multiple emails)
- `isVerified: true` set for all OAuth sign-ins
- Referral code assigned via `ReferralService.assignReferralCode()` on OAuth signup

#### `src/lib/email.ts` — Already resolved (no conflict markers)
Already has Nodemailer/Gmail SMTP (rhikibranch's approach). HEAD used Resend. Keep Nodemailer.

#### `src/lib/emails/verify-email.ts` — New file (rhikibranch)
Styled HTML verification email template. **Keep as-is.**

#### `src/lib/emails/reset-password.ts` — New file (rhikibranch)
Styled HTML password reset email template. **Keep as-is.**

#### `src/lib/rate-limit.ts` — New file (rhikibranch)
DB-backed rate limiting (`rateLimitsTable`). Used by signup, forgot-password, change-password, and resend-verification routes. **Keep as-is.**

#### `src/lib/token-crypto.ts` — New file (rhikibranch)
`aes-256-gcm` encryption/decryption for Google refresh tokens. Used by `auth.ts` and `youtube.service.ts`. **Keep as-is.**

#### `src/lib/task-detector.ts` — New file (rhikibranch)
Pattern-based task type detection (`isYtLike`, `isYtSubscribe`, `isYtComment`). Used by `task.service.ts`. **Keep as-is.**

#### `src/services/youtube.service.ts` — New file (rhikibranch)
YouTube API client — `verifyLike`, `verifySubscription`, `verifyComment`, `resolveChannelHandle`, `getAuthorizedClient` with token refresh. **Keep as-is.**

#### `src/services/referral.service.ts` — New file (rhikibranch)
Referral code assignment, binding, and bonus awarding. **Keep as-is.**

#### `src/services/security.service.ts` — New file (rhikibranch)
Security utilities. **Keep as-is.**

---

### YouTube Feature

#### `src/components/user-dashboard/youtube-modal.tsx` — High
**2 blocks: session management architecture**

**Resolution:** Use rhikibranch's session-based approach with hybrid heartbeat algorithm:
1. **`startSession`** → POST to create session, returns `videoDuration` fetched from YouTube API
2. **Every 30s** → send heartbeat PATCH with `watchedSeconds` (client time) + `sessionId`; server records timestamp, validates gap, updates `accumulatedWatchTime`
3. **`complete`** → POST to `/youtube-complete` with `sessionId` + `fingerprint`
   - Server checks: `accumulatedWatchTime >= videoDuration * 0.85`, coverage >= 75%, no gap > 2 intervals
4. **Fingerprint** → collected client-side, passed through to completion for dedup storage in `userTasksTable.submissionFingerprint`

#### `src/components/user-dashboard/task-card.tsx` — Medium
**5 blocks: state vars, mutation body, animation, rejected handling, onComplete**

**Resolution:**
- **State vars (Block 1):** Keep both — rhikibranch's file upload/preview states AND HEAD's `fingerprint` state
- **Mutation body (Block 2):** Use rhikibranch's `sessionId` plus keep HEAD's `fingerprint` — send both to the complete endpoint
- **Animations (Block 3):** Use rhikibranch's `isFinalStatus` logic — handles edge cases better
- **Rejected handling (Block 4):** Use rhikibranch's "Re-claim →" approach (`onPickup`) — correct UX
- **onComplete (Block 5):** Use rhikibranch's mutation call — pass both `sessionId` and `fingerprint`

#### `src/lib/validations/task.ts` — Low
**1 block: `youtubeCompleteSchema`**

**Resolution:** Accept both `sessionId` AND `fingerprint`:
```ts
youtubeCompleteSchema: z.object({
  taskId: z.coerce.number(),
  sessionId: z.number().optional(), // for watch tasks
  fingerprint: z.string().optional(), // for dedup
})

heartbeatSchema: z.object({
  sessionId: z.number(),
  watchedSeconds: z.number().min(0),
})
```

#### `src/app/api/user/tasks/youtube-complete/route.ts` — Medium
**2 blocks: imports + request handler**

**Resolution:** Accepts `sessionId` + `fingerprint` in the body. Passes both to `completeYoutubeTask`. Uses `rateLimit` import for rate limiting.

#### `src/app/api/tasks/[id]/watch-session/route.ts` — New file (rhikibranch)
Three endpoints:
- **POST** → `startSession`: fetch video duration from YouTube API, create `watchSessionsTable` row, return `{ sessionId, videoDuration }`
- **PATCH** → `reportProgress`: validates heartbeat gap (must be < 60s since last), updates `accumulatedWatchTime`, records timestamp
- **DELETE** → `cancelSession`: marks session cancelled
**Keep as-is.**

#### `src/services/task.service.ts` — ⚠️ Very High
**12 blocks — most complex file**

Key conflict areas:
| Block | Ours | Theirs | Decision |
|-------|------|--------|----------|
| Imports | `lt, inArray, not, isNotNull` | `ne` + service imports | Keep both |
| pickUpTask daily-login | Inline streak/bonus | Transaction with `FOR UPDATE` | **Theirs** |
| Points update | SQL-based | SQL + lifetimePoints | **Theirs** |
| claimDailyLogin | Outside transaction | Inside transaction | **Theirs** |
| completeYoutubeTask | watchedSeconds/fingerprint | sessionId + fingerprint | **Hybrid** — session hybrid + API verification + fingerprint dedup. Checks: `accumulatedWatchTime >= videoDuration*0.85`, coverage >= 75%, no gap > 2 intervals |
| Points award (yt) | Simple update | Transaction + pointsLog | **Theirs** |
| getAllTasks pagination | limit/offset | completedCounts group-by | **Ours** (pagination is critical for performance) |
| verifySubmission | Direct queries | Transaction + FOR UPDATE | **Theirs** |
| Helpers | `getValidCompletedTaskIds`, `mapTasksToItems` | `deleteCloudinaryImage`, `extractVideoId`, `extractChannelId` | **Keep both** — different utilities |
| awardFacebookPoints | taskPoints with multiplier | pointsAwarded + lifetimePoints | **Mix** — keep their locking + pointsLog, keep our multiplier logic |

**Resolution strategy:** Take their version as base (it has more infrastructure), then overlay our critical features:
1. Add our import `lt, inArray, not, type SQL, isNotNull` to their imports
2. Keep their pagination in `getAllTasks` (they group-by completedCounts, we add limit/offset on top)
3. Keep both sets of helpers
4. Merge `awardFacebookPoints`: their transaction + pointsLog + lifetimePoints with our multiply logic

---

### Tickets & Deals

#### `src/app/api/tickets/redeem/route.ts` — Medium
**2 blocks: body parsing + redeeemTicket args**

**Resolution:** Accept BOTH parameter sets. Request body should accept:
```ts
{ eventId, accessTypeId?, quantity?, dealCode?, dealId? }
```
Pass everything to `TicketService.redeemTicket()`.

#### `src/services/ticket.service.ts` — ⚠️ High
**3 blocks: params, return type, transaction logic**

| Block | Ours | Theirs |
|-------|------|--------|
| Params | `quantity: number = 1` | `dealCode?, dealId?` |
| Return | `tickets: Array<{id, redemptionToken}>` | `discountApplied?: {...}` |
| Transaction | Insert multiple tickets, deduct total cost | Validate deal, deduct 100 points, insert 1 ticket |

**Resolution:** Merge all features:
1. Accept both `quantity` and `dealCode`/`dealId` as optional params
2. Return BOTH `tickets` array and `discountApplied` (if applicable)
3. Transaction logic: validate deal if provided → calculate cost (100 base per ticket, or discounted) → deduct points → insert N tickets → send email
4. Use their row-level locking pattern

#### `src/app/(main)/events/[id]/page.tsx` — High
**3 blocks: query setup, onSuccess, UI rendering**

**Resolution:** Take THEIR UI — it has discount code UI, price display with discounts, and better structure. Overlay our `quantity` selection and `selectedAccessTypeId` logic. Their discount code section is valuable and ours doesn't have it.

---

### Admin Panel

#### `src/app/admin/dashboard/page.tsx` — High
**2 blocks: component structure + render**

**Resolution:** Take THEIR side entirely. Their admin dashboard is feature-complete with CRUD for events, deals, task management, and analytics. Ours is a placeholder.

---

### User Dashboard

#### `src/app/(main)/dashboard/page.tsx` — High
**3 blocks: mutation params, completedCount, TaskList props**

**Resolution:**
- **Mutation params:** Use their approach — it supports both `proofUrl` and `proofImageUrl` for submissions
- **completedCount:** Use their categorized approach (completed, in-progress, rejected, available) — richer UX
- **TaskList props:** Use their callback signatures that match the mutation

#### `src/components/user-dashboard/task-list.tsx` — Low
**2 blocks: prop types + hasAnyTasks**

**Resolution:** Use their `any[]` typing (necessary for mixed task types). `hasAnyTasks` order doesn't matter.

#### `src/components/layout/user-submissions.tsx` — Low
**1 block: error handling**

**Resolution:** Keep their optimistic UI rollback (`context?.previous`). It's more resilient.

#### `src/components/layout/manage-task/TaskFormModal.tsx` — Medium
**2 blocks: defaultDuration + additional section**

**Resolution:**
- **defaultDuration:** Use `30` (their value) — aligns with session-based YouTube tracking which has shorter default watch times
- **Additional section:** Keep their fields (task type, points) — valuable for admin task creation

---

### User Service

#### `src/services/user.service.ts` — High
**7 blocks: imports, types, queries, points updates**

| Block | Ours | Theirs | Decision |
|-------|------|--------|----------|
| Imports | `getUserTier, getStreakMultiplier` | `ReferralService` | **Theirs** (tiers removed from ours) |
| UserPointsResult | `tier: string` | `lifetimePoints: number \| null` | **Theirs** |
| UserProfile | `& { tier: string }` | `& { lifetimePoints, referredBy, referredByName }` | **Theirs** |
| getUserPoints return | `tier: getUserTier(...)` | `lifetimePoints: user.lifetimePoints` | **Theirs** |
| getProfile query | Includes `completedTasksCount` | Includes `lifetimePoints, referredBy` with join | **Theirs** (more complete) |
| claimProfileReward | SQL-based points | Value-based + lifetimePoints | **Mix** — their locking + our SQL safety |
| claimReferralReward | SQL-based points | Value-based + lifetimePoints | **Mix** — same approach |

**Resolution:** Take their version as base — it has the more complete profile/points system. Ours was built on an older version without these features. The `tier` system was already removed in our branch.

---

### Other Files

#### `src/lib/manage-task/types.ts` — Low
**1 block: Task type fields**

**Resolution:** Keep both field sets. Their fields (`socialPlatform`, `targetUrl`, `isActive`) complement ours (`isFlash`, `isShare`, `expiresAt`).

#### `src/services/event.service.ts` — Low
**1 block: post-fetch cleanup**

**Resolution:** Take their approach — auto-cleanup of past events from DB is beneficial. Remove our `console.log`.

#### `src/app/api/user/tasks/claim-profile/route.ts` — Low
**1 block: imports**

**Resolution:** Keep their `rateLimit` import (security). Add our `toNextResponse` if still used in the file.

#### `src/app/api/user/tasks/claim-referral/route.ts` — Low
**1 block: imports**

**Resolution:** Same as claim-profile — keep `rateLimit`.

#### `src/app/api/user/tasks/daily-login/route.ts` — Low
**1 block: imports**

**Resolution:** Same as above.

---

## Resolution Order (recommended)

1. **`package.json` + `package-lock.json`** — base deps
2. **`src/db/schema.ts`** — foundation for everything (take rhikibranch, overlay HEAD's anti-fraud columns)
3. **`src/db/user-queries.ts`** — depends on schema
4. **`src/proxy.ts`** — middleware, independent
5. **`src/lib/manage-task/types.ts`** — type definitions
6. **`src/lib/validations/task.ts`** — validation schemas (add `heartbeatSchema`)
7. **`src/lib/rate-limit.ts`**, **`token-crypto.ts`**, **`task-detector.ts`** — new files, keep as-is
8. **`src/services/youtube.service.ts`**, **`referral.service.ts`**, **`security.service.ts`** — new files, keep as-is
9. **`src/services/user.service.ts`** — core service (take rhikibranch, add HEAD fraud columns)
10. **`src/services/task.service.ts`** — core service (complex — hybrid YouTube, pointsLog, pagination)
11. **`src/services/ticket.service.ts`** — core service (merge quantity + deal codes)
12. **`src/services/event.service.ts`** — minor
13. **`src/auth.ts`** — already clean (rhikibranch's full Google OAuth)
14. **Auth routes** (`signup/route.ts` — take rhikibranch for rate limiting + verification; `youtube-complete/route.ts` — hybrid; `watch-session/route.ts` — new, keep; `tickets/redeem/route.ts` — merge; `claim-*` routes)
15. **Components** (`youtube-modal.tsx`, `task-card.tsx`, `task-list.tsx`, `TaskFormModal.tsx`, `user-submissions.tsx`)
16. **Pages** (`dashboard/page.tsx`, `events/[id]/page.tsx`, `admin/dashboard/page.tsx`)
17. **Email + templates** (`email.ts`, `emails/verify-email.ts`, `emails/reset-password.ts` — Nodemailer, keep as-is)

---

## Post-Merge Verification Checklist

- [ ] `npm install` — deps resolved
- [ ] `npx tsc --noEmit` — no type errors (except pre-existing `[...nextauth]/route.ts`)
- [ ] `npm run dev` — server starts
- [ ] Sign up with email → verification email sent → click link → verified
- [ ] Sign in with credentials → works
- [ ] Sign in with Google/Facebook → auto-verified
- [ ] Forgot password flow → email sent → reset works
- [ ] Redeem ticket (no deal) → points deducted, ticket created
- [ ] Redeem ticket (with deal code) → discount applied
- [ ] YouTube task → `startSession` returns `videoDuration` → heartbeats every 30s → `complete` with `accumulatedWatchTime >= 85%`, coverage >= 75%, no gap > 2 intervals
- [ ] Facebook task → completes with verification
- [ ] Daily login → streak tracked, points awarded
- [ ] Deals listing → redeem → code revealed
- [ ] Admin dashboard → CRUD events, tasks, deals
- [ ] Leaderboard → sorted by lifetimePoints correctly
- [ ] Profile → settings, tickets, referrals all work
- [ ] Share tasks → click tracking works
