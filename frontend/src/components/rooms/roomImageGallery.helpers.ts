/**
 * Helpers for RoomImageGallery — non-component utilities extracted so the
 * component file can stay component-only (react-refresh friendly).
 */

/**
 * Fills image slots by cycling through available images.
 * If images array is empty, returns placeholder paths for all slots.
 */
export function fillImageSlots(images: string[], slots: number = 5): string[] {
    if (images.length === 0) return Array(slots).fill('/images/placeholder-room.png');
    return Array.from({ length: slots }, (_, i) => images[i % images.length]);
}
