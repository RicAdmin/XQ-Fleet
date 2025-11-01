"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/lib/user-context"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login")
    }
    if (isAuthenticated && pathname === "/login") {
      router.push("/dashboard")
    }
  }, [isAuthenticated, pathname, router])

  if (!isAuthenticated && pathname !== "/login") {
    return null
  }

  return <>{children}</>
}
