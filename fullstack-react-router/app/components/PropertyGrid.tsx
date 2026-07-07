import type { Property } from "../lib/types";
import { PropertyCard } from "./PropertyCard";

export function PropertyGrid({
  properties,
  columns,
}: {
  properties: Property[];
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid ${columns === 2 ? "grid-2" : ""}`}>
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
