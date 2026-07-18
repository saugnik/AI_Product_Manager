import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .trim(),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
    .regex(/[0-9]/, { error: "Include at least one number." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
