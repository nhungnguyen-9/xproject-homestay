/**
 * Danh sách tiện nghi phòng có sẵn.
 * DB vẫn lưu string[] — giá trị lưu trong DB chính là `label`.
 * Icon tra cứu bằng exact match theo label, fallback DEFAULT_AMENITY_ICON cho custom.
 */

export type AmenityCategory = 'common' | 'extra';

export interface AmenityOption {
  id: string;
  label: string;
  icon: string;
  category: AmenityCategory;
  /** Đánh dấu tiện nghi cảnh báo (vd: WC chung → hiển thị đỏ) */
  warn?: boolean;
}

/** Nhãn cảnh báo "WC chung" — dùng để so khớp chính xác khi áp style đỏ */
export const SHARED_WC_LABEL = 'WC chung';

/** Dòng ghi chú đỏ hiển thị bên dưới danh sách amenities khi có WC chung */
export const SHARED_WC_WARNING = 'Không có WC trong phòng';

export const AMENITY_OPTIONS: AmenityOption[] = [
  // Tiện nghi chung
  { id: 'bedding', label: 'Bộ đồ giường cao cấp', icon: '🛏️', category: 'common' },
  { id: 'hot-shower', label: 'Vòi sen nước nóng', icon: '🚿', category: 'common' },
  { id: 'wifi', label: 'Wi-Fi tốc độ cao', icon: '📶', category: 'common' },
  { id: 'ac', label: 'Máy điều hòa', icon: '❄️', category: 'common' },
  { id: 'breakfast', label: 'Bữa sáng theo yêu cầu', icon: '☕', category: 'common' },

  // Tiện nghi riêng
  { id: 'balcony', label: 'Ban công thoáng', icon: '🌿', category: 'extra' },
  { id: 'bathtub', label: 'Bồn tắm', icon: '🛁', category: 'extra' },
  { id: 'smart-tv', label: 'Smart TV', icon: '📺', category: 'extra' },
  { id: 'ac-dual', label: 'Máy lạnh 2 chiều', icon: '❄️', category: 'extra' },
  { id: 'mini-fridge', label: 'Tủ lạnh mini', icon: '🧊', category: 'extra' },
  { id: 'safe', label: 'Két an toàn', icon: '🔒', category: 'extra' },
  { id: 'wardrobe', label: 'Tủ quần áo', icon: '👔', category: 'extra' },
  { id: 'toiletries', label: 'Bộ vệ sinh cá nhân', icon: '🪥', category: 'extra' },
  { id: 'housekeeping', label: 'Dọn phòng hàng ngày', icon: '🧹', category: 'extra' },
  { id: 'parking', label: 'Chỗ đậu xe', icon: '🅿️', category: 'extra' },
  { id: 'shared-wc', label: 'WC chung', icon: '🚻', category: 'extra', warn: true },
  { id: 'private-wc', label: 'WC riêng', icon: '🚽', category: 'extra' },
];

export const DEFAULT_AMENITY_ICON = '✨';

const AMENITY_BY_LABEL = new Map<string, AmenityOption>(
  AMENITY_OPTIONS.map((opt) => [opt.label, opt]),
);

/** Trả về option dự kiến theo label (exact match), undefined nếu là tiện nghi custom */
export function findAmenityOption(label: string): AmenityOption | undefined {
  return AMENITY_BY_LABEL.get(label);
}

/** Icon cho một amenity — exact match theo AMENITY_OPTIONS, fallback ✨ */
export function getAmenityIcon(label: string): string {
  return AMENITY_BY_LABEL.get(label)?.icon ?? DEFAULT_AMENITY_ICON;
}

/** true nếu amenity là "WC chung" — so sánh chính xác theo label */
export function isSharedWC(label: string): boolean {
  return label === SHARED_WC_LABEL;
}

/** true nếu danh sách amenities có chứa "WC chung" */
export function hasSharedWC(amenities: readonly string[] | undefined | null): boolean {
  return !!amenities && amenities.includes(SHARED_WC_LABEL);
}

export const COMMON_AMENITIES = AMENITY_OPTIONS.filter((o) => o.category === 'common');
export const EXTRA_AMENITIES = AMENITY_OPTIONS.filter((o) => o.category === 'extra');
