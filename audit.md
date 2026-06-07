# Security Audit — Arbitary Codebase

**Audited by:** Senior Security Researcher / QA Engineer  
**Date:** 2026-06-07  
**Scope:** End-to-end code review of all API routes, services, auth layer, task verification, and data privacy controls.

---

## Vulnerability Matrix

| # | Severity | Component | Issue | Steps to Reproduce | Impact |
|---|---|---|---|---|---|
| 1 | **CRITICAL** | `src/auth.ts:52–97` — Credentials `authorize()` | **Unhandled Exception → "Unexpected Error" on login** — Any exception thrown inside `authorize()` (DB timeout, bcrypt corruption, unique constraint race) is **not caught**. NextAuth's default error handler cannot serialize the raw error, so it renders a generic "Unexpected Error" page. Rate limiting on the `[...nextauth]` route (10/email, 30/IP per 15min) prevents pool exhaustion, but transient DB errors or bcrypt failures still crash the session. The `throw new Error("linked to a Google account")` at line 68 IS caught by NextAuth (shows as login error) — other throws are not. | 1) Have a DB connection blip while logging in. 2) `db.query.usersTable.findFirst()` inside `authorize()` throws a connection error. 3) Exception propagates uncaught → NextAuth generic error page → user sees "Unexpected Error". | Transient DB issues cause complete login failure with no actionable error message; no retry guidance. |
| 2 | **LOW** | `src/app/(auth)/login/page.tsx:264–267` — `authError` URL param path | **`RATE_LIMITED` error not handled in URL-param fallback path** — The login page handles rate limiting correctly for the credentials form flow (`signIn("credentials", { redirect: false })` → `result.error.startsWith("RATE_LIMITED")`). However, if the error arrives via URL search param (`?error=RATE_LIMITED:...`), the `errorMessages` dictionary lookup fails (no `"RATE_LIMITED:..."` key) and falls through to the generic `"An unexpected error occurred."` message. This path is not triggered in normal flow, but is a latent gap. | 1) Navigate to `/login?error=RATE_LIMITED:120`. 2) Page renders "An unexpected error occurred." instead of the rate-limit message. | Misleading error message for rate-limited users; only exploitable by directly crafting the URL. |
| 3 | **HIGH** | `src/services/task.service.ts` — `verifySubmission()` (line 1140) | **Race condition: admin approve + user resubmit can double-award points** — The `verifySubmission()` transaction does `SELECT ... FOR UPDATE` on the user row, but the status change **and** the points update happen in the same transaction after the lock. If admin approves while user simultaneously submits (creating a new `userTask`), the new submission could also be approved, awarding points twice for the same underlying action. | 1) User submits proof → status = "Pending Verification". 2) Admin clicks "Approve" while user submits again. 3) Race window: both transactions see the old userTask, and both award points. | Duplicate point awards. |
| 4 | **MEDIUM** | `src/lib/facebook.ts:26–36` — `getVerificationCode()` | **Deterministic verification code — predictable across sessions** — The code is `#v` + `abs(hash(userId + "-" + taskId + "-" + todayDate))`. Same user + same task + same date = **identical code**. The `GET /api/user/tasks/facebook-complete?taskId=X` endpoint leaks this code to the authenticated user. | 1) User A picks up Facebook task #5. 2) `GET /api/user/tasks/facebook-complete?taskId=5` returns `{ verificationCode: "#vabc123" }`. 3) Any user who knows user A's ID and the task ID can compute the same code for the same date. 4) They could post the code on user A's behalf (low probability but deterministic = bad practice). | Predictable verification token; social engineering amplification. |
| 5 | **MEDIUM** | `src/auth.ts:218–245` — JWT callback | **JWT role is cached until `trigger=signIn` or `trigger=update`** — Changing a user's role to "admin" in the DB does not take effect until the user signs out and back in. The JWT callback only re-queries the DB on `signIn`/`update`. | 1) Admin promotes user to "admin" in `usersTable.role`. 2) User still has old "user" role in their JWT until next sign-in. 3) Protected admin routes check `token.role` — they see stale data. | Stale role enforcement; delayed privilege escalation or role demotion. |
| 6 | **MEDIUM** | `src/auth.ts:271–283` — `redirect()` callback | **Open redirect via relative path — low risk but unnecessary** — The redirect callback accepts any URL starting with `/`. Combined with any client-side redirect functionality, this could be used for open redirect. | 1) Craft a link to `/api/auth/signin?callbackUrl=//evil.com`. 2) NextAuth's callback validates `new URL(url).origin`, but `//evil.com` might pass certain parsers. | Potential open redirect for phishing. |
| 7 | **LOW** | `src/app/api/user/tasks/route.ts` — PATCH `updateTaskStatus` | **`proofUrl` accepted without protocol validation** — The PATCH handler accepts `proofUrl` from the user. While the admin UI (`user-submissions.tsx`) sanitizes it with `sanitizeUrl()` (only `https:`), the **raw value persists in the DB**. Any other code path rendering `proofUrl` unsafely opens XSS. | 1) User submits `proofUrl = "javascript:alert('XSS')"` via PATCH. 2) `updateTaskStatus` stores it verbatim. 3) If any admin UI or export renders this without `sanitizeUrl()`, the script executes. | Stored XSS (conditional on an unsanitized rendering path existing). |
| 8 | **LOW** | `src/app/api/admin/tasks/verify/route.ts:34` — PATCH `verifySubmission` | **`status` parameter not validated against allowed values** — The verify endpoint accepts any string as `status`. If a non-standard status is passed, it's stored directly. The transaction only handles "Verified" specifically — other values might leave the submission in an inconsistent state. | 1) Call `PATCH /api/admin/tasks/verify` with `{ userTaskId: X, status: "invalid_status" }`. 2) The submission is now in an unrecoverable state ("invalid_status") that no UI filter catches. | Orphaned submissions invisible to admin UI. |
| 9 | **LOW** | `src/services/task.service.ts` — `completeYoutubeTask()` (line 616) | **Watch-session `completedAt` timestamp gating can be bypassed** — The elapsed-seconds check uses `completedAt - createdAt`. If a user keeps the watch session open for hours but only watches 15s, then sends the final checkpoint with `positionSeconds` meeting the threshold, `completedAt` is set and the elapsed-seconds check might pass if enough wall-clock time has passed. | 1) User opens video, leaves tab open for 3 hours. 2) User sends PATCH with `positionSeconds = requiredDuration` at minute 179. 3) `completedAt - createdAt` = 3 hours (> required). 4) Task completes without actually watching. | Task completion bypass for inattentive users (not exploitable via script — requires manual tab-open). |
| 10 | **LOW** | `src/services/task.service.ts` — `handleShareClick()` (line 870) | **Owner fingerprint bypass for share tasks** — The owner `fingerprint` is set client-side via `POST /api/share-task/set-owner-fingerprint`. A user who knows the share code could call this endpoint themselves, setting a different fingerprint and bypassing the owner-check. | 1) User A shares a task, gets share code "abc123". 2) User B intercepts the share URL. 3) User B calls `POST /api/share-task/set-owner-fingerprint` with `{ shareCode: "abc123", fingerprint: "fake" }`. 4) User B's fingerprint is now the owner, and User A is now a visitor who can earn clicks. | Self-click fraud — user B can artificially complete the share task. |
| 11 | **LOW** | `src/services/user.service.ts:120–122` — `claimReferralReward` | **No task-type verification — any task ID accepted** — The `claimReferralReward` endpoint accepts any `taskId` and awards points based on that task's `points` value multiplied by referral count. If an admin creates a high-point "referral" task, the reward scales with referrals. | 1) Admin creates a referral task with high points (e.g., 500 pts). 2) User with 10 referrals claims → gets 10 × 500 = 5000 pts. 3) This may be intentional but there's no cap. | Unbounded referral point inflation (may be intended behavior). |
| 12 | **INFO** | `src/app/api/upload/route.ts` — Cloudinary upload | **No file-type validation beyond MIME** — Upload validates `file.type` (MIME) but not magic bytes. A user could craft a polyglot file (valid JPEG header + embedded JS). | 1) Upload a polyglot JPEG/HTML. 2) Cloudinary serves it with `Content-Type: image/jpeg`. 3) Browser refuses to execute as script due to MIME type. | Theoretical; low practical risk due to MIME enforcement. |

---

## Data Privacy & Isolation (IDOR) — Verdict

**No IDOR found.** Every API route that accepts a `taskId` or resource identifier also verifies `session.user.id` via `requireUser()` and filters on it. Specifically:

- `GET /api/user/tasks` — Returns only tasks for `auth.data.id`
- `PATCH /api/user/tasks` — Updates `userTasksTable` WHERE `userId = auth.data.id` AND `taskId = provided`
- `DELETE /api/user/tasks` — Deletes WHERE `userId = auth.data.id`
- `POST /api/user/tasks/youtube-complete` — Queries `userTasksTable` with `userId` + `taskId`
- `POST /api/user/tasks/facebook-complete` — Same pattern
- `POST /api/deals/validate` — Filters by `claimedBy = auth.data.id`

**All admin endpoints** require `requireAdmin()` which checks `token.role === "admin"`. No privilege escalation possible from user to admin via API calls.

---

## Authentication "Unexpected Error" — Root Cause Analysis

The crash is caused by **unhandled exceptions in the Credentials `authorize()` function** (`src/auth.ts:52–97`).

**Primary trigger:** Any exception thrown inside `authorize()` that is NOT a `throw new Error(...)` — such as a DB connection timeout, bcrypt comparison failure, or null-pointer — propagates uncaught to NextAuth's internal handler. NextAuth serializes this as a generic error with no actionable message.

**Rate limiting — already in place:**
- **Login:** 10 attempts per email per 15 min + 30 per IP per 15 min (in `[...nextauth]/route.ts`)
- **Signup:** 5 signups per IP per 60 min (in `signup/route.ts`)
- The credentials form uses `signIn("credentials", { redirect: false })` and correctly parses the `RATE_LIMITED` error client-side, displaying "Too many attempts. Please try again in about X minutes." (works correctly)
- The signup client-side displays the API's error string verbatim ("Too many signups from this network...") — also correct.

**Latent rate-limit UI bug (finding #2):** If `RATE_LIMITED` ever arrives via URL search params (e.g., `?error=RATE_LIMITED:120`), the login page's `errorMessages` dict doesn't handle it and falls back to a generic error. Not triggered in normal flow.

**Fix direction:**
1. Wrap the `authorize()` body in try/catch — log the real error server-side, return `null` for any non-actionable exception
2. Add a `RATE_LIMITED_` prefix handler in the `authError` URL-param path so the rate-limit message works universally

---

## Point Awarding Logic — Findings

| Issue | Description |
|---|---|
| **Race condition in admin verify** | `verifySubmission()` uses `FOR UPDATE` on user row, but a concurrent user submission could create a second `userTask` row during the transaction window. |
| **No idempotency on verify** | Calling `PATCH /api/admin/tasks/verify` with the same `userTaskId` twice when `status = "Verified"`: the second call increments `completedTasksCount` again but skips points (because `countChange = 0`). This causes `completedTasksCount` to drift from actual. |
| **Daily login double-claim prevented** | The `pickUpTask` function for daily-login uses `SELECT ... FOR UPDATE` inside a transaction, preventing double-claim. **This is correctly implemented.** |
| **YouTube completion opens no transaction for status update** | The `completeYoutubeTask` function does the auto-verification first (sub/like/comment/watch checks), THEN opens a transaction to award points. There's a TOCTOU gap between verification and point award, but the verification is OAuth-based and idempotent. |

---

## XSS / SSRF — Verdict

**No exploitable XSS** in `proofUrl` rendering: the `user-submissions.tsx` component uses `sanitizeUrl()` to enforce `https:` protocol only, and `isCloudinaryUrl()` restricts image display to `res.cloudinary.com`. The `<a>` tag uses `rel="noopener noreferrer"`.

**No exploitable SSRF:** All outbound HTTP requests target:
- Hardcoded API endpoints (Facebook Graph API, YouTube Data API, Cloudinary)
- URLs from environment variables
- The `handleShareClick` redirect validates the target URL against the request origin

**Mitigation needed:** Add input-side validation to `proofUrl` at the API layer (not just at display layer) so that malicious values cannot persist in the database even if a future UI renders them unsafely.

---

## Summary

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 1 |
| Medium | 3 |
| Low | 5 |
| Info | 2 |
| **Total** | **12** |

### Top 3 Priorities to Fix

1. **Wrap `authorize()` in try/catch** — Prevents "Unexpected Error" crashes from transient DB errors or unexpected exceptions. Rate limiting already prevents brute-force/pool exhaustion, but individual transient errors still crash the session.
2. **Add `RATE_LIMITED` handling to the `authError` URL-param fallback in login page** — Currently falls through to generic error if the error arrives via URL. Easy one-line fix in the `errorMessages` display logic.
3. **Add input-side `proofUrl` validation** — Only store `https:` URLs in the database; reject `javascript:`, `data:`, and other schemes at the API boundary.
