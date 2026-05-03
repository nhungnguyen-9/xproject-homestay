import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { HeroBanner } from '../hero/hero-banner'
import { ReviewsSection } from './reviews-section'
import * as branchService from '@/services/branchService'
import * as roomService from '@/services/roomService'
import * as bookingService from '@/services/bookingService'
import type { Branch } from '@/types/branch'
import type { RoomDetail } from '@/types/room'
import type { Booking, Room, RoomType } from '@/types/schedule'
import type { RoomCardProps } from '../rooms/room-card'
import { MapPin, Loader2, Images } from 'lucide-react'
import { GalleryGrid } from '../gallery-grid'
import { RoomSchedule } from '../schedule/room-schedule'
import { cn } from '@/lib/utils'
import { formatPrice, formatDateInput } from '@/utils/helpers'

// ─── Section IDs (dùng cho scroll spy) ───────────────────────────
export const SECTION_IDS = {
  branches: 'chi-nhanh',
  rooms: 'phong-nghi',
  gallery: 'thu-vien-anh',
  booking: 'dat-phong',
  reviews: 'danh-gia',
} as const

// ─── Helpers ─────────────────────────────────────────────────────
function shortPrice(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000
    return `${k % 1 === 0 ? k : k.toFixed(0)}K`
  }
  return formatPrice(amount)
}

function toRoomCardProps(room: RoomDetail): RoomCardProps {
  const parts: string[] = []
  if (room.combo3hRate > 0) parts.push(`3H/${shortPrice(room.combo3hRate)}`)
  else if (room.hourlyRate > 0) parts.push(`${shortPrice(room.hourlyRate)}/giờ`)
  if (room.combo6h1hRate > 0) parts.push(`6H+1H/${shortPrice(room.combo6h1hRate)}`)
  if (room.overnightRate > 0) parts.push(`Qua đêm/${shortPrice(room.overnightRate)}`)
  return {
    id: room.id,
    title: room.name,
    price: parts.join(' • ') || 'Liên hệ',
    images: room.images.map(roomService.imageUrl),
    type: room.type,
    discountSlots: room.discountSlots,
  }
}

// ─── Image Library data ──────────────────────────────────────────
interface Album {
  title: string
  count: number
  cover: string
}

const ALBUMS: Album[] = [
  { title: 'Không gian tổng thể', count: 14, cover: 'images/generated-1773763950437.png' },
  { title: 'Phòng Cherry & Pinterest', count: 10, cover: 'images/generated-1773763964292.png' },
  { title: 'Phòng 52HZ', count: 8, cover: 'images/generated-1773763985850.png' },
  { title: "Phòng BB's Forest", count: 8, cover: 'images/generated-1773763983771.png' },
  { title: "Phòng BB's Canvas & Coco", count: 10, cover: 'images/generated-1773764044972.png' },
]

// ─── Main Home Component ─────────────────────────────────────────
export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // Branch data
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchLoading, setBranchLoading] = useState(true)

  // Room data
  const [rooms, setRooms] = useState<RoomDetail[]>([])
  const [roomActiveBranchId, setRoomActiveBranchId] = useState<string | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)

  // Booking data
  const [date, setDate] = useState(new Date())
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingActiveBranchId, setBookingActiveBranchId] = useState<string | null>(null)
  const [bookingLoading, setBookingLoading] = useState(true)
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null)

  // ── Load branches ──
  useEffect(() => {
    branchService.getAll()
      .then(setBranches)
      .catch(() => toast.error('Không tải được danh sách chi nhánh'))
      .finally(() => setBranchLoading(false))
  }, [])

  // ── Load rooms ──
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const [branchData, roomData] = await Promise.all([
          branchService.getAll(),
          roomService.getAll(),
        ])
        setRooms(roomData)
        const paramBranchId = searchParams.get('branchId')
        if (paramBranchId && branchData.some((b) => b.id === paramBranchId)) {
          setRoomActiveBranchId(paramBranchId)
        } else if (branchData.length > 0) {
          setRoomActiveBranchId(branchData[0].id)
        }
        if (paramBranchId) {
          const next = new URLSearchParams(searchParams)
          next.delete('branchId')
          setSearchParams(next, { replace: true })
        }
      } catch {
        toast.error('Không tải được dữ liệu phòng')
      } finally {
        setRoomLoading(false)
      }
    }
    fetchRooms()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load booking data ──
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const [branchData, roomData] = await Promise.all([
          branchService.getAll(),
          roomService.getAll(),
        ])
        const mappedRooms: Room[] = roomData.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type as RoomType,
          branchId: r.branchId,
          amenities: r.amenities || [],
          hourlyRate: r.hourlyRate,
          dailyRate: r.dailyRate,
          overnightRate: r.overnightRate,
          extraHourRate: r.extraHourRate,
          combo3hRate: r.combo3hRate,
          combo6h1hRate: r.combo6h1hRate,
          combo6h1hDiscount: r.combo6h1hDiscount,
          discountSlots: r.discountSlots,
        }))
        setAllRooms(mappedRooms)
        if (branchData.length > 0) {
          setBookingActiveBranchId(branchData[0].id)
        }
      } catch {
        toast.error('Không tải được dữ liệu đặt phòng')
      } finally {
        setBookingLoading(false)
      }
    }
    fetchBookingData()
  }, [])

  // ── Fetch bookings when date changes ──
  useEffect(() => {
    const dateStr = formatDateInput(date)
    let cancelled = false
    bookingService.getByDate(dateStr)
      .then((data) => { if (!cancelled) setBookings(data) })
      .catch(() => { if (!cancelled) toast.error('Không tải được lịch đặt phòng') })
    return () => { cancelled = true }
  }, [date])

  const handleBookingCreate = useCallback(async (newBooking: Omit<Booking, 'id'>) => {
    try {
      await bookingService.create(newBooking)
      const dateStr = formatDateInput(date)
      const data = await bookingService.getByDate(dateStr)
      setBookings(data)
      toast.success('Đặt phòng thành công')
    } catch {
      toast.error('Đặt phòng thất bại, vui lòng thử lại')
    }
  }, [date])

  // ── Filtered data ──
  const filteredRooms = useMemo(() => {
    if (!roomActiveBranchId) return []
    return rooms.filter((r) => r.branchId === roomActiveBranchId)
  }, [rooms, roomActiveBranchId])

  const roomItems: RoomCardProps[] = filteredRooms.map(toRoomCardProps)
  const roomActiveBranch = branches.find((b) => b.id === roomActiveBranchId)

  const bookingFilteredRooms = useMemo(() => {
    if (!bookingActiveBranchId) return []
    return allRooms.filter((r) => r.branchId === bookingActiveBranchId)
  }, [allRooms, bookingActiveBranchId])

  const handleBookingBranchChange = useCallback((branchId: string) => {
    setBookingActiveBranchId(branchId)
    setFocusedRoomId(null)
  }, [])

  return (
    <div className="flex flex-col gap-0 pb-20">
      <HeroBanner />

      {/* ═══ 1. Danh sách chi nhánh ═══ */}
      <section id={SECTION_IDS.branches} className="scroll-mt-20 py-10">
        <div className="px-8 mb-5">
          <h2 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">
            Danh sách chi nhánh
          </h2>
        </div>
        {branchLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : branches.length > 0 ? (
          <motion.div
            className="mx-auto grid w-full grid-cols-1 gap-5 px-8 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onClick={() => {
                  setRoomActiveBranchId(branch.id)
                  document.getElementById(SECTION_IDS.rooms)?.scrollIntoView({ behavior: 'smooth' })
                }}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex justify-center py-12">
            <p className="text-sm text-gray-500">Chưa có chi nhánh nào</p>
          </div>
        )}
      </section>

      {/* ═══ 2. Phòng nghỉ ═══ */}
      <section id={SECTION_IDS.rooms} className="scroll-mt-20 py-10">
        <div className="px-8 mb-5">
          <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">Phòng Nghỉ</h1>
          {roomActiveBranch && (
            <p className="mt-1 text-sm text-[#9B8B7A]">{roomActiveBranch.address}</p>
          )}
        </div>

        {roomLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {branches.length > 1 && (
              <div className="px-8 mb-4">
                <div
                  className="flex gap-1 border-b-2 border-border overflow-x-auto [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => setRoomActiveBranchId(branch.id)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors -mb-[2px]',
                        roomActiveBranchId === branch.id
                          ? 'font-semibold text-foreground border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={roomActiveBranchId ?? 'none'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {roomItems.length > 0 ? (
                  <GalleryGrid items={roomItems} />
                ) : (
                  <div className="flex justify-center py-12">
                    <p className="text-sm text-muted-foreground">Chi nhánh này chưa có phòng</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </section>

      {/* ═══ 3. Thư viện ảnh ═══ */}
      <section id={SECTION_IDS.gallery} className="scroll-mt-20 py-10">
        <ImageLibrarySection />
      </section>

      {/* ═══ 4. Đặt phòng ═══ */}
      <section id={SECTION_IDS.booking} className="scroll-mt-20 py-10">
        <div className="px-4 sm:px-8">
          <h2 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight mb-5">
            Đặt phòng
          </h2>

          {bookingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {branches.length > 1 && (
                <div className="mb-4">
                  <div
                    className="flex gap-1 border-b-2 border-border overflow-x-auto [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {branches.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => handleBookingBranchChange(branch.id)}
                        className={cn(
                          'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors -mb-[2px]',
                          bookingActiveBranchId === branch.id
                            ? 'font-semibold text-foreground border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {branch.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={bookingActiveBranchId ?? 'none'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <RoomSchedule
                    date={date}
                    rooms={bookingFilteredRooms}
                    bookings={bookings}
                    onDateChange={setDate}
                    onBookingCreate={handleBookingCreate}
                    startHour={0}
                    endHour={24}
                    focusedRoomId={focusedRoomId}
                    onFocusChange={setFocusedRoomId}
                  />
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </section>

      {/* ═══ 5. Khách hàng nói gì về chúng tôi ═══ */}
      <section id={SECTION_IDS.reviews} className="scroll-mt-20 py-10">
        <ReviewsSection />
      </section>
    </div>
  )
}

// ─── Branch Card ─────────────────────────────────────────────────
import type { Variants } from 'framer-motion'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

function BranchCard({ branch, onClick }: { branch: Branch; onClick: () => void }) {
  const images = (branch.images || []).map(branchService.imageUrl)
  const img = (i: number) => images[i] || images[0] || '/images/placeholder-room.png'
  const hasImages = images.length > 0

  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
    >
      {hasImages ? (
        <div className="flex h-[200px] gap-2">
          <div className="relative flex-[5] overflow-hidden rounded-xl">
            <img src={img(0)} alt={branch.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
          {images.length > 1 && (
            <div className="relative flex-[3] overflow-hidden rounded-xl">
              <img src={img(1)} alt={branch.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          {images.length > 2 && (
            <div className="flex flex-[2] flex-col gap-2">
              {[2, 3, 4].map((i) => images[i] ? (
                <div key={i} className="relative flex-1 overflow-hidden rounded-xl">
                  <img src={img(i)} alt={`${branch.name} ${i}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                </div>
              ) : null)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-100">
          <MapPin className="size-12 text-gray-300" />
        </div>
      )}
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <h3 className="text-[17px] font-extrabold text-[#2B2B2B]">{branch.name}</h3>
        <p className="text-[13px] font-semibold text-[#6A635B]">{branch.address}</p>
      </div>
    </motion.div>
  )
}

// ─── Image Library Section ───────────────────────────────────────
function AlbumCell({
  album,
  className = '',
  textSize = 'sm',
}: {
  album: Album
  className?: string
  textSize?: 'sm' | 'lg'
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}>
      <img
        src={album.cover}
        alt={album.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-0.5 bg-black/45 px-3 py-5 backdrop-blur-[1px]">
        <p className={`font-bold text-white leading-tight ${textSize === 'lg' ? 'text-2xl' : 'text-sm'}`}>
          {album.title}
        </p>
        <p className="flex items-center gap-1 text-[11px] font-medium text-white/80">
          <Images className="h-3 w-3" /> {album.count} ảnh
        </p>
      </div>
    </div>
  )
}

function ImageLibrarySection() {
  const [featured, ...rest] = ALBUMS
  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9B8B7A] mb-1">
            Thư viện ảnh
          </p>
          <h2 className="text-2xl font-extrabold text-[#2B2B2B] leading-tight sm:text-[36px]">
            Khám phá Nhà Cam
          </h2>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-3 sm:hidden">
        <AlbumCell album={featured} className="h-56" textSize="lg" />
        <div className="grid grid-cols-2 gap-3">
          {rest.map((album) => (
            <AlbumCell key={album.title} album={album} className="h-40" />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div
        className="hidden sm:grid gap-3"
        style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', height: 500 }}
      >
        <AlbumCell album={featured} className="row-span-2" textSize="lg" />
        {rest.map((album) => (
          <AlbumCell key={album.title} album={album} />
        ))}
      </div>
    </div>
  )
}
