import React, { useState } from "react"
import { Outlet, useNavigate } from "react-router"
import { Sidebar } from "./sidebar"
import * as authService from "@/services/authService"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, LogOut } from "lucide-react"

interface AdminLayoutProps {
  children?: React.ReactNode
}

/**
 * Bố cục chính trang quản trị — sidebar cố định bên trái, nội dung cuộn bên phải
 * Header hiển thị thông tin người dùng, vai trò và nút đăng xuất
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const user = authService.getUser()
  const role = authService.getRole()
  const displayName = user?.displayName ?? user?.username ?? 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await authService.logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen || mobileSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-card px-6 shadow-sm">
          <button
            aria-label="Mở/đóng sidebar"
            onClick={() => setMobileSidebarOpen(v => !v)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <span
              className={
                role === 'admin'
                  ? "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                  : "inline-flex items-center rounded-full bg-status-info-muted px-2 py-0.5 text-xs font-semibold text-status-info-foreground"
              }
            >
              {role === 'admin' ? 'Admin' : 'Nhân viên'}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm transition-colors hover:bg-accent">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm text-foreground sm:inline">{displayName}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut size={14} className="mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}
