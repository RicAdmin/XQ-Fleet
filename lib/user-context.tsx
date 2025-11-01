"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type UserRole = "Super Admin" | "Operation" | "Customer Care"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  mobile: string
}

interface AccessLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: UserRole
  action: "Sign In" | "Sign Out"
  timestamp: string
  ipAddress: string
  device: string
}

interface UserContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  getAccessLogs: () => AccessLog[]
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const mockUserDatabase = [
  {
    id: "1",
    name: "John Admin",
    email: "admin@xqrentals.com",
    password: "admin123",
    role: "Super Admin" as UserRole,
    mobile: "+60 12-345 6789",
  },
  {
    id: "2",
    name: "Sarah Operations",
    email: "sarah@xqrentals.com",
    password: "operation123",
    role: "Operation" as UserRole,
    mobile: "+60 12-456 7890",
  },
  {
    id: "3",
    name: "Mike Support",
    email: "mike@xqrentals.com",
    password: "care123",
    role: "Customer Care" as UserRole,
    mobile: "+60 12-567 8901",
  },
]

const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent
  if (userAgent.includes("Chrome")) return "Chrome Browser"
  if (userAgent.includes("Firefox")) return "Firefox Browser"
  if (userAgent.includes("Safari")) return "Safari Browser"
  if (userAgent.includes("Edge")) return "Edge Browser"
  return "Unknown Browser"
}

const getMockIPAddress = (): string => {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

const logAccessEvent = (user: User, action: "Sign In" | "Sign Out") => {
  const accessLog: AccessLog = {
    id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    action,
    timestamp: new Date().toISOString(),
    ipAddress: getMockIPAddress(),
    device: getDeviceInfo(),
  }

  const existingLogs = localStorage.getItem("accessLogs")
  const logs: AccessLog[] = existingLogs ? JSON.parse(existingLogs) : []
  logs.unshift(accessLog) // Add to beginning of array

  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(100)
  }

  localStorage.setItem("accessLogs", JSON.stringify(logs))
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setCurrentUser(user)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = mockUserDatabase.find((u) => u.email === email && u.password === password)

    if (user) {
      const { password: _, ...userWithoutPassword } = user
      setCurrentUser(userWithoutPassword)
      setIsAuthenticated(true)
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))

      logAccessEvent(userWithoutPassword, "Sign In")

      return true
    }

    return false
  }

  const logout = () => {
    if (currentUser) {
      logAccessEvent(currentUser, "Sign Out")
    }

    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("currentUser")
  }

  const getAccessLogs = (): AccessLog[] => {
    const existingLogs = localStorage.getItem("accessLogs")
    return existingLogs ? JSON.parse(existingLogs) : []
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isAuthenticated, login, logout, getAccessLogs }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

export type { AccessLog }
