"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Plus, Edit, Search, Check, X, Eye, Key } from "lucide-react"
import { AddUserModal } from "@/components/add-user-modal"
import { EditUserModal } from "@/components/edit-user-modal"
import { ResetPasswordModal } from "@/components/reset-password-modal"
import { useUser } from "@/lib/user-context"

interface User {
  id: string
  name: string
  role: "Super Admin" | "Operation" | "Customer Care"
  email: string
  mobile: string
  status: "Active" | "Inactive"
  createdOn: string
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "John Admin",
    role: "Super Admin",
    email: "admin@xqrentals.com",
    mobile: "+60 12-345 6789",
    status: "Active",
    createdOn: "2024-01-15",
  },
  {
    id: "2",
    name: "Sarah Operations",
    role: "Operation",
    email: "sarah@xqrentals.com",
    mobile: "+60 12-456 7890",
    status: "Active",
    createdOn: "2024-02-20",
  },
  {
    id: "3",
    name: "Mike Support",
    role: "Customer Care",
    email: "mike@xqrentals.com",
    mobile: "+60 12-567 8901",
    status: "Active",
    createdOn: "2024-03-10",
  },
  {
    id: "4",
    name: "Emily Care",
    role: "Customer Care",
    email: "emily@xqrentals.com",
    mobile: "+60 12-678 9012",
    status: "Inactive",
    createdOn: "2024-01-25",
  },
]

export function SettingsPage() {
  const { currentUser } = useUser()
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null)
  const [showPermissions, setShowPermissions] = useState(true)

  const isSuperAdmin = currentUser?.role === "Super Admin"

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const groupedUsers = {
    "Super Admin": filteredUsers.filter((u) => u.role === "Super Admin"),
    Operation: filteredUsers.filter((u) => u.role === "Operation"),
    "Customer Care": filteredUsers.filter((u) => u.role === "Customer Care"),
  }

  const handleAddUser = (newUser: Omit<User, "id" | "createdOn">) => {
    const user: User = {
      ...newUser,
      id: String(users.length + 1),
      createdOn: new Date().toISOString().split("T")[0],
    }
    setUsers([...users, user])
  }

  const handleEditUser = (updatedUser: User) => {
    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    setEditingUser(null)
  }

  const handleResetPassword = (userId: string, newPassword: string) => {
    console.log(`[v0] Password reset for user ${userId}: ${newPassword}`)
    // In a real app, this would call an API to update the password
    alert(`Password successfully reset for user ${userId}`)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 pb-24 lg:pb-6">
      <Card className="rounded-xl overflow-hidden glass-card border-white/40">
        <div
          className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setShowPermissions(!showPermissions)}
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">Role Permissions & Access Rights</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              View what each role can access and manage in the system
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8">
            {showPermissions ? "Hide" : "Show"}
          </Button>
        </div>

        {showPermissions && (
          <div className="p-4 overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-semibold text-xs w-[180px]">Module / Function</TableHead>
                  <TableHead className="text-center font-semibold text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <span>Super Admin</span>
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-700 border-purple-500/20 text-[10px]"
                      >
                        Full Access
                      </Badge>
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <span>Operation</span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-[10px]">
                        View Only
                      </Badge>
                    </div>
                  </TableHead>
                  <TableHead className="text-center font-semibold text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <span>Customer Care</span>
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-700 border-green-500/20 text-[10px]"
                      >
                        Limited
                      </Badge>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/20">
                  <TableCell colSpan={4} className="font-semibold text-xs py-2">
                    Operations
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Dashboard</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Jobs (Create/Edit)</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Cars (View)</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Eye className="h-4 w-4 text-blue-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Cars (Add/Edit)</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Fleet Management</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Eye className="h-4 w-4 text-blue-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Service (Maintenance/Wash)</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Eye className="h-4 w-4 text-blue-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Analytics</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Eye className="h-4 w-4 text-blue-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Activity Logs</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Eye className="h-4 w-4 text-blue-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Tickets (Create/Edit)</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/20">
                  <TableCell colSpan={4} className="font-semibold text-xs py-2">
                    Management
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Customers</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/20">
                  <TableCell colSpan={4} className="font-semibold text-xs py-2">
                    System
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm py-2.5">Admin (User Management)</TableCell>
                  <TableCell className="text-center py-2.5">
                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <X className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-4 flex items-start gap-4 text-xs text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>Full Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                <span>View Only</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-gray-400" />
                <span>No Access</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Filter Bar */}
      <Card className="rounded-xl p-4 glass-card border-white/40">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <Button onClick={() => setIsAddUserModalOpen(true)} className="h-10 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </Card>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> of{" "}
          <span className="font-semibold text-foreground">{users.length}</span> users
        </p>
      </div>

      {Object.entries(groupedUsers).map(
        ([role, roleUsers]) =>
          roleUsers.length > 0 && (
            <div key={role} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground tracking-tight">{role}</h2>
                <Badge variant="outline" className="bg-muted/50 text-xs font-medium">
                  {roleUsers.length}
                </Badge>
              </div>

              <Card className="rounded-xl overflow-hidden glass-card border-white/40">
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold text-xs whitespace-nowrap h-11">Name</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap h-11">Email</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap h-11">Mobile No</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap h-11">Created On</TableHead>
                        <TableHead className="font-semibold text-xs whitespace-nowrap h-11">Status</TableHead>
                        <TableHead className="text-right font-semibold text-xs whitespace-nowrap h-11">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-accent/30 transition-colors">
                          <TableCell className="font-medium text-sm py-3">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm py-3">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap py-3">
                            {user.mobile}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap py-3">
                            {new Date(user.createdOn).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                user.status === "Active"
                                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs font-medium"
                                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 text-xs font-medium"
                              }
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent"
                                onClick={() => setEditingUser(user)}
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {isSuperAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-accent"
                                  onClick={() => setResettingPasswordUser(user)}
                                  title="Reset password"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          ),
      )}

      {filteredUsers.length === 0 && (
        <Card className="rounded-xl p-12 glass-card border-white/40">
          <p className="text-center text-muted-foreground text-sm">No users found matching your search</p>
        </Card>
      )}

      <AddUserModal open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} onAddUser={handleAddUser} />

      {editingUser && (
        <EditUserModal
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onEditUser={handleEditUser}
        />
      )}

      {resettingPasswordUser && (
        <ResetPasswordModal
          open={!!resettingPasswordUser}
          onOpenChange={(open) => !open && setResettingPasswordUser(null)}
          user={resettingPasswordUser}
          onResetPassword={handleResetPassword}
        />
      )}
    </div>
  )
}
