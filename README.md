# BIoT Marketing Studio

A single-page marketing automation dashboard built with Next.js, Tailwind CSS, and Supabase. The app centralizes campaign ideation, asset review, and publishing workflows while delegating AI generation tasks to n8n automations.

## Getting started

```bash
pnpm install # or npm install / yarn install
pnpm dev
```

Set the following environment variables in a `.env.local` file to enable live data and webhook submission:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_N8N_BASE_URL=https://your-n8n-instance
```

## Database

The `supabase/migrations/0001_create_core_tables.sql` migration provisions the `posts`, `assets`, and `jobs` tables with row-level security policies and realtime publication support. Apply the migration using Supabase CLI:

```bash
supabase db push
```

## Features

- **Pipeline Summary**: realtime table of the 100 most recent posts with color-coded status badges.
- **New Idea Form**: submits structured payloads to the n8n marketing router webhook for immediate generation or queueing.
- **Pending Approval**: highlights posts awaiting review, displays caption drafts, and previews generated assets stored on Google Drive.

Design accents follow the BIoT brand palette (navy, gold, and purple) with soft shadows and rounded corners for a polished experience.
