"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useUser } from "@/lib/user-context"
import { Eye, EyeOff, LogIn } from "lucide-react"
import Image from "next/image"

export function LoginPage() {
  const router = useRouter()
  const { login } = useUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(email, password)

      if (success) {
        router.push("/dashboard")
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md p-10 glass-card border-white/60 shadow-2xl backdrop-blur-xl bg-white/80 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
            <Image
              src="/xq-logo.png"
              alt="XQ Logo"
              width={96}
              height={96}
              className="rounded-3xl relative z-10 shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-3 font-medium">Sign in to XQ Operation Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground/90">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@xqrentals.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 px-4 bg-white/50 border-border/50 focus:bg-white focus:border-primary/50 transition-all duration-200 text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground/90">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 px-4 pr-12 bg-white/50 border-border/50 focus:bg-white focus:border-primary/50 transition-all duration-200 text-base"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200/50 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-border/30">
          <p className="text-xs font-bold text-foreground/80 mb-3 uppercase tracking-wide">Demo Credentials</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-border/20">
              <span className="font-semibold text-foreground/70">Super Admin</span>
              <span className="font-mono text-[10px]">admin@xqrentals.com / admin123</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-border/20">
              <span className="font-semibold text-foreground/70">Operation</span>
              <span className="font-mono text-[10px]">sarah@xqrentals.com / operation123</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-border/20">
              <span className="font-semibold text-foreground/70">Customer Care</span>
              <span className="font-mono text-[10px]">mike@xqrentals.com / care123</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-8 font-medium">© 2025-2026 Ricodes.com</p>
      </Card>
    </div>
  )
}
