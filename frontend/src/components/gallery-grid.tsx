import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { RoomCard } from "./rooms/room-card"

export interface GalleryGridProps {
  items: {
    title: string
    price: string
    images: string[]
  }[]
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

/**
 * Lưới phòng — hiển thị danh sách RoomCard theo dạng grid responsive với hiệu ứng stagger
 */
export function GalleryGrid({ items }: GalleryGridProps) {
  return (
    <div className="mx-auto flex w-full flex-col px-8">
      <motion.div 
        className="grid w-full gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {items.map((item, index) => (
          <RoomCard 
            key={item.title + index}
            title={item.title}
            price={item.price}
            images={item.images}
          />
        ))}
      </motion.div>

      <div className="mt-12 flex justify-center">
        <button className="rounded-full bg-nhacam-primary px-10 py-3 text-sm font-semibold tracking-wider text-white shadow-sm transition-all hover:scale-105 hover:bg-nhacam-primary-hover hover:shadow-md">
          Xem tất cả phòng
        </button>
      </div>
    </div>
  )
}
