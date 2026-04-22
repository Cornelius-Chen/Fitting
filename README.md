# Thin Muscle Plan App

Responsive Next.js app for a 12-week thin-muscle training plan with:

- workout checklists
- meal selection and nutrition totals
- daily report generation
- history and trend charts
- Supabase auth and cross-device sync
- local cache fallback when cloud sync is unavailable

## Setup

1. Install Node.js 20+ or 22+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

5. Apply `supabase/schema.sql` in your Supabase SQL editor.
6. Enable email + password auth in Supabase.
7. Run `npm run dev`.

## Routes

- `/` home overview
- `/plan` 12-week progression
- `/today` daily recommendation
- `/workout` workout execution
- `/food` meal planning
- `/dashboard` check-ins and daily report
- `/history` report history and charts
- `/auth/login` email sign-in/sign-up

## Notes

- Without Supabase env vars, the app still works in local-cache mode.
- The old `thin_muscle_12_week_plan_app (1).jsx` file is kept only as a legacy reference and is not used by the new app.
