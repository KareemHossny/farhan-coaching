import { extractYoutubeId } from "@/lib/youtube";

export function YoutubeEmbed({ youtubeUrl }: { youtubeUrl?: string | null }) {
  const id = extractYoutubeId(youtubeUrl);
  if (!id) return null;
  return <div className="relative aspect-video w-full overflow-hidden rounded-lg"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="فيديو التمرين" loading="lazy" className="absolute inset-0 h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
}
