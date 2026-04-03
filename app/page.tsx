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

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, fullName)
        await login(email, password)
      }
      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.message || "Authentication failed")
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
                  <Input id="fullName" name="full_name" placeholder="Enter your full name" type="text" className="bg-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
              />
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
              />
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
              onClick={() => setIsLogin(!isLogin)}
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
