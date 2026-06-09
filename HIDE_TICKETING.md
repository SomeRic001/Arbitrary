# Hiding Rewards/Deals & Ticketing Transactions from Client UI

**Date:** 2026-06-09
**Status:** Applied

## Scope

Temporarily remove the following from the client-facing UI:
- `/deals` (Rewards system) — navigation link + page
- All ticket purchasing/redemption transaction flows
- Profile Tickets tab (results of past purchases)

All backend logic, API routes, services, DB schemas, and admin tools remain **untouched**.

---

## Files Modified

| # | File | What Changed |
|---|------|-------------|
| 1 | `src/components/ui/header.tsx` | Removed `"Rewards"` from desktop & mobile nav arrays |
| 2 | `src/app/(main)/deals/page.tsx` | Replaced full JSX with a clean "temporarily unavailable" placeholder |
| 3 | `src/app/page.tsx` | `"Get Tickets"` → `"View Event"` |
| 4 | `src/app/(main)/events/page.tsx` | `"Get Tickets"` → `"View Details"` |
| 5 | `src/app/(main)/events/[id]/page.tsx` | Stripped purchasing sidebar (tier selector, pricing, discount code, buy/redeem buttons, quantity modal) + related state/hooks. Hero, date, venue, description, timeline kept. |
| 6 | `src/app/(main)/profile/page.tsx` | Removed `TicketsTab` import, `"tickets"` from `Tab` type & `TAB_TITLES`, its render branch |
| 7 | `src/app/(main)/profile/_components/profile-sidebar.tsx` | Removed `"tickets"` from `Tab` type and the tickets entry from the `tabs` array |

## Files Kept Intact

- `src/app/(main)/profile/_components/tickets-tab.tsx` — component file preserved on disk, logic intact for re-enable
- All API routes under `src/app/api/deals/`, `src/app/api/tickets/`, `src/app/api/user/tickets/`, `src/app/api/redemptions/`
- `src/services/ticket.service.ts`
- `src/db/schema.ts`
- All admin pages (`src/app/admin/tickets/scanner/`, `src/app/admin/tickets/redeem/`, `src/app/admin/dashboard/_components/deals-manager.tsx`)
- All reward animation components (`reward-context.tsx`, `animated-counter.tsx`)
- All points displays (`profile-dropdown.tsx`, profile stats, task cards)

## Re-enabling

To restore, reverse each change above:
1. Add `"Rewards"` back to header nav arrays
2. Restore the original `/deals` page return
3. Change `"View Event"` / `"View Details"` back to `"Get Tickets"`
4. Restore the purchasing sidebar in `events/[id]/page.tsx`
5. Restore the TicketsTab import, type, and render in `profile/page.tsx`
6. Restore `"tickets"` in `profile-sidebar.tsx`
