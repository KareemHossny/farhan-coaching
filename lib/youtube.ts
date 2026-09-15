export function extractYoutubeId(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(url.hostname)) return null;
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    if (url.pathname === "/watch") return url.searchParams.get("v");
    if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
  } catch { return null; }
  return null;
}
