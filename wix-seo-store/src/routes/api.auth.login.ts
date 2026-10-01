import { createFileRoute } from '@tanstack/react-router'
import { login } from '#/server/auth'

export const Route = createFileRoute('/api/auth/login')({
  server: { handlers: { GET: ({ request }) => login(request) } },
})
