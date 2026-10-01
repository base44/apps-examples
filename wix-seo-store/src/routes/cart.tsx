import { Link, createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { checkoutFn, fetchCart } from '#/lib/api'
import { trackEvent } from '#/lib/analytics'
import { CACHE_PRIVATE } from '#/lib/http'
import { NOINDEX, seo } from '#/lib/seo'
import { Picture } from '#/components/Picture'
import { siteFromMatches } from './__root'

export const Route = createFileRoute('/cart')({
  loader: () => fetchCart(),
  // Per-visitor content: never cache, never index.
  staleTime: 0,
  headers: () => ({ ...CACHE_PRIVATE, 'X-Robots-Tag': 'noindex' }),
  head: ({ matches }) => {
    const site = siteFromMatches(matches)
    return seo({
      site,
      title: 'Your cart',
      description: `Review the items in your ${site.siteName} cart.`,
      path: '/cart',
      robots: NOINDEX,
    })
  },
  component: CartPage,
})

function CartPage() {
  const cart = Route.useLoaderData()
  const checkout = useServerFn(checkoutFn)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
      {cart.lines.length === 0 ? (
        <p className="mt-6 text-stone-600">
          Your cart is empty.{' '}
          <Link to="/" className="underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex items-center gap-4 py-4">
                {l.image && (
                  <div className="h-20 w-20 flex-none overflow-hidden rounded bg-stone-100">
                    <Picture image={l.image} widths={[80, 160]} sizes="80px" aspectRatio={1} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  {l.slug ? (
                    <Link to="/products/$slug" params={{ slug: l.slug }} className="font-medium hover:underline">
                      {l.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{l.name}</span>
                  )}
                  <p className="text-sm text-stone-600">Qty {l.quantity}</p>
                </div>
                <p className="font-medium">{l.formattedPrice}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-right text-lg">
            Subtotal: <strong>{cart.formattedSubtotal}</strong>
          </p>
          <div className="mt-6 text-right">
            {cart.checkoutAvailable ? (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  trackEvent('InitiateCheckout', {
                    contents: cart.lines.map((l) => ({ id: l.productId, name: l.name, quantity: l.quantity })),
                  })
                  const url = await checkout()
                  if (url) window.location.href = url
                  else setBusy(false)
                }}
                className="rounded-md bg-stone-900 px-6 py-3 font-medium text-white hover:bg-stone-800 disabled:bg-stone-400"
              >
                {busy ? 'Redirecting…' : 'Checkout'}
              </button>
            ) : (
              <p className="text-sm text-stone-500">Checkout is disabled in demo (mock data) mode.</p>
            )}
          </div>
        </>
      )}
    </>
  )
}
