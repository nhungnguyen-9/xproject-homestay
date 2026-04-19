/**
 * RoomAmenitiesOverview — Displays room amenities with emoji icons.
 * Maps amenity strings to icon + label pairs using keyword matching.
 * Shows fallback message when no amenities are available.
 */

interface RoomAmenitiesOverviewProps {
    amenities: string[]; // Array of amenity strings from RoomDetail
    roomName: string; // For section context
}

interface AmenityMapping {
    keywords: string[];
    icon: string;
}

const AMENITY_MAPPINGS: AmenityMapping[] = [
    { keywords: ['giường'], icon: '🛏️' },
    { keywords: ['vòi sen', 'nước nóng'], icon: '🚿' },
    { keywords: ['wifi', 'wi-fi'], icon: '📶' },
    { keywords: ['điều hòa', 'máy lạnh'], icon: '❄️' },
    { keywords: ['bữa sáng'], icon: '☕' },
    { keywords: ['ban công'], icon: '🌿' },
    { keywords: ['bồn tắm'], icon: '🛁' },
    { keywords: ['tv', 'smart tv'], icon: '📺' },
];

const DEFAULT_ICON = '✨';

/**
 * Maps an amenity string to its corresponding emoji icon.
 * Matches by checking if the amenity (lowercased) contains any keyword.
 */
export function getAmenityIcon(amenity: string): string {
    const lower = amenity.toLowerCase();
    for (const mapping of AMENITY_MAPPINGS) {
        if (mapping.keywords.some((keyword) => lower.includes(keyword))) {
            return mapping.icon;
        }
    }
    return DEFAULT_ICON;
}

export function RoomAmenitiesOverview({ amenities, roomName }: RoomAmenitiesOverviewProps) {
    return (
        <section
            aria-label={`Tiện nghi ${roomName}`}
            className="w-full bg-card rounded-xl shadow-sm border border-border px-4 py-6 mb-3"
        >
            <p className="text-sm font-bold text-foreground mb-2">
                Tổng Quan Tiện Nghi Phòng
            </p>

            {amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Chưa có thông tin tiện nghi
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground"
                        >
                            <span aria-hidden="true">{getAmenityIcon(amenity)}</span>
                            <span>{amenity}</span>
                        </span>
                    ))}
                </div>
            )}
        </section>
    );
}

export default RoomAmenitiesOverview;
