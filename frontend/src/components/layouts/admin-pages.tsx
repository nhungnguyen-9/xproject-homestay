import { Link } from "react-router"

/**
 * Trang cài đặt quản trị — liên kết đến các trang quản lý nâng cao
 */
export function AdminSettingsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trang cài đặt đã được kết nối vào bảng điều khiển.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Quản lý nâng cao</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/management"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Mở quản lý hình ảnh phòng
          </Link>
        </div>
      </div>
    </section>
  )
}
