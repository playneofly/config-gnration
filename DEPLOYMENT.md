# راهنمای دیپلوی

این نسخه‌ی بازنویسی‌شده با **PostgreSQL خارجی** کار می‌کند (دیگر D1 لازم نیست) و جدول‌ها را در اولین اجرا **خودکار** می‌سازد.

---

## ۱) رفع خطای قبلی Cloudflare (`npm ci` failed)

علت خطا: فایل `package-lock.json` قدیمی با `package.json` جدید هماهنگ نبود.
**قانون طلایی:** هر بار که کد را به‌روز می‌کنید، **هر دو فایل** `package.json` و `package-lock.json` را با هم کامیت کنید. هیچ‌وقت لاک‌فایل قدیمی را با package.json جدید مخلوط نکنید.

---

## ۲) ساخت دیتابیس PostgreSQL رایگان (۲ دقیقه)

1. وارد [neon.tech](https://neon.tech) شوید (یا Supabase) و یک پروژه‌ی رایگان بسازید.
2. رشته‌ی اتصال (Connection String) را کپی کنید؛ چیزی شبیه:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require`

## ۳) تنظیمات Cloudflare Workers

در داشبورد Workers & Pages روی پروژه:

**Settings → Variables and Secrets** — یک Secret جدید:

| Name | Value |
|---|---|
| `DATABASE_URL` | رشته‌ی اتصال Neon از مرحله‌ی قبل |

**Settings → Build:**

| فیلد | مقدار |
|---|---|
| Framework preset | `Next.js` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |

سپس آخرین کد را (شامل `package-lock.json` جدید) push کنید؛ بیلد سبز می‌شود و جدول‌ها در اولین درخواست خودکار ساخته می‌شوند.

> در `wrangler.jsonc` فلگ `nodejs_compat` فعال است — برای کارکردن `pg` و تست اتصال TCP/TLS داخل Workers ضروری است.
> اتصال D1 قدیمی دیگر استفاده نمی‌شود و می‌توانید binding آن را حذف کنید.

---

## ۴) جایگزین پیشنهادی: Vercel (ساده‌تر)

اگر کلادفلر اجباری نیست، این پروژه روی Vercel بدون هیچ تنظیمی کار می‌کند:

1. پروژه را در [vercel.com](https://vercel.com) ایمپورت کنید.
2. در Environment Variables فقط `DATABASE_URL` را بگذارید.
3. Deploy — تمام.

---

## ۵) نکته درباره‌ی محدودیت پلن رایگان Workers

- ساخت دسته‌ای چندین fetch و تا ۱۵۰ تست اتصال انجام می‌دهد؛ پلن رایگان Workers محدودیت subrequest دارد (۵۰ در هر invocation). روی پلن رایگان ممکن است فقط بخشی از تست‌ها انجام شود — بقیه با دکمه‌ی «تست گروهی» در صفحه‌ی کانفیگ‌ها تکمیل می‌شود.
- کانفیگ‌های پروتکل UDP (Hysteria2/TUIC) با TCP قابل تست نیستند و «تست‌نشده» می‌مانند — این طبیعی است و همان‌طور که هستند در اشتراک قرار می‌گیرند.
