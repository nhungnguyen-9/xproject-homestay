import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Booking, Room, RoomType } from '@/types/schedule'
import type { Branch } from '@/types/branch'
import { RoomSchedule } from '@/components/schedule/room-schedule'
import * as roomService from '@/services/roomService'
import * as bookingService from '@/services/bookingService'
import * as branchService from '@/services/branchService'
import { formatDateInput } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

export const BookingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [date, setDate] = useState(new Date())
    const [branches, setBranches] = useState<Branch[]>([])
    const [allRooms, setAllRooms] = useState<Room[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
    const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null)

    // On mount: load branches + rooms, resolve ?roomId param
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchData, roomData] = await Promise.all([
                    branchService.getAll(),
                    roomService.getAll(),
                ])
                setBranches(branchData)

                const mappedRooms = roomData.map((r) => ({
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
                }))
                setAllRooms(mappedRooms)

                // Resolve ?roomId → find branch, set active tab + focus
                const paramRoomId = searchParams.get('roomId')
                if (paramRoomId) {
                    const targetRoom = roomData.find((r) => r.id === paramRoomId)
                    if (targetRoom?.branchId) {
                        setActiveBranchId(targetRoom.branchId)
                        setFocusedRoomId(paramRoomId)
                    } else if (branchData.length > 0) {
                        setActiveBranchId(branchData[0].id)
                    }
                    // Clean up URL param after consuming
                    setSearchParams({}, { replace: true })
                } else if (branchData.length > 0) {
                    setActiveBranchId(branchData[0].id)
                }
            } catch (err) {
                console.error('Failed to load data:', err)
                toast.error('Không tải được dữ liệu')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch bookings when date changes
    useEffect(() => {
        const dateStr = formatDateInput(date)
        let cancelled = false
        bookingService.getByDate(dateStr)
            .then(data => { if (!cancelled) setBookings(data) })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Failed to load bookings:', err)
                    toast.error('Không tải được lịch đặt phòng')
                }
            })
        return () => { cancelled = true }
    }, [date])

    const handleBookingCreate = useCallback(async (newBooking: Omit<Booking, 'id'>) => {
        try {
            await bookingService.create(newBooking)
            const dateStr = formatDateInput(date)
            const data = await bookingService.getByDate(dateStr)
            setBookings(data)
            toast.success('Đặt phòng thành công')
        } catch (err) {
            console.error('Tạo booking thất bại:', err)
            toast.error('Đặt phòng thất bại, vui lòng thử lại')
        }
    }, [date])

    const handleBranchChange = useCallback((branchId: string) => {
        setActiveBranchId(branchId)
        setFocusedRoomId(null)
    }, [])

    const filteredRooms = useMemo(() => {
        if (!activeBranchId) return []
        return allRooms.filter((r) => r.branchId === activeBranchId)
    }, [allRooms, activeBranchId])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="px-4 py-8 pb-20 sm:px-8">
            {/* Branch tabs above the schedule */}
            {branches.length > 1 && (
                <div className="mb-4">
                    <div className="flex gap-1 border-b-2 border-border overflow-x-auto">
                        {branches.map((branch) => (
                            <button
                                key={branch.id}
                                type="button"
                                onClick={() => handleBranchChange(branch.id)}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors -mb-[2px]',
                                    activeBranchId === branch.id
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

            <RoomSchedule
                date={date}
                rooms={filteredRooms}
                bookings={bookings}
                onDateChange={setDate}
                onBookingCreate={handleBookingCreate}
                startHour={0}
                endHour={24}
                focusedRoomId={focusedRoomId}
                onFocusChange={setFocusedRoomId}
            />
        </div>
    )
}
