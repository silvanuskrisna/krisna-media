<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:workflow-rules -->
# Workflow Rules — Nita (Ivan's PC) & Tania (Shop PC)

## Before editing
- **ALWAYS `git pull` first** — sync with GitHub before making any changes
- Notify in Discord channel `#🧑‍💻-dev-log` (ID: 1521786128645095535) before starting work

## After editing
- Commit & push to GitHub when done
- Notify in Discord `#🧑‍💻-dev-log` channel with brief summary of what was changed

## Conflict handling
- If git conflict occurs: whoever encounters it fixes it, then notifies the other
- Do NOT force push (git push --force) unless explicitly requested

## Environment
- `.env.local` is NOT in git — each machine has its own
- Vercel env vars (DISCORD_WEBHOOK_URL, Supabase) are managed via Vercel Dashboard
- Supabase webhook triggers are managed via SQL migrations in `supabase/migrations/`
<!-- END:workflow-rules -->
