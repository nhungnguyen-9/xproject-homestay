import { useNavigate } from "react-router"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { RoomTypeBadge } from "./RoomTypeBadge"
import type { RoomType } from "@/types/schedule"
import type { DiscountSlot } from "@/types/room"

export interface RoomCardProps {
  id?: string
  title: string
  price: string
  images: string[]
  type?: RoomType
  discountSlots?: DiscountSlot[]
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

/**
 * Thẻ phòng — collage: ảnh trái lớn | ảnh giữa + play | 3 ảnh nhỏ phải
 */
export function RoomCard({ id, title, price, images, type, discountSlots }: RoomCardProps) {
  const navigate = useNavigate()
  const img = (i: number) => images[i] || images[0] || "/images/placeholder-room.png"
  const hasDiscount = (discountSlots?.length ?? 0) > 0

  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
    >
      {/* Image collage */}
      <div className="relative flex h-[200px] gap-2">
        {type && (
          <div className="absolute left-2 top-2 z-10">
            <RoomTypeBadge type={type} />
          </div>
        )}

        {/* Left — main large image */}
        <div className="relative flex-[5] overflow-hidden rounded-xl">
          <img src={img(0)} alt={title} className="h-full w-full object-cover" loading="lazy" />
        </div>

        {/* Middle — with play button */}
        <div className="relative flex-[3] overflow-hidden rounded-xl">
          <img src={img(1)} alt={title} className="h-full w-full object-cover" loading="lazy" />
        </div>

        {/* Right — 3 small stacked */}
        <div className="flex flex-[2] flex-col gap-2">
          {[2, 3, 4].map((i) => (
            <div key={i} className="relative flex-1 overflow-hidden rounded-xl">
              <img src={img(i)} alt={`${title} ${i}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>

      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <h3 className="text-[17px] font-extrabold text-[#2B2B2B]">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-semibold text-[#6A635B]">{price}</p>
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              🎁 Giờ vàng
            </span>
          )}
        </div>
      </div>

      {/* "Dat Phong" button — navigates to /dat-phong?roomId=id */}
      {id && (
        <div className="px-1 pb-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/dat-phong?roomId=${id}`)
            }}
            className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-nhacam-primary-hover transition-colors"
          >
            Đặt Phòng
          </button>
        </div>
      )}
    </motion.div>
  )
}
