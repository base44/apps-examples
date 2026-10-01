import { createFileRoute } from '@tanstack/react-router'
import { logoutCallback } from '#/server/auth'

export const Route = createFileRoute('/api/auth/logout-callback')({
  server: { handlers: { GET: ({ request }) => logoutCallback(request) } },
})
