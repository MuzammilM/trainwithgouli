import { getYouTubeEmbedUrl } from '@/lib/youtube'

export function YouTubeEmbed({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <iframe
      src={embedUrl}
      title="Exercise video"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full border-2 border-[var(--border)]"
    />
  )
}
