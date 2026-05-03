import { useState, useEffect, useRef, useCallback } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { BookingLookupModal } from "@/components/booking-calendar-form/BookingLookupModal"
import { Button } from "../ui/button"
import { SECTION_IDS } from "../home/home"

/**
 * Thứ tự các section trên trang chủ, map với route tương ứng.
 * "Trang chủ" (/) → khu vực hero + chi nhánh (trước section đầu tiên)
 * Các route khác → section id tương ứng
 */
const NAV_LINKS = [
    { to: "/", label: "Trang chủ", sectionId: SECTION_IDS.branches },
    { to: "/phong-nghi", label: "Phòng nghỉ", sectionId: SECTION_IDS.rooms },
    { to: "/dat-phong", label: "Đặt phòng", sectionId: SECTION_IDS.booking },
    { to: "/thu-vien-anh", label: "Thư viện ảnh", sectionId: SECTION_IDS.gallery },
    { to: "/chinh-sach", label: "Chính sách", sectionId: null },
] as const

/** Offset từ top để xác định section đang active (px) */
const SCROLL_OFFSET = 120

export const Header = ({
    onLogoClick,
}: {
    onLogoClick?: () => void
}) => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [lookupOpen, setLookupOpen] = useState(false)
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const location = useLocation()
    const isHomePage = location.pathname === "/"

    // Refs cho animated indicator
    const desktopNavRef = useRef<HTMLElement>(null)
    const desktopLinkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
    const [indicatorStyle, setIndicatorStyle] = useState<{
        left: number
        width: number
        opacity: number
    }>({ left: 0, width: 0, opacity: 0 })

    // ── Scroll detection (sticky header) ──
    useEffect(() => {
        let ticking = false
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 20)
                    ticking = false
                })
                ticking = true
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // ── Scroll spy: tính toán chính xác section nào đang hiển thị ──
    const computeActiveSection = useCallback(() => {
        if (!isHomePage) return

        const scrollY = window.scrollY + SCROLL_OFFSET
        const sectionIds = [
            SECTION_IDS.reviews,
            SECTION_IDS.booking,
            SECTION_IDS.gallery,
            SECTION_IDS.rooms,
            SECTION_IDS.branches,
        ]

        // Duyệt từ dưới lên: section nào có top <= scrollY thì đó là section active
        for (const id of sectionIds) {
            const el = document.getElementById(id)
            if (el && el.offsetTop <= scrollY) {
                setActiveSection(id)
                return
            }
        }

        // Nếu chưa scroll đến section nào → highlight "Trang chủ"
        setActiveSection(SECTION_IDS.branches)
    }, [isHomePage])

    useEffect(() => {
        if (!isHomePage) {
            setActiveSection(null)
            return
        }

        // Tính lần đầu sau khi DOM render
        const initTimer = setTimeout(computeActiveSection, 100)

        let ticking = false
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    computeActiveSection()
                    ticking = false
                })
                ticking = true
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            clearTimeout(initTimer)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [isHomePage, location.pathname, computeActiveSection])

    // ── Animated indicator position ──
    const updateIndicator = useCallback((targetRoute: string | null) => {
        if (!targetRoute) {
            setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }))
            return
        }

        const linkEl = desktopLinkRefs.current.get(targetRoute)
        const navEl = desktopNavRef.current
        if (!linkEl || !navEl) return

        const navRect = navEl.getBoundingClientRect()
        const linkRect = linkEl.getBoundingClientRect()

        setIndicatorStyle({
            left: linkRect.left - navRect.left,
            width: linkRect.width,
            opacity: 1,
        })
    }, [])

    useEffect(() => {
        if (isHomePage) {
            // Trang chủ: indicator theo scroll spy
            if (!activeSection) {
                updateIndicator("/")
                return
            }
            const navItem = NAV_LINKS.find((n) => n.sectionId === activeSection)
            updateIndicator(navItem?.to ?? null)
        } else {
            // Trang khác: indicator theo route match
            const matchedLink = NAV_LINKS.find((n) => n.to !== "/" && location.pathname.startsWith(n.to))
            if (matchedLink) {
                // Delay nhỏ để đảm bảo DOM đã render sau khi chuyển trang
                const timer = setTimeout(() => updateIndicator(matchedLink.to), 50)
                return () => clearTimeout(timer)
            } else if (location.pathname === "/") {
                updateIndicator("/")
            } else {
                updateIndicator(null)
            }
        }
    }, [activeSection, isHomePage, isScrolled, location.pathname, updateIndicator])

    /** Kiểm tra nav link có đang active không */
    const isLinkHighlighted = (to: string, routeActive: boolean): boolean => {
        if (!isHomePage) {
            // Trang khác: dùng route match, nhưng "/" chỉ active khi exact match
            if (to === "/") return location.pathname === "/"
            return routeActive || location.pathname.startsWith(to)
        }

        // Trang chủ: dùng scroll spy
        const navItem = NAV_LINKS.find((n) => n.to === to)
        if (!navItem?.sectionId || !activeSection) {
            return to === "/" && (!activeSection || activeSection === SECTION_IDS.branches)
        }
        return navItem.sectionId === activeSection
    }

    return (
        <>
            {isScrolled && <div className="h-[64px] lg:h-[72px]" />}
            <div
                className={`${isScrolled
                    ? 'fixed top-0 left-0 right-0 shadow-xl backdrop-blur-sm bg-[#F87171]/95'
                    : 'relative bg-[#F87171]'
                    } text-white z-50 transition-all duration-300`}
            >
                {/* Main bar */}
                <div className="flex items-center justify-between px-4 lg:px-8 py-2 lg:py-3">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 shrink-0">
                        <img
                            src="https://github.com/shadcn.png"
                            alt="logo"
                            className="rounded-full w-10 h-10 lg:w-14 lg:h-14"
                        />
                        <button
                            onClick={onLogoClick}
                            className="flex flex-col items-start text-left focus:outline-none"
                        >
                            <h1 className="font-semibold text-base lg:text-xl text-white leading-tight">Nhà Cam Homestay</h1>
                            <p className="text-[10px] lg:text-xs text-[#C4A882] mt-0.5 tracking-widest">STAY . CHILL . REPEAT</p>
                        </button>
                    </Link>

                    {/* Desktop nav — with animated indicator */}
                    <nav
                        ref={desktopNavRef}
                        className="hidden lg:flex items-center gap-8 uppercase text-sm font-medium relative"
                    >
                        {/* Animated underline indicator */}
                        <span
                            className="absolute bottom-0 h-[2px] bg-white rounded-full pointer-events-none"
                            style={{
                                left: indicatorStyle.left,
                                width: indicatorStyle.width,
                                opacity: indicatorStyle.opacity,
                                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                            }}
                        />

                        {NAV_LINKS.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                ref={(el) => {
                                    if (el) desktopLinkRefs.current.set(to, el)
                                    else desktopLinkRefs.current.delete(to)
                                }}
                                className={({ isActive }) => {
                                    const highlighted = isLinkHighlighted(to, isActive)
                                    return [
                                        'relative pb-1 transition-colors duration-200',
                                        highlighted ? 'text-white' : 'text-white/70 hover:text-white/90',
                                    ].join(' ')
                                }}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Desktop CTA + Mobile hamburger */}
                    <div className="flex items-center gap-3">
                        <NavLink to="/huong-dan">
                            <Button className="hidden lg:inline-flex uppercase px-5 py-2 border border-white hover:cursor-pointer text-sm">
                                Hướng dẫn
                            </Button>
                        </NavLink>

                        <button
                            aria-label="Toggle menu"
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen(v => !v)}
                            className="lg:hidden p-2"
                        >
                            {mobileOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 6H20M4 12H20M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                <div className={`${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#ef6666]`}>
                    <nav className="flex flex-col items-center gap-4 py-4 font-medium text-sm uppercase">
                        {NAV_LINKS.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) => {
                                    const highlighted = isLinkHighlighted(to, isActive)
                                    return [
                                        'transition-colors duration-200',
                                        highlighted
                                            ? 'text-white underline underline-offset-4 decoration-2'
                                            : 'text-white/70 hover:text-white/90',
                                    ].join(' ')
                                }}
                            >
                                {label}
                            </NavLink>
                        ))}
                        <NavLink to="/huong-dan" onClick={() => setMobileOpen(false)}>
                            <Button className="uppercase px-5 py-2 border border-white text-sm mt-1">
                                Hướng dẫn
                            </Button>
                        </NavLink>
                    </nav>
                </div>
            </div>

            <BookingLookupModal
                open={lookupOpen}
                onOpenChange={setLookupOpen}
            />
        </>
    )
}
