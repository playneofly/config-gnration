# Deployment notes

This is a full Next.js application: it contains server API routes and uses PostgreSQL.
It cannot be deployed as a static Cloudflare Pages site by only selecting the `.next`
folder. The app needs a Next.js server runtime and a PostgreSQL connection.

## Recommended: Vercel

1. Import `playneofly/config-gnration` into Vercel.
2. Framework preset: **Next.js**.
3. Build command: `npm run build`.
4. Add `DATABASE_URL` under Project Settings → Environment Variables.
5. Redeploy.

Use a hosted PostgreSQL database such as Neon, Supabase, or Railway. The database must
be reachable from the deployment and the URL should normally include `sslmode=require`.

## If staying on Cloudflare

Use **Cloudflare Workers + the OpenNext adapter**, not a plain Pages static deployment.
Also use a serverless PostgreSQL driver/adapter supported by Cloudflare Workers (for
example Neon HTTP/serverless), or move the API/database portion to a separate service.
The current `pg`/Node runtime setup is not a plain Cloudflare Pages static build.

## Important

The build will complete after this patch, but config CRUD/API operations still require a
real `DATABASE_URL`. Do not commit the actual password; configure it as a secret in the
hosting dashboard.
