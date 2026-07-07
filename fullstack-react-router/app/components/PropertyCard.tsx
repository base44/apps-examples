import { Link } from "react-router";
import type { Property } from "../lib/types";
import {
  coverImage,
  formatPrice,
  formatSqft,
  statusLabel,
  typeLabel,
} from "../lib/format";
import { AreaIcon, BathIcon, BedIcon, PinIcon } from "./icons";
import { SaveFavoriteButton } from "./SaveFavoriteButton";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="card">
      <Link to={`/property/${property.id}`} className="card-media">
        <img
          src={coverImage(property.images)}
          alt={property.title}
          loading="lazy"
        />
        <div className="card-badges">
          {property.featured && (
            <span className="badge badge-featured">Featured</span>
          )}
          <span className={`badge badge-${property.status}`}>
            {statusLabel(property.status)}
          </span>
        </div>
      </Link>
      <SaveFavoriteButton propertyId={property.id} className="card-fav" />

      <div className="card-body">
        <div className="card-price">{formatPrice(property.price)}</div>
        <Link to={`/property/${property.id}`} className="card-title">
          {property.title}
        </Link>
        <div className="card-addr" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <PinIcon /> <span>{property.address}, {property.city}</span>
        </div>
        <div className="card-specs">
          {property.property_type === "land" ? (
            <span className="badge badge-type">{typeLabel(property.property_type)}</span>
          ) : (
            <>
              <span>
                <BedIcon /> {property.bedrooms} bd
              </span>
              <span>
                <BathIcon /> {property.bathrooms} ba
              </span>
              {property.sqft > 0 && (
                <span>
                  <AreaIcon /> {formatSqft(property.sqft)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
