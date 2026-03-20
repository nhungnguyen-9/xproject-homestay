import { Link } from "react-router"

export function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Cai dat</h1>
        <p className="mt-1 text-sm text-slate-500">
          Trang cai dat da duoc ket noi vao navigation dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Quan ly nang cao</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/management"
            className="rounded-lg bg-[#F87171] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ef6666]"
          >
            Mo quan ly hinh anh phong
          </Link>
        </div>
      </div>
    </section>
  )
}
