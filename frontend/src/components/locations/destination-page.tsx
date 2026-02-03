import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { locationBranches } from "../../data/locations"
import { destinationSuites } from "../../data/destination-suites"

export function DestinationPage({ locationName }: { locationName?: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const params = useParams()
  const visibleCards = 4
  const cardWidth = 320
  const cardGap = 24
  const maxIndex = Math.max(0, destinationSuites.length - visibleCards)
  const offsetStyle = useMemo(
    () => ({ transform: `translateX(-${selectedIndex * (cardWidth + cardGap)}px)` }),
    [selectedIndex]
  )

  const handlePrev = () => setSelectedIndex((prev) => Math.max(0, prev - 1))
  const handleNext = () => setSelectedIndex((prev) => Math.min(maxIndex, prev + 1))
  const navigate = useNavigate()

  const handleSelectSuite = (suiteId: string) => {
    // navigate to room detail and preserve current location id in query
    navigate(`/hang-phong/${encodeURIComponent(suiteId)}?loc=${encodeURIComponent(String(id ?? ""))}`)
  }

  const id = params.id ?? params["*"]
  const branch = locationBranches.find((b) => String(b.id) === String(id))
  const displayLocationName = locationName ?? (branch ? branch.name : String(id ?? ""))

  useEffect(() => {
    // ensure page starts at the top when navigating to a destination
    window.scrollTo({ top: 0, left: 0 })
  }, [id])

  return (
    <div className="flex flex-col bg-[#fceae5]">
      {/* banner */}
      <div className="mx-auto w-full max-w-8xl px-6 pt-4">
        <div className="rounded-[12px] bg-[#fffbfc] p-4 shadow-md mb-6">
          <div className="flex items-start gap-4">
            <span className="mt-1 h-3 w-3 rounded-full bg-rose-500" aria-hidden />
            <div>
              <h3 className="text-lg font-semibold">Chốn - Thủ Khoa Huân - {displayLocationName}</h3>
              <p className="mt-1 text-sm text-[#6c4a38]">{branch?.address ?? "Địa chỉ không có"}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[900px]">
          <img src="https://choncinehome.com/_next/image?url=%2Fassets%2Fbanner.jpg&w=1920&q=75" alt="promo" className="w-full shadow-lg" />
        </div>
      </div>

      <div className="px-6 pb-20 pt-14">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.6em] text-[#c48d73]">Điểm đến</p>
          <h2 className="text-4xl font-bold text-[#1c0b04]">Điểm đến</h2>
          <p className="text-2xl font-semibold text-[#f63a78]">tại {displayLocationName}</p>
          <button className="rounded-full bg-[#f76c8a] px-6 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110">
            Chốn - Thủ Khoa Huân - {displayLocationName}
          </button>
          <p className="text-2xl font-bold text-[#f63a78]">Chốn - Thủ Khoa Huân - {displayLocationName}</p>
        </div>
        <div className="relative mx-auto mt-10 flex w-full max-w-full items-center px-6">
          <button
            onClick={handlePrev}
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:bg-black/30"
            disabled={selectedIndex === 0}
            aria-label="Previous destinations"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="overflow-hidden" style={{ width: "100%" }}>
            <div className="flex gap-6 transition-transform duration-500 pl-6" style={offsetStyle}>
              {destinationSuites.map((suite) => (
                <article
                  key={suite.id}
                  className="group flex min-w-[320px] max-w-[320px] cursor-pointer flex-col overflow-hidden rounded-[24px] bg-white transition duration-300 hover:-translate-y-1"
                  onClick={() => handleSelectSuite(suite.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      handleSelectSuite(suite.id)
                    }
                  }}
                >
                  <div className="relative h-70 overflow-hidden rounded-t-[24px]">
                    <img
                      src={suite.image}
                      alt={suite.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute left-4 right-4 top-3 rounded-full bg-white/90 px-3 py-1 text-center text-[0.58rem] font-semibold uppercase tracking-[0.35em] text-[#d23a70] shadow">
                      {suite.badge}
                    </div>
                    <div className="absolute bottom-3 left-4 rounded-full bg-white/95 px-3 py-1.5 text-[0.7rem] font-semibold text-[#1c0b04] shadow">
                      {suite.priceLabel}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-4 py-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#1c0b04]">{suite.title}</h3>
                      <p className="text-[0.7rem] text-[#c48778]">{suite.subtitle}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-[#ff6b7a] shadow-[0_6px_16px_rgba(255,107,122,0.45)]" />
                      <span className="h-4 w-4 rounded-full bg-[#ff6b7a] shadow-[0_6px_16px_rgba(255,107,122,0.45)]" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {suite.amenities.map((amenity) => (
                        <span
                          key={amenity.label}
                          className="flex items-center gap-2 rounded-full border border-[#f6bac2] bg-[#fff0f3] px-2.5 py-1 text-[0.62rem] font-semibold text-[#d83670]"
                        >
                          <amenity.icon className="h-3.5 w-3.5" aria-hidden={true} />
                          <span className="text-[#d83670]">{amenity.label}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-1 flex-col">
                      <p className="text-[0.6rem] uppercase tracking-[0.35em] text-[#d27c9c]">Bảng giá hôm nay</p>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div className="flex-1 space-y-1.5 text-[0.7rem] text-[#6c4a38]">
                          {suite.highlights.map((highlight) => (
                            <div
                              key={`${suite.id}-${highlight.label}`}
                              className="flex items-center justify-between border-b border-dashed border-[#f5d1d9] pb-2"
                            >
                              <span className="font-semibold text-[#1c0b04]">{highlight.label}</span>
                              <span className="font-semibold text-[#f1597c]">{highlight.value}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          className="shrink-0 rounded-full bg-[#f1597c] px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_30px_rgba(241,89,124,0.4)] transition hover:bg-[#ed2b64]"
                          onClick={() => handleSelectSuite(suite.id)}
                        >
                          Đặt phòng
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:bg-black/30"
            disabled={selectedIndex >= maxIndex}
            aria-label="Next destinations"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

