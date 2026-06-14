# Security & Abuse Audit

_Authored 2026-06-12. Append new items at the bottom._

---

## Gaps Found

| Gap | Severity | Details |
|---|---|---|
| No disposable/temp email detection | CRITICAL | No check against known temp-mail domains. Attackers can register unlimited accounts via `mailinator.com`, `10minutemail.com`, etc. |
| No CAPTCHA on signup | CRITICAL | No bot challenge (reCAPTCHA, Turnstile, hCaptcha) on the signup form. Scripts can POST unlimited registrations. |
| No middleware-level filtering | HIGH | No `middleware.ts`. No global IP blacklisting, edge-level rate limiting, or request filtering. |
| Rate limiting is DB-backed, fixed window | HIGH | Uses PostgreSQL `INSERT … ON CONFLICT`. No sliding window, no Redis/Upstash. Creates DB contention under load. |
| No IP banning | HIGH | Rate limiting only returns 429. No mechanism to block an IP after repeated abuse. |
| No signup CSRF protection | MEDIUM | Signup POST has no CSRF token. |
| Weak signup rate limit (5/IP/hr) | MEDIUM | A single IP can create 120 accounts per day. |
| Email not lowercased consistently | MEDIUM | Stored as-typed in signup, but lowercased in forgot-password — potential duplicate accounts via casing tricks. |
| No Content Security Policy | MEDIUM | `next.config.ts` has security headers but no CSP. |

---

## Proposed Fixes & What Each Solves

### 1. Cloudflare Turnstile (CAPTCHA)
**Solves:** Bulk automated registrations. Bots cannot complete the challenge, so a script cannot POST thousands of signups even with rotating IPs. Free and privacy-first (no user data collection).

### 2. Disposable Email Blocking
**Solves:** Temp-mail account creation. Blocks known disposable domains before the user record is created. Cuts the abuse pipeline before email verification runs.

### 3. Honeypot Field
**Solves:** Dumb scrapers. An invisible form field that humans skip but bots fill. Catches generic automation with zero user friction.

### 4. Fingerprint.js at Signup
**Solves:** Multi-account abuse through rotating IPs. Same device → same fingerprint even behind different IPs. Allows server-side duplicate detection and flagging.

### 5. Domain-Based Rate Limiting (e.g. max 10/hr per domain)
**Solves:** Attackers cycling many emails on the same temp-mail domain while staying under per-IP limits.

### 6. Staged IP Banning
**Solves:** Persistent abusers. After exceeding rate limits N times, escalate from 429 to progressively longer cooldowns.

---

## Chosen Plan

**Phase 1 (immediate):**
- Cloudflare Turnstile on signup form
- Disposable email blocking via local domain list + server-side check

**Phase 2 (if manual multi-account farming becomes a problem):**
- Fingerprint.js at signup (library already in the project)
- Domain-based rate limiting

---

## Future Items

_Add notes below as you identify new risks or requirements._

---

## Proposed Feature: YouTube Live Stream + Chat + Watch-Time Rewards

### What Exists Today
- Watch session tracking (`watchSessionsTable`) with heartbeat logging and anti-cheat gap validation
- YouTube IFrame API integration (Records player + YouTube task modal)
- Points reward system with streak multipliers
- `VIDEO_WATCH` task type with known `videoDuration` and 85% completion threshold
- Admin task creation UI (`TaskFormModal.tsx`)

### What Would Need Building

**1. Live Stream Page + Chat**
- Dedicated live stream page (not the bottom-right monitor) using YouTube IFrame API with `playerVars: { rel: 0, modestbranding: 1 }`
- Live chat embed: `<iframe src="https://www.youtube.com/live_chat?v=LIVE_ID&embed_domain=DOMAIN" />` in a side panel alongside the video
- Auto-reconnect on stream end (show VOD or next scheduled stream)

**2. Live-Specific Watch Tracking**
- New task type like `LIVE_WATCH` (videoDuration = null mode): tracks **total minutes watched** instead of percentage
- Points awarded per threshold (e.g. "watch 10 min → 10 pts, 20 min → 20 pts")
- Reuses existing heartbeat + `watchSessionsTable` with `videoDuration` set to 0/null

**3. Admin Task Creation**
- Admin form variant for live stream: YouTube live ID, required watch time (minutes), points reward
- Threshold-based (watch X min → Y pts) or tiered (watch 10 min = 10 pts, 20 min = 20 pts, etc.)

---

## Live Stream Anti-Cheat Layers

### Attack: Background Tab / Walk Away
Heartbeats alone can't distinguish "watching" from "left open in background."

### Layer 1 — Passive (zero friction, always on)
- **Tab Visibility API**: pause watch time when tab is hidden/switched
- **Window Focus/Blur**: pause when window loses focus
- **Idle detection**: pause if no mouse/scroll/touch for 3 minutes
- **Heartbeat max gap** (60s, already exists)

### Layer 2 — Engagement Checkpoint (low friction)
- Every 8–10 minutes: subtle **"Keep Watching"** pill appears with 10s countdown
- Click to continue, or watch time pauses
- ~6 clicks/hour, less friction than ad breaks

### Layer 3 — Earning Caps (safety net)
- Max 100 pts/day from live streams
- Max 60 min session per task pickup
- Diminishing returns: 1× first 10 min, 0.5× next 10 min, 0.25× remainder

### Layer 4 — Optional Chat Bonus (engagement incentive)
- +20% bonus if user sends a YouTube chat message during session
- Verify via YouTube API that user's YouTube account commented in live chat
- Rewards real interaction without punishing passive viewers

---

## iOS YouTube IFrame API Playback Fix

### Problem
"Watch on YouTube" appears instead of inline playback on iOS (tested via HTTPS forwarded port; desktop works fine).

### Root Causes

| Issue | Location | Why it breaks on iOS |
|---|---|---|
| Audio player hidden at 1×1px | `#ytPlayerAudio` (`width:1;height:1;opacity:0`) | iOS Safari refuses to allocate a video rendering surface for elements below ~200px. Player never initialises. |
| Video iframe too small | `#ytPlayerVideo` at 244×166px inside monitor | Below iOS minimum threshold. Further shrunk by ResizeObserver `scale()` on mobile viewports. |
| No `onError` handlers | Both players | Failures are silently swallowed — no fallback or diagnostic. |

### Proposed Fix (no new files)

**1. Audio player — renderable off-screen size**
```
Replace width:1;height:1;opacity:0 → width:300px;height:200px;left:-9999px;top:-9999px;opacity:0.01
```
`opacity: 0.01` (not 0) signals iOS WebKit the element is renderable. Off-screen keeps it invisible.

**2. Video on mobile — full-screen overlay modal** (Option A)
- Add `#mobileVideoOverlay` — a fixed full-screen overlay with own YouTube player instance (`ytMobilePlayer`)
- Detect mobile in `doWatch()` via `window.innerWidth < 768`:
  - **Desktop:** existing monitor widget (unchanged)
  - **Mobile:** show overlay, mount player in `#ytMobileVideoContainer`
- Overlay has: YouTube player (full-width, 16:9), close button, track info, skip/play controls
- `skip()` branches to `ytMobilePlayer.loadVideoById()` on mobile

**3. `onError` handler** on both `ytVideoPlayer` and `ytMobilePlayer` for diagnostics.

### Files to modify
- `src/app/(main)/records/RecordsCatalog.tsx`
- `src/app/(main)/records/recordsCatalog.css`
---
