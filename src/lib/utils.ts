import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString; // fallback
  return d.toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric" });
}

export function formatInPHTime(
  date: Date | string | number = new Date(),
  formatPattern: "full" | "date" | "time" = "full"
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  
  if (formatPattern === "date") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(d);
  }

  if (formatPattern === "time") {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  }

  // "full" format -> e.g. "Aug 24, 2026 - 04:31 PM"
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${datePart} - ${timePart}`;
}
