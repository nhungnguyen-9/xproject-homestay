import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { HeartParticles } from "@/components/header/header-particle"
import { locationBranches } from "@/data/locations"

export const Header = ({
  onLogoClick,
  onBranchClick
}: {
  onLogoClick?: () => void
  onBranchClick?: (branchName: string) => void
}) => {
    const [open, setOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const handleBranchSelect = (branch: string) => {
        setOpen(false)
        onBranchClick?.(branch)
    }
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
                    <DropdownMenu open={open} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <Label
                                onMouseEnter={() => setOpen(true)}
                                onMouseLeave={() => setOpen(false)}
                                className="hover:text-gray-200 cursor-pointer"
                            >
                                Chi nhánh
                            </Label>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            onMouseEnter={() => setOpen(true)}
                            onMouseLeave={() => setOpen(false)}
                        >
                            Chi nhánh
                        </Label>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        onMouseEnter={() => setOpen(true)}
                        onMouseLeave={() => setOpen(false)}
                    >
                            <DropdownMenuGroup>
                                {locationBranches.map((branch) => (
                                    <DropdownMenuItem
                                        key={branch.name}
                                        onSelect={() => handleBranchSelect(branch.name)}
                                    >
                                        {branch.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <a className="hover:text-gray-200" href="">Tra cứu Booking</a>
                <a className="hover:text-gray-200" href="">Hợp tác / Nhượng quyền</a>
                <a className="hover:text-gray-200" href="">Blog</a>
                <a className="hover:text-gray-200" href="">Liên hệ</a>
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
                <div className="flex flex-col items-center gap-3 py-3 font-semibold">
                    {locationBranches.map((branch) => (
                        <button
                            key={branch.name}
                            className="hover:text-gray-200"
                            onClick={() => {
                                handleBranchSelect(branch.name)
                                setMobileOpen(false)
                            }}
                        >
                            {branch.name}
                        </button>
                    ))}
                    <a className="hover:text-gray-200" href="">Tra cứu Booking</a>
                    <a className="hover:text-gray-200" href="">Hợp tác / Nhượng quyền</a>
                    <a className="hover:text-gray-200" href="">Blog</a>
                    <a className="hover:text-gray-200" href="">Liên hệ</a>
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
                    <div className="flex flex-col items-center gap-3 py-3 font-semibold">
                        <a className="hover:text-gray-200" href="">Chi nhánh</a>
                        <a className="hover:text-gray-200" href="">Tra cứu Booking</a>
                        <a className="hover:text-gray-200" href="">Hợp tác / Nhượng quyền</a>
                        <a className="hover:text-gray-200" href="">Blog</a>
                        <a className="hover:text-gray-200" href="">Liên hệ</a>
                    </div>
                </div>
            </div>
        </>
    )
}
