import { createFileRoute } from '@tanstack/react-router'
import { logout } from '#/server/auth'

export const Route = createFileRoute('/api/auth/logout')({
  server: { handlers: { POST: ({ request }) => logout(request) } },
})
