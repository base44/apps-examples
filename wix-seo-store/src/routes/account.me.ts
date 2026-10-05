import { createFileRoute } from '@tanstack/react-router'
import { me } from '#/server/auth'

export const Route = createFileRoute('/account/me')({
  server: { handlers: { GET: () => me() } },
})
