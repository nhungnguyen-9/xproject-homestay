import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { GalleryGrid } from "../gallery-grid"
import { getAll, imageUrl } from "@/services/roomService"
import * as branchService from "@/services/branchService"
import { formatPrice } from "@/utils/helpers"
import type { RoomDetail } from "@/types/room"
import type { Branch } from "@/types/branch"
import type { RoomCardProps } from "../rooms/room-card"

/** Format giá rút gọn: 199000 → "199K" */
function shortPrice(amount: number): string {
    if (amount >= 1000) {
        const k = amount / 1000;
        return `${k % 1 === 0 ? k : k.toFixed(0)}K`;
    }
    return formatPrice(amount);
}

/** Chuyển RoomDetail từ API thành props cho RoomCard */
function toRoomCardProps(room: RoomDetail): RoomCardProps {
    const parts: string[] = [];
    if (room.combo3hRate > 0) parts.push(`3H/${shortPrice(room.combo3hRate)}`);
    else if (room.hourlyRate > 0) parts.push(`${shortPrice(room.hourlyRate)}/giờ`);
    if (room.combo6h1hRate > 0) parts.push(`6H+1H/${shortPrice(room.combo6h1hRate)}`);
    if (room.overnightRate > 0) parts.push(`Qua đêm/${shortPrice(room.overnightRate)}`);

    return {
        id: room.id,
        title: room.name,
        price: parts.join(' • ') || 'Liên hệ',
        images: room.images.map(imageUrl),
        type: room.type,
    };
}

export const RestRoomPage = () => {
    const [searchParams] = useSearchParams()
    const branchId = searchParams.get('branchId')

    const [rooms, setRooms] = useState<RoomDetail[]>([])
    const [branch, setBranch] = useState<Branch | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        const fetchData = async () => {
            try {
                // Fetch rooms (filter by branchId if provided)
                const roomData = await getAll(branchId ? { branchId } : undefined)
                setRooms(roomData)

                // Fetch branch info if branchId is provided
                if (branchId) {
                    const branchData = await branchService.getById(branchId)
                    setBranch(branchData)
                } else {
                    setBranch(null)
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [branchId])

    const roomItems: RoomCardProps[] = rooms.map(toRoomCardProps)

    return (
        <div className="flex flex-col gap-6 pb-20 pt-8">
            <div className="px-8">
                <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">
                    {branch ? `Phòng tại ${branch.name}` : 'Danh sách phòng'}
                </h1>
                <p className="mt-1 text-sm text-[#9B8B7A]">
                    {branch ? branch.address : 'Chọn phòng phù hợp với bạn'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <p className="text-sm text-gray-500">Đang tải danh sách phòng...</p>
                </div>
            ) : roomItems.length > 0 ? (
                <GalleryGrid items={roomItems} />
            ) : (
                <div className="flex justify-center py-12">
                    <p className="text-sm text-gray-500">
                        {branch ? `Chưa có phòng nào tại ${branch.name}` : 'Chưa có phòng nào'}
                    </p>
                </div>
            )}
        </div>
    )
}
