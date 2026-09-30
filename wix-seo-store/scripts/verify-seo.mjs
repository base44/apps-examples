#!/usr/bin/env node
// Crawls a running server and asserts the raw (no-JS) SSR HTML carries the
// SEO essentials. Usage: node scripts/verify-seo.mjs [baseUrl]
const base = process.argv[2] || 'http://localhost:3000'
let failures = 0
const ok = (cond, msg) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) failures++
}
const attr = (html, re) => html.match(re)?.[1]
const metaName = (h, n) => attr(h, new RegExp(`<meta name="${n}" content="([^"]*)"`))
const metaProp = (h, p) => attr(h, new RegExp(`<meta property="${p}" content="([^"]*)"`))

async function page(path, { status = 200, jsonLd = [], robots = /^index/, ogType } = {}) {
  const res = await fetch(base + path, { redirect: 'manual' })
  const html = await res.text()
  console.log(`\n${path}  [${res.status}] cache-control="${res.headers.get('cache-control')}"`)
  ok(res.status === status, `status ${status}`)
  ok(/<html lang="en"/.test(html), 'html lang="en"')
  const h1s = html.match(/<h1[\s>]/g) || []
  ok(h1s.length === 1, `exactly one <h1> (found ${h1s.length}): "${attr(html, /<h1[^>]*>(.*?)<\/h1>/s)?.replace(/<[^>]+>/g, '')}"`)
  ok(/<main[\s>]/.test(html) && /<nav[\s>]/.test(html), '<main> and <nav> present')
  const title = attr(html, /<title>([^<]*)<\/title>/)
  ok(Boolean(title) && (html.match(/<title>/g) || []).length === 1, `single title: "${title}"`)
  const robotsVal = metaName(html, 'robots')
  ok(robots.test(robotsVal || ''), `robots: "${robotsVal}"`)
  if (status !== 200) return { html }
  const desc = metaName(html, 'description')
  ok(desc && desc.length <= 160 && (desc.length >= 50 || /noindex/.test(robotsVal)), `meta description (${desc?.length} chars)`)
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/)
  ok(canonical && /^https?:\/\//.test(canonical), `canonical absolute: ${canonical}`)
  ok(Boolean(metaProp(html, 'og:title')), `og:title: "${metaProp(html, 'og:title')}"`)
  ok(!ogType || metaProp(html, 'og:type') === ogType, `og:type: ${metaProp(html, 'og:type')}`)
  ok(Boolean(metaProp(html, 'og:image')) || robots.source.includes('noindex'), `og:image: ${metaProp(html, 'og:image')}`)
  ok(Boolean(metaName(html, 'twitter:card')), `twitter:card: ${metaName(html, 'twitter:card')}`)
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => m[1])
  const types = []
  for (const b of blocks) {
    try {
      types.push(JSON.parse(b)['@type'])
    } catch (e) {
      ok(false, `JSON-LD parse error: ${e.message}`)
    }
  }
  ok(blocks.length === types.length, `JSON-LD blocks parse (${blocks.length}): ${types.join(', ')}`)
  for (const t of jsonLd) ok(types.includes(t), `JSON-LD has ${t}`)
  return { html, blocks: blocks.map((b) => JSON.parse(b)) }
}

const home = await page('/', { jsonLd: ['Organization', 'WebSite', 'ItemList'] })
const cat = await page('/category/all-products', { jsonLd: ['BreadcrumbList', 'CollectionPage'] })
ok(!/<link rel="prev"/.test(cat.html), 'category page 1 has no rel=prev')
// Real stores may fit on one page; only assert pagination when there is a page 2.
if (/<link rel="next" href="[^"]*\?page=2"/.test(cat.html)) {
  const cat2 = await page('/category/all-products?page=2', { jsonLd: ['BreadcrumbList', 'CollectionPage'] })
  ok(/<link rel="prev" href="[^"]*\/category\/all-products"/.test(cat2.html), 'page 2 rel=prev -> page 1 (no ?page=1)')
  ok(/<link rel="canonical" href="[^"]*\?page=2"/.test(cat2.html), 'page 2 self-canonical')
} else {
  console.log('  SKIP  single-page category: no rel=next, page 2 checks skipped')
  await page('/category/all-products?page=2', { status: 404, robots: /noindex/ })
}
const pdpSlug = home.html.match(/href="\/products\/([^"]+)"/)[1]
const pdp = await page(`/products/${pdpSlug}`, { jsonLd: ['Product', 'BreadcrumbList'], ogType: 'product' })
const product = pdp.blocks.find((b) => b['@type'] === 'Product')
const offers = product.offers?.['@type'] === 'AggregateOffer' ? product.offers.offers : [product.offers]
ok(offers.length > 0 && offers.every((o) => o?.price && o.priceCurrency && o.availability), `${product.offers?.['@type']} x${offers.length} price=${offers[0]?.price} ${offers[0]?.priceCurrency} ${offers[0]?.availability}`)
ok(Array.isArray(product.image) && product.image.length > 0 && product.brand?.name, `Product images=${product.image?.length} brand=${product.brand?.name} sku=${product.sku ?? offers[0]?.sku ?? '-'}`)
ok(/fetchPriority="high"/i.test(pdp.html), 'LCP image has fetchpriority=high')
ok(/<link rel="preload" as="image"/.test(pdp.html), 'LCP image preloaded')
ok(/loading="lazy"/.test(pdp.html), 'below-the-fold images lazy-loaded')
ok(/<img[^>]*width="\d+"[^>]*height="\d+"/.test(pdp.html), 'img has width/height')
await page('/cart', { robots: /noindex/ })
await page('/search?q=linen', { robots: /noindex/ })
await page('/products/does-not-exist', { status: 404, robots: /noindex/ })
await page('/category/does-not-exist', { status: 404, robots: /noindex/ })
await page('/category/all-products?page=999', { status: 404, robots: /noindex/ })
await page('/this/route/does/not/exist', { status: 404, robots: /noindex/ })

console.log('\n/category/all-products?page=1')
const r1 = await fetch(base + '/category/all-products?page=1', { redirect: 'manual' })
ok(r1.status === 301 && /\/category\/all-products$/.test(r1.headers.get('location') || ''), `301 -> ${r1.headers.get('location')}`)

console.log('\n/sitemap.xml')
const sm = await fetch(base + '/sitemap.xml')
const xml = await sm.text()
const urls = (xml.match(/<url>/g) || []).length
const lastmods = (xml.match(/<lastmod>/g) || []).length
ok(sm.status === 200 && /xml/.test(sm.headers.get('content-type')), `status ${sm.status} ${sm.headers.get('content-type')}`)
ok(urls > 0 && /^<\?xml/.test(xml) && /<\/urlset>\s*$/.test(xml), `${urls} <url> entries, ${lastmods} with <lastmod>`)
ok(xml.includes(`/products/${pdpSlug}</loc>`), 'sitemap contains product URL')

console.log('\n/robots.txt')
const rb = await (await fetch(base + '/robots.txt')).text()
ok(/Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(rb), `robots.txt -> ${rb.match(/Sitemap: (\S+)/)?.[1]}`)
ok(/Disallow: \/cart/.test(rb), 'robots.txt disallows /cart')

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`)
process.exit(failures ? 1 : 0)
