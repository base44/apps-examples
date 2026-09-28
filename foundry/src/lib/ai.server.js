import { openaiCompatibleText } from "@tanstack/ai-openai/compatible";
import { getRequest } from "@tanstack/react-start/server";

// A TanStack AI chat adapter on the Base44 AI gateway: OpenAI-compatible, no API
// key, billed to the app's AI credits. Pass `context.getBase44()`. The gateway is
// called as the app (service role) because an owner can restrict it to server-side
// calls, which refuses a visitor's token, so authenticate the caller first.
// "automatic" lets the platform pick the model; named models cost more credits.
export const gatewayModel = (base44, model = "automatic") => {
  const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
  // The platform's signed proof that the visitor passed the workspace IP allowlist.
  const state = getRequest().headers.get("Base44-State");
  return openaiCompatibleText(model, {
    name: "base44",
    baseURL,
    apiKey: token,
    defaultHeaders: state ? { "Base44-State": state } : undefined,
  });
};
