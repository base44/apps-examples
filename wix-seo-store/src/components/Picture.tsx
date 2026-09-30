import { responsiveImage } from '#/lib/media'
import type { Img } from '#/lib/types'

interface PictureProps {
  image: Img
  widths: ReadonlyArray<number>
  sizes: string
  aspectRatio?: number
  /** LCP candidate: eager + fetchpriority=high. Everything else is lazy. */
  priority?: boolean
  className?: string
  alt?: string
}

/**
 * Responsive image. For Wix media emits <picture> with AVIF + WebP sources
 * and a JPEG fallback, each with a width-descriptor srcset. Intrinsic
 * width/height are always set so the browser reserves space (no CLS).
 */
export function Picture({
  image,
  widths,
  sizes,
  aspectRatio,
  priority = false,
  className,
  alt,
}: PictureProps) {
  const r = responsiveImage(image, { widths: [...widths], aspectRatio })
  const imgProps = {
    src: r.src,
    srcSet: r.srcSet.jpg,
    sizes: r.srcSet.jpg ? sizes : undefined,
    width: r.width,
    height: r.height,
    alt: alt ?? image.alt,
    className,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: priority ? ('sync' as const) : ('async' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
  }
  if (!r.srcSet.avif) return <img {...imgProps} />
  return (
    <picture>
      <source type="image/avif" srcSet={r.srcSet.avif} sizes={sizes} />
      <source type="image/webp" srcSet={r.srcSet.webp} sizes={sizes} />
      <img {...imgProps} />
    </picture>
  )
}

/**
 * <link rel=preload> descriptor for an LCP image, matching exactly what
 * <Picture priority> will request (the AVIF srcset of the <picture>). React
 * does not auto-preload <img> inside <picture>, so this is the only hint.
 */
export function preloadImageLink(
  image: Img | undefined,
  preset: { widths: ReadonlyArray<number>; sizes: string; aspectRatio?: number },
): Record<string, string> | undefined {
  if (!image) return undefined
  const r = responsiveImage(image, {
    widths: [...preset.widths],
    aspectRatio: preset.aspectRatio,
  })
  if (r.srcSet.avif) {
    return {
      rel: 'preload',
      as: 'image',
      type: 'image/avif',
      href: r.src,
      imageSrcSet: r.srcSet.avif,
      imageSizes: preset.sizes,
      fetchPriority: 'high',
    }
  }
  // Non-Wix (mock/local) images render as a plain <img fetchpriority=high>,
  // which React 19 already preloads during SSR; avoid a duplicate hint.
  return undefined
}
