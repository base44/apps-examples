/**
 * Responsive Wix media URL builder.
 *
 * Wix Media serves on-the-fly transforms from static.wixstatic.com:
 *   https://static.wixstatic.com/media/<id>/v1/fill/w_<w>,h_<h>,al_c,q_<q>,enc_<fmt>/<name>.<ext>
 * `fill` crops to exactly w x h (centered via al_c), `fit` letterboxes.
 * `enc_avif` / `enc_webp` select the output encoding; the output file
 * extension is set to match so CDNs/browsers get the right Content-Type.
 *
 * Kept dependency-free (no @wix/image-kit) so it adds ~0 bytes of client JS.
 */
import type { Img } from './types'

const WIX_MEDIA_BASE = 'https://static.wixstatic.com/media/'

export type ImageFormat = 'avif' | 'webp' | 'jpg'

interface ParsedWixImage {
  id: string
  width?: number
  height?: number
}

export function parseWixImage(src: string): ParsedWixImage | null {
  if (src.startsWith('wix:image://')) {
    // wix:image://v1/<id>/<filename>#originWidth=W&originHeight=H
    const [path, hash = ''] = src.replace('wix:image://v1/', '').split('#')
    const id = path.split('/')[0]
    const params = new URLSearchParams(hash)
    return {
      id,
      width: Number(params.get('originWidth')) || undefined,
      height: Number(params.get('originHeight')) || undefined,
    }
  }
  if (src.startsWith(WIX_MEDIA_BASE)) {
    const id = src.slice(WIX_MEDIA_BASE.length).split('/')[0]
    return { id }
  }
  return null
}

export function isWixImage(src: string): boolean {
  return parseWixImage(src) !== null
}

export interface WixImageUrlOptions {
  width: number
  height: number
  format?: ImageFormat
  quality?: number
  fit?: 'fill' | 'fit'
}

export function wixImageUrl(src: string, opts: WixImageUrlOptions): string {
  const parsed = parseWixImage(src)
  if (!parsed) return src
  const { width, height, format = 'jpg', quality = 80, fit = 'fill' } = opts
  const w = Math.round(width)
  const h = Math.round(height)
  const enc = format === 'jpg' ? '' : `,enc_${format}`
  const baseName = parsed.id.replace(/~mv2.*$/, '').replace(/\.[a-z0-9]+$/i, '')
  const ext = format === 'jpg' ? 'jpg' : format
  return `${WIX_MEDIA_BASE}${parsed.id}/v1/${fit}/w_${w},h_${h},al_c,q_${quality}${enc}/${baseName}.${ext}`
}

export interface ResponsiveImage {
  /** Fallback (JPEG) src at the largest width. */
  src: string
  width: number
  height: number
  /** `srcset` strings per format; empty when the source isn't Wix media. */
  srcSet: Partial<Record<ImageFormat, string>>
}

/**
 * Builds srcsets for AVIF / WebP / JPEG at the given widths, preserving the
 * requested aspect ratio (defaults to the original image's ratio). Widths
 * larger than the original are dropped to avoid upscaling.
 */
export function responsiveImage(
  img: Img,
  opts: { widths: Array<number>; aspectRatio?: number; quality?: number },
): ResponsiveImage {
  const ratio = opts.aspectRatio ?? img.width / img.height
  const maxW = img.width || Math.max(...opts.widths)
  const widths = Array.from(
    new Set(opts.widths.map((w) => Math.min(w, maxW))),
  ).sort((a, b) => a - b)
  const largest = widths[widths.length - 1]
  const height = Math.round(largest / ratio)

  if (!isWixImage(img.src)) {
    return { src: img.src, width: largest, height, srcSet: {} }
  }

  const build = (format: ImageFormat) =>
    widths
      .map(
        (w) =>
          `${wixImageUrl(img.src, { width: w, height: w / ratio, format, quality: opts.quality })} ${w}w`,
      )
      .join(', ')

  return {
    src: wixImageUrl(img.src, {
      width: largest,
      height,
      format: 'jpg',
      quality: opts.quality,
    }),
    width: largest,
    height,
    srcSet: { avif: build('avif'), webp: build('webp'), jpg: build('jpg') },
  }
}

/** Absolute URL for og:image / JSON-LD (1200px JPEG, universally supported). */
export function absoluteImageUrl(
  img: Img | undefined,
  siteUrl: string,
  width = 1200,
): string | undefined {
  if (!img) return undefined
  if (isWixImage(img.src)) {
    const ratio = img.width && img.height ? img.width / img.height : 1
    const w = Math.min(width, img.width || width)
    return wixImageUrl(img.src, { width: w, height: w / ratio, format: 'jpg' })
  }
  return new URL(img.src, siteUrl).toString()
}

/** Shared presets so the LCP preload and the <img> use identical URLs. */
export const IMAGE_PRESETS = {
  pdpMain: {
    widths: [360, 540, 720, 960, 1200],
    aspectRatio: 1,
    sizes: '(min-width: 1024px) 50vw, 100vw',
  },
  card: {
    widths: [240, 360, 480, 640],
    aspectRatio: 1,
    sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw',
  },
  hero: {
    widths: [480, 768, 1024, 1440, 1920],
    aspectRatio: 16 / 7,
    sizes: '100vw',
  },
} as const
