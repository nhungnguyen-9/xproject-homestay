import { GalleryGrid } from "../gallery-grid"

const MOCK_ROOMS = [
    {
        title: "Phòng Cam 01",
        price: "3 tiếng/199K • Qua đêm/299K",
        images: [
            "/images/generated-1773763911137.png",
            "/images/generated-1773764116868.png",
            "/images/generated-1773764146153.png",
            "/images/generated-1773764166795.png",
            "/images/generated-1773764183697.png",
        ],
    },
    {
        title: "Phòng Cam 02",
        price: "3 tiếng/219K • Qua đêm/319K",
        images: [
            "/images/generated-1773764199921.png",
            "/images/generated-1773764218357.png",
            "/images/generated-1773764255793.png",
            "/images/generated-1773764270784.png",
            "/images/generated-1773764296856.png",
        ],
    },
    {
        title: "Phòng Cam 03",
        price: "3 tiếng/249K • Qua đêm/349K",
        images: [
            "/images/generated-1773764315880.png",
            "/images/generated-1773764350601.png",
            "/images/generated-1773764375449.png",
            "/images/generated-1773764415086.png",
        ],
    },
]

export const RestRoomPage = () => {
    return (
        <div className="flex flex-col gap-6 pb-20 pt-8">
            <div className="px-8">
                <h1 className="text-[28px] font-extrabold text-[#2B2B2B] tracking-tight">
                    Danh sách phòng
                </h1>
                <p className="mt-1 text-sm text-[#9B8B7A]">Chọn phòng phù hợp với bạn</p>
            </div>

            <GalleryGrid items={MOCK_ROOMS} />
        </div>
    )
}
