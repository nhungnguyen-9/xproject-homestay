import React, { useState, useEffect } from 'react'
import { HeroBanner } from '../hero/hero-banner'
import { GalleryGrid } from '../gallery-grid'
import * as roomService from '@/services/roomService'
import type { RoomDetail } from '@/types/room'
import { formatPrice } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

const filterCategories = ["Tất cả", "Tiêu chuẩn", "VIP", "Super VIP"]

/** Map bộ lọc UI → giá trị type trong DB */
const FILTER_TYPE_MAP: Record<string, string | null> = {
  "Tất cả": null,
  "Tiêu chuẩn": "standard",
  "VIP": "vip",
  "Super VIP": "supervip",
}

/** Chuyển dữ liệu phòng từ API thành props cho GalleryGrid */
function toGalleryItem(room: RoomDetail) {
  const images = room.images.length > 0
    ? room.images.map(roomService.imageUrl)
    : ['/images/placeholder-room.png']
  return {
    title: room.name,
    price: `3 tiếng/${formatPrice(room.hourlyRate * 3)} • Qua đêm/${formatPrice(room.overnightRate)}`,
    images,
  }
}

/**
 * Trang chủ — hiển thị hero banner, bộ lọc danh mục phòng, và lưới phòng từ API
 */
export const Home = () => {
  const [activeFilter, setActiveFilter] = useState("Tất cả")
  const [rooms, setRooms] = useState<RoomDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    roomService.getAll()
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredRooms = rooms.filter(room => {
    const filterType = FILTER_TYPE_MAP[activeFilter]
    return filterType === null || room.type === filterType
  })

  return (
    <div className="flex flex-col gap-6 pb-20">
      <HeroBanner />

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Không có phòng nào.</p>
        </div>
      ) : (
        <GalleryGrid items={filteredRooms.map(toGalleryItem)} />
      )}
    </div>
  )
}
