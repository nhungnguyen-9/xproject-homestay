import { useState, useEffect } from "react"
import { Link, NavLink } from "react-router"
import { BookingLookupModal } from "@/components/booking-calendar-form/BookingLookupModal"
import { Button } from "../ui/button"

export const Header = ({
    onLogoClick,
}: {
    onLogoClick?: () => void
}) => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [lookupOpen, setLookupOpen] = useState(false)

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

    const navLinks = [
        { to: "/", label: "Trang chủ" },
        { to: "/phong-nghi", label: "Phòng nghỉ" },
        { to: "/dat-phong", label: "Đặt phòng" },
        { to: "/thu-vien-anh", label: "Thư viện ảnh" },
        { to: "/chinh-sach", label: "Chính sách" },
    ]

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

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-8 uppercase text-sm font-medium">
                        {navLinks.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `hover:text-rose-100 transition-colors ${isActive ? 'underline underline-offset-4' : ''}`
                                }
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
                        {navLinks.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `hover:text-rose-100 transition-colors ${isActive ? 'underline underline-offset-4' : ''}`
                                }
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
