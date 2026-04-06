import { useState } from 'react'
import { HeroBanner } from '../hero/hero-banner'
import { GalleryGrid } from '../gallery-grid'
import { ReviewsSection } from './reviews-section'

const filterCategories = ["Hôm nay", "Giá thấp"]

const MOCK_ROOMS = [
  {
    title: "Chi Nhánh Cam 01",
    price: "3 tiếng/199K • Qua đêm/299K",
    images: [
      "/images/generated-1773763911137.png",
      "/images/generated-1773764116868.png",
      "/images/generated-1773764146153.png",
      "/images/generated-1773764166795.png",
      "/images/generated-1773764183697.png",
    ],
  },
  {
    title: "Chi Nhánh Cam 02",
    price: "3 tiếng/219K • Qua đêm/319K",
    images: [
      "/images/generated-1773764199921.png",
      "/images/generated-1773764218357.png",
      "/images/generated-1773764255793.png",
      "/images/generated-1773764270784.png",
      "/images/generated-1773764296856.png",
    ],
  },
  {
    title: "Chi Nhánh Cam 03",
    price: "3 tiếng/249K • Qua đêm/349K",
    images: [
      "/images/generated-1773764315880.png",
      "/images/generated-1773764350601.png",
      "/images/generated-1773764375449.png",
      "/images/generated-1773764415086.png",
    ],
  },
]

export const Home = () => {
  const [activeFilter, setActiveFilter] = useState("Hôm nay")

  return (
    <div className="flex flex-col gap-6 pb-20">
      <HeroBanner />

      <div className="px-8 mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">
            Danh sách chi nhánh
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {filterCategories.map((filter) => {
              const isActive = filter === activeFilter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105 shadow-sm
                    ${isActive
                      ? 'bg-nhacam-primary text-white hover:bg-nhacam-primary-hover shadow-md'
                      : 'bg-card text-secondary hover:bg-accent'
                    }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <GalleryGrid items={MOCK_ROOMS} />

      <ReviewsSection />
    </div>
  )
}
