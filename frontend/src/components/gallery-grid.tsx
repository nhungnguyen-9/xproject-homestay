import { useState } from "react"
import type { MouseEvent } from "react"
import { motion } from "framer-motion"
import imageHome1 from "../assets/image_home1.png"
import imageHome2 from "../assets/image_home2.png"
import imageHome3 from "../assets/image_home3.png"

const galleryItems = [
  { title: "Nhiều góc checkin", accent: "Pop-up ambiance", image: imageHome1 },
  { title: "Không gian rộng rãi", accent: "Open living", image: imageHome2 },
  { title: "Sofa êm ái, gương lớn", accent: "Daybed lounge", image: imageHome3 },
  { title: "Hệ thống đèn xịn sò", accent: "Mood lighting", image: imageHome1 },
  { title: "Ưu đãi decor sinh nhật", accent: "Celebration set", image: imageHome2 }
]

export function GalleryGrid() {
  const [origins, setOrigins] = useState<Record<number, { x: string; y: string }>>({})

  const handleMouseMove = (index: number, event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const originX = ((event.clientX - bounds.left) / bounds.width) * 100
    const originY = ((event.clientY - bounds.top) / bounds.height) * 100
    setOrigins((prev) => ({ ...prev, [index]: { x: `${originX}%`, y: `${originY}%` } }))
  }

  const handleMouseLeave = (index: number) => {
    setOrigins((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  return (
    <section className="bg-linear-to-b from-[#ffe8dd] via-[#fbe4d3] to-[#f3cbbc] py-16">
      <div className="flex w-full flex-col gap-1 px-6 text-[#ad6047] sm:px-10 text-left items-start">
        <p className="text-xs uppercase tracking-[0.6em] text-[#c48d7d]">HomeStay stories</p>
        <h2 className="text-4xl font-semibold leading-tight text-[#3f1a0a] sm:text-5xl">
          Book your stay, feel the glow.
        </h2>
        <p className="text-base text-[#6c4a38]">
          Khám phá những căn phòng signature của chúng tôi, ánh sáng vàng nhè nhẹ sưởi ấm từng góc nhỏ mang đậm chất homestay Việt.
        </p>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-full flex-col gap-10 px-6 sm:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-3">
          {galleryItems.slice(0, 3).map((item, index) => (
            <motion.article
              key={item.title}
            className="group overflow-hidden rounded-[28px] border border-transparent bg-transparent shadow-none transition duration-300 hover:bg-white/30"
              whileHover={{ translateY: -6 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div
                className="h-70 w-full overflow-hidden"
                onMouseMove={(event) => handleMouseMove(index, event)}
                onMouseLeave={() => handleMouseLeave(index)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{
                    transformOrigin: `${origins[index]?.x ?? "50%"} ${origins[index]?.y ?? "50%"}`
                  }}
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between px-6 py-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1c0b04]">{item.title}</h3>
                  <p className="text-sm uppercase tracking-[0.4em] text-[#c48778]">{item.accent}</p>
                </div>
                <span className="text-sm text-[#d7b1a6]">0{index + 1}</span>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="grid w-full gap-8 lg:grid-cols-2">
          {galleryItems.slice(3).map((item, index) => (
            <motion.article
              key={item.title}
            className="group overflow-hidden rounded-[34px] border border-transparent bg-transparent shadow-none transition duration-300 hover:bg-white/40"
              whileHover={{ translateY: -6 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div
                className="h-90 w-full overflow-hidden"
                onMouseMove={(event) => handleMouseMove(index + 3, event)}
                onMouseLeave={() => handleMouseLeave(index + 3)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{
                    transformOrigin: `${origins[index + 3]?.x ?? "50%"} ${origins[index + 3]?.y ?? "50%"}`
                  }}
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between px-6 py-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1c0b04]">{item.title}</h3>
                  <p className="text-sm uppercase tracking-[0.4em] text-[#c48778]">{item.accent}</p>
                </div>
                <span className="text-sm text-[#d7b1a6]">0{galleryItems.indexOf(item) + 1}</span>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="flex justify-center">
          <button className="rounded-full bg-[#f7a6ab] px-10 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white shadow-[0_15px_60px_rgba(243,92,121,0.35)] transition duration-300 hover:bg-[#f38993]">
            Xem thêm
          </button>
        </div>
      </div>
    </section>
  )
}
