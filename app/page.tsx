"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { login, register } from "@/lib/auth"
import { userFacingErrorMessage } from "@/lib/api-errors"
import {
  fieldErrorsMap,
  loginFormSchema,
  registerFormSchema,
  type RegisterFormValues,
} from "@/lib/validation"

type AuthFieldKey = "email" | "password" | "fullName"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AuthFieldKey, string>>
  >({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const schema = isLogin ? loginFormSchema : registerFormSchema
    const parsed = schema.safeParse({
      email,
      password,
      fullName: fullName.trim() || undefined,
    })
    if (!parsed.success) {
      setFieldErrors(fieldErrorsMap(parsed.error) as Partial<
        Record<AuthFieldKey, string>
      >)
      return
    }
    setLoading(true)
    try {
      if (isLogin) {
        await login(parsed.data.email, parsed.data.password)
      } else {
        const d = parsed.data as RegisterFormValues
        await register(
          d.email,
          d.password,
          d.fullName?.trim() || undefined,
        )
        await login(d.email, d.password)
      }
      router.push("/dashboard")
    } catch (err: unknown) {
      setError(userFacingErrorMessage(err, "Sign-in failed. Try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">Invize</CardTitle>
            <CardTitle className="text-xl font-semibold text-foreground">
              {isLogin ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin ? "Sign in to your Invize account" : "Get started with Invize today"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="full_name"
                    placeholder="Enter your full name"
                    type="text"
                    className="bg-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={!!fieldErrors.fullName}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-sm text-destructive">{fieldErrors.fullName}</p>
                  )}
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{isLogin ? "Email Address" : "Work Email"}</Label>
              <Input
                id="email"
                name="email"
                placeholder={isLogin ? "Enter your email" : "Enter your work email"}
                type="email"
                className="bg-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-sm text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isLogin ? "Password" : "Create Password"}</Label>
              <Input
                id="password"
                name="password"
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                type="password"
                className="bg-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <p className="text-sm text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            {isLogin && (
              <div className="text-right">
                <Link href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Forgot Password?
                </Link>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              {loading ? (isLogin ? "Signing In..." : "Creating Account...") : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setFieldErrors({})
                setError(null)
              }}
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
