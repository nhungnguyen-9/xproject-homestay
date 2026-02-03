import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { HeroBanner } from "../hero/hero-banner"
import imageHome1 from "../../assets/image_home1.png"
import { locationBranches } from "../../data/locations"

const VISIBLE_CARDS = 4

export function LocationPage({ onSelectLocation }: { onSelectLocation?: (location: { name: string }) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const navigate = useNavigate()
  const hasEnoughCards = locationBranches.length >= VISIBLE_CARDS
  const isTwo = locationBranches.length === 2
  const maxIndex = hasEnoughCards ? Math.max(0, locationBranches.length - VISIBLE_CARDS) : 0

  const offsetStyle = useMemo(() => {
    return hasEnoughCards ? { transform: `translateX(-${selectedIndex * 260}px)` } : { transform: "translateX(0)" }
  }, [selectedIndex, hasEnoughCards])

  const handlePrev = () => setSelectedIndex((prev) => Math.max(0, prev - 1))
  const handleNext = () => setSelectedIndex((prev) => Math.min(maxIndex, prev + 1))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasEnoughCards) setSelectedIndex(0)
  }, [hasEnoughCards])

  return (
    <div className="flex flex-col">
      <HeroBanner />
      <div className="relative bg-[#fceae5] pt-12 pb-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.6em] text-[#c48d73]">Chi nhánh</p>
          <h2 className="text-4xl font-bold text-[#1c0b04]">Chi nhánh</h2>
        </div>
        <div className="relative mx-auto mt-10 flex w-full max-w-full items-center px-6">
          {hasEnoughCards && (
            <button
              onClick={handlePrev}
              className="mr-4 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:bg-black/30"
              disabled={selectedIndex === 0}
              aria-label="Previous locations"
            >
              ‹
            </button>
          )}
          <div className="overflow-x-hidden" style={{ width: "100%", overflowY: "visible" }}>
            <div
              className={
                hasEnoughCards
                  ? "flex gap-6 transition-transform duration-500 pl-6"
                  : isTwo
                    ? "flex gap-20 justify-center flex-wrap sm:flex-nowrap"
                    : "flex gap-6 justify-center"
              }
              style={offsetStyle}
            >
              {locationBranches.map((location, idx) => (
                <div
                  key={location.id}
                  className="cursor-pointer overflow-hidden rounded-[24px] bg-white transform transition-transform duration-300"
                  onClick={() => {
                    if (onSelectLocation) return onSelectLocation(location)
                    navigate(`/chi-nhanh/${location.id}`)
                  }}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    // responsive width: when exactly 2 cards, use percentage so they scale on small screens
                    minWidth: isTwo ? "min(48%, 320px)" : "320px",
                    maxWidth: isTwo ? "min(48%, 320px)" : "320px",
                    transform: hoverIndex === idx ? "scale(1.05)" : undefined,
                    transformOrigin: "center",
                    willChange: "transform",
                    zIndex: hoverIndex === idx ? 10 : undefined,
                  }}
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
          {hasEnoughCards && (
            <button
              onClick={handleNext}
              className="ml-4 h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:bg-black/30"
              disabled={selectedIndex >= maxIndex}
              aria-label="Next locations"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
