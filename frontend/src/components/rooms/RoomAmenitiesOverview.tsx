/**
 * RoomAmenitiesOverview — hiển thị tiện nghi phòng với icon chính xác từ AMENITY_OPTIONS.
 * Chia 2 nhóm (chung / riêng) nếu có cả hai; custom amenities hiển thị nhóm "Khác" với icon fallback.
 */
import {
    findAmenityOption,
    getAmenityIcon,
    hasSharedWC,
    isSharedWC,
    SHARED_WC_WARNING,
} from '@/data/amenities';
import { cn } from '@/lib/utils';

interface RoomAmenitiesOverviewProps {
    amenities: string[];
    roomName: string;
}

interface AmenityGroup {
    title: string;
    items: string[];
}

function groupAmenities(amenities: string[]): AmenityGroup[] {
    const common: string[] = [];
    const extra: string[] = [];
    const custom: string[] = [];

    for (const amenity of amenities) {
        const opt = findAmenityOption(amenity);
        if (!opt) custom.push(amenity);
        else if (opt.category === 'common') common.push(amenity);
        else extra.push(amenity);
    }

    const groups: AmenityGroup[] = [];
    if (common.length) groups.push({ title: 'Tiện nghi chung', items: common });
    if (extra.length) groups.push({ title: 'Tiện nghi riêng', items: extra });
    if (custom.length) groups.push({ title: 'Khác', items: custom });
    return groups;
}

function AmenityChip({ amenity }: { amenity: string }) {
    const warn = isSharedWC(amenity);
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm',
                warn
                    ? 'bg-red-100 text-red-700 border border-red-200 font-semibold'
                    : 'bg-muted text-foreground',
            )}
        >
            <span aria-hidden="true">{getAmenityIcon(amenity)}</span>
            <span>{amenity}</span>
        </span>
    );
}

export function RoomAmenitiesOverview({ amenities, roomName }: RoomAmenitiesOverviewProps) {
    const groups = groupAmenities(amenities);
    const showGroups = groups.length > 1;

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
            ) : showGroups ? (
                <div className="flex flex-col gap-3">
                    {groups.map((group) => (
                        <div key={group.title}>
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                                {group.title}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {group.items.map((item) => (
                                    <AmenityChip key={item} amenity={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                        <AmenityChip key={amenity} amenity={amenity} />
                    ))}
                </div>
            )}

            {hasSharedWC(amenities) && (
                <p className="mt-2 text-xs font-medium text-red-600">
                    ⚠️ {SHARED_WC_WARNING}
                </p>
            )}
        </section>
    );
}

export default RoomAmenitiesOverview;
