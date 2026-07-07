import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("listings", "routes/listings.tsx"),
  route("property/:id", "routes/property.tsx"),
  route("favorites", "routes/favorites.tsx"),
  route("agent", "routes/agent.tsx"),
  route("seed", "routes/seed.tsx"),
] satisfies RouteConfig;
