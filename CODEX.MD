# Egyptian Fitness Coach Platform — Claude Code Build Guide

**Scope locked in:**
- Public landing page (Arabic, RTL)
- Client dashboard (view assigned workout + diet plan, log progress)
- Coach dashboard (manage clients, build/assign plans)
- No payment gateway — payment is manual via **InstaPay** (coach shares handle/QR, client sends money, confirms via **WhatsApp**)
- WhatsApp is the primary contact/lead channel (`wa.me` links, not an API integration — that needs a paid WhatsApp Business API and isn't worth it at this stage)

---

## 0. Before You Start

### 0.1 What you need installed
- **Node.js** (LTS version) — check with `node -v` in a terminal.
- **Claude Code** — install per Anthropic's current docs if you haven't
  already (`npm install -g @anthropic-ai/claude-code` or the installer for
  your OS; check docs.claude.com for the current method since this changes).
- A **Supabase** account (free tier) — supabase.com.
- A **Vercel** account (free tier) — vercel.com. Sign up with GitHub so
  deployment is a straight connect-and-go later.
- A **GitHub** account, and git installed locally — you'll want every
  phase committed so you can roll back a bad phase without losing earlier
  work.

### 0.2 Open the project folder
Create an empty folder for the project (e.g. `ahmed-farhan-coaching`), open
it in your terminal, and open that same folder in Claude Code — this
becomes your working directory for every prompt in this guide. Don't run
Phase 0 inside an existing unrelated folder.

### 0.3 Prepare your real assets before Phase 0
You already have these organized locally:
- A `coach/` folder with 2 photos of the coach
- A `transformations/` folder with 8 client result photos
- A logo file currently named `ChatGPT Image Aug 3, 2026, 02_31_00 PM.png`

Before touching any code, get these into shape:

1. **Rename the logo file** to `logo.png` — the original name has spaces,
   commas, and colons in it, all of which cause real problems in web paths,
   imports, and URLs. Don't skip this; it will break image loading later.
2. **Rename the coach photos** to `coach-hero.jpg` (the one you want on the
   homepage hero — pick the more dynamic/front-facing shot) and
   `coach-about.jpg` (the second one, used in the About section).
3. **Rename the transformation photos** to `transformation-1.jpg` through
   `transformation-8.jpg`, in whatever order you want them to appear.
4. You don't need to place these inside the project yet — Phase 0 scaffolds
   the Next.js app first, and the `/public` folder that these need to live
   in doesn't exist until then. Just have them renamed and ready in one
   folder on your machine so Phase 0's last step (copying them in) is a
   simple drag-and-drop.

### 0.4 The order you'll work in
1. Set up Supabase (create a project, grab your API URL + anon key —
   you'll need these as environment variables starting in Phase 0).
2. Run Phase 0 through Phase 12 below, in order, each as its own Claude
   Code prompt, checking the browser after each one.
3. Deploy (covered at the end, after Phase 12).

Don't skip ahead or combine phases — this is the single biggest lever for
avoiding the "generic/broken" drift that happens when Claude Code is asked
to do too much in one shot.

---



## 1. Tech Stack (opinionated, and why)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | One codebase for landing page + both dashboards, server actions remove need for a separate API layer, deploys free on Vercel |
| Language | TypeScript | Claude Code writes safer code with types; catches schema mismatches early |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, and shadcn components are RTL-friendly with small tweaks |
| Auth + DB | **Supabase** (Postgres + Auth + Storage) | Free tier is enough for one coach's client base; Row Level Security gives you real client-data isolation for free; Storage holds progress photos/PDF plans |
| Fonts | **Cairo** or **Tajawal** (Google Fonts, Arabic-optimized) | Default system fonts render Arabic poorly; these are the two most professional-looking Arabic web fonts |
| Hosting | Vercel (app) + Supabase (backend) | Both have generous free tiers, zero DevOps |

Total monthly cost at launch: **$0**. You only pay if the client base grows past Supabase's free tier.

---

## 2. Data Model

Sketch this out before writing any code — Claude Code performs dramatically better when it has a schema to work against instead of inventing one mid-task.

```
users (managed by Supabase Auth)
 └── profiles
      - id (uuid, FK to auth.users)
      - full_name
      - role ('coach' | 'client')
      - phone (for WhatsApp deep link)
      - avatar_url
      - created_at

clients  (extra fields only relevant to role='client')
 - id (FK to profiles.id)
 - coach_id (FK to profiles.id)
 - status ('active' | 'paused' | 'pending') — 'pending' = account created but
   not yet active (unpaid, or plan not built yet). This is NOT the same as
   the `leads` table below — leads are anonymous form submissions with no
   account at all; a `clients` row always has a real login.
 - goal (text)
 - height_cm, starting_weight_kg
 - notes (coach-only private notes)

exercise_library   (coach's reusable exercise catalog)
 - id
 - coach_id (FK)
 - name
 - muscle_group (nullable)
 - youtube_url (nullable)
 - default_sets, default_reps (text — "8-12"/"AMRAP"), default_rest_seconds
 - notes
 - created_at

meal_library   (coach's reusable meal catalog)
 - id
 - coach_id (FK)
 - name
 - calories, protein_g, carbs_g, fats_g
 - notes
 - created_at

plans
 - id
 - client_id (FK)
 - coach_id (FK)
 - type ('workout' | 'diet')
 - title
 - start_date, end_date
 - created_at

plan_items
 - id
 - plan_id (FK)
 - day_of_week (0-6)
 - order_index
 - library_item_id (nullable — references exercise_library.id or
   meal_library.id depending on the parent plan's type; polymorphic, so no
   DB-level FK constraint, just an index)
 - meal_label (text, nullable — diet plans only, e.g. "الإفطار"/"الغداء"/
   "العشاء"/"سناك"; groups plan_items visually within a day)
 - override_sets, override_reps, override_calories (nullable — per-client
   tweaks without editing the library item itself)
 - override_grams (numeric, nullable — diet plans only: the actual amount
   of this food item in grams for this specific client; this is the ONLY
   quantity shown to the client, calories/macros stay coach-internal)
 - name, details (jsonb) — fallback fields for a fully custom one-off item
   not pulled from the library

progress_logs
 - id
 - client_id (FK)
 - date
 - weight_kg
 - photo_url (nullable, Supabase Storage)
 - note

leads   (landing page contact form submissions, before becoming a client)
 - id
 - name, phone
 - message
 - created_at
 - contacted (boolean)
```

Row Level Security rules you'll need (tell Claude Code this explicitly):
- A client can only `SELECT` their own rows in `clients`, `plans`, `plan_items`, `progress_logs`.
- A coach can `SELECT`/`INSERT`/`UPDATE` rows where `coach_id = auth.uid()`.
- A coach can `SELECT`/`INSERT`/`UPDATE`/`DELETE` `exercise_library` and `meal_library` rows where `coach_id = auth.uid()`.
- A client can `SELECT` `exercise_library`/`meal_library` rows where `coach_id` matches their own `clients.coach_id` (so they can see the exercise name/video for items in their assigned plan).
- `leads` are insertable by anyone (public form), readable only by the coach.

---

## 3. Folder Structure to Ask For

```
/app
  /(marketing)
    page.tsx                → landing page
  /(auth)
    login/page.tsx
  /(client)
    dashboard/page.tsx      → client's plan + progress
    layout.tsx              → auth-guarded, role='client'
  /(coach)
    coach/page.tsx          → client list
    coach/clients/[id]/page.tsx  → build/edit a client's plan
    layout.tsx              → auth-guarded, role='coach'
  /api (only if something truly needs a route handler, e.g. webhooks — likely unused here)
/components
  /landing  (Hero, About, ContactForm, WhatsAppButton)
  /dashboard (PlanView, ProgressChart, WeekPicker)
  /ui        (shadcn components)
/lib
  supabase/client.ts
  supabase/server.ts
  types.ts
/supabase
  migrations/               → SQL schema + RLS policies, versioned
```

Giving Claude Code this structure up front stops it from scattering logic randomly across the app.

---

## 4. How to Work With Claude Code (the part most people get wrong)

**Don't** write one giant prompt asking for the whole app. You'll get a huge, inconsistent, half-broken dump. Instead:

### 4.1 Set up a `CLAUDE.md` first
This file is auto-read by Claude Code at the start of every session in that project — it's your persistent system prompt. Create it before writing any feature code:

```markdown
# Project: [Coach Name] Fitness Coaching Platform

## Stack
Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Supabase (auth+db+storage).
Language: Arabic only, RTL layout (dir="rtl" on <html>, use Cairo font).

## Conventions
- Server Components by default; "use client" only when interactivity is needed.
- All DB access through /lib/supabase — never inline Supabase calls in components.
- All new tables go through a numbered migration file in /supabase/migrations.
- Every client-facing table must have RLS enabled — never skip this.
- No payment integration of any kind. Payment = InstaPay handle shown as text/QR
  + a WhatsApp button. Do not suggest Stripe/Paymob.
- WhatsApp links use: https://wa.me/20XXXXXXXXXX?text=<url-encoded-message>
- Keep components small and in /components, not inline in page.tsx files.
- Arabic-first content everywhere — no English placeholder text in UI copy.

## Roles
- coach: full CRUD on their own clients' plans.
- client: read-only on their own plan and progress; can create progress_logs.

## Do not
- Do not invent extra features (subscriptions, notifications, blog) unless asked.
- Do not add a payment gateway.
```

Keep this updated as decisions get made — it's the single highest-leverage file in the whole project.

### 4.2 Build in phases, one Claude Code session (or clearly scoped prompt) per phase
Trying to do everything in one shot is the #1 reason people get bad results. Below are the exact phases and prompts.

---

## 5. Phase-by-Phase Prompts

Paste these into Claude Code **in order**. Wait for each to finish, review/run the app, then move to the next. Adjust the bracketed placeholders.

### Phase 0 — Scaffold
```
Initialize a new Next.js 15 project (App Router, TypeScript, Tailwind, App Router,
src directory off). Install and configure shadcn/ui. Install @supabase/supabase-js
and @supabase/ssr. Set up /lib/supabase/client.ts and /lib/supabase/server.ts
following the current official Supabase SSR pattern for Next.js App Router.
Add Cairo font from next/font/google, set it as the default font, and set
dir="rtl" and lang="ar" on the root html element. Create the CLAUDE.md file
with the content I'll provide next and follow it for the rest of this project.
```
(then paste the CLAUDE.md content above)

**Then, before moving to Phase 1:**

1. Create `.env.local` in the project root with your Supabase project's URL
   and anon key (from Supabase dashboard → Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Copy your renamed assets into `/public/images/`:
   - `logo.png` → `/public/images/logo.png`
   - `coach-hero.jpg`, `coach-about.jpg` → `/public/images/coach/`
   - `transformation-1.jpg` through `transformation-8.jpg` → `/public/images/transformations/`
3. Run `git init`, commit ("Phase 0: scaffold"). Commit after every phase
   from here on — if a phase goes badly, you want to roll back one phase,
   not the whole project.

### Phase 1 — Database schema + RLS
```
Create a Supabase migration file implementing this schema: [paste the Data
Model section from above]. Include foreign keys, sensible defaults, and
timestamps. Then write RLS policies so that: coaches can only access rows
where coach_id = auth.uid(); clients can only SELECT their own client/plan/
progress rows and INSERT their own progress_logs; anyone (anon) can INSERT
into leads but not read them. Output the full SQL migration file, don't
apply it yet — I'll review it first.
```
Review this SQL yourself (or paste it back and ask Claude Code to explain any policy) before running it — RLS mistakes are the one category of bug that actually leaks client data.

### Phase 2 — Auth
```
Implement Supabase auth: email/password login for coach and clients (no
public sign-up — the coach creates client accounts manually from their
dashboard, since clients are onboarded personally). Build:
- /login page (Arabic UI)
- Middleware that redirects unauthenticated users to /login, and redirects
  users to /coach or /dashboard based on their profiles.role after login.
- A server action for the coach to create a new client account (creates the
  auth user + profiles row + clients row in one transaction/flow).
```

### Phase 3 — Landing Page
```
Build the public landing page at app/(marketing)/page.tsx, fully in Arabic,
RTL, mobile-first (most Egyptian visitors will be on mobile). Use the
content object from /lib/content/landing-content.ts for all copy (import
nav, coach, hero, about, pricing, transformations, contact, payment, footer
from it). Structure:

0. Sticky navbar — logo.url from landing-content.ts on one side (an
   <img>, not text — it's a transparent PNG, render at a fixed height
   e.g. 36-40px, don't stretch it), nav.links as anchor links,
   nav.ctaText as a WhatsApp CTA button, collapsing to a hamburger menu on
   mobile (remember this is RTL so the menu and icons should mirror
   correctly, not just flip text direction).
1. Hero (id="home") — coach's photo (heroPhotoUrl), name, a strong
   headline, CTA button that opens WhatsApp with a pre-filled Arabic
   message.
2. About the coach — credentials, philosophy, aboutPhotoUrl.
3. Pricing (id="pricing") — pricing.plans as 3 pricing cards side by side
   (stacked on mobile), highlight the plan where highlighted=true (e.g.
   border/badge "الأكثر طلبًا"), each card ends with a WhatsApp CTA button
   prefilled with a message naming that specific plan. Show pricing.note
   below the cards.
4. Transformations gallery (id="transformations") — render
   transformations.items as a responsive image grid (2 columns mobile, 4
   desktop) using next/image with proper width/height and lazy loading.
5. Contact (id="contact") — form (name, phone, message) that inserts into
   the `leads` table via a server action, AND a prominent WhatsApp button.
6. Footer — logo.url alongside coach.name, footer.tagline, footer.quickLinks, social icons linking to
   footer.social (only render icons for links that aren't still a
   "[placeholder]" string), footer.copyrightText.

Use shadcn Card, Button components throughout.
```

### Phase 4 — Coach Dashboard: client list and leads
```
Build app/(coach)/coach/page.tsx with two sections:

1. Clients: a table/list of all clients belonging to the logged-in coach
   (from `clients` joined with `profiles`), showing name, status
   (active/paused/pending), and last progress log date. Include a button
   to add a new client (opens the create-client flow from Phase 2) and a
   link into each client's detail page.

2. Leads (separate section/tab, e.g. "الطلبات الجديدة"): a list of `leads`
   table rows where contacted = false, showing name, phone, message, and
   submission date. Each row gets two actions: "تم التواصل" (marks
   contacted = true) and "تحويل لعميل" (opens the create-client flow from
   Phase 2 pre-filled with this lead's name and phone). Leads are NOT
   clients — they have no account yet, this section exists purely so the
   coach doesn't lose track of form submissions from the landing page.
```

### Phase 5 — Coach Dashboard: plan builder
```
Build app/(coach)/coach/clients/[id]/page.tsx where the coach can:
- View the client's basic info and progress history (simple line chart of
  weight_kg over time using recharts).
- Create/edit a workout plan and a diet plan for that client, organized by
  day of week, with an add/remove row UI for plan_items (exercise name +
  sets/reps/rest for workouts; meal name + calories/macros for diet).
- Save writes to `plans` and `plan_items` tables.
```

### Phase 6 — Client Dashboard
```
Build app/(client)/dashboard/page.tsx: the logged-in client sees their
current workout plan and diet plan (read-only, organized by day of week,
today's day highlighted), and a simple form to log today's progress
(weight, optional photo upload to Supabase Storage, optional note), plus
their own weight history as a chart. Everything in Arabic, mobile-first —
assume this is checked on a phone at the gym.
```

### Phase 7 — InstaPay / WhatsApp payment flow
```
Add a "الاشتراك والدفع" section, visible to a client whose status is
'pending' or when the coach flags a plan as pending payment: display the
coach's InstaPay handle and a QR code image (I'll provide the image /
handle as a constant in config), a short Arabic instruction ("حوّل المبلغ عبر InstaPay
ثم اضغط الزر لتأكيد التحويل عبر واتساب"), and a WhatsApp button pre-filled
with a confirmation message including the client's name. No payment
gateway, no automatic verification — the coach confirms manually.
```

### Phase 8 — Polish
```
Review the whole app for: consistent Arabic copy (no leftover English
strings), consistent spacing/typography using the design tokens already in
use, loading and empty states on every data-fetching page, and basic error
handling on all server actions (try/catch + user-facing Arabic error
messages).
```

---

### Phase 9 — Exercise & Diet Libraries (with YouTube playback)

Run these five prompts in order. This replaces free-typed plan items with a
reusable library the coach builds once and reuses across all clients.

**9.1 — Migration**
```
Extend the database with two new tables and adjust plan_items to reference
them, so the coach can maintain reusable libraries instead of retyping
exercises/meals per client. Create a new Supabase migration:

exercise_library
 - id uuid pk default gen_random_uuid()
 - coach_id uuid FK -> profiles.id
 - name text not null
 - muscle_group text nullable
 - youtube_url text nullable
 - default_sets int nullable
 - default_reps text nullable  (text because reps can be "8-12" or "AMRAP")
 - default_rest_seconds int nullable
 - notes text nullable
 - created_at timestamptz default now()

meal_library
 - id uuid pk default gen_random_uuid()
 - coach_id uuid FK -> profiles.id
 - name text not null
 - calories int nullable
 - protein_g numeric nullable
 - carbs_g numeric nullable
 - fats_g numeric nullable
 - notes text nullable
 - created_at timestamptz default now()

Alter plan_items:
 - add column library_item_id uuid nullable (references exercise_library.id
   OR meal_library.id depending on the parent plan's type — don't add a DB
   level FK constraint since it's polymorphic, just index it)
 - add column override_sets int nullable
 - add column override_reps text nullable
 - add column override_calories int nullable
 - keep existing name/details columns as fallback for any fully custom
   one-off item not pulled from a library

Add RLS policies:
 - coach can INSERT/UPDATE/DELETE/SELECT exercise_library and meal_library
   rows where coach_id = auth.uid()
 - a client can SELECT exercise_library/meal_library rows where coach_id
   matches their own clients.coach_id (so they can see exercise names/videos
   in their assigned plan)
Output the full migration SQL, don't apply yet — I'll review first.
```

**9.2 — Coach library management UI**
```
Build a "المكتبة" (Library) section in the coach dashboard at
app/(coach)/coach/library/page.tsx with two tabs: "التمارين" (Exercises)
and "الوجبات" (Meals).

Exercises tab:
- Table/grid of the coach's exercise_library rows: name, muscle_group,
  a small YouTube thumbnail preview (derive from the video ID) if
  youtube_url is set, sets/reps/rest defaults.
- "إضافة تمرين" button opens a form (dialog or separate route) to add a new
  exercise: name, muscle_group, youtube_url (validate it's a real YouTube
  URL), default_sets, default_reps, default_rest_seconds, notes.
- Edit and delete actions on each row (confirm before delete, and warn if
  the exercise is currently used in any active client plan_items).

Meals tab: same pattern for meal_library (name, calories, protein_g,
carbs_g, fats_g, notes).

All server actions, Arabic UI, RTL, use shadcn Dialog/Table/Form
components matching the rest of the coach dashboard.
```

**9.3 — YouTube embed component**
```
Create a reusable component /components/YoutubeEmbed.tsx that takes a
youtubeUrl string prop, extracts the video ID (handle youtube.com/watch?v=,
youtu.be/, and youtube.com/shorts/ formats), and renders a responsive
16:9 embedded iframe player (youtube-nocookie.com/embed/<id>) with lazy
loading. If the URL is invalid or empty, render nothing instead of a
broken embed. Use this component anywhere an exercise's youtube_url needs
to actually play in the page, not just link out.
```

**9.4 — Plan builder: pick from library**
```
Update the coach's plan builder at
app/(coach)/coach/clients/[id]/page.tsx: instead of the coach typing
exercise/meal names freehand, replace that input with a searchable
"إضافة من المكتبة" (Add from library) picker — a combobox/command palette
(shadcn Command component) listing the coach's exercise_library (for
workout plans) or meal_library (for diet plans), filterable by typing.
Selecting an item adds a plan_item row referencing library_item_id,
prefilled with the library defaults (sets/reps/rest, or calories/macros),
which the coach can then override per client using override_sets/
override_reps/override_calories without touching the library item itself.
Still allow a "عنصر مخصص" (custom one-off item) option for anything not in
the library, falling back to the existing name/details fields. Show the
exercise's YouTube thumbnail next to it in the picker if one exists.
```

**9.5 — Client dashboard: video playback**
```
Update the client dashboard's plan view (app/(client)/dashboard/page.tsx)
so that each workout plan_item shows its exercise name, sets/reps/rest
(using the override if set, otherwise falling back to the library
defaults), and — if a youtube_url exists on the linked exercise_library
row — renders the YoutubeEmbed component so the client can watch the
exercise demo directly on the page rather than following an external link.
Keep it collapsed/expandable per exercise on mobile so the page doesn't
get too long with 8 videos.
```

Run 9.1 first and actually review the SQL before applying it — this alters
a table you're already using in production data (if you have real clients
in there already, back up first). Then 9.2 through 9.5 in order, testing
in the browser between each.

---

### Phase 10 — Diet Plans Grouped by Meal, Grams-Only for Clients

Run in order. This makes diet plans read like a real meal plan (الإفطار /
الغداء / العشاء / سناك) and ensures the client only ever sees grams — never
calories or macros, which stay as the coach's own reference data.

**10.1 — Migration**
```
Alter plan_items to support meal-grouped diet plans:
 - add column meal_label text nullable (used only on diet-plan items —
   e.g. "الإفطار", "الغداء", "العشاء", "سناك"; groups items visually within
   a day, coach can type a custom label too, not just presets)
 - add column override_grams numeric nullable (the actual serving size in
   grams for this specific client — this is what gets shown to the client,
   not calories/macros)
Output the migration SQL, don't apply yet — I'll review first.
```

**10.2 — Coach plan builder: meal sections + grams**
```
Update the diet-plan side of the coach's plan builder at
app/(coach)/coach/clients/[id]/page.tsx: for each day, let the coach add
one or more meal sections (meal_label — offer quick presets "الإفطار",
"الغداء", "العشاء", "سناك" as buttons, but allow typing a custom label too).
Within each meal section, use the existing library picker to add food
items from meal_library, and require the coach to enter override_grams
(the amount in grams for this client) when adding each item — show it as
a number input with "جرام" suffix. The coach can still see the item's
calories/protein/carbs/fats from the library for their own reference while
building the plan (e.g. in a muted subtitle under the item), but make it
visually clear this reference data is coach-only and won't be shown to the
client.
```

**10.3 — Client dashboard: meal-grouped, grams-only**
```
Update the client dashboard's diet plan view (app/(client)/dashboard/page.tsx)
so that for the selected day, items are grouped under their meal_label as
section headings (e.g. "الإفطار"), in order_index order within each
section. Each food item shows ONLY its name and override_grams — formatted
like "أرز أبيض مسلوق — ١٥٠ جرام" — with NO calories, protein, carbs, or fat
numbers displayed anywhere on this page. Keep the workout plan view
untouched; this only affects the diet plan view.
```

---

### Phase 11 — Premium Visual Redesign

The functional build is done — this phase is visual-only. Run these four in
order; each is scoped to a layer so Claude Code doesn't half-apply changes
across unrelated files.

**Design tokens** (reference for all four prompts):
- Background `#0F0F11`, surface `#1A1A1D`, hairline border `#2C2C30`
- Text `#F3F1EC`, muted text `#9C9A94`
- Accent (from the coach's real logo — lime `#E2FD4B`), accent deep/olive `#5F7E15` for hover/shadow states — used sparingly and deliberately (CTA fills, key stat numbers, active states, the top-tier pricing plan's edge), never as a diffuse glow or gradient wash across a whole section
- Display font: Cairo, weight 800/900, headlines and big numbers only
- Body font: Tajawal, weight 400/500, everything else
- Elevation via 1px hairline border + surface color shift, not drop-shadows
- Border radius: smaller/tighter than shadcn default (~6px) — structured, not bubbly

**11.1 — Global design tokens**
```
I'm providing design-tokens.css with the exact CSS custom properties for
this project (colors sampled from the real logo, not placeholders). Merge
its :root block into globals.css exactly as given — don't invent different
values. Then:
- Load Cairo at weight 800/900 for headline/display text and big numbers
  only, and Tajawal at weight 400/500 as the base body font, via
  next/font/google.
- Go through every shadcn Card usage in the app and replace the default
  box-shadow-based elevation with: background: var(--surface), border: 1px
  solid var(--border-hairline), no box-shadow.
- Set the global border-radius scale to var(--radius-base) (6px) instead of
  the shadcn default, everywhere.
- Apply var(--bg-ink) as the page background and var(--text-primary) /
  var(--text-muted) as the default text colors.
Do not touch page structure or content yet — token layer only, so every
page inherits it. After this, actually load the site and confirm text is
still readable everywhere (check every page, not just the homepage) before
moving on — a global token change is the change most likely to silently
break contrast somewhere.
```

**11.2 — Hero redesign**
```
Redesign the landing page hero section to feel like a premium athletic
brand, not a generic SaaS hero. Reference direction: bold, editorial,
confident — think a premium gym/training brand, not a soft startup page.
- Full-bleed coach photo (heroPhotoUrl) as a large background/side image
  with a dark gradient overlay so text stays legible, not a small circular
  avatar.
- Oversized headline in Cairo 900 weight, large scale (clamp sized, e.g.
  clamp(2.5rem, 6vw, 5rem)), tight leading, right-aligned to match RTL flow
  naturally rather than centered.
- Below the headline, add a horizontal "scoreboard" stat strip — render
  stats from landing-content.ts (value + label for each), separated by thin vertical hairline dividers, styled like a
  stats bar, not cards. Use Cairo for the numbers, Tajawal for the labels
  beneath them.
- One deliberate motion moment on load: headline and image reveal with a
  short staggered fade/slide (under 600ms total), no repeated fade-up
  animations elsewhere on the page.
- CTA button in the lime accent color, solid fill, no gradient.
Keep the WhatsApp CTA functionality exactly as it is, just restyle it.
```

**11.3 — Pricing and transformations**
```
Restyle two sections to match the new premium dark/lime design system
(from the token update already applied):

Pricing: style the 3 plan cards like membership cards — dark surface panels
with a hairline border, and give the highlighted plan (highlighted: true) a
lime-colored border/foil edge instead of a badge, so it reads as the
"premium tier" the way a black/gold membership card would, rather than a
generic "most popular" ribbon.

Transformations gallery: I'm providing the exact component code for this —
save it as /components/landing/TransformationsMarquee.tsx exactly as given,
don't rewrite or "improve" it, then import and render
<TransformationsMarquee /> in place of the current transformations section.
It replaces next/image with plain <img> deliberately (documented in the
file's comments) and sets dir="ltr" on the track specifically to avoid the
RTL + translateX(-50%) direction mismatch that causes this kind of marquee
to disappear. If anything about styling needs to change, edit this file
directly rather than regenerating the section from scratch.

Keep all functionality (WhatsApp links, content from landing-content.ts)
exactly as is — this is a visual-only pass.
```

**11.4 — Dashboards**
```
Apply the same premium dark/lime design system to the coach and client
dashboards (not the marketing page — those already have real functional
density, so keep decoration minimal there): dark surfaces, hairline borders
instead of card shadows, lime accent used only for primary actions and
active/selected states (e.g. the current day tab, the primary save button),
Cairo for section headings and key numbers (like weight in the progress
chart), Tajawal for everything else. Do not change any functionality, data,
or layout structure — restyle within the existing structure only.
```

Run 11.1 first and check every existing page still looks coherent before
moving on — this one touches the most shared files. Then 11.2 through 11.4,
checking in the browser between each. If any section feels off after, give
specific feedback ("the pricing card border is too thin to read as premium,
make it 2px") rather than "make it better."

---

### Phase 12 — Bug Fixes & Dashboard Reorganization

Based on real screenshots, some of this is actual bugs (broken embed, empty
marquee) not style preference. **Run 12.1–12.2 first** — those are
correctness bugs — then 12.3–12.6 for organization/polish.

**12.1 — Debug the empty transformations marquee**
```
The transformations section is rendering completely empty — just the
heading and subtitle, then a large blank gap where the image marquee
should be. Check, in this order, and report what you find before fixing
anything: (1) Is /components/landing/TransformationsMarquee.tsx the exact
file I provided, or was it rewritten? (2) Is it actually imported and
rendered in the landing page, in place of any older transformations
component (not alongside a hidden/broken one)? (3) Open browser devtools:
are the <img> tags inside .marquee-track present in the DOM at all, and do
they have a resolved, non-404 src? (4) Confirm the 8 files exist at
exactly /public/images/transformations/transformation-1.jpg through
transformation-8.jpg with those exact names and that path. Fix whichever
of these is the actual cause.
```

**12.2 — Fix exercise videos: embed, don't link**
```
On the client dashboard workout plan, each exercise currently shows a text
link "عرض فيديو التمرين" instead of an embedded, playable video — this is
wrong. Check whether /components/YoutubeEmbed.tsx exists and is actually
imported into the client dashboard's plan view. If the link is there
instead of the component, replace it with <YoutubeEmbed youtubeUrl={...}
/>. Keep each exercise's video collapsed/expandable on mobile so the page
doesn't get too long, but expanding it must reveal a real inline player,
not a link that navigates away.
```

**12.3 — Coach dashboard: client detail / plan builder reorganization**
```
Reorganize the coach's client detail / plan builder page
(app/(coach)/coach/clients/[id]/page.tsx) — it currently reads as a wall
of repetitive plain rows with no visual hierarchy. Apply this structure:
- Each day of the week is its own card: surface background
  (var(--surface)), hairline border, with the day name as a proper section
  header (Cairo, larger weight/size) — not the same text size as the
  exercise rows inside it.
- Within a day's workout card, each exercise is a compact row: name in
  bold, sets/reps/rest as smaller muted text beneath or beside it, the
  "من المكتبة" origin tag as a small pill in a consistent size and position
  across every row (not floating differently row to row), delete action as
  a small icon button (trash icon), not a text button competing visually
  with the exercise name.
- The "+ إضافة من المكتبة" action is a clearly secondary button (outline
  style, not filled lime) at the bottom of each day's card.
- For diet days, each meal (الإفطار/الغداء/العشاء/سناك) is a distinct
  sub-section within the day's card with its own small header, separated
  from other meals by a thin divider — right now meal items look identical
  to workout exercise rows with no grouping cue at all.
- Empty days ("لا يوجد عناصر") should look intentionally empty/muted, not
  like a broken state.
- The primary "حفظ الخطة" save button should be the only lime-filled button
  on the page, so it's unambiguous which action is primary versus
  secondary actions.
This is a layout/hierarchy pass — don't change any data logic or the
library-picker functionality, just how it's organized and styled.
```

**12.4 — Coach dashboard: client list reorganization**
```
Reorganize the coach dashboard's client list (app/(coach)/coach/page.tsx)
to feel like a real admin dashboard, not a bare stacked list:
- Add a small stats row at the top: إجمالي العملاء (count of all `clients`
  rows), عملاء نشطين (count where status='active'), طلبات جديدة (count of
  `leads` rows where contacted=false — NOT clients with any status; leads
  and clients are different tables representing different funnel stages,
  don't conflate them).
- Each client renders as a row/card with: a circular avatar (initials if no
  photo), name, phone, status as a colored pill (active=lime, paused=muted
  gray, pending=outline), last progress log date, and a "فتح" action
  aligned consistently at the same position on every row.
- Add a search/filter input at the top if more than ~5 clients exist (build
  it now even with one client currently, since this matters quickly as the
  client base grows).
- Use the hairline-border/surface-panel treatment consistent with the rest
  of the dashboard, with proper spacing between rows.
```

**12.5 — Brand the login page**
```
Apply the site's branding to the login page (currently a bare unbranded
card): add logo.url from landing-content.ts above the "تسجيل الدخول"
heading, add a short welcome line beneath it (e.g. "سجّل الدخول لمتابعة
خطتك"), and give the page a subtle background treatment consistent with
the rest of the site (e.g. a faint radial gradient, or the ink background
with a barely-visible gym photo behind at low opacity) instead of flat
black — right now it looks disconnected from the rest of the product.
```

**12.6 — Fix footer icons and navbar logo sizing**
```
Fix two visible issues:
1. In the footer, the social icons currently render as plain generic
   circular outline icons that don't match the site. Use real brand icons
   (lucide-react or react-icons/simple-icons for Instagram/Facebook/
   TikTok, plus WhatsApp), sized consistently (20-24px), muted color by
   default with a lime hover state.
2. In the navbar, the logo image currently renders very small/oddly
   cropped in the corner. Fix the <img> sizing to a fixed height (e.g.
   40px) with width auto so the full logo mark is visible and proportional
   — check whether a parent container or object-fit is clipping it.
```

**12.7 — Fix the clients.status naming collision (lead → pending)**
```
Rename the 'lead' value in clients.status to 'pending' — write a migration
that updates the check constraint/enum and does a data migration
(UPDATE clients SET status = 'pending' WHERE status = 'lead') for any
existing rows. Then update every place in the codebase that references
status === 'lead' to use 'pending' instead. Also add a "الطلبات الجديدة"
leads section to the coach dashboard (app/(coach)/coach/page.tsx) showing
`leads` table rows where contacted=false, with "تم التواصل" and "تحويل
لعميل" actions as described in Phase 4 — check if this already partially
exists before building it from scratch. This fixes a real naming
collision: `clients.status='pending'` (an account that exists but isn't
active yet) is conceptually different from a `leads` row (a form
submission with no account at all) — the stats row from 12.4 must count
these separately, not merge them.
```

---


## 6. Current Visual Direction (implemented)

- Brand direction: premium dark athletic identity using `#0F0F11`, graphite surfaces, hairline borders, and lime `#E2FD4B` as a deliberate accent.
- The landing page is the primary conversion surface: WhatsApp is the main CTA, with the coach hero photo, about photo, and transformation gallery used as proof assets.
- The hero uses `coach-hero.jpg` as a full-height, cover-mode cinematic background on the right with a dark readable text panel on the left; preserve the image's centered back/shoulder composition and do not revert to a small contained side image.
- The marketing navbar is sticky at the top with a translucent blurred background; keep the marketing root free of overflow containers that would disable sticky positioning.
- The app is intentionally animation-free except for the transformations carousel: it uses Swiper autoplay with an infinite loop and never pauses on mouse hover. Keep all other page animations disabled.
- The visual system is shared across marketing, auth, coach, and client screens through the CSS tokens in `app/globals.css`; legacy slate/lime utility classes are bridged to the same ink/surface/border/accent values, and shared Card/Button components use the token radius with no card shadows.
- Arabic marketing copy is stored in `/lib/content/landing-content.ts`; keep personal claims, prices, phone numbers, and credentials editable there and do not invent unsupported facts.
- Transformation images are displayed in full with a click-to-enlarge viewer; avoid cropping composite before/after images.
- Shared visual treatment applies to login, coach dashboard, client dashboard, and marketing pages. Preserve Supabase data behavior and RLS when restyling.
- `tsconfig.json` excludes `node_modules.broken` and `node_modules.invalid`, which are local dependency recovery folders and must not be typechecked.
- Supabase middleware detects POST requests carrying the `next-action` header and passes them through without auth redirects; Server Action responses must remain an RSC payload.
- Sonner is the shared toast notification layer. Use Arabic success/error toasts for Server Action results, while keeping inline error text where it improves accessibility.
- Transformations use Swiper with autoplay every 3 seconds and an infinite loop, custom arrows, pagination, centered active slide, coverflow emphasis, and full-image `object-contain` rendering. It never pauses on mouse hover or touch swipe, but intentionally stops when a visitor selects a story image or uses either arrow. Each item has an editable `story` field in `landing-content.ts`, shown in the click-to-open modal.
- Supabase connectivity failures are handled gracefully: middleware allows public `/login` to render when Auth is temporarily unreachable, protected routes treat the request as signed out, and login returns an Arabic connection error instead of exposing `AuthRetryableFetchError`.
- WhatsApp actions use the local `components/icons/WhatsAppIcon.tsx` brand mark; do not replace it with a generic `MessageCircle` icon.
- Coach navigation is organized into `/coach` overview, `/coach/clients`, `/coach/leads`, and `/coach/library`; a shared logout control is available across coach routes.
- Coach dashboard navigation uses a shared responsive shell: sidebar on desktop and horizontally scrollable top navigation on mobile. The overview, clients, leads, library, and client-detail routes all use the same shell; `CoachHeader` is page context only.
- Library save/delete Server Actions return typed Arabic action state, use the `useActionState` signature correctly, and catch Supabase failures so library forms show toast errors instead of crashing.
- Diet plan items require a positive `override_grams` value when saved; the coach sees library calories/macros only as muted reference data, while the client sees only the meal name and grams.
- Meal-library macros now include `macro_reference_grams` through corrective migration `0008_meal_macro_reference_grams.sql`. Existing rows default to 100g; new meal entries require the coach to state the reference weight. The coach plan builder scales and displays the reference calories/macros for the client's selected grams; these values remain coach-only and are excluded from the client RPC.
- InstaPay is informational only: the client dashboard shows the configured handle and QR image for every client, with no payment status gate, confirmation action, or plan/account access dependency. Coaches can independently activate, pause, or permanently remove client accounts from the client list.
- Current product decision: remove InstaPay, QR, payment confirmation, and payment-dependent copy from the application UI. Account access is controlled only by the coach through the client status: active clients see their plans and progress tools; paused clients see only that the account was paused by the coach; pending clients see that the account is not active yet and should contact the coach through WhatsApp.
- Middleware passes requests carrying the `next-action` header through without redirects or session-cookie mutation, preserving the expected Next.js Server Action response.
- Confirmed business details: coach name أحمد فرحان, 10 years of experience, WhatsApp/InstaPay phone `01028720683` (WhatsApp links use `201028720683`), Instagram `https://www.instagram.com/ahmed__farhan_/`. Pricing has two plans: monthly 1500 EGP and 3 months 3500 EGP, with the same five features; the 3-month plan is highlighted. QR image is still pending.

## 7. Egyptian-Specific Details Worth Getting Right

- **Fonts**: Cairo or Tajawal — not Arial/system Arabic, which looks amateurish.
- **Numbers**: Decide once — Arabic-Indic numerals (١٢٣) vs Western numerals (123) in your UI. Most modern Egyptian fitness brands use Western numerals even in Arabic UI; it's more readable for weights/reps. Tell Claude Code explicitly which you want, or it'll be inconsistent.
- **Phone numbers**: Egyptian mobile format is `+20 1X XXXX XXXX`. Validate for this format on the lead form and client creation form.
- **WhatsApp link format**: `https://wa.me/20<number without leading 0>?text=<encoded>` — make sure Claude Code strips the leading `0` from `01XXXXXXXXX` numbers when building the link.
- **InstaPay display**: A static QR code image (export it from the InstaPay app) is more trustworthy to clients than typing a handle — plan to just drop the QR image into Supabase Storage or `/public` and reference it.
- **Trust signals matter more here than flashy design**: real coach photo, real credentials, clear WhatsApp responsiveness — this converts better for a personal coaching brand than animations.

---

## 7. A Note on Working With Claude Code Day-to-Day

- After each phase, actually run the app (`npm run dev`) and click through before moving on — catching drift early is much cheaper than fixing it after 5 more phases are built on top.
- If something looks off, don't say "fix it" — say what's wrong and what you expected, e.g. *"the WhatsApp button on mobile is wrapping to two lines, it should stay on one line and be full-width."* Specific feedback = specific fixes.
- Keep CLAUDE.md updated whenever you make a real decision (e.g. "we decided against Arabic-Indic numerals") so Claude Code doesn't reintroduce the same debate three phases later.
- Commit to git after every phase. If a phase goes badly, you want to roll back one phase, not the whole project.

---

## 8. Deploying (the final step)

Once Phase 12 is done and the app looks right locally, deploy it:

1. **Push to GitHub**: create a new repo, push your project (`git remote add origin <repo-url>`, `git push -u origin main`).
2. **Import into Vercel**: on vercel.com, "Add New Project" → import the GitHub repo. Vercel auto-detects Next.js — you don't need to configure the build command.
3. **Add environment variables** in Vercel's project settings (same values as your local `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy.** Vercel gives you a live URL immediately (e.g. `your-project.vercel.app`).
5. **Custom domain (optional but recommended for a real coaching brand)**: buy a domain (any registrar — Namecheap, GoDaddy, or an Egyptian registrar), add it in Vercel's project → Domains, and follow Vercel's DNS instructions. This is worth doing before sharing the link widely — a real domain reads as far more trustworthy than a `.vercel.app` URL when someone's deciding whether to pay a stranger via InstaPay.
6. **Final check on a real phone, on mobile data** (not wifi, not desktop devtools' mobile view) — this is the actual condition most of the coach's clients will be in. Check: does the WhatsApp button actually open WhatsApp, does the InstaPay QR code load fast, does the transformations marquee run smoothly.

At this point the project is live. Any further changes just go through the same loop: describe the specific thing that's wrong, get Claude Code to fix just that, commit, and if it's already deployed via Vercel's GitHub integration, pushing to `main` redeploys automatically.

## Current progress submission control

- Progress submission is controlled independently per client through `clients.progress_enabled`.
- Existing clients remain enabled by default through corrective migration `0009_client_progress_control.sql`.
- Coaches can pause or reactivate sending weight/photos from the client list. The server action and the `progress_logs` insert RLS policy both enforce the setting; hiding the client form is not the only protection.
- Existing authorized progress history and photos remain visible to an active client and their assigned coach while new submissions are paused.
- An active client with progress enabled can replace their own same-day weight/photo entry; this is protected by corrective migration `0010_progress_log_client_update.sql`.
- Corrective migration `0011_progress_log_client_permissions.sql` explicitly grants the authenticated role the required progress-log table privileges and uses a narrow security-definer `can_submit_progress` predicate. This avoids checking the client-private `clients` table directly inside RLS policies; apply it after `0009` and `0010` if Supabase returns permission error `42501`.
- Corrective migration `0012_exercise_performance_logs.sql` adds daily client-owned performance records for assigned workout items: the client submits maximum weight and maximum repetitions, and the assigned coach can read the history. Nutrition privacy and the existing weight/photo progress flow are unchanged.
- Current product behavior uses `0013_exercise_performance_current_records.sql`: the client has one editable current strength record per unique assigned exercise type (maximum weight and maximum repetitions), without daily repetition. The assigned coach sees the latest saved value and last update time. Migration `0012` is preserved for compatibility but is not used by the UI.
- Corrective migration `0014_new_clients_active_by_default.sql` changes only the coach onboarding RPC so newly created client accounts start as `active`; existing `pending`, `paused`, and `active` client statuses are preserved.
