import { Link } from "react-router"

export function AdminSettingsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Cai dat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trang cai dat da duoc ket noi vao navigation dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Quan ly nang cao</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/management"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Mo quan ly hinh anh phong
          </Link>
        </div>
      </div>
    </section>
  )
}
