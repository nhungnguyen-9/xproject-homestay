import { Images } from "lucide-react"

interface Album {
    title: string
    count: number
    cover: string
}

const ALBUMS: Album[] = [
    {
        title: "Không gian tổng thể",
        count: 14,
        cover: "images/generated-1773763950437.png",
    },
    {
        title: "Phòng Cherry & Pinterest",
        count: 10,
        cover: "images/generated-1773763964292.png",
    },
    {
        title: "Phòng 52HZ",
        count: 8,
        cover: "images/generated-1773763985850.png",
    },
    {
        title: "Phòng BB's Forest",
        count: 8,
        cover: "images/generated-1773763983771.png",
    },
    {
        title: "Phòng BB's Canvas & Coco",
        count: 10,
        cover: "images/generated-1773764044972.png",
    },
]

function AlbumCell({
    album,
    className = "",
    textSize = "sm",
}: {
    album: Album
    className?: string
    textSize?: "sm" | "lg"
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}>
            {/* Ảnh */}
            <img
                src={album.cover}
                alt={album.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Dark overlay bar phía dưới */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-0.5 bg-black/45 px-3 py-5 backdrop-blur-[1px]">
                <p className={`font-bold text-white leading-tight ${textSize === "lg" ? "text-2xl" : "text-sm"}`}>
                    {album.title}
                </p>
                <p className="flex items-center gap-1 text-[11px] font-medium text-white/80">
                    <Images className="h-3 w-3" /> {album.count} ảnh
                </p>
            </div>
        </div>
    )
}

export const ImageLibraryPage = () => {
    const [featured, ...rest] = ALBUMS

    return (
        <div className="mx-auto max-w-8xl px-4 py-10 sm:px-8">
            {/* Header */}
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#9B8B7A] mb-1">
                        Thư viện ảnh
                    </p>
                    <h1 className="text-2xl font-extrabold text-[#2B2B2B] leading-tight sm:text-[36px]">
                        Khám phá Nhà Cam
                    </h1>
                </div>
                <button className="flex items-center gap-1 text-sm font-semibold text-nhacam-primary hover:underline whitespace-nowrap">
                    Xem tất cả →
                </button>
            </div>

            {/* Mobile: stack dọc */}
            <div className="flex flex-col gap-3 sm:hidden">
                <AlbumCell album={featured} className="h-56" textSize="lg" />
                <div className="grid grid-cols-2 gap-3">
                    {rest.map((album) => (
                        <AlbumCell key={album.title} album={album} className="h-40" />
                    ))}
                </div>
            </div>

            {/* Desktop: grid 3 cột 2 hàng */}
            <div
                className="hidden sm:grid gap-3"
                style={{
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gridTemplateRows: "1fr 1fr",
                    height: 500,
                }}
            >
                <AlbumCell album={featured} className="row-span-2" textSize="lg" />
                {rest.map((album) => (
                    <AlbumCell key={album.title} album={album} />
                ))}
            </div>
        </div>
    )
}
