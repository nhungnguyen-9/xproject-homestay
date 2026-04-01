# Hướng dẫn FE — Giao diện Khách hàng & Kết nối API Backend

Tài liệu dành cho Frontend Developer xây dựng lại giao diện khách hàng, kết nối với Backend API thay thế dữ liệu mock/localStorage hiện tại.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Thiết lập API Client](#2-thiết-lập-api-client)
3. [Dữ liệu phòng (Rooms)](#3-dữ-liệu-phòng-rooms)
4. [Dữ liệu chi nhánh (Branches)](#4-dữ-liệu-chi-nhánh-branches)
5. [Luồng đặt phòng (Booking Flow)](#5-luồng-đặt-phòng-booking-flow)
6. [Tra cứu khách hàng theo SĐT](#6-tra-cứu-khách-hàng-theo-sđt)
7. [Mã khuyến mãi (Promo)](#7-mã-khuyến-mãi-promo)
8. [Đồ ăn & Combo](#8-đồ-ăn--combo)
9. [Thanh toán VietQR](#9-thanh-toán-vietqr)
10. [Type Definitions](#10-type-definitions)
11. [Tính giá phòng](#11-tính-giá-phòng)
12. [Kiểm tra trùng lịch](#12-kiểm-tra-trùng-lịch)
13. [Hiện trạng & Roadmap migration](#13-hiện-trạng--roadmap-migration)

---

## 1. Tổng quan kiến trúc

### Routes khách hàng (public)

```
/                       → Trang chủ — danh sách phòng
/chi-nhanh              → Danh sách chi nhánh
/chi-nhanh/:id          → Chi tiết chi nhánh + lịch phòng + booking modal
/hang-phong/:id         → Chi tiết phòng
```

### Flow tổng quát

```
Trang chủ
  └─ GET /api/v1/rooms               → Hiển thị danh sách phòng
  └─ Chọn phòng → Mở BookingModal

BookingModal (3 bước)
  ├─ Step 1: Chọn thời gian
  │    └─ GET /api/v1/bookings/check-overlap  → Kiểm tra trùng lịch
  │
  ├─ Step 2: Thông tin khách
  │    ├─ GET /api/v1/customers/by-phone/:phone  → Auto-fill tên + bỏ qua upload CCCD
  │    └─ POST /api/v1/customers/:id/id-images   → Upload ảnh CCCD (nếu cần)
  │
  └─ Step 3: Xác nhận & thanh toán
       ├─ POST /api/v1/promos/validate           → Kiểm tra voucher
       └─ POST /api/v1/bookings                  → Tạo booking → Hiện QR VietQR
```

### API Base URL

```typescript
// frontend/.env
VITE_API_URL=http://localhost:3001/api/v1

// Dùng trong code
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
```

---

## 2. Thiết lập API Client

File `frontend/src/services/apiClient.ts` đã có sẵn. Dùng hàm `apiFetch` cho tất cả API call:

```typescript
import { apiFetch } from '@/services/apiClient';

// GET request
const rooms = await apiFetch<RoomDetail[]>('/rooms');

// POST JSON
const booking = await apiFetch<Booking>('/bookings', {
  method: 'POST',
  body: { roomId: 'g01', date: '2026-04-01', ... },
});

// POST FormData (upload file)
const form = new FormData();
files.forEach(f => form.append('images', f));
await apiFetch('/customers/c1/id-images', { method: 'POST', body: form });

// Endpoint public — không cần auth token
const customer = await apiFetch<CustomerLookup | null>(
  '/customers/by-phone/0912345678',
  { skipAuth: true }
);
```

### Xử lý lỗi

```typescript
import { apiFetch, ApiError } from '@/services/apiClient';

try {
  const data = await apiFetch<Booking>('/bookings', { method: 'POST', body: payload });
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      // Trùng lịch
    } else if (err.status === 400) {
      // Dữ liệu không hợp lệ: err.message
    }
  }
}
```

---

## 3. Dữ liệu phòng (Rooms)

### API

#### `GET /api/v1/rooms` — Danh sách phòng (public)

```
Query params:
  branchId?: string     — Lọc theo chi nhánh
  type?: 'standard' | 'vip' | 'supervip'

Response 200: RoomDetail[]
```

#### `GET /api/v1/rooms/:id` — Chi tiết phòng (public)

```
Response 200: RoomDetail
Response 404: { error: string }
```

### Response shape

```typescript
interface RoomDetail {
  id: string;
  name: string;                             // "G01", "P102"
  type: 'standard' | 'vip' | 'supervip';
  branchId: string | null;
  description: string | null;
  images: string[];                         // ["/uploads/rooms/g01-123.jpg", ...]
  maxGuests: number;
  amenities: string[];                      // ["WiFi", "TV", "Điều hòa"]
  hourlyRate: number;                       // 169000
  dailyRate: number;                        // 450000
  overnightRate: number;                    // 350000
  extraHourRate: number;                    // 40000
  isActive: boolean;
  createdAt: string;                        // ISO 8601
  updatedAt: string;
}
```

### Lấy URL ảnh phòng

Ảnh trả về dạng path tương đối `/uploads/rooms/filename.jpg`. Dùng hàm `imageUrl()` từ `roomService` hoặc tự ghép:

```typescript
import * as roomService from '@/services/roomService';

// Cách 1: dùng service
const url = roomService.imageUrl('/uploads/rooms/g01-123.jpg');
// → "http://localhost:3001/uploads/rooms/g01-123.jpg"

// Cách 2: tự ghép
const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1')
  .replace('/api/v1', '');
const imgUrl = `${BACKEND_URL}${imagePath}`;
```

### Dùng trong component

```typescript
// Thay thế demoRooms
import * as roomService from '@/services/roomService';

const [rooms, setRooms] = useState<RoomDetail[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  roomService.getAll()
    .then(setRooms)
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

### Giá tiền theo hạng phòng (default)

| Hạng | `type` | Theo giờ | Theo ngày | Qua đêm | Phụ thu/giờ |
|---|---|---|---|---|---|
| Tiêu chuẩn | `standard` | 169.000đ | 450.000đ | 350.000đ | 40.000đ |
| VIP | `vip` | 210.000đ | 550.000đ | 450.000đ | 50.000đ |
| Super VIP | `supervip` | 269.000đ | 650.000đ | 550.000đ | 60.000đ |

> Giá thực tế lấy từ `room.hourlyRate`, `room.dailyRate`, `room.overnightRate`, `room.extraHourRate` — **không hardcode**.

---

## 4. Dữ liệu chi nhánh (Branches)

### API

#### `GET /api/v1/branches` — Danh sách chi nhánh

> **Lưu ý:** Endpoint này yêu cầu auth (`requirePermission('branches')`). Nếu cần public, cần thêm route riêng hoặc bỏ auth middleware.

```typescript
// Hiện tại (mock data tạm thời):
import { locationBranches } from '@/data/locations';

// Sau khi backend mở public:
const branches = await apiFetch<Branch[]>('/branches', { skipAuth: true });
```

### Response shape

```typescript
interface Branch {
  id: string;
  name: string;            // "Cần Thơ", "TP. Hồ Chí Minh"
  phone: string;
  address: string;
  district: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Luồng đặt phòng (Booking Flow)

### Cấu trúc dữ liệu form

```typescript
interface BookingFormData {
  // Thông tin phòng
  roomId: string;
  roomType: 'standard' | 'vip' | 'supervip';
  roomName: string;

  // Hình thức đặt
  mode: 'hourly' | 'daily' | 'overnight';

  // Thời gian
  checkInDate: Date;
  checkInTime: string;         // "HH:mm"
  checkOutDate: Date;
  checkOutTime: string;        // "HH:mm"

  // Thông tin khách
  adults: number;
  guestName: string;
  guestPhone: string;
  idImages: File[];            // Ảnh CCCD — bắt buộc nếu khách mới

  // Dịch vụ thêm
  foodItems: FoodItem[];       // Danh sách với qty
  selectedComboIds?: string[];

  // Khác
  note: string;
  voucher: string;
  acceptTerms: boolean;
  customerLookup?: CustomerLookup | null;  // Kết quả tra cứu SĐT
}
```

### Hình thức đặt phòng

| `mode` | Mô tả | Check-in | Check-out |
|---|---|---|---|
| `hourly` | Theo giờ | Tùy chọn | Tùy chọn |
| `daily` | Theo ngày | 14:00 | 12:00 hôm sau |
| `overnight` | Qua đêm | 22:00 | 09:00 hôm sau |

### Tạo booking — `POST /api/v1/bookings`

> Endpoint yêu cầu auth. Nếu khách tự đặt không có tài khoản, cần thêm endpoint public `/bookings/guest` hoặc tạo token tạm. Hiện tại booking được tạo qua admin/staff.

**Request body:**

```typescript
{
  roomId: string;                       // "g01"
  date: string;                         // "2026-04-15" (YYYY-MM-DD)
  startTime: string;                    // "14:00" (HH:mm)
  endTime: string;                      // "16:00" (HH:mm)
  mode?: 'hourly' | 'daily' | 'overnight';  // default: "hourly"
  guestName?: string;                   // "Nguyễn Văn A"
  guestPhone?: string;                  // "0912345678"
  status?: 'pending' | 'confirmed';     // default: "pending"
  category?: 'guest' | 'internal';      // default: "guest"
  note?: string;
  adults?: number;                      // default: 2
  foodItems?: Array<{
    id: string;
    name: string;
    price: number;
    qty?: number;
  }>;
  totalPrice: number;                   // Bắt buộc — tính ở frontend
  voucher?: string;
}
```

**Response 201:**

```typescript
{
  id: string;               // "abc123" (nanoid)
  roomId: string;
  customerId?: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  status: string;           // "pending"
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  // ... các field khác
}
```

**Response lỗi:**

```typescript
// 400 — Dữ liệu không hợp lệ
{ error: string }

// 409 — Trùng lịch
{ error: "Room is already booked for this time slot" }

// 403 — Staff tạo internal booking
{ error: "Only admins can create internal bookings" }
```

### Trạng thái booking

```
pending → confirmed → checked-in → checked-out
       ↘ cancelled
```

| `status` | Ý nghĩa |
|---|---|
| `pending` | Chờ xác nhận |
| `confirmed` | Đã xác nhận (admin đã nhận tiền) |
| `checked-in` | Khách đang trong phòng |
| `checked-out` | Đã trả phòng |
| `cancelled` | Đã hủy |

---

## 6. Tra cứu khách hàng theo SĐT

### API — Public, không cần auth

#### `GET /api/v1/customers/by-phone/:phone`

```
Params:
  phone: string   — SĐT (chuẩn hóa +84 → 0, bỏ khoảng trắng)

Response 200: CustomerLookup | null
```

**Response shape:**

```typescript
// Khách tồn tại
interface CustomerLookup {
  id: string;
  name: string;
  phone: string;
  hasIdImages: boolean;      // true nếu đã có ảnh CCCD trong hệ thống
  idImageUrls: string[];     // ["/uploads/customers/c1/c1-123.jpg"]
}

// Khách chưa tồn tại → trả về null
null
```

### Dùng trong Step 2 (debounce)

```typescript
import { useRef } from 'react';
import { apiFetch } from '@/services/apiClient';
import { normalizePhone } from '@/services/customerService';

const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [lookupResult, setLookupResult] = useState<CustomerLookup | null | 'loading'>(null);

useEffect(() => {
  const phone = formData.guestPhone.replace(/\s/g, '');

  if (!/^[0-9]{10,11}$/.test(phone)) {
    setLookupResult(null);
    return;
  }

  setLookupResult('loading');

  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(async () => {
    const normalized = normalizePhone(phone);
    const result = await apiFetch<CustomerLookup | null>(
      `/customers/by-phone/${normalized}`,
      { skipAuth: true }
    ).catch(() => null);

    setLookupResult(result);

    if (result) {
      // Auto-fill tên
      setFormData(prev => ({ ...prev, guestName: result.name, customerLookup: result }));
    }
  }, 600);

  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [formData.guestPhone]);
```

### UI feedback

```tsx
{lookupResult === 'loading' && (
  <p className="text-xs text-muted-foreground mt-1">Đang tra cứu...</p>
)}

{lookupResult && lookupResult !== 'loading' && lookupResult.hasIdImages && (
  <p className="text-xs text-green-600 font-medium mt-1">
    ✓ Khách quen — đã có giấy tờ, không cần upload lại
  </p>
)}

{lookupResult && lookupResult !== 'loading' && !lookupResult.hasIdImages && (
  <p className="text-xs text-amber-600 font-medium mt-1">
    Khách quen — vui lòng bổ sung giấy tờ
  </p>
)}
```

### Logic ẩn/hiện phần upload CCCD

```tsx
const skipUpload = lookupResult &&
                   lookupResult !== 'loading' &&
                   lookupResult.hasIdImages;

{!skipUpload && (
  <div className="upload-cccd-section">
    {/* ImageUpload component */}
  </div>
)}
```

### Validate Step 2 theo trạng thái khách

```typescript
const validateStep2 = () => {
  const errors: Record<string, string> = {};

  if (!guestName.trim()) errors.guestName = 'Vui lòng nhập họ tên';
  if (!/^[0-9]{10,11}$/.test(guestPhone.replace(/\s/g, '')))
    errors.guestPhone = 'Số điện thoại không hợp lệ';

  // Chỉ yêu cầu ảnh nếu khách chưa có trong hệ thống
  const hasExistingImages = customerLookup?.hasIdImages === true;
  if (!hasExistingImages && idImages.length === 0)
    errors.idImages = 'Vui lòng upload ảnh CMND/CCCD';

  return errors;
};
```

---

## 7. Mã khuyến mãi (Promo)

### API — Yêu cầu auth

#### `POST /api/v1/promos/validate` — Kiểm tra mã

```typescript
// Request
{
  code: string;                           // "SUMMER20"
  roomType: 'standard' | 'vip' | 'supervip';
}

// Response 200 — hợp lệ
{
  valid: true;
  discountValue: number;                  // 20 (percent) hoặc 50000 (fixed)
  discountType: 'percent' | 'fixed';
  finalPrice: number;                     // Giá sau giảm (truyền originalPrice khi gọi)
}

// Response 200 — không hợp lệ
{
  valid: false;
  error: string;                          // "Mã không tồn tại" | "Mã đã hết hạn" | ...
}
```

#### `POST /api/v1/promos/apply` — Áp dụng để lấy giá cuối

```typescript
// Request
{
  code: string;
  roomType: 'standard' | 'vip' | 'supervip';
  originalPrice: number;                  // Giá phòng trước giảm
}

// Response 200
{
  finalPrice: number;                     // Giá sau giảm
  discount: number;                       // Số tiền đã giảm
  discountType: 'percent' | 'fixed';
}
```

### Tính giảm giá thủ công (fallback)

```typescript
function applyDiscount(
  originalPrice: number,
  discountType: 'percent' | 'fixed',
  discountValue: number
): number {
  if (discountType === 'percent') {
    return Math.round(originalPrice * (1 - discountValue / 100));
  }
  return Math.max(0, originalPrice - discountValue);
}
```

---

## 8. Đồ ăn & Combo

### API — Yêu cầu auth

#### `GET /api/v1/food-items` — Danh sách đồ ăn

```typescript
// Query
category?: 'item' | 'combo'

// Response 200
Array<{
  id: string;
  name: string;           // "Pepsi", "Mỳ Ly"
  price: number;          // 11000
  image?: string;         // URL ảnh (nếu có)
  category: 'item' | 'combo';
  isActive: boolean;
  sortOrder: number;
}>
```

### Dùng hiện tại (mock — cần migrate)

```typescript
// frontend/src/types/schedule.ts
export const FOOD_ITEMS: FoodItem[] = [...];   // hardcode
export const COMBO_ITEMS: FoodItem[] = [...];  // hardcode
```

### Migrate sang API

```typescript
// Thay thế FOOD_ITEMS constant bằng API call
const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
const [comboItems, setComboItems] = useState<FoodItem[]>([]);

useEffect(() => {
  Promise.all([
    apiFetch<FoodItem[]>('/food-items?category=item'),
    apiFetch<FoodItem[]>('/food-items?category=combo'),
  ]).then(([items, combos]) => {
    setFoodItems(items.filter(i => i.isActive));
    setComboItems(combos.filter(i => i.isActive));
  });
}, []);
```

### Cấu trúc FoodItem trong booking

```typescript
interface FoodItem {
  id: string;
  name: string;
  price: number;
  qty?: number;       // Số lượng khách chọn
  selected?: boolean;
  image?: string;
}

// Tính tổng tiền đồ ăn
const foodTotal = foodItems
  .filter(f => (f.qty || 0) > 0)
  .reduce((sum, f) => sum + f.price * (f.qty || 0), 0);

const comboTotal = selectedComboIds
  .map(id => comboItems.find(c => c.id === id))
  .filter(Boolean)
  .reduce((sum, c) => sum + c!.price, 0);
```

---

## 9. Thanh toán VietQR

### Cấu hình ngân hàng

```typescript
// frontend/src/config/bank.ts (hoặc từ .env)
const BANK_ID = import.meta.env.VITE_BANK_ID ?? 'MB';
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT ?? '0123456789';
const ACCOUNT_NAME = import.meta.env.VITE_ACCOUNT_NAME ?? 'CHON CINEHOME';
```

> Cập nhật thông tin ngân hàng thật trong `frontend/.env` trước khi deploy.

### Tạo QR URL

```typescript
function buildVietQRUrl(params: {
  amount: number;
  addInfo: string;
}): string {
  const base = `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png`;
  const query = new URLSearchParams({
    amount: String(params.amount),
    addInfo: params.addInfo,
    accountName: ACCOUNT_NAME,
  });
  return `${base}?${query}`;
}
```

### Nội dung chuyển khoản

Format: `DP {roomName} {4 số cuối SĐT} {DDMM}`

```typescript
function buildTransferContent(
  roomName: string,
  guestPhone: string,
  bookingDate: Date
): string {
  const last4 = guestPhone.replace(/\s/g, '').slice(-4);
  const day = String(bookingDate.getDate()).padStart(2, '0');
  const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
  return `DP ${roomName} ${last4} ${day}${month}`;
}

// Ví dụ: "DP G01 4567 1504"
```

### Render QR code

```tsx
const qrUrl = buildVietQRUrl({
  amount: totalPrice,
  addInfo: buildTransferContent(roomName, guestPhone, checkInDate),
});

<img
  src={qrUrl}
  alt="QR thanh toán"
  className="h-48 w-48 rounded-xl border border-border"
  loading="lazy"
/>
```

---

## 10. Type Definitions

### Room

```typescript
type RoomType = 'standard' | 'vip' | 'supervip';

interface Room {
  id: string;
  name: string;
  type: RoomType;
}

interface RoomDetail extends Room {
  branchId: string | null;
  description: string | null;
  images: string[];               // URL paths: ["/uploads/rooms/..."]
  maxGuests: number;
  amenities: string[];
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PriceConfig {
  hourlyRate: number;
  dailyRate: number;
  overnightRate: number;
  extraHourRate: number;
}
```

### Booking

```typescript
type BookingMode = 'hourly' | 'daily' | 'overnight';
type BookingStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
type BookingCategory = 'guest' | 'internal';

interface Booking {
  id: string;
  roomId: string;
  date: string;               // "YYYY-MM-DD"
  startTime: string;          // "HH:mm"
  endTime: string;            // "HH:mm"
  mode: BookingMode;
  guestName?: string;
  guestPhone?: string;
  status: BookingStatus;
  category: BookingCategory;
  note?: string;
  adults?: number;
  foodItems?: FoodItem[];
  totalPrice: number;
  voucher?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Gửi lên backend khi tạo mới
type CreateBookingPayload = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
```

### Customer

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  idImageUrls?: string[];
  createdAt: string;
}

interface CustomerLookup {
  id: string;
  name: string;
  phone: string;
  hasIdImages: boolean;
  idImageUrls: string[];
}
```

### Promo

```typescript
interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  startDate: string;                       // "YYYY-MM-DD"
  endDate: string;
  applicableRoomTypes: RoomType[];         // [] = áp dụng cho tất cả
  status: 'active' | 'expired' | 'disabled';
}
```

---

## 11. Tính giá phòng

### Logic tính giá — `calculateBookingPrice()`

```typescript
// frontend/src/utils/helpers.ts
function calculateBookingPrice(
  mode: BookingMode,
  duration: number,        // giờ (số thực, VD: 2.5)
  priceConfig: PriceConfig
): number {
  const { hourlyRate, dailyRate, overnightRate, extraHourRate } = priceConfig;

  if (mode === 'hourly') {
    return Math.ceil(duration) * hourlyRate;
  }

  if (mode === 'overnight') {
    // Check-in 22:00, check-out 09:00 hôm sau = 11 tiếng cố định
    // Nếu trả trễ hơn 09:00 → phụ thu extraHourRate/giờ
    const baseHours = 11;
    const extra = Math.max(0, duration - baseHours);
    const extraCharge = Math.ceil(extra) * extraHourRate;
    return overnightRate + extraCharge;
  }

  if (mode === 'daily') {
    // Check-in 14:00, check-out 12:00 hôm sau = 22 tiếng/ngày
    const hoursPerDay = 22;
    const fullDays = Math.floor(duration / hoursPerDay);
    const remainHours = duration % hoursPerDay;
    const extraCharge = remainHours > 0 ? Math.ceil(remainHours) * extraHourRate : 0;
    const cost = fullDays * dailyRate + extraCharge;
    // Không vượt quá giá ngày tiếp theo
    return Math.min(cost, (fullDays + 1) * dailyRate);
  }

  return 0;
}
```

### Tính khoảng thời gian — `calculateDuration()`

```typescript
function calculateDuration(
  checkInDate: Date,
  checkInTime: string,
  checkOutDate: Date,
  checkOutTime: string
): number {
  const [inH, inM] = checkInTime.split(':').map(Number);
  const [outH, outM] = checkOutTime.split(':').map(Number);

  const startMs = new Date(checkInDate).setHours(inH, inM, 0, 0);
  let endMs = new Date(checkOutDate).setHours(outH, outM, 0, 0);

  // Nếu check-out trước check-in → qua ngày hôm sau
  if (endMs <= startMs) endMs += 24 * 60 * 60 * 1000;

  return (endMs - startMs) / (1000 * 60 * 60);    // giờ
}
```

### Lấy giá từ RoomDetail thay vì hardcode

```typescript
// ❌ Sai — đừng hardcode
const ROOM_PRICES = { standard: { hourlyRate: 169000, ... } };

// ✅ Đúng — lấy từ API
const priceConfig: PriceConfig = {
  hourlyRate: room.hourlyRate,
  dailyRate: room.dailyRate,
  overnightRate: room.overnightRate,
  extraHourRate: room.extraHourRate,
};

const price = calculateBookingPrice(mode, duration, priceConfig);
```

---

## 12. Kiểm tra trùng lịch

### Dùng API backend (khuyến nghị)

#### `GET /api/v1/bookings/check-overlap`

```typescript
// Query params
interface CheckOverlapQuery {
  roomId: string;
  date: string;         // "YYYY-MM-DD" — ngày check-in
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  excludeId?: string;   // Loại trừ booking đang sửa
}

// Response
{ hasConflict: boolean }
```

```typescript
const { hasConflict } = await apiFetch<{ hasConflict: boolean }>(
  '/bookings/check-overlap?' + new URLSearchParams({
    roomId: formData.roomId,
    date: formatDateInput(formData.checkInDate),
    startTime: formData.checkInTime,
    endTime: formData.checkOutTime,
  })
);

if (hasConflict) {
  setErrors({ time: 'Phòng đã có người đặt trong khung giờ này' });
}
```

### Logic kiểm tra trùng client-side (fallback)

```typescript
// frontend/src/components/booking-calendar-form/booking-modal/validation.ts

function toTimestamp(date: Date, time: string): number {
  const [h, m] = time.split(':').map(Number);
  return new Date(date).setHours(h, m, 0, 0);
}

function hasOverlap(
  newStart: number,
  newEnd: number,
  booking: Booking
): boolean {
  // Xử lý booking qua nửa đêm
  const bDate = new Date(booking.date);
  const bStart = toTimestamp(bDate, booking.startTime);
  let bEnd = toTimestamp(bDate, booking.endTime);
  if (bEnd <= bStart) bEnd += 24 * 60 * 60 * 1000;

  // Overlap nếu: newStart < bEnd VÀ bStart < newEnd
  return newStart < bEnd && bStart < newEnd;
}

// Trong validateStep1:
const newStart = toTimestamp(checkInDate, checkInTime);
let newEnd = toTimestamp(checkOutDate, checkOutTime);
if (newEnd <= newStart) newEnd += 24 * 60 * 60 * 1000;

const conflicting = bookings
  .filter(b => b.roomId === roomId && b.status !== 'cancelled')
  .find(b => hasOverlap(newStart, newEnd, b));
```

---

## 13. Hiện trạng & Roadmap migration

### Những gì đang dùng mock data (cần migrate)

| Tính năng | Hiện tại | Cần đổi sang |
|---|---|---|
| Danh sách phòng | `demoRooms` (localStorage) | `GET /api/v1/rooms` ✅ (đã có `roomService.getAll()`) |
| Lịch booking trên trang khách | `demoBookings` (localStorage) | `GET /api/v1/bookings?roomId=&date=` |
| Tra cứu khách theo SĐT | — | `GET /api/v1/customers/by-phone/:phone` ✅ |
| Tạo booking | `bookingService.create()` → localStorage | `POST /api/v1/bookings` ⚠️ cần auth |
| Validate promo | `promoService.validate()` → localStorage | `POST /api/v1/promos/validate` ⚠️ cần auth |
| Danh sách đồ ăn | `FOOD_ITEMS` constant hardcode | `GET /api/v1/food-items` ⚠️ cần auth |
| Danh sách chi nhánh | `locationBranches` hardcode | `GET /api/v1/branches` ⚠️ cần auth hoặc public |

### Vấn đề cần giải quyết trước khi migrate hoàn toàn

#### 1. Tạo booking không cần auth (khách tự đặt)

Hiện tại `POST /api/v1/bookings` yêu cầu JWT. Có 2 hướng:

**Option A — Endpoint public riêng:**
```
POST /api/v1/bookings/guest   → Public, không cần auth
```

**Option B — Token tạm (guest token):**
```
POST /api/v1/auth/guest-token → Trả về token tạm 30 phút
→ Dùng token đó để POST /api/v1/bookings
```

#### 2. Đồ ăn & chi nhánh cần public

```typescript
// Backend: bỏ auth middleware cho các route public
foodItemsRouter.get('/', handler);    // Remove requirePermission
branchesRouter.get('/', handler);     // Remove authMiddleware
```

#### 3. Promo validate nên public

Khách nhập mã giảm giá trước khi có tài khoản → cần public endpoint.

### Thứ tự migration khuyến nghị

```
1. Public endpoints:
   - GET /rooms              ✅ Đã public
   - GET /customers/by-phone ✅ Đã public
   - GET /food-items         → Mở public
   - GET /branches           → Mở public
   - POST /promos/validate   → Mở public

2. Booking flow:
   - GET /bookings?roomId&date  → Cần auth hoặc public endpoint mới
   - POST /bookings             → Thêm public guest endpoint

3. Frontend migrate:
   - Xóa import từ demoRooms, demoBookings
   - Thay bằng API calls trong useEffect
   - Giữ localStorage làm fallback khi offline (optional)
```

---

## Phụ lục — Environment Variables

```env
# frontend/.env
VITE_API_URL=http://localhost:3001/api/v1

# Thông tin thanh toán VietQR
VITE_BANK_ID=MB
VITE_BANK_ACCOUNT=0123456789
VITE_ACCOUNT_NAME=CHON CINEHOME
```

> Thay `VITE_BANK_ACCOUNT` và `VITE_ACCOUNT_NAME` bằng thông tin thật trước khi go-live.

---

## Phụ lục — Danh sách endpoints tóm tắt

| Endpoint | Method | Auth | Dùng cho |
|---|---|---|---|
| `/rooms` | GET | Public | Trang chủ, trang chi tiết phòng |
| `/rooms/:id` | GET | Public | Chi tiết phòng |
| `/branches` | GET | ⚠️ Cần mở public | Trang chi nhánh |
| `/customers/by-phone/:phone` | GET | Public | Step 2 auto-fill |
| `/bookings/check-overlap` | GET | Auth | Validate Step 1 |
| `/bookings` | POST | Auth | Tạo booking (cần guest endpoint) |
| `/promos/validate` | POST | ⚠️ Cần mở public | Validate voucher |
| `/food-items` | GET | ⚠️ Cần mở public | Danh sách đồ ăn |
| `/customers/:id/id-images` | POST | Auth | Upload CCCD Step 2 |

*Cập nhật lần cuối: 2026-04-01*
