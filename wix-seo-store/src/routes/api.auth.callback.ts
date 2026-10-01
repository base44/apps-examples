import { createFileRoute } from '@tanstack/react-router'
import { callback } from '#/server/auth'

export const Route = createFileRoute('/api/auth/callback')({
  server: { handlers: { GET: ({ request }) => callback(request) } },
})
