import { handlers } from "@/auth";

// Auth.js catch-all route: handles /api/auth/signin, /callback, /session, etc.
export const { GET, POST } = handlers;
