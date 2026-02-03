import { useState, useEffect } from "react"
import { NavLink } from "react-router"
import { HeartParticles } from "@/components/header/header-particle"

export const Header = ({
    onLogoClick,
}: {
    onLogoClick?: () => void
}) => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

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

    return (
        <>
            {isScrolled && <div className="h-[72px] lg:h-[80px]" />}
            <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 shadow-xl backdrop-blur-sm bg-[#f77170]/95' : 'relative bg-[#f77170]'} text-white flex flex-row lg:flex-row items-center justify-between lg:justify-around p-3 lg:p-2 gap-4 lg:gap-0 overflow-visible lg:overflow-hidden transition-all duration-500 ease-in-out z-50`}>

                <HeartParticles />

                <div className="relative z-10 flex items-center gap-3">
                    <img
                        src="https://github.com/shadcn.png"
                        alt="logo"
                        className="rounded-full w-12 h-12 lg:w-16 lg:h-16"
                    />
                    <button
                        onClick={onLogoClick}
                        className="flex flex-col items-start text-left focus:outline-none"
                    >
                        <h1 className="font-bold text-xl">HomeStay</h1>
                        <p className="italic text-sm">Chốn lặng thinh - Vị đậm tình</p>
                    </button>
                </div>

                {/* Menu */}
                <div className="relative z-10 hidden lg:flex items-center gap-12 font-semibold">
                    <NavLink className="hover:text-gray-200" to="/chi-nhanh">Chi nhánh</NavLink>
                    <NavLink className="hover:text-gray-200" to="">Tra cứu Booking</NavLink>
                    <NavLink className="hover:text-gray-200" to="">Hợp tác / Nhượng quyền</NavLink>
                    <NavLink className="hover:text-gray-200" to="">Blog</NavLink>
                    <NavLink className="hover:text-gray-200" to="">Liên hệ</NavLink>
                </div>

                <div className="relative z-20 lg:hidden">
                    <button
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen(v => !v)}
                        className="p-2 pointer-events-auto"
                    >
                        {mobileOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6H20M4 12H20M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile menu panel */}
                <div className={`${mobileOpen ? 'block' : 'hidden'} lg:hidden w-full bg-[#f77170] absolute top-full left-0 z-30`}>
                    {/* Mobile menu panel */}
                    <div className={`${mobileOpen ? 'block' : 'hidden'} lg:hidden w-full bg-[#f77170] absolute top-full left-0 z-30`}>
                        <div className="flex flex-col items-center gap-3 py-3 font-semibold">
                            <NavLink className="hover:text-gray-200" to="/chi-nhanh">Chi nhánh</NavLink>
                            <NavLink className="hover:text-gray-200" to="">Tra cứu Booking</NavLink>
                            <NavLink className="hover:text-gray-200" to="">Hợp tác / Nhượng quyền</NavLink>
                            <NavLink className="hover:text-gray-200" to="">Blog</NavLink>
                            <NavLink className="hover:text-gray-200" to="">Liên hệ</NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}