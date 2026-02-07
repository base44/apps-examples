import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req: Request) => {
  const base44 = await createClientFromRequest(req);
  const { message, context, history } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: "message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build conversation history for context
  const historyText = (history || [])
    .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Buzz, a friendly and energetic AI browser sidekick by Base44. You help users manage their browser tabs and browse smarter. You're helpful, concise, and have a can-do attitude.

${context}

${historyText ? `Previous conversation:\n${historyText}\n` : ""}

User: ${message}

Respond helpfully and concisely. If the user wants to perform an action on their tabs, include an "action" in your response.

Available actions you can suggest:
- close_tabs: Close specific tabs (provide tabIds array)
- group_tabs: Group tabs together (provide tabIds, name, color)
- open_url: Open a new URL (provide url)
- focus_tab: Switch to a tab (provide tabId)

Respond with JSON containing:
- "message": Your helpful response to the user
- "action": (optional) An action object if you're suggesting an action

Be conversational, friendly, and helpful. Keep responses short and actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Your response to the user"
          },
          action: {
            type: "object",
            description: "Optional action to perform",
            properties: {
              type: {
                type: "string",
                enum: ["close_tabs", "group_tabs", "open_url", "focus_tab"]
              },
              tabIds: {
                type: "array",
                items: { type: "number" }
              },
              name: { type: "string" },
              color: { type: "string" },
              url: { type: "string" },
              tabId: { type: "number" }
            }
          }
        },
        required: ["message"]
      }
    });

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("browser-assistant error:", error);
    return new Response(JSON.stringify({
      message: "I apologize, but I encountered an error. Please try again.",
      error: error?.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
