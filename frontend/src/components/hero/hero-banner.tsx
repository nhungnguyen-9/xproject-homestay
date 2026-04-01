import { motion } from "framer-motion"
import type { Variants } from "framer-motion"

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 1.0,
      ease: [0.25, 0.8, 0.35, 1],
      staggerChildren: 0.2
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
}

/**
 * Banner chính — ảnh nền toàn chiều rộng kèm tiêu đề và slogan với hiệu ứng chuyển động
 */
export function HeroBanner() {
  return (
    <section className="relative w-full px-8 pt-8">
      <div className="relative h-[420px] w-full overflow-hidden rounded-3xl shadow-sm">

        <div
          className="absolute inset-0 z-0 bg-[#fceae5]"
          style={{
            backgroundImage: `url("/images/Nhà Cam HOMESTAY.png")`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat"
          }}
        />

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-black/20 to-black/10" />

        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center text-white"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="font-serif text-[48px] font-extrabold leading-tight tracking-tight drop-shadow-lg sm:text-[64px]"
            variants={itemVariants}
          >
            Nhà Cam HOMESTAY
          </motion.h1>

          <motion.p
            className="mt-4 font-sans text-[16px] font-semibold tracking-wide drop-shadow-md sm:text-[18px]"
            variants={itemVariants}
          >
            Cozy • Chill • Ấm áp
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
