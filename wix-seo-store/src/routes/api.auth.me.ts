import { createFileRoute } from '@tanstack/react-router'
import { me } from '#/server/auth'

export const Route = createFileRoute('/api/auth/me')({
  server: { handlers: { GET: () => me() } },
})
