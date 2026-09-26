'use client'

/**
 * Interactive wrapper around ShareCard: on-screen preview (scaled to fit the
 * viewport), PNG download via modern-screenshot, and Web Share when the
 * browser supports sharing files.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { domToPng } from 'modern-screenshot'
import {
  ShareCard,
  CARD_W,
  CARD_H,
  type ShareCardProps,
} from '@/components/ShareCard'

type Props = ShareCardProps & {
  /** File name without extension, e.g. trainwithgouli-2026-09-25. */
  fileBase: string
}

/** Scale that fits the 941×1672 card into the current viewport. */
function fitScale(): number {
  if (typeof window === 'undefined') return 1
  const pad = 32
  const availW = Math.min(window.innerWidth - pad, 560)
  const availH = window.innerHeight - pad * 2
  return Math.min(availW / CARD_W, availH / CARD_H, 1)
}

export function ShareCardClient(props: Props) {
  const { fileBase, ...cardProps } = props
  const captureRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Lazy initializer — runs once on mount, no effect/setState cascade.
  // Guarded for SSR; canShare with an empty file probe can throw on some
  // browsers, hence the try/catch.
  const [canShare] = useState(() => {
    try {
      return (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [new File([new Blob()], 't.png', { type: 'image/png' })] })
      )
    } catch {
      return false
    }
  })

  useEffect(() => {
    const update = () => setScale(fitScale())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  /** Render the card off-screen at full design size for pixel-clean capture. */
  const ensureCaptureNode = useCallback(async () => {
    const node = captureRef.current
    if (!node) throw new Error('capture node missing')
    // modern-screenshot resolves web fonts on its own; give it a beat to lay out.
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    return node
  }, [])

  const capturePng = useCallback(async (): Promise<Blob> => {
    const node = await ensureCaptureNode()
    const dataUrl = await domToPng(node, {
      scale: 2,
      width: CARD_W,
      height: CARD_H,
      backgroundColor: 'transparent',
    })
    const res = await fetch(dataUrl)
    return await res.blob()
  }, [ensureCaptureNode])

  const onDownload = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const blob = await capturePng()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileBase}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Capture failed')
    } finally {
      setBusy(false)
    }
  }, [capturePng, fileBase])

  const onShare = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const blob = await capturePng()
      const file = new File([blob], `${fileBase}.png`, { type: 'image/png' })
      await navigator.share({
        files: [file],
        title: 'TrainWithGouli — daily progress',
      })
    } catch (e) {
      // User-cancelled share throws AbortError — not a failure.
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setError(e instanceof Error ? e.message : 'Share failed')
      }
    } finally {
      setBusy(false)
    }
  }, [capturePng, fileBase])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Preview: full card scaled to fit */}
      <div
        className="relative"
        style={{ width: CARD_W * scale, height: CARD_H * scale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left border-2 border-[var(--border)]"
          style={{ transform: `scale(${scale})` }}
        >
          <ShareCard ref={captureRef} {...cardProps} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="border-2 border-[var(--border)] bg-[var(--accent)] px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {busy ? 'Rendering…' : 'Download PNG'}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            disabled={busy}
            className="border-2 border-[var(--border)] px-5 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-60"
          >
            {busy ? 'Rendering…' : 'Share'}
          </button>
        )}
        <a
          href="/days"
          className="border-2 border-transparent px-2 py-2.5 font-mono text-sm uppercase tracking-wider text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          Back to days
        </a>
      </div>

      {error && (
        <p className="font-mono text-sm text-[var(--accent)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
