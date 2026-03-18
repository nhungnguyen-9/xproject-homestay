import React from "react"
import { Outlet } from "react-router"
import { Sidebar } from "./sidebar"

interface AdminLayoutProps {
  /** Nội dung trang admin hiển thị bên phải sidebar */
  children?: React.ReactNode
}

/**
 * AdminLayout - Khung bố cục cho trang quản lý
 * Cấu trúc: Sidebar (trái, cố định) + Main content (phải, cuộn)
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar điều hướng */}
      <Sidebar
        isOpen={sidebarOpen || mobileSidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Vùng nội dung chính */}
      <main className="flex-1 overflow-y-auto">
        {/* Header bar của admin */}
        <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white px-6 shadow-sm">
          {/* Nút toggle sidebar trên mobile */}
          <button
            aria-label="Toggle sidebar"
            onClick={() => setMobileSidebarOpen(v => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Tiêu đề trang (slot cho children header) */}
          <div className="flex-1" />

          {/* Avatar giả lập nhân viên */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Admin</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F87171] text-white text-sm font-semibold">
              A
            </div>
          </div>
        </div>

        {/* Nội dung trang con */}
        <div className="p-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}
