import * as React from "react"

import { cn } from "@/lib/utils"

// Input chuẩn Nhacam: height 44px (touch-friendly), focus ring rose-400
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Kích thước và layout chuẩn nhacam
        "h-11 w-full min-w-0 rounded-lg border bg-transparent px-4 py-2.5 text-sm",
        // Màu viền và placeholder
        "border-nhacam-border placeholder:text-muted-foreground",
        // File input
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Trạng thái
        "transition-[color,box-shadow] outline-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Focus: ring rose-400 (nhacam primary)
        "focus-visible:border-nhacam-primary focus-visible:ring-2 focus-visible:ring-nhacam-primary/30",
        // Validation error state
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
