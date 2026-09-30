import { Link } from '@tanstack/react-router'

/**
 * Crawlable pagination: real <a href> links (?page=N), page 1 has no param so
 * it matches the canonical. rel=prev/next are also emitted in <head>.
 */
export function Pagination({
  slug,
  page,
  totalPages,
}: {
  slug: string
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null
  const search = (p: number) => (p === 1 ? {} : { page: p })
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const cls = 'rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100'
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link to="/category/$slug" params={{ slug }} search={search(page - 1)} rel="prev" className={cls}>
          ← Previous
        </Link>
      )}
      {pages.map((p) =>
        p === page ? (
          <span key={p} aria-current="page" className={`${cls} bg-stone-900 text-white hover:bg-stone-900`}>
            {p}
          </span>
        ) : (
          <Link key={p} to="/category/$slug" params={{ slug }} search={search(p)} className={cls}>
            <span className="sr-only">Page </span>
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link to="/category/$slug" params={{ slug }} search={search(page + 1)} rel="next" className={cls}>
          Next →
        </Link>
      )}
    </nav>
  )
}
