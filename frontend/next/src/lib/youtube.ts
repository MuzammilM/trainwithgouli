const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:.*v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(YOUTUBE_REGEX)
  if (!match) return null
  const videoId = match[1]
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

export function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null
  const match = url.match(YOUTUBE_REGEX)
  if (!match) return null
  return match[1]
}
