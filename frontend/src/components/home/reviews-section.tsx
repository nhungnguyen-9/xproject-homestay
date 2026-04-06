import { Star } from "lucide-react"

interface Review {
    name: string
    date: string
    room: string
    rating: number
    comment: string
    color: string
}

const REVIEWS: Review[] = [
    {
        name: "Hải Anh",
        date: "11/03/2026",
        room: "Phòng Cam 01",
        rating: 5,
        comment: "Phòng sạch và rất ấm áp. Đèn hoàng hôn lên hình đẹp, máy chiếu hoạt động tốt. Sẽ quay lại!",
        color: "#F97316",
    },
    {
        name: "Minh Trí",
        date: "09/03/2026",
        room: "Phòng Cam 02",
        rating: 5,
        comment: "Không gian chill đúng như mô tả. Check-in tự động tiện, phòng thơm và sạch. Đi nhóm nhỏ rất hợp.",
        color: "#22C55E",
    },
    {
        name: "Phương Nam",
        date: "07/03/2026",
        room: "Phòng Cam 03",
        rating: 4,
        comment: "Giường êm, phòng yên tĩnh. Có góc decor chụp hình đẹp, ánh sáng ấm. Giá hợp lý.",
        color: "#3B82F6",
    },
    {
        name: "Thu Lan",
        date: "05/03/2026",
        room: "Phòng Cam 02",
        rating: 4,
        comment: "Mình thích nhất là ánh sáng ấm và phòng rất gọn gàng. Nhắn admin phản hồi nhanh.",
        color: "#A855F7",
    },
    {
        name: "Quốc Nam",
        date: "02/03/2026",
        room: "Phòng Cam 01",
        rating: 4,
        comment: "Đặt phòng nhanh, nhận hướng dẫn rõ ràng. Không gian riêng tư, phù hợp nghỉ ngắn hoặc qua đêm.",
        color: "#EC4899",
    },
    {
        name: "Ngọc Hân",
        date: "28/02/2026",
        room: "Phòng Cam 03",
        rating: 5,
        comment: "Phòng decor xinh, nhiều góc chụp ảnh. Máy chiếu xem phim buổi tối rất đã.",
        color: "#10B981",
    },
]

const OVERALL_RATING = 4.4

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <Star
                    key={i}
                    className="h-3.5 w-3.5"
                    fill={i < Math.round(rating) ? "#F59E0B" : "none"}
                    stroke={i < Math.round(rating) ? "#F59E0B" : "#D1D5DB"}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    )
}

export function ReviewsSection() {
    return (
        <section className="px-4 sm:px-8">
            <div className="rounded-2xl bg-white px-6 py-10 shadow-sm">
                {/* Header */}
                <div className="mb-2 text-center">
                    <h2 className="text-2xl font-extrabold text-[#2B2B2B] sm:text-[28px]">
                        Khách hàng nói gì về chúng tôi
                    </h2>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="text-base font-bold text-[#2B2B2B]">{OVERALL_RATING} / 5</span>
                        <StarRating rating={OVERALL_RATING} />
                    </div>
                </div>

                {/* Grid reviews */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {REVIEWS.map((r) => (
                        <div key={r.name + r.date} className="rounded-xl border border-[#F0EBE3] bg-[#FAFAF9] p-4">
                            {/* Avatar + info */}
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                    style={{ backgroundColor: r.color }}
                                >
                                    {r.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#2B2B2B]">{r.name}</p>
                                    <p className="text-xs text-[#9B8B7A]">{r.date} • {r.room}</p>
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="mt-3">
                                <StarRating rating={r.rating} />
                            </div>

                            {/* Comment */}
                            <p className="mt-2 text-sm leading-relaxed text-[#4B4540]">{r.comment}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
