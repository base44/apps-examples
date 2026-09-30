import { Link } from '@tanstack/react-router'

export interface Crumb {
  name: string
  /** Router path; omitted for the current page. */
  to?: string
  params?: Record<string, string>
}

/** Visible breadcrumb trail; mirrors the BreadcrumbList JSON-LD. */
export function Breadcrumbs({ items }: { items: Array<Crumb> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.to ? (
              <Link to={c.to} params={c.params} className="hover:underline">
                {c.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-stone-900">
                {c.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
