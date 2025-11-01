import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { UserProvider } from "@/lib/user-context"

export const metadata: Metadata = {
  title: "XQ Operation Portal",
  description: "Fleet Management System",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <UserProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </UserProvider>
        <Analytics />
      </body>
    </html>
  )
}
