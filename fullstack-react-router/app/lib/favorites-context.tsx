import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBrowserClient } from "./base44.client";
import { login } from "./use-session";
import type { Favorite, SessionUser } from "./types";

interface FavoritesApi {
  ready: boolean;
  isLoggedIn: boolean;
  isFavorite: (propertyId: string) => boolean;
  toggle: (propertyId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesApi | null>(null);

// Loads the signed-in user's favorites ONCE on the client and shares them with
// every card, so we make one query instead of one per card. All work happens
// after hydration; server-rendered HTML stays user-neutral and cacheable.
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  // propertyId -> favorite record id (needed to delete)
  const [map, setMap] = useState<Record<string, string>>({});
  const loading = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    const base44 = getBrowserClient();
    base44.auth
      .me()
      .then(async (me) => {
        if (!active) return;
        setUser(me as unknown as SessionUser);
        const favorites = (await base44.entities.Favorite.list(
          "-created_date",
          500,
        )) as Favorite[];
        if (!active) return;
        const next: Record<string, string> = {};
        for (const fav of favorites) next[fav.property_id] = fav.id;
        setMap(next);
      })
      .catch(() => {
        /* anonymous visitor — nothing saved */
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(
    async (propertyId: string) => {
      if (!user) {
        login();
        return;
      }
      if (loading.current.has(propertyId)) return;
      loading.current.add(propertyId);
      const base44 = getBrowserClient();
      const existingId = map[propertyId];
      try {
        if (existingId) {
          await base44.entities.Favorite.delete(existingId);
          setMap((m) => {
            const next = { ...m };
            delete next[propertyId];
            return next;
          });
        } else {
          const created = (await base44.entities.Favorite.create({
            property_id: propertyId,
            user_email: user.email,
          })) as Favorite;
          setMap((m) => ({ ...m, [propertyId]: created.id }));
        }
      } finally {
        loading.current.delete(propertyId);
      }
    },
    [user, map],
  );

  const api: FavoritesApi = {
    ready,
    isLoggedIn: Boolean(user),
    isFavorite: (id) => Boolean(map[id]),
    toggle,
  };

  return (
    <FavoritesContext.Provider value={api}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesApi {
  return (
    useContext(FavoritesContext) ?? {
      ready: false,
      isLoggedIn: false,
      isFavorite: () => false,
      toggle: async () => {},
    }
  );
}
