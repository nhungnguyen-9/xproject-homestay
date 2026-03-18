import React, { useState } from 'react'
import { HeroBanner } from '../hero/hero-banner'
import { GalleryGrid } from '../gallery-grid'

const filterCategories = ["Tất cả", "Phòng Đơn", "Phòng Đôi", "Family"]

const mockRoomsData = [
  { title: "Phòng Cam 01", price: "3 tiếng/199K • Qua đêm/299K", images: ["/images/generated-1773764503552.png", "/images/generated-1773764486731.png", "/images/generated-1773764463695.png", "/images/generated-1773764444394.png", "/images/generated-1773764415086.png"] },
  { title: "Phòng Cam 02", price: "3 tiếng/199K • Qua đêm/349K", images: ["/images/generated-1773764375449.png", "/images/generated-1773764350601.png", "/images/generated-1773764315880.png", "/images/generated-1773764296856.png", "/images/generated-1773764270784.png"] },
  { title: "Phòng Cam 03", price: "3 tiếng/249K • Qua đêm/399K", images: ["/images/generated-1773764255793.png", "/images/generated-1773764218357.png", "/images/generated-1773764199921.png", "/images/generated-1773764186811.png", "/images/generated-1773764183697.png"] },
  { title: "Phòng Cam 04", price: "3 tiếng/199K • Qua đêm/299K", images: ["/images/generated-1773764166795.png", "/images/generated-1773764146153.png", "/images/generated-1773764116868.png", "/images/generated-1773764087743.png", "/images/generated-1773764068502.png"] },
  { title: "Phòng Family 01", price: "3 tiếng/299K • Qua đêm/499K", images: ["/images/generated-1773764044972.png", "/images/generated-1773764039915.png", "/images/generated-1773764030006.png", "/images/generated-1773764015932.png", "/images/generated-1773764014842.png"] },
  { title: "Phòng Đôi 02", price: "3 tiếng/249K • Qua đêm/399K", images: ["/images/generated-1773764007485.png", "/images/generated-1773764000619.png", "/images/generated-1773763992260.png", "/images/generated-1773763989897.png", "/images/generated-1773763985850.png"] }
]

export const Home = () => {
    const [activeFilter, setActiveFilter] = useState("Tất cả")

    return (
        <div className="flex flex-col gap-6 pb-20">
            <HeroBanner />
            
            {/* Rooms Header & Filters Section */}
            <div className="px-8 mt-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">
                        Danh sách phòng
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
                                            : 'bg-white text-nhacam-secondary hover:bg-gray-50'
                                        }`}
                                >
                                    {filter}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
            
            <GalleryGrid items={mockRoomsData} />
        </div>
    )
}
