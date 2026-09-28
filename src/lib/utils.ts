import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newUuid(): string {
  return crypto.randomUUID();
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomToken(len = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => alphabet[b % alphabet.length]).join("");
}

const faDigits = new Intl.NumberFormat("fa-IR");
export function faNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return faDigits.format(n);
}

export function timeAgoFa(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "همین الان";
  if (min < 60) return `${faNum(min)} دقیقه پیش`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${faNum(h)} ساعت پیش`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${faNum(days)} روز پیش`;
  return d.toLocaleDateString("fa-IR");
}
