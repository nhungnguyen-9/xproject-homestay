import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// === Badge Variants ===
// Badge hiển thị trạng thái booking: pending | confirmed | checked-out | cancelled
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Chờ xác nhận - vàng amber
        pending:
          "bg-amber-100 text-amber-700 border border-amber-200",
        // Đã xác nhận - xanh emerald
        confirmed:
          "bg-emerald-100 text-emerald-700 border border-emerald-200",
        // Đã trả phòng - xám slate
        "checked-out":
          "bg-slate-100 text-slate-600 border border-slate-200",
        // Đã huỷ - đỏ rose
        cancelled:
          "bg-rose-100 text-rose-600 border border-rose-200",
        // Mặc định (neutral)
        default:
          "bg-slate-100 text-slate-700 border border-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

import React from "react"

// Nhãn trạng thái booking hiển thị màu theo loại
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
