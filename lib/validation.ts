export function normalizeEgyptianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `20${digits.slice(1)}`;
  return digits;
}

export function isValidEgyptianPhone(value: string): boolean {
  return /^20(10|11|12|15)\d{8}$/.test(normalizeEgyptianPhone(value));
}

// Supabase Phone Auth can require an SMS provider even when the app only needs
// password login. Keep the user's phone as the visible identifier while using
// a private, deterministic email alias for Supabase Auth instead.
export function phoneAuthEmail(value: string): string {
  return `client-${normalizeEgyptianPhone(value)}@phone.farhan-coaching.app`;
}

export function isValidPositiveGrams(value: unknown): value is number {
  const grams = typeof value === "number" ? value : Number(value);
  return Number.isFinite(grams) && grams > 0;
}

export function isValidDateRange(startDate?: string | null, endDate?: string | null): boolean {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
}

export function canAccessClientStatus(status: "active" | "paused" | "pending") {
  return { canViewPlans: status === "active", canLogProgress: status === "active" };
}
