# ARBITARY — Codebase Summary

## Project Overview

A **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Drizzle ORM + PostgreSQL** gamified social task platform and event management system. Users earn points by completing social media tasks (YouTube like/subscribe/comment/watch, Facebook comments, share link clicks), maintain daily login streaks, climb rank tiers (Iron → Diamond), redeem points for deals/discount codes, and earn referral bonuses.

---

## Directory Structure

```
ARBITARY/
├── .env                          # Environment variables (gitignored)
├── .env.local                    # Local env overrides (gitignored)
├── .gitignore                    # Git ignore rules
├── AGENTS.md                     # AI agent instructions for Next.js breaking changes
├── CLAUDE.md                     # Points to AGENTS.md
├── CODEBASE_AUDIT.md             # Full security/architecture audit
├── README.md                     # Project readme
├── drizzle.config.ts             # Drizzle Kit config (PostgreSQL, schema path, migration out)
├── next.config.ts                # Next.js config (remote image patterns)
├── tsconfig.json                 # TypeScript strict config, @/* alias
├── postcss.config.mjs            # Tailwind CSS v4 PostCSS plugin
├── eslint.config.mjs             # ESLint (Next.js core-web-vitals + TS)
├── pnpm-workspace.yaml           # pnpm workspace (allows esbuild)
├── package.json                  # Scripts: dev, build, start, lint
├── tasks_test_data.json          # Seed/test data for tasks
│
├── drizzle/                      # Drizzle Kit migrations
│   ├── 0000_*.sql to 0010_*.sql  # 11 migration files
│   └── meta/                     # Migration snapshots + journal
│
├── public/                       # Static assets (images, icons)
│
└── src/
    ├── auth.ts                   # NextAuth config (Google, Facebook, Credentials, JWT)
    ├── proxy.ts                  # Route protection logic (not registered as middleware)
    ├── index.ts                  # Minimal Drizzle init (unused, use db/index.ts instead)
    │
    ├── app/                      # Next.js App Router pages + API
    │   ├── globals.css           # Global Tailwind CSS v4 styles
    │   ├── layout.tsx            # Root layout
    │   ├── page.tsx              # Landing page (hero, events, work, team, CTA)
    │   ├── providers.tsx         # Session/QueryClient/Theme providers
    │   │
    │   ├── (auth)/               # Auth route group
    │   │   ├── login/page.tsx    # Login (credentials, Google, Facebook)
    │   │   └── signup/page.tsx   # Signup (supports ?ref= referral code)
    │   │
    │   ├── (main)/               # Main app route group
    │   │   ├── about/page.tsx    # Stub
    │   │   ├── dashboard/page.tsx # User task dashboard (stats, tasks, claim, streaks)
    │   │   ├── deals/page.tsx    # Rewards store (redeem points for codes)
    │   │   ├── events/
    │   │   │   ├── page.tsx      # All events (upcoming + past)
    │   │   │   └── [id]/page.tsx # Single event detail
    │   │   ├── leaderboard/page.tsx # Top 100 users (Server Component)
    │   │   ├── profile/
    │   │   │   ├── page.tsx           # User profile with tabs
    │   │   │   └── _components/       # Profile tab components
    │   │   └── work/page.tsx     # Stub
    │   │
    │   ├── admin/
    │   │   ├── layout.tsx        # Admin layout
    │   │   ├── login/page.tsx    # Admin login
    │   │   ├── dashboard/
    │   │   │   ├── page.tsx           # Admin dashboard (tabs: Overview, Events, Tasks, Deals, Submissions)
    │   │   │   └── _components/       # Admin tab components
    │   │   └── tickets/redeem/page.tsx # Ticket redemption
    │   │
    │   ├── api/                  # API route handlers
    │   │   ├── admin/            # Admin API (tasks CRUD, deals, social-posts, tickets, verify)
    │   │   ├── auth/             # Auth API (nextauth, signup, verify)
    │   │   ├── deals/            # Deal listing + redemption
    │   │   ├── debug/google/     # Google OAuth debug
    │   │   ├── events/           # Event CRUD
    │   │   ├── redemptions/      # User redemption history
    │   │   ├── referral/         # Referral info + bind
    │   │   ├── share-click/      # Share link click logging
    │   │   ├── share-progress/   # Share task progress lookup
    │   │   ├── share-task/       # Share task owner fingerprint
    │   │   ├── tasks/            # Task operations
    │   │   ├── tickets/          # Ticket listing + redeem
    │   │   ├── upload/           # Cloudinary file upload
    │   │   ├── user/             # User profile, points, tasks, tickets, referral
    │   │   └── verify-like/      # Facebook like verification
    │   │
    │   └── r/[shareCode]/        # Share task redirect page
    │
    ├── components/               # Shared React components
    │   ├── layout/               # Layout components (form-input, loading, manage-task, user-submissions)
    │   ├── leaderboard/          # Leaderboard list component
    │   ├── sections/             # Hero section
    │   ├── ui/                   # UI primitives (header, footer, profile-dropdown)
    │   └── user-dashboard/       # Dashboard-specific components (stats, task cards, modals)
    │
    ├── db/
    │   ├── index.ts              # Drizzle ORM client (pg pool)
    │   ├── schema.ts             # Full DB schema (14 tables + relations)
    │   └── user-queries.ts       # Leaderboard query
    │
    ├── hooks/
    │   └── useAuth.ts            # Auth hook (redirects to admin login if unauthenticated)
    │
    ├── lib/                      # Utilities and business logic helpers
    │   ├── api-response.ts       # ServiceResult → NextResponse converter
    │   ├── email.ts              # Resend email integration
    │   ├── facebook.ts           # Facebook Graph API v20.0 helpers
    │   ├── rate-limit.ts         # DB-backed rate limiter
    │   ├── share-tasks.ts        # Share task utilities
    │   ├── streak-helper.ts      # Daily login streak + milestone bonuses
    │   ├── task-detector.ts      # YouTube task pattern detection
    │   ├── tiers.ts              # Rank tier thresholds
    │   ├── manage-task/          # Manage-task component types
    │   ├── social/               # Social platform types/enums
    │   └── validations/          # Zod schemas (event, task)
    │
    ├── services/                 # Business logic layer
    │   ├── auth.service.ts       # Session-based auth helpers (getOptionalUser, requireUser, requireAdmin)
    │   ├── event.service.ts      # Event CRUD with transactions
    │   ├── rank.service.ts       # Rank sync based on lifetime points
    │   ├── referral.service.ts   # Referral code generation, binding, bonus
    │   ├── result.ts             # ServiceResult<T> discriminated union pattern
    │   ├── security.service.ts   # Security utilities
    │   ├── task.service.ts       # Core task logic (1332 lines)
    │   ├── ticket.service.ts     # Ticket management
    │   ├── user.service.ts       # User CRUD
    │   └── youtube.service.ts    # YouTube OAuth verification
    │
    └── types/
        ├── db.ts                 # TypeScript types from Drizzle schema
        └── next-auth.d.ts        # NextAuth type augmentations
```

---

## Architecture & Logic

### Architecture Pattern

- **Service Layer**: Business logic is isolated in `src/services/` using a `ServiceResult<T>` discriminated union (`{success: true, data}` | `{success: false, error, status?}`)
- **Thin API routes**: Routes handle auth, parse JSON, call services, return `NextResponse`
- **No middleware**: `src/proxy.ts` exists but is not registered as actual Next.js middleware
- **Drizzle ORM**: Database access via PostgreSQL pool, schema in `src/db/schema.ts`

### Auth Flow

- **NextAuth v4** with JWT strategy, 30-day maxAge
- **3 providers**: Google OAuth, Facebook OAuth, Credentials (email+password with bcryptjs)
- OAuth providers upsert users by email on first auth
- JWT stores: userId, name, image, role, provider, lastLoginAt, bio, location, phoneNumber, social tokens
- **Google OAuth tokens** (`googleAccessToken`, `googleRefreshToken`, `googleTokenExpiry`) are persisted to the `users` table on link/sign-in and restored to the JWT on session re-creation. Refreshed tokens are also synced to DB. This ensures accounts that later link Google retain YouTube API scopes across logins.

### Gamification Logic

1. **Tasks**: Users pick up tasks from dashboard (YouTube like/subscribe/comment, Facebook comment, share link, watch video)
2. **Verification**: Server-authoritative — YouTube via OAuth API, Facebook via Graph API, watch via sessions with periodic checkpoints
3. **Points**: Awarded on completion, logged in `points_log` table
4. **Streaks**: Daily login tracked, milestone bonuses at 5d (50pts), 7d (100pts), 30d (500pts)
5. **Tiers**: Iron (0) → Bronze (500) → Silver (1500) → Gold (3000) → Platinum (6000) → Diamond (10000), based on lifetime points
6. **Deals**: Redeem points for discount codes, deal codes encrypted with crypto
7. **Referrals**: Unique code per user, bonus points on binding

### Database Schema (14 tables)

- **users** — Core user data, points, streaks, rank, referral code, Google OAuth tokens (`google_access_token`, `google_refresh_token`, `google_token_expiry` persisted for session recovery)
- **tasks** — Available tasks (type, platform, points, expiry, flash/share flags)
- **user_tasks** — Junction table tracking task assignment status (pending/completed)
- **events** — Event data with nested relations
- **content_sections** — Event content (belongs to event)
- **media_items** — Media within content sections
- **access_types** — Tickets/access levels per event
- **timeline_items** — Event timeline entries
- **user_tickets** — User-owned tickets with redemption token
- **referrals** — Referrer/referred relationships
- **points_log** — Points transaction history
- **watch_sessions** — YouTube watch duration tracking
- **rate_limits** — DB-backed rate limiting by key
- **deals** — Redeemable deals (title, cost, stock, discount type/value)
- **deal_codes** — Individual codes per deal
- **redemptions** — User redemption records
- **share_tasks** — Share link tasks with click tracking
- **share_clicks** — Individual click logs with IP/fingerprint dedup

---

## .gitignore Rules

| Pattern | What it ignores |
|---|---|
| `/node_modules` | npm/pnpm dependencies |
| `/.pnp`, `.pnp.*` | Plug'n'Play files |
| `.yarn/*` (excl. patches/plugins/releases/versions) | Yarn internals |
| `/coverage` | Test coverage reports |
| `/.next/`, `/out/` | Next.js build output |
| `/build` | Production build |
| `.DS_Store` | macOS metadata |
| `*.pem` | Certificate files |
| `npm-debug.log*`, `yarn-*.log*`, `.pnpm-debug.log*` | Debug logs |
| `.env*` | **All env files** (`.env`, `.env.local`, `.env.production`, etc.) |
| `.vercel` | Vercel deployment config |
| `*.tsbuildinfo` | TypeScript incremental build info |
| `next-env.d.ts` | Next.js TypeScript declarations |

**Important**: The `.env*` glob means any environment file is excluded from version control. If you need a `.env.example` template, you must explicitly name it outside the `.env*` pattern or override it in `.gitignore`.
