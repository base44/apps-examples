import { QueryClient } from "@tanstack/react-query";

// One client per router: on the server getRouter() runs per request, so a shared
// client would render one visitor's cached query data into another visitor's page.
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false },
    },
  });
