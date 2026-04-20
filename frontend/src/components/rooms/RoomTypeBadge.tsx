import { cn } from "@/lib/utils"
import type { RoomType } from "@/types/schedule"

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard: "Standard",
  vip: "VIP",
  supervip: "Super VIP",
}

const ROOM_TYPE_CLASSES: Record<RoomType, string> = {
  standard: "bg-slate-100 text-slate-600 border-slate-200",
  vip: "bg-amber-100 text-amber-700 border-amber-200",
  supervip: "bg-purple-100 text-purple-700 border-purple-200",
}

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
}

interface RoomTypeBadgeProps {
  type: RoomType
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/** Nhãn loại phòng — Standard / VIP / Super VIP với màu phù hợp */
export function RoomTypeBadge({ type, size = "md", className }: RoomTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-wide whitespace-nowrap",
        SIZE_CLASSES[size],
        ROOM_TYPE_CLASSES[type],
        className,
      )}
    >
      {ROOM_TYPE_LABELS[type]}
    </span>
  )
}

export { ROOM_TYPE_LABELS, ROOM_TYPE_CLASSES }
