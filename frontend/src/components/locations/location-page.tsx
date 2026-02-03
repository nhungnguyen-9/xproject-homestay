import { useMemo, useState } from "react"
import { HeroBanner } from "../hero/hero-banner"
import imageHome1 from "../../assets/image_home1.png"
import { locationBranches } from "../../data/locations"

const VISIBLE_CARDS = 4

export function LocationPage({ onSelectLocation }: { onSelectLocation?: (location: { name: string }) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const maxIndex = Math.max(0, locationBranches.length - VISIBLE_CARDS)

  const offsetStyle = useMemo(() => ({ transform: `translateX(-${selectedIndex * 260}px)` }), [selectedIndex])

  const handlePrev = () => setSelectedIndex((prev) => Math.max(0, prev - 1))
  const handleNext = () => setSelectedIndex((prev) => Math.min(maxIndex, prev + 1))

  return (
    <div className="flex flex-col">
      <HeroBanner />
      <div className="relative bg-[#fceae5] pt-12 pb-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.6em] text-[#c48d73]">Điểm đến</p>
          <h2 className="text-4xl font-bold text-[#1c0b04]">Điểm đến</h2>
          <p className="text-2xl font-semibold text-[#f63a78]">tại Tỉnh Vĩnh Long</p>
          <button className="rounded-full bg-[#f76c8a] px-6 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110">
            Chốn - Thủ Khoa Huân - Vĩnh Long
          </button>
          <p className="text-2xl font-bold text-[#f63a78]">Chốn - Thủ Khoa Huân - Vĩnh Long</p>
        </div>
        <div className="relative mx-auto mt-10 flex w-full max-w-full items-center px-6">
          <button
            onClick={handlePrev}
            className="mr-4 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:bg-black/30"
            disabled={selectedIndex === 0}
            aria-label="Previous locations"
          >
            ‹
          </button>
          <div className="overflow-hidden" style={{ width: "100%" }}>
            <div className="flex gap-6 transition-transform duration-500 pl-6" style={offsetStyle}>
              {locationBranches.map((location) => (
                <div
                  key={location.name}
                  className="min-w-[320px] max-w-[320px] cursor-pointer overflow-hidden rounded-[24px] bg-white ]"
                  onClick={() => onSelectLocation?.(location)}
                >
                  <div className="h-70 w-full bg-cover" style={{ backgroundImage: `url(${imageHome1})` }} />
                  <div className="px-5 py-4">
                    <h3 className="text-lg font-semibold text-[#1c0b04]">{location.name}</h3>
                    <p className="text-sm text-[#c48778]">{location.district}</p>
                    <div className="mt-3 text-sm text-[#6c4a38]">
                      <p>{location.phone}</p>
                      <p>{location.address}</p>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#d83771]">Xem bản đồ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="ml-4 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:bg-black/30"
            disabled={selectedIndex >= maxIndex}
            aria-label="Next locations"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
