# Egyptian Fitness Coach Platform

## Stack

Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, and Supabase for
authentication, Postgres, and Storage. The product is Arabic-first and uses
RTL layout with Cairo typography.

## Conventions

- Use Server Components by default; use `"use client"` only for interactivity.
- Keep Supabase access inside `/lib/supabase`; do not inline database calls in components.
- Add every database change through a numbered migration in `/supabase/migrations`.
- Enable and review Row Level Security for every client-facing table.
- Payment is manual InstaPay plus WhatsApp; do not add a payment gateway.
- Use small components under `/components` rather than large page files.
- Keep user-facing copy Arabic-first and avoid English placeholder text.

## Roles

- `coach`: manage their own clients, plans, and reusable libraries.
- `client`: read their own assigned plans and progress, and create progress logs.

## Scope guardrails

- Do not invent subscriptions, notifications, a blog, or other features unless requested.
- Protect private coach notes and client data with Supabase RLS.
- Keep `CODEX.MD` as the canonical project brief and update it when architectural,
  data-model, security, or workflow decisions change.
