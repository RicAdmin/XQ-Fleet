"use client"

import type React from "react"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Car,
  LayoutDashboard,
  CarFront,
  Settings,
  Menu,
  AlertCircle,
  Clock,
  Bell,
  LogOut,
  Package,
  BarChart3,
  Wrench,
  Users,
  ChevronDown,
  ChevronRight,
  Monitor,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface AppLayoutProps {
  children: React.ReactNode
}

interface ActivityNotification {
  id: string
  type: "Job" | "Ticket"
  title: string
  message: string
  time: string
  orderId: string
  unread: boolean
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, logout } = useUser()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [operationsExpanded, setOperationsExpanded] = useState(true)
  const [managementExpanded, setManagementExpanded] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const pathname = usePathname()

  const shouldHideSidebar = pathname?.startsWith("/car/")

  console.log("[v0] Current pathname:", pathname)
  console.log("[v0] Should hide sidebar:", shouldHideSidebar)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const activityNotifications: ActivityNotification[] = [
    {
      id: "1",
      type: "Job",
      title: "New Job Created",
      message: "Job #J-2024-045 created for Toyota Camry - Customer: John Smith",
      time: "5 min ago",
      orderId: "J-2024-045",
      unread: true,
    },
    {
      id: "2",
      type: "Job",
      title: "Job Pickup Completed",
      message: "Job #J-2024-044 - Honda Odyssey picked up by Michael Chen",
      time: "1 hour ago",
      orderId: "J-2024-044",
      unread: true,
    },
    {
      id: "3",
      type: "Job",
      title: "Job Return Completed",
      message: "Job #J-2024-043 - Ford Explorer returned by Sarah Williams",
      time: "2 hours ago",
      orderId: "J-2024-043",
      unread: false,
    },
    {
      id: "4",
      type: "Ticket",
      title: "New Ticket Created",
      message: "Ticket #TKT-2025-012 - AC issue reported for Chevrolet Tahoe",
      time: "3 hours ago",
      orderId: "TKT-2025-012",
      unread: true,
    },
    {
      id: "5",
      type: "Ticket",
      title: "Ticket Resolved",
      message: "Ticket #TKT-2025-011 - Engine noise issue resolved for Nissan Altima",
      time: "5 hours ago",
      orderId: "TKT-2025-011",
      unread: false,
    },
    {
      id: "6",
      type: "Job",
      title: "Job Extended",
      message: "Job #J-2024-042 - Rental period extended by 3 days for Robert Brown",
      time: "6 hours ago",
      orderId: "J-2024-042",
      unread: false,
    },
  ]

  const unreadNotifications = activityNotifications.filter((n) => n.unread).length

  const mainNavigation = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/job-monitor", icon: Monitor, label: "Job Monitor" },
  ]

  const operationsNavigation = [
    { href: "/bookings", icon: Package, label: "Jobs" },
    { href: "/tickets", icon: AlertCircle, label: "Tickets" },
    { href: "/cars", icon: Car, label: "Cars" },
    { href: "/maintenance", icon: Wrench, label: "Service" },
    { href: "/pr", icon: KeyRound, label: "P&R" }, // Changed icon from TruckIcon to KeyRound (car key icon)
  ]

  const managementNavigation = [
    { href: "/fleet", icon: CarFront, label: "Fleet" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/activity-logs", icon: Clock, label: "Activities" },
    { href: "/customers", icon: Users, label: "Customers" },
    { href: "/tables", icon: Settings, label: "Tables" },
  ]

  const adminNavigation = [{ href: "/settings", icon: Settings, label: "Admin" }]

  const getFilteredNavigation = () => {
    const userRole = currentUser?.role || "Customer Care"

    if (userRole === "Customer Care") {
      return {
        operations: operationsNavigation.filter((item) => item.label === "Jobs" || item.label === "Tickets"),
        management: [],
        admin: [],
      }
    } else if (userRole === "Operation") {
      return {
        operations: operationsNavigation,
        management: [],
        admin: [],
      }
    } else {
      return {
        operations: operationsNavigation,
        management: managementNavigation,
        admin: adminNavigation,
      }
    }
  }

  const filteredNav = getFilteredNavigation()

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname?.startsWith(href + "/")
  }

  const getPageTitle = () => {
    const allItems = [...mainNavigation, ...operationsNavigation, ...managementNavigation, ...adminNavigation]
    const route = allItems.find((item) => isActiveRoute(item.href))
    return route?.label || "Dashboard"
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {!shouldHideSidebar && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out lg:translate-x-0",
            "bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <img src="/xq-logo.png" alt="XQ Car" className="w-10 h-10 rounded-lg" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">XQ Car</span>
            </div>
          </div>

          <nav className="overflow-y-auto h-[calc(100vh-4rem)] py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="mb-6">
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</h3>
              </div>
              <div className="space-y-0.5">
                {mainNavigation.map((item) => {
                  const Icon = item.icon
                  const active = isActiveRoute(item.href)
                  return (
                    <Link key={item.href} href={item.href}>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                          "hover:bg-gray-100",
                          active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900",
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    </Link>
                  )
                })}
              </div>
            </div>

            {filteredNav.operations.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setOperationsExpanded(!operationsExpanded)}
                  className="w-full flex items-center gap-2 px-3 mb-2 hover:bg-gray-50 rounded-lg py-1.5 transition-colors duration-200"
                >
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-1 text-left">
                    Operations
                  </h3>
                  {operationsExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200" />
                  )}
                </button>
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                    operationsExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {filteredNav.operations.map((item) => {
                    const Icon = item.icon
                    const active = isActiveRoute(item.href)
                    return (
                      <Link key={item.href} href={item.href}>
                        <button
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                            "hover:bg-gray-100",
                            active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900",
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                        </button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {filteredNav.management.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setManagementExpanded(!managementExpanded)}
                  className="w-full flex items-center gap-2 px-3 mb-2 hover:bg-gray-50 rounded-lg py-1.5 transition-colors duration-200"
                >
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-1 text-left">
                    Management
                  </h3>
                  {managementExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200" />
                  )}
                </button>
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                    managementExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {filteredNav.management.map((item) => {
                    const Icon = item.icon
                    const active = isActiveRoute(item.href)
                    return (
                      <Link key={item.href} href={item.href}>
                        <button
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                            "hover:bg-gray-100",
                            active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900",
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                        </button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {filteredNav.admin.length > 0 && (
              <div>
                <div className="px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</h3>
                </div>
                <div className="space-y-0.5">
                  {filteredNav.admin.map((item) => {
                    const Icon = item.icon
                    const active = isActiveRoute(item.href)
                    return (
                      <Link key={item.href} href={item.href}>
                        <button
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                            "hover:bg-gray-100",
                            active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900",
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                        </button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </nav>
        </aside>
      )}

      <div className={cn("flex-1", !shouldHideSidebar && "lg:pl-64")}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 glass-header px-6">
          <div className="flex items-center gap-4">
            {!shouldHideSidebar && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">{getPageTitle()}</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {currentTime.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {" • "}
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-foreground">{currentUser?.name || "User"}</span>
              <span className="text-xs text-muted-foreground">{currentUser?.role || "Guest"}</span>
            </div>

            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-gray-100 transition-colors duration-200"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-sm">Activity Notifications</h3>
                  {unreadNotifications > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadNotifications} new
                    </Badge>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {activityNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={cn(
                          "w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 mb-1",
                          notification.unread && "bg-blue-50/50",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              notification.type === "Job"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-red-500/10 text-red-600",
                            )}
                          >
                            {notification.type === "Job" ? (
                              <Package className="h-5 w-5" />
                            ) : (
                              <AlertCircle className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  notification.type === "Job"
                                    ? "bg-green-500/10 text-green-700 border-green-500/20"
                                    : "bg-red-500/10 text-red-700 border-red-500/20",
                                )}
                              >
                                {notification.type}
                              </Badge>
                              {notification.unread && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">{notification.title}</p>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-1">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-400">{notification.time}</p>
                              <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {notification.orderId}
                              </code>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t">
                  <Link href="/activity-logs">
                    <Button variant="ghost" className="w-full text-sm" size="sm">
                      View all activities
                    </Button>
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 transition-colors duration-200"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-8rem)]">{children}</main>

        <footer className="border-t border-border py-4 px-6 text-center text-sm text-muted-foreground">
          XQ Operation Portal © 2025-2026 Ricodes.com
        </footer>
      </div>

      {!shouldHideSidebar && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {!shouldHideSidebar && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass-header lg:hidden">
          <div className="grid grid-cols-5 gap-1 p-2">
            {mainNavigation.concat(operationsNavigation.slice(0, 4)).map((item) => {
              const Icon = item.icon
              const active = isActiveRoute(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-2 w-full transition-colors duration-200",
                      active && "text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
