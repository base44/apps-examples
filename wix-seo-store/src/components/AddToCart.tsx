import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { addToCartFn } from '#/lib/api'
import type { ProductVariant } from '#/lib/types'

/** Minimal add-to-cart (Wix eCom current cart). Not part of indexable content. */
export function AddToCart({
  productId,
  variants,
  optionsLabel,
  disabled,
}: {
  productId: string
  variants?: Array<ProductVariant>
  optionsLabel?: string
  disabled?: boolean
}) {
  const add = useServerFn(addToCartFn)
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle')
  const [variantId, setVariantId] = useState(
    () => (variants?.find((v) => v.inStock) ?? variants?.[0])?.id,
  )
  const variant = variants?.find((v) => v.id === variantId)
  const soldOut = disabled || variant?.inStock === false
  return (
    <div>
      {variants && variants.length > 1 && (
        <label className="mb-4 block text-sm font-medium">
          {optionsLabel ?? 'Option'}
          <select
            value={variantId}
            onChange={(e) => {
              setVariantId(e.target.value)
              setState('idle')
            }}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 sm:w-64"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
                {v.inStock ? '' : ' (out of stock)'}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={soldOut || state === 'busy'}
        onClick={async () => {
          setState('busy')
          try {
            await add({ data: { productId, variantId, quantity: 1 } })
            await router.navigate({ to: '/cart' })
          } catch {
            setState('error')
          }
        }}
        className="w-full rounded-md bg-stone-900 px-6 py-3 text-base font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400 sm:w-auto"
      >
        {soldOut ? 'Out of stock' : state === 'busy' ? 'Adding…' : 'Add to cart'}
      </button>
      <p role="status" className="mt-2 text-sm text-rose-700">
        {state === 'error' ? 'Could not add to cart. Please try again.' : ''}
      </p>
    </div>
  )
}
