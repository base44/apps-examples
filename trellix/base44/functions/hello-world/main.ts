import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  return new Response('Hello World');
});
