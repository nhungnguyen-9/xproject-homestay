/**
 * RoomImageGallery — Collage layout for room detail page.
 * Matches RoomCard proportions (flex-5 | flex-3 | flex-2) but taller for detail view.
 * Responsive: horizontal collage on ≥768px, vertical stack on <768px.
 */

interface RoomImageGalleryProps {
    images: string[]; // Already resolved via imageUrl()
    roomName: string; // For alt attributes
}

/**
 * Fills image slots by cycling through available images.
 * If images array is empty, returns placeholder paths for all slots.
 */
export function fillImageSlots(images: string[], slots: number = 5): string[] {
    if (images.length === 0) return Array(slots).fill('/images/placeholder-room.png');
    return Array.from({ length: slots }, (_, i) => images[i % images.length]);
}

export function RoomImageGallery({ images, roomName }: RoomImageGalleryProps) {
    const slots = fillImageSlots(images);

    return (
        <section aria-label={`Bộ sưu tập ảnh ${roomName}`}>
            {/* Desktop: horizontal collage (≥768px) */}
            <div className="hidden md:flex h-[400px] gap-2">
                {/* Left — main large image */}
                <div className="relative flex-5 overflow-hidden rounded-xl">
                    <img
                        src={slots[0]}
                        alt={`${roomName} - ảnh chính`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Center — medium image */}
                <div className="relative flex-3 overflow-hidden rounded-xl">
                    <img
                        src={slots[1]}
                        alt={`${roomName} - ảnh 2`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Right — 3 small stacked */}
                <div className="flex flex-2 flex-col gap-2">
                    {[2, 3, 4].map((i) => (
                        <div key={i} className="relative flex-1 overflow-hidden rounded-xl">
                            <img
                                src={slots[i]}
                                alt={`${roomName} - ảnh ${i + 1}`}
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile: vertical stack (<768px) */}
            <div className="flex flex-col gap-2 md:hidden">
                {slots.map((src, i) => (
                    <div key={i} className="relative h-[200px] overflow-hidden rounded-xl">
                        <img
                            src={src}
                            alt={`${roomName} - ảnh ${i + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default RoomImageGallery;
