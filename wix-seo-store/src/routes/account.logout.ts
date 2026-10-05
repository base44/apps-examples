import { createFileRoute } from '@tanstack/react-router'
import { logout } from '#/server/auth'

export const Route = createFileRoute('/account/logout')({
  server: { handlers: { POST: ({ request }) => logout(request) } },
})
