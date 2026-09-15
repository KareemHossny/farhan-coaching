/* eslint-disable @next/next/no-img-element */
type Photo = { date: string; url: string };

export function ProgressPhotoGallery({ photos }: { photos: Photo[] }) {
  if (!photos.length) return <div className="rounded-[var(--radius-base)] border border-dashed border-[var(--border-hairline)] p-6 text-center text-sm text-[var(--text-muted)]">لم يرفع العميل صور تقدم بعد.</div>;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo) => <figure key={`${photo.date}-${photo.url}`} className="overflow-hidden rounded-[var(--radius-base)] border border-[var(--border-hairline)] bg-[var(--bg-ink)]"><div className="aspect-[4/5]"><img src={photo.url} alt={`صورة تقدم العميل بتاريخ ${photo.date}`} className="h-full w-full object-cover" /></div><figcaption className="p-2 text-center text-xs text-[var(--text-muted)]">{new Date(`${photo.date}T00:00:00`).toLocaleDateString("ar-EG")}</figcaption></figure>)}</div>;
}
