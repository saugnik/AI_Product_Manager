# Running & Deploying MediFlow

## A. Run locally (execution)

You need **two terminals**: one for the database, one for the app.

```bash
# One-time: install deps (also generates the Prisma client via postinstall)
npm install

# Copy env template and fill in AUTH_SECRET + GEMINI_API_KEY
cp .env.example .env
```

**Terminal 1 — database** (leave running):

```bash
npm run db:start        # = prisma dev --name mediflow
```

Copy the `DATABASE_URL` / `SHADOW_DATABASE_URL` it prints into `.env`.

**Terminal 2 — create tables, then run the app:**

```bash
npm run setup           # prisma generate && prisma db push
npm run dev             # http://localhost:3000
```

To run the production build locally instead of `dev`:

```bash
npm run build
npm run start           # http://localhost:3000
```

---

## B. Deploy to a live URL (hosting)

Local `prisma dev` is a dev-only database — it does **not** run on a host. For a
public URL you need (1) a hosted Postgres and (2) somewhere to run the Next.js
app. Easiest combo: **Neon (Postgres) + Vercel (app)**.

### 1. Create a hosted Postgres

Use any managed Postgres — [Neon](https://neon.tech), [Supabase](https://supabase.com),
[Prisma Postgres](https://www.prisma.io/postgres), or Railway. Copy the
connection string. **Use the pooled/"connection pooling" URL** if the provider
offers one (serverless functions open many short-lived connections).

Example Neon URL:

```
postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/mediflow?sslmode=require
```

### 2. Push the schema to it (run once, from your machine)

```bash
# point Prisma at the hosted DB just for this command
DATABASE_URL="postgresql://...pooler.../mediflow?sslmode=require" npx prisma db push
```

### 3. Deploy the app to Vercel

```bash
npm i -g vercel
vercel            # first run: links the project
vercel --prod     # deploys to production
```

Then set these **Environment Variables** in the Vercel project (Settings →
Environment Variables), for the Production environment:

| Variable          | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| `DATABASE_URL`    | your hosted (pooled) Postgres URL                            |
| `AUTH_SECRET`     | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_TRUST_HOST` | `true`                                                       |
| `GEMINI_API_KEY`  | your Gemini key (rotate the one shared in chat first)        |

Redeploy after adding them (`vercel --prod`). The app builds with `next build`
and Vercel runs it automatically — no `npm start` needed.

> `SHADOW_DATABASE_URL` is only used by `prisma migrate` locally; production
> uses `prisma db push`, so you don't need it on the host.

### Non-Vercel Node host (Render, Railway, Fly, a VM)

Any host that can run Node works:

```bash
npm ci
npm run build
npm run start        # serves on $PORT (default 3000)
```

Set the same env vars as above, plus `AUTH_URL=https://your-domain.com`
(instead of `AUTH_TRUST_HOST`) if the host isn't behind Vercel's proxy.

---

## Pre-submission checklist

- [ ] `GEMINI_API_KEY` rotated (the shared one was exposed in chat).
- [ ] `AUTH_SECRET` is a fresh random value on the host (not the dev one).
- [ ] Schema pushed to the hosted DB (`prisma db push`).
- [ ] You can register + log in on the live URL.
- [ ] All three tools return results on the live URL.
