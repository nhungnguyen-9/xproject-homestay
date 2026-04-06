import { motion } from "framer-motion"
import { useNavigate } from "react-router"
import { RoomCard } from "./rooms/room-card"
import type { RoomCardProps } from "./rooms/room-card"

interface GalleryGridProps {
  items: RoomCardProps[]
  onCardClick?: (item: RoomCardProps) => void
}

/**
 * Lưới phòng — hiển thị danh sách RoomCard theo dạng grid responsive với hiệu ứng stagger
 */
export function GalleryGrid({ items, onCardClick }: GalleryGridProps) {
  const navigate = useNavigate()

  const handleClick = (item: RoomCardProps) => {
    if (onCardClick) onCardClick(item)
    else navigate("/phong-nghi")
  }

  return (
    <motion.div
      className="mx-auto grid w-full grid-cols-1 gap-5 px-8 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
    >
      {items.map((item, i) => (
        <div key={i} onClick={() => handleClick(item)} className="cursor-pointer">
          <RoomCard {...item} />
        </div>
      ))}
    </motion.div>
  )
}
