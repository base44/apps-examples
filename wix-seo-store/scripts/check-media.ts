// Sanity check for the Wix media URL builder (run: node --experimental-strip-types scripts/check-media.ts)
import { absoluteImageUrl, responsiveImage, wixImageUrl } from '../src/lib/media.ts'

const img = {
  src: 'https://static.wixstatic.com/media/8dfd06_e9c49cd22b95454daac5e46a92bbad79~mv2.png',
  width: 2000,
  height: 1500,
  alt: 'demo',
}
const wixUri = {
  src: 'wix:image://v1/8dfd06_e9c49cd22b95454daac5e46a92bbad79~mv2.png/shirt.png#originWidth=1000&originHeight=1000',
  width: 1000,
  height: 1000,
  alt: 'demo',
}
console.log(wixImageUrl(img.src, { width: 480, height: 480, format: 'avif' }))
const r = responsiveImage(wixUri, { widths: [360, 720, 1200], aspectRatio: 1 })
console.log(JSON.stringify(r, null, 1))
console.log(absoluteImageUrl(img, 'https://shop.example.com'))
console.log(responsiveImage({ src: '/mock-media/x-1.svg', width: 1200, height: 1200, alt: '' }, { widths: [360] }))
