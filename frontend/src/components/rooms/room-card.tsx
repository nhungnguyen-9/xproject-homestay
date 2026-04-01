import { Play } from "lucide-react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"

export interface RoomCardProps {
  title: string
  price: string
  images: string[]
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
 * Thẻ phòng — hiển thị collage 5 ảnh (trái lớn, giữa video, phải 3 nhỏ) kèm tên phòng và giá
 */
export function RoomCard({ title, price, images }: RoomCardProps) {
  const leftImg = images[0] || ""
  const midImg = images[1] || images[0] || ""
  const rightImg1 = images[2] || images[0] || ""
  const rightImg2 = images[3] || images[0] || ""
  const rightImg3 = images[4] || images[0] || ""

  return (
    <motion.div
      variants={cardVariants}
      className="flex h-[340px] w-full flex-col gap-[12px] rounded-[20px] bg-[#FFFFFF] p-[14px] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
    >
      <div className="flex h-[210px] w-full gap-[8px] rounded-[16px] bg-gray-50 p-[8px]">

        <div className="relative h-full flex-[220] overflow-hidden rounded-[14px]">
          <img 
            src={leftImg} 
            alt="Room main" 
            className="h-full w-full object-cover" 
            loading="lazy" 
          />
        </div>

        <div className="relative h-full flex-[108] overflow-hidden rounded-[14px]">
          <img 
            src={midImg} 
            alt="Room video preview" 
            className="h-full w-full object-cover" 
            loading="lazy" 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#00000055] backdrop-blur-sm">
              <Play className="h-[20px] w-[20px] text-white" fill="currentColor" />
            </div>
          </div>
        </div>

        <div className="flex h-full flex-[60] flex-col gap-[8px]">
          <div className="relative flex-1 overflow-hidden rounded-[14px]">
            <img src={rightImg1} alt="Room detail 1" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="relative flex-1 overflow-hidden rounded-[14px]">
            <img src={rightImg2} alt="Room detail 2" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="relative flex-1 overflow-hidden rounded-[14px]">
            <img src={rightImg3} alt="Room detail 3" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-1 px-2 pb-1">
        <h3 className="font-sans text-[18px] font-[800] text-[#2B2B2B]">{title}</h3>
        <p className="font-sans text-[14px] font-[600] text-[#6A635B]">{price}</p>
      </div>
    </motion.div>
  )
}
