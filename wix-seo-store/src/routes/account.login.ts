import { createFileRoute } from '@tanstack/react-router'
import { login } from '#/server/auth'

export const Route = createFileRoute('/account/login')({
  server: { handlers: { GET: ({ request }) => login(request) } },
})
