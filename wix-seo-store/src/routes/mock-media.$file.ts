/**
 * MOCK ONLY: generates placeholder product artwork (SVG) for the mock catalog
 * used when WIX_CLIENT_ID is unset. Real Wix media is served from
 * static.wixstatic.com with responsive transforms (see src/lib/media.ts).
 */
import { createFileRoute } from '@tanstack/react-router'

const PALETTE = [
  ['#efe6d8', '#b08968'],
  ['#dfe7e2', '#5f7f6f'],
  ['#e6e0ee', '#7a6a93'],
  ['#f1e4d9', '#c0775a'],
  ['#dde6ef', '#4f6d8a'],
  ['#ecead7', '#8a8450'],
]

function hash(s: string): number {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

const titleCase = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function svg(name: string): string {
  const variant = name.endsWith('-2') ? 2 : 1
  const base = name.replace(/-\d$/, '').replace(/^collection-/, '')
  const [bg, fg] = PALETTE[hash(base) % PALETTE.length]
  const label = titleCase(base).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const shape =
    variant === 1
      ? `<rect x="330" y="300" width="540" height="540" rx="60" fill="${fg}" opacity=".85"/>`
      : `<circle cx="600" cy="560" r="290" fill="${fg}" opacity=".85"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="${bg}"/>${shape}<text x="600" y="1010" font-family="system-ui,sans-serif" font-size="56" font-weight="600" text-anchor="middle" fill="#292524">${label}</text></svg>`
}

export const Route = createFileRoute('/mock-media/$file')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const name = params.file.replace(/\.svg$/, '')
        if (!/^[a-z0-9-]+$/.test(name)) return new Response('Not found', { status: 404 })
        return new Response(svg(name), {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Robots-Tag': 'noindex',
          },
        })
      },
    },
  },
})
