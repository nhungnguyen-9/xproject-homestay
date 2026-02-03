import { AnimatePresence, motion, type Variants } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import type { MouseEvent } from "react"
import imageHome1 from "../../assets/image_home1.png"
import imageHome2 from "../../assets/image_home2.png"
import imageHome3 from "../../assets/image_home3.png"

const heroAssets = [imageHome1, imageHome2, imageHome3]

type HeroPhase = "grid" | "focus" | "carousel"

const durations = {
  grid: 2200,
  focus: 900,
  carousel: 7500
} as const

type IntroTile = { image: string; delay: number; xOffset: number }

const introTiles = Array.from({ length: 8 }, (_, index) => ({
  image: heroAssets[index % heroAssets.length],
  delay: Math.random() * 0.6,
  xOffset: (Math.random() - 0.5) * 50
})) satisfies IntroTile[]

const tileVariants: Variants = {
  hidden: (tile: IntroTile) => ({
    opacity: 0,
    scale: 0.9,
    y: 26,
    x: tile.xOffset,
    filter: "blur(8px)"
  }),
  enter: (tile: IntroTile) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, delay: tile.delay, ease: [0.25, 0.8, 0.35, 1] }
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -12,
    filter: "blur(3px)",
    transition: { duration: 0.45, ease: "easeIn" }
  }
}

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.12 }
  },
  exit: {
    opacity: 0,
    transition: { when: "afterChildren" }
  }
}

const focusVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 20 },
  enter: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    scale: 1.03,
    y: -10,
    transition: { duration: 0.6, ease: "easeIn" }
  }
}

const carouselVariants: Variants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 70 : -70,
    scale: 1.01
  }),
  enter: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1.2, ease: "easeInOut" }
  },
  exit: (direction: number) => ({
    opacity: 0.35,
    x: direction >= 0 ? -60 : 60,
    transition: { duration: 1.0, ease: "easeInOut" }
  })
}

export function HeroBanner() {
  const [phase, setPhase] = useState<HeroPhase>("grid")
  const [activeIndex, setActiveIndex] = useState(0)
  const [heroOrigin, setHeroOrigin] = useState({ x: "50%", y: "50%" })
  const [carouselDirection, setCarouselDirection] = useState<1 | -1>(1)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (phase === "grid") {
      timer = setTimeout(() => setPhase("focus"), durations.grid)
    } else if (phase === "focus") {
      timer = setTimeout(() => {
        setActiveIndex(0)
        setCarouselDirection(1)
        setPhase("carousel")
      }, durations.focus)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== "carousel") return

    const timer = setTimeout(() => {
      setCarouselDirection(1)
      setActiveIndex((prev) => (prev + 1) % heroAssets.length)
    }, durations.carousel)

    return () => clearTimeout(timer)
  }, [phase, activeIndex])

  useEffect(() => {
    heroAssets.forEach((src) => {
      const image = new Image()
      image.src = src
    })
  }, [])

  const coverImage = useMemo(() => heroAssets[activeIndex], [activeIndex])
  const coverBackgroundStyle = useMemo(
    () => ({
      backgroundImage: `url(${coverImage})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      filter: "blur(0px)",
      opacity: 0
    }),
    [coverImage]
  )

  const handleHeroMouse = (event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    setHeroOrigin({ x: `${x}%`, y: `${y}%` })
  }

  const resetHeroOrigin = () => setHeroOrigin({ x: "50%", y: "50%" })

  const handleCarouselDot = (targetIndex: number) => {
    if (targetIndex === activeIndex) return
    const total = heroAssets.length
    const forwardDistance = (targetIndex - activeIndex + total) % total
    const backwardDistance = (activeIndex - targetIndex + total) % total
    setCarouselDirection(forwardDistance <= backwardDistance ? 1 : -1)
    setActiveIndex(targetIndex)
  }

  const handleCarouselPrev = () => {
    setCarouselDirection(-1)
    setActiveIndex((prev) => (prev - 1 + heroAssets.length) % heroAssets.length)
  }

  const handleCarouselNext = () => {
    setCarouselDirection(1)
    setActiveIndex((prev) => (prev + 1) % heroAssets.length)
  }

  return (
    <section
      className="relative h-[75vh] min-h-160 w-full overflow-hidden bg-[#fceae5] text-[#1c0b04]"
      aria-label="Hero gallery"
      onMouseMove={handleHeroMouse}
      onMouseLeave={resetHeroOrigin}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          ...coverBackgroundStyle,
          backgroundColor: "#fceae5"
        }}
      />
      <AnimatePresence mode="wait">
        {phase === "grid" && (
          <motion.div
            className="absolute inset-0 grid grid-cols-3 gap-y-10 gap-x-10 px-6 py-12 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 auto-rows-[240px] justify-center"
            variants={gridVariants}
            initial="hidden"
            animate="enter"
            exit="exit"
          >
            {introTiles.map((tile, index) => (
              <motion.div
                key={`tile-${index}`}
                className="overflow-hidden rounded-[34px] border border-white/70 shadow-[0_30px_70px_rgba(0,0,0,0.15)]"
                variants={tileVariants}
                initial="hidden"
                animate="enter"
                exit="exit"
                custom={tile}
              >
                <motion.img
                  src={tile.image}
                  alt="gallery preview"
                  className="h-full w-full object-cover object-center"
                  loading="eager"
                  draggable={false}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "focus" && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center px-0"
            variants={focusVariants}
            initial="hidden"
            animate="enter"
            exit="exit"
          >
            <motion.img
              src={coverImage}
              alt="featured stay"
              className="h-full w-full object-cover object-center"
              loading="eager"
              style={{
                transformOrigin: `${heroOrigin.x} ${heroOrigin.y}`,
                willChange: "transform, opacity"
              }}
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {phase === "carousel" && (
          <>
            <motion.div
              custom={carouselDirection}
              className="absolute inset-0 z-20 overflow-hidden"
              style={{ backgroundColor: "#fceae5" }}
              key={`slide-${activeIndex}`}
              variants={carouselVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
            >
              <motion.img
                src={coverImage}
                alt="slide"
                className="h-full w-full object-cover object-center"
                loading="eager"
                style={{
                  transformOrigin: `${heroOrigin.x} ${heroOrigin.y}`,
                  willChange: "transform, opacity"
                }}
                draggable={false}
              />
            </motion.div>
            <div className="absolute right-6 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3 rounded-full bg-black/0 px-2 py-1">
              {heroAssets.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  className={`h-3 w-3 rounded-full transition-all ${index === activeIndex ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => handleCarouselDot(index)}
                />
              ))}
            </div>
            <div className="pointer-events-auto absolute inset-0 flex items-center justify-between px-6">
              <button
                className="rounded-full border border-white/40 bg-black/50 px-3 py-2 shadow-lg transition hover:border-white hover:bg-black/70"
                onClick={handleCarouselPrev}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                className="rounded-full border border-white/40 bg-black/50 px-3 py-2 shadow-lg transition hover:border-white hover:bg-black/70"
                onClick={handleCarouselNext}
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
