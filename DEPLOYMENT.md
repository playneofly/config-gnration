# راهنمای دیپلوی (نسخه‌ی اصلاح‌شده)

این پروژه با **OpenNext (`@opennextjs/cloudflare`)** روی **Cloudflare Workers** اجرا می‌شود و با **PostgreSQL خارجی** (مثل Neon) کار می‌کند. جدول‌ها در اولین اجرا به‌صورت خودکار ساخته/ارتقا داده می‌شوند.

---

## 🚨 رفع فوری خطای «ساخت کانفیگ / دریافت کانفیگ‌ها» (schema drift)

**علت:** دیتابیس شما با نسخه‌ی قدیمی `database.sql` ساخته شده و ستون‌های جدید
(`fingerprint`, `alive`, `latency`, `last_tested_at`, `source`, `raw_link` و
جدول `sync_runs`) را ندارد. مهاجرت خودکار قبلی هم فقط «اگر نبود بساز» بود و
روی جدول موجودِ قدیمی هنگام ساخت ایندکس می‌ترکید — نتیجه: **همه‌ی اندپوینت‌ها خطا.**

**ترمیم در دو قدم (جمعاً ۵ دقیقه):**

1. **ترمیم فوری دیتابیس (بدون نیاز به deploy):** کل محتوای فایل `database.sql`
   همین ریپو را کپی و در SQL Editor سرویس دیتابیس‌تان (مثلاً Neon → **SQL Editor** → New query)
   اجرا کنید. این اسکریپت فقط *اضافه* می‌کند و هیچ داده‌ای را پاک نمی‌کند —
   بلافاصله بعد از اجرا، سایت فعلی هم بدون deploy درست کار می‌کند.
2. **دیپلوی کد جدید:** فایل‌های اصلاح‌شده را push کنید تا کلادفلر دوباره build
   بگیرد. از این به بعد مهاجرت دیتابیس **خودترمیم** است و هر بار خودش ارتقا می‌دهد.

**اگر بعد از قدم ۱ هنوز خطا گرفتید** → یعنی `DATABASE_URL` اصلاً ست نشده است:
داشبورد کلادفلر → پروژه‌ی Worker → **Settings → Variables and Secrets** →
Secret جدید با نام `DATABASE_URL` و رشته‌ی اتصال Postgres → **Redeploy**.
تست سلامت: آدرس `/api/health` باید `{"ok":true}` برگرداند.

---

## ⚠️ چرا سایت قبلاً بالا نمی‌آمد؟

دو مشکل هم‌زمان وجود داشت:

1. **بیلد روی کلادفلر شکست می‌خورد** چون `package-lock.json` با `package.json` هماهنگ نبود (`npm ci` خطای EUSAGE می‌داد) و چند خطای کامپایل/تایپ در کد وجود داشت.
   **قانون طلایی:** هر بار `package.json` را تغییر دادید، حتماً `npm install` بزنید و **هر دو فایل را با هم کامیت کنید.** اکنون لاک‌فایل بازسازی شده و همه‌ی خطاها رفع شده‌اند.
2. **پروژه به‌جای Workers به Cloudflare Pages وصل شده بود.** آدرس `config-gnration.pages.dev` مخصوص Pages است، ولی خروجی OpenNext یک Worker است (`.open-next/worker.js`) و Pages نمی‌تواند آن را اجرا کند. راه‌حل: دیپلوی روی **Workers** (پایین توضیح داده شده).

---

## ۱) ساخت دیتابیس PostgreSQL رایگان (۲ دقیقه)

1. وارد [neon.tech](https://neon.tech) شوید (یا Supabase) و یک پروژه‌ی رایگان بسازید.
2. رشته‌ی اتصال (Connection String) را کپی کنید؛ چیزی شبیه:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require`

---

## ۲) روش پیشنهادی: دیپلوی روی Cloudflare **Workers** (نه Pages)

### روش A — اتصال گیت‌هاب (خودکار)

1. در داشبورد کلادفلر: **Workers & Pages → Create → Import a repository** را بزنید (از بخش **Workers**، نه Pages).
2. ریپوی `config-gnration` را انتخاب کنید و این تنظیمات را بدهید:

| فیلد | مقدار |
|---|---|
| Framework preset | `Next.js` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |

3. **Settings → Variables and Secrets** — یک Secret با نام `DATABASE_URL` و مقدار رشته‌ی اتصال Neon بسازید (Runtime).
4. پروژه‌ی **Pages** قدیمی را حذف کنید تا سردرگم نشوید. سایت جدید روی
   `config-gnration.<your-subdomain>.workers.dev` بالا می‌آید و می‌توانید دامنه‌ی اختصاصی هم به آن وصل کنید.
   (آدرس `*.pages.dev` فقط مال پروژه‌های Pages است و این اپ را اجرا نمی‌کند.)

### روش B — دیپلوی دستی از سیستم خودتان (سریع‌ترین راه)

```bash
npm install
npx wrangler login
npx wrangler secret put DATABASE_URL   # رشته‌ی اتصال Neon را وارد کنید
npm run deploy                          # build + deploy به Workers
```

---

## ۳) جایگزین ساده‌تر: Vercel

اگر کلادفلر اجباری نیست، بدون هیچ تنظیمی:

1. پروژه را در [vercel.com](https://vercel.com) ایمپورت کنید.
2. در Environment Variables فقط `DATABASE_URL` را بگذارید.
3. Deploy — تمام.

---

## ۴) نکات مهم

- در `wrangler.jsonc` فلگ `nodejs_compat` فعال است — برای کارکردن `pg` و تست اتصال TCP/TLS داخل Workers ضروری است.
- ساخت دسته‌ای چندین fetch و تا ۱۵۰ تست اتصال انجام می‌دهد؛ پلن رایگان Workers محدودیت subrequest دارد (~۵۰ در هر invocation). بقیه‌ی تست‌ها با دکمه‌ی «تست گروهی» در صفحه‌ی کانفیگ‌ها تکمیل می‌شوند.
- کانفیگ‌های UDP (Hysteria2/TUIC) با TCP قابل تست نیستند و «تست‌نشده» می‌مانند — طبیعی است.
- خروجی‌های بیلد (`.next`, `.open-next`, `.wrangler`, `node_modules`) در `.gitignore` هستند و **نباید** کامیت شوند.
