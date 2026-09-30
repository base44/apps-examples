import { createClient, OAuthStrategy } from '@wix/sdk'
import { catalogVersioning } from '@wix/stores'
import { getWixClientId } from '../env'
import { createMockProvider } from './mock-data'
import type { CatalogProvider } from './provider'
import { createWixProvider } from './wix'
import { createWixV3Provider } from './wix-v3'

let mock: CatalogProvider | undefined
let wix: { clientId: string; provider: Promise<CatalogProvider> } | undefined

/** WIX_CATALOG_VERSION=V1|V3 skips detection; otherwise ask the site once per process. */
async function detectVersion(clientId: string): Promise<'V1' | 'V3'> {
  const forced = process.env.WIX_CATALOG_VERSION?.trim().toUpperCase()
  if (forced === 'V1' || forced === 'V3') return forced
  const client = createClient({
    modules: { catalogVersioning },
    auth: OAuthStrategy({ clientId }),
  })
  const { catalogVersion } = await client.catalogVersioning.getCatalogVersion()
  return catalogVersion === 'V3_CATALOG' ? 'V3' : 'V1'
}

function wixProvider(clientId: string): Promise<CatalogProvider> {
  if (!wix || wix.clientId !== clientId) {
    const provider = detectVersion(clientId).then((v) =>
      v === 'V3' ? createWixV3Provider(clientId) : createWixProvider(clientId),
    )
    // A failed detection (e.g. Wix unreachable) is retried on the next request.
    provider.catch(() => {
      if (wix?.provider === provider) wix = undefined
    })
    wix = { clientId, provider }
  }
  return wix.provider
}

/** Defers every call until the site's catalog version is known. */
function lazy(get: () => Promise<CatalogProvider>): CatalogProvider {
  return {
    source: 'wix',
    listCollections: async () => (await get()).listCollections(),
    getCollectionBySlug: async (slug) => (await get()).getCollectionBySlug(slug),
    listProducts: async (opts) => (await get()).listProducts(opts),
    getProductBySlug: async (slug) => (await get()).getProductBySlug(slug),
    searchProducts: async (q, limit) => (await get()).searchProducts(q, limit),
    listAllProductsForSitemap: async () => (await get()).listAllProductsForSitemap(),
  }
}

/**
 * Returns the Wix provider (Catalog V1 or V3, detected) when WIX_CLIENT_ID is
 * configured, otherwise the clearly-marked mock catalog (see mock-data.ts).
 */
export function getCatalog(): CatalogProvider {
  const clientId = getWixClientId()
  if (clientId) return lazy(() => wixProvider(clientId))
  return (mock ??= createMockProvider())
}
