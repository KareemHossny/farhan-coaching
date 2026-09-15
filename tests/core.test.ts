import { describe, expect, it } from "vitest";
import { whatsappUrl } from "@/lib/whatsapp";
import { extractYoutubeId } from "@/lib/youtube";
import { canAccessClientStatus, isValidDateRange, isValidEgyptianPhone, isValidPositiveGrams, normalizeEgyptianPhone } from "@/lib/validation";

describe("WhatsApp links", () => {
  it("normalizes an Egyptian mobile number and encodes the message", () => {
    expect(whatsappUrl("01028720683", "أريد الاشتراك")).toBe("https://wa.me/201028720683?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83");
  });
});

describe("YouTube parsing", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abc123", "abc123"],
    ["https://youtu.be/abc123", "abc123"],
    ["https://www.youtube.com/shorts/abc123", "abc123"],
  ])("extracts an id from %s", (url, id) => expect(extractYoutubeId(url)).toBe(id));
  it("rejects unrelated domains", () => expect(extractYoutubeId("https://example.com/video")).toBeNull());
});

describe("validation", () => {
  it("normalizes and validates Egyptian phone numbers", () => {
    expect(normalizeEgyptianPhone("+20 102 872 0683")).toBe("201028720683");
    expect(isValidEgyptianPhone("01028720683")).toBe(true);
    expect(isValidEgyptianPhone("011234")).toBe(false);
  });
  it("requires positive grams", () => {
    expect(isValidPositiveGrams(150)).toBe(true);
    expect(isValidPositiveGrams(0)).toBe(false);
    expect(isValidPositiveGrams("-20")).toBe(false);
  });
  it("accepts open dates and rejects reversed ranges", () => {
    expect(isValidDateRange("2026-09-01", "2026-09-30")).toBe(true);
    expect(isValidDateRange("2026-09-30", "2026-09-01")).toBe(false);
    expect(isValidDateRange(null, "2026-09-01")).toBe(true);
  });
  it("restricts plan access for paused and pending clients", () => {
    expect(canAccessClientStatus("active").canViewPlans).toBe(true);
    expect(canAccessClientStatus("paused").canViewPlans).toBe(false);
    expect(canAccessClientStatus("pending").canLogProgress).toBe(false);
  });
});
