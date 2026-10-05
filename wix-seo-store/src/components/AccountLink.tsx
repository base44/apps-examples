import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'

/**
 * Sign in / Sign out. Resolved on the client after hydration so the SSR HTML of
 * public pages stays identical for every visitor (and CDN-cacheable).
 */
export function AccountLink() {
  const { href } = useLocation()
  const [member, setMember] = useState<boolean | null>(null)
  useEffect(() => {
    fetch('/account/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? (r.json() as Promise<{ member: boolean }>) : { member: false }))
      .then((d) => setMember(d.member))
      .catch(() => setMember(false))
  }, [])
  const returnTo = encodeURIComponent(href)
  if (member === null) return <span className="w-14" aria-hidden="true" />
  return member ? (
    <form method="post" action={`/account/logout?returnToUrl=${returnTo}`}>
      <button type="submit" className="hover:underline">
        Sign out
      </button>
    </form>
  ) : (
    <a href={`/account/login?returnToUrl=${returnTo}`} rel="nofollow" className="hover:underline">
      Sign in
    </a>
  )
}
