import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"
import { toast } from "sonner"
import { GalleryGrid } from "../gallery-grid"
import { getAll, imageUrl } from "@/services/roomService"
import * as branchService from "@/services/branchService"
import { formatPrice } from "@/utils/helpers"
import type { RoomDetail } from "@/types/room"
import type { Branch } from "@/types/branch"
import type { RoomCardProps } from "../rooms/room-card"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

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
        images: room.images.map(imageUrl),
        type: room.type,
    }
}

export const RestRoomPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [branches, setBranches] = useState<Branch[]>([])
    const [rooms, setRooms] = useState<RoomDetail[]>([])
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [branchData, roomData] = await Promise.all([
                    branchService.getAll(),
                    getAll(),
                ])
                setBranches(branchData)
                setRooms(roomData)

                const paramBranchId = searchParams.get('branchId')
                if (paramBranchId && branchData.some((b) => b.id === paramBranchId)) {
                    setActiveBranchId(paramBranchId)
                } else if (branchData.length > 0) {
                    setActiveBranchId(branchData[0].id)
                }
                if (paramBranchId) {
                    const next = new URLSearchParams(searchParams)
                    next.delete('branchId')
                    setSearchParams(next, { replace: true })
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

    const filteredRooms = useMemo(() => {
        if (!activeBranchId) return []
        return rooms.filter((r) => r.branchId === activeBranchId)
    }, [rooms, activeBranchId])

    const roomItems: RoomCardProps[] = filteredRooms.map(toRoomCardProps)
    const activeBranch = branches.find((b) => b.id === activeBranchId)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (branches.length === 0) {
        return (
            <div className="flex flex-col gap-6 pb-20 pt-8">
                <div className="px-8">
                    <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">Danh sách phòng</h1>
                </div>
                <div className="flex justify-center py-12">
                    <p className="text-sm text-muted-foreground">Chưa có chi nhánh nào</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 pb-20 pt-8">
            <div className="px-8">
                <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">Phòng Nghỉ</h1>
                {activeBranch && (
                    <p className="mt-1 text-sm text-[#9B8B7A]">{activeBranch.address}</p>
                )}
            </div>

            {/* Branch tabs */}
            {branches.length > 1 && (
            <div className="px-8">
                <div className="flex gap-1 border-b-2 border-border overflow-x-auto">
                    {branches.map((branch) => (
                        <button
                            key={branch.id}
                            type="button"
                            onClick={() => setActiveBranchId(branch.id)}
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

            {/* Room cards grid */}
            {roomItems.length > 0 ? (
                <GalleryGrid items={roomItems} />
            ) : (
                <div className="flex justify-center py-12">
                    <p className="text-sm text-muted-foreground">Chi nhánh này chưa có phòng</p>
                </div>
            )}
        </div>
    )
}
