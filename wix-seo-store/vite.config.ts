import base44 from '@base44/vite-plugin'
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    base44({
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true,
    }),
    // No inspector: a restarted dev server would race the old one for port 9229.
    cloudflare({ viteEnvironment: { name: 'ssr' }, inspectorPort: false }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: 'src',
      // Inline the (small) Tailwind CSS into the SSR HTML: no render-blocking request.
      server: { build: { inlineCss: true } },
    }),
    viteReact(),
  ],
})
