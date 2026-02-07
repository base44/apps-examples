export interface DisplayMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface User {
  id: string;
  email: string;
}
