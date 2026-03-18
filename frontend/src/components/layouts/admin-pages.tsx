import { Link } from "react-router"
import { demoBookings, demoRooms } from "@/data/demo-schedule"

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string | number
  tone?: "default" | "primary"
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={tone === "primary" ? "mt-2 text-2xl font-bold text-[#F87171]" : "mt-2 text-2xl font-bold text-slate-900"}>
        {value}
      </p>
    </div>
  )
}

export function AdminDashboardPage() {
  const pendingCount = demoBookings.filter((booking) => booking.status === "pending").length
  const confirmedCount = demoBookings.filter((booking) => booking.status === "confirmed").length

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan vận hành</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi nhanh tình trạng đặt phòng trong ngày.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng đơn booking" value={demoBookings.length} />
        <StatCard label="Đơn chờ xác nhận" value={pendingCount} tone="primary" />
        <StatCard label="Đơn đã xác nhận" value={confirmedCount} />
        <StatCard label="Số phòng hoạt động" value={demoRooms.length} />
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Truy cập nhanh</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/bookings"
            className="rounded-lg bg-[#F87171] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ef6666]"
          >
            Mở lịch phòng
          </Link>
          <Link
            to="/admin/rooms"
            className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Danh sách khách
          </Link>
        </div>
      </div>
    </section>
  )
}

export function AdminBookingsPage() {
  return (
    <section className="space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Lịch phòng</h1>
      <p className="text-sm text-slate-500">
        Khu vực này là điểm vào cho lịch phòng và sẽ được mở rộng ở TASK tiếp theo.
      </p>
    </section>
  )
}

export function AdminRoomsPage() {
  return (
    <section className="space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Danh sách khách</h1>
      <p className="text-sm text-slate-500">
        Điều hướng đã sẵn sàng. Nội dung chi tiết sẽ được bổ sung theo roadmap.
      </p>
    </section>
  )
}

export function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trang cài đặt đã được kết nối vào navigation dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quản lý nâng cao</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/management"
            className="rounded-lg bg-[#F87171] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ef6666]"
          >
            Mở quản lý hình ảnh phòng
          </Link>
        </div>
      </div>
    </section>
  )
}
