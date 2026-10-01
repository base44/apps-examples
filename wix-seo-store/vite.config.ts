import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Cloudflare Workers module output: what Base44 publish deploys.
    nitro({
      preset: 'cloudflare_module',
      compatibilityDate: '2026-09-01',
      cloudflare: { nodeCompat: true },
    }),
    tailwindcss(),
    tanstackStart({
      // Inline the (small) Tailwind CSS into the SSR HTML: removes the only
      // render-blocking request on first paint (better FCP/LCP).
      server: { build: { inlineCss: true } },
    }),
    viteReact(),
  ],
})

export default config
