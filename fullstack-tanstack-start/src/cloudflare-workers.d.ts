// Minimal ambient declaration for the Worker-only `cloudflare:workers` virtual
// module. It only resolves at runtime on workerd; we import it lazily and read
// `env` (the Worker environment bindings). `wrangler types` would generate a
// richer version, but the example only needs the env record.
declare module "cloudflare:workers" {
  export const env: Record<string, string | undefined>;
}
