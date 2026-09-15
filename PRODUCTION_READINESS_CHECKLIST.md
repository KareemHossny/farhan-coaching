# Production Readiness Checklist

## Baseline

- [x] Repository and existing uncommitted changes inspected
- [x] Supabase migrations `0001` through `0005` identified
- [x] No production database command executed
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` passes with an existing raw `<img>` warning
- [x] `npm run lint` passes with direct ESLint
- [x] Automated unit tests exist and pass

## Phase 1 — Repository and tooling

- [x] Standardize on npm and one lockfile
- [x] Remove/ignore broken local installation artifacts
- [x] Replace deprecated `next lint` with direct ESLint
- [x] Add typecheck, unit-test, and E2E scripts
- [x] Document all Supabase environment variables
- [x] Verify service-role usage remains server-only

## Phase 2 — Arabic and UI correctness

- [x] Repair/verify Arabic UTF-8 content (source scan found no mojibake)
- [x] Load Cairo through `next/font/google`
- [x] Fix metadata, labels, empty states, and error messages
- [x] Replace raw images where appropriate
- [x] Remove fragile global CSS overrides
- [x] Implement reduced-motion behavior

## Phase 3 — Supabase security

- [x] Add corrective migration(s) only (`0006`, `0007`; not applied yet)
- [x] Add safe client-facing data RPC (`get_client_plan_items`)
- [x] Remove direct client reads from coach-only library tables in the corrective migration
- [x] Add profile/client role and ownership validation triggers
- [x] Add plan/library, grams, and day validation triggers
- [ ] Verify RLS and storage isolation against the live Supabase project

## Phase 4 — Reliable writes

- [x] Harden client creation and rollback behavior in server code and `0007`
- [x] Make plan saving atomic through `save_client_plans` in `0007`
- [x] Add progress-photo cleanup on failed writes
- [x] Standardize Server Action validation and error handling for auth, leads, plans, and progress

## Phase 5 — Types and maintainability

- [x] Add typed Supabase database definitions (manual baseline; regenerate from live schema before deployment)
- [x] Remove sensitive `any`, `@ts-nocheck`, and `as never` workarounds
- [ ] Centralize auth, validation, statuses, and action results
- [ ] Refactor oversized JSX files
- [ ] Add complete loading/error/empty/unauthorized states

## Phase 6 — Product and SEO

- [x] Add complete SEO and social metadata
- [ ] Preserve and verify the transformation carousel
- [ ] Improve navigation and destructive confirmations
- [ ] Verify active/pending/paused client behavior
- [ ] Keep InstaPay informational and manual

## Phase 7 — Verification

- [x] Unit tests pass
- [ ] RLS/security tests pass (requires the existing Supabase project and test accounts)
- [ ] End-to-end workflow tests pass (Playwright requires a running test environment/browser setup)
- [ ] Responsive viewport checks pass
- [x] Clean dependency install, lint, typecheck, and build pass locally

## Phase 8 — Deployment

- [ ] Production backup verified by the project owner
- [ ] Corrective migrations applied to the existing Supabase project
- [ ] Post-migration data and RLS verification complete
- [ ] Vercel environment variables configured
- [ ] Vercel deployment and production smoke test pass
- [x] Coach handoff/deployment documentation added

## Final verdict

- [ ] PRODUCTION READY
- [x] NOT PRODUCTION READY — external Supabase/Vercel verification and migration application remain
