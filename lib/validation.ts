import { z } from "zod"

/** Matches backend `EmailStr` + non-empty after trim. */
export const emailField = z
  .string()
  .trim()
  .min(1, "Email required")
  .email("Enter a valid email")

/** Matches backend `constr(min_length=8, max_length=128)`. */
export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")

export const loginFormSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const registerFormSchema = loginFormSchema.extend({
  fullName: z.string().max(256).optional(),
})

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export const inviteEmailSchema = z.object({
  email: emailField,
})

export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input"
}

export function fieldErrorsMap(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === "string" && out[key] === undefined) {
      out[key] = issue.message
    }
  }
  return out
}
