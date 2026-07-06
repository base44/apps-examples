import { useState } from "react";
import { HeartIcon } from "./icons";
import { useFavorites } from "../lib/favorites-context";

// Client-side "save to favorites" control. Uses the shared favorites context so
// state is consistent across cards and the detail page. Anonymous users are
// sent to login on click.
export function SaveFavoriteButton({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);
  const active = isFavorite(propertyId);

  return (
    <button
      type="button"
      className={`fav-btn ${active ? "is-active" : ""} ${className ?? ""}`}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      title={active ? "Saved" : "Save to favorites"}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        try {
          await toggle(propertyId);
        } finally {
          setBusy(false);
        }
      }}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
