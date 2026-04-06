# Quy Trình Chuẩn Hóa Đặt Phòng — Chốn Cinehome

> Tài liệu mô tả luồng đặt phòng end-to-end, dựa trên codebase hiện tại.
> Cập nhật: 2026-03-20

---

## Tổng Quan Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LỊCH PHÒNG (RoomSchedule)                       │
│  ┌──────┬────────────────────────────────────────────────────────────┐  │
│  │Phòng │  00h    02h    04h    06h    08h    10h    12h    14h ... │  │
│  ├──────┼────────────────────────────────────────────────────────────┤  │
│  │ P101 │  ░░░░░░░░░░░░  ████████  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │ P102 │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ██████████████████  │  │
│  │ P103 │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  └──────┴────────────────────────────────────────────────────────────┘  │
│         ░ = Trống (click để đặt)    █ = Đã đặt (không thể chọn)       │
└─────────────────┬───────────────────────────────────────────────────────┘
                  │ Click ô trống
                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     MODAL ĐẶT PHÒNG (BookingModal)                     │
│                                                                         │
│  ┌─ Bước 1 ─┐    ┌─ Bước 2 ─┐    ┌─ Bước 3 ─┐                       │
│  │ Chọn phòng│───▶│ Thông tin │───▶│ Thanh toán│                       │
│  │ & dịch vụ │◀───│ khách    │◀───│ & xác nhận│                       │
│  └───────────┘    └──────────┘    └─────┬─────┘                       │
│                                         │ Xác nhận                     │
└─────────────────────────────────────────┼───────────────────────────────┘
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MODAL THANH TOÁN (PaymentModal)                      │
│           QR Code + Thông tin chuyển khoản MB Bank                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Điểm Vào (Entry Points)

### 1. Từ lịch phòng (Primary)
- **Component**: `RoomSchedule` → click ô trống trên timeline
- **Trigger**: `onEmptySlotClick(roomId, time)` → mở `BookingModal`
- **Dữ liệu khởi tạo**: roomId, selectedDate, selectedTime từ vị trí click
- **File**: `src/components/schedule/room-schedule.tsx:467-473`

### 2. Từ trang chi tiết phòng (Secondary — chưa triển khai)
- Nút "Đặt phòng" trên `RoomDetailPage` → mở `BookingModal`

---

## Bước 1: Chọn Phòng & Thời Gian

**Component**: `Step1.tsx` | **Validation**: `validateStep1()`

### 1.1 Chọn hình thức đặt phòng

| Hình thức | Value | Giờ nhận | Giờ trả | Mô tả |
|-----------|-------|----------|---------|-------|
| Theo giờ | `hourly` | Tùy chọn (00h-23h, bước 15 phút) | Tùy chọn | Tối thiểu 30 phút |
| Theo ngày | `daily` | 14:00 (cố định) | 12:00 hôm sau (cố định) | Tự tính ngày trả |
| Qua đêm | `overnight` | 22:00 (cố định) | 09:00 hôm sau (cố định) | Tự tính ngày trả |

**Logic chuyển mode**: Khi user đổi mode, hệ thống lưu lại dữ liệu thời gian của mode cũ (`modeData` state) và load dữ liệu đã lưu của mode mới → tránh mất dữ liệu khi chuyển qua lại.

### 1.2 Chọn phòng

```
Hạng phòng (read-only, lấy từ room đã chọn trên lịch)
    ├── Tiêu chuẩn (standard)
    ├── VIP (vip)
    └── Super VIP (supervip)

Phòng (Select dropdown)
    └── Lọc theo roomType → chỉ hiện phòng cùng hạng
```

### 1.3 Bảng giá

| Hạng phòng | Theo giờ | Theo ngày | Qua đêm | Phụ thu/giờ |
|------------|----------|-----------|---------|-------------|
| Tiêu chuẩn | 169,000đ | 450,000đ | 350,000đ | 40,000đ |
| VIP | 21,000đ | 550,000đ | 450,000đ | 50,000đ |
| Super VIP | 269,000đ | 650,000đ | 550,000đ | 60,000đ |

**Công thức tính giá**:
```
hourly:    ceil(duration_hours) × hourlyRate
daily:     ceil(duration_hours / 24) × dailyRate
overnight: ceil(duration_hours / 24) × overnightRate
```

### 1.4 Đồ ăn & Dịch vụ (tùy chọn)

**Combo đặc biệt** (toggle chọn/bỏ):
| Combo | Giá |
|-------|-----|
| 1 Mỳ Ly + 1 Xúc Sích + 1 Suối | 25,000đ |
| 2 Áo Giáp | 20,000đ |
| 1 Snack + 1 Suối | 15,000đ |

**Món lẻ** (mở FoodModal, chọn số lượng +/−):
- Hiển thị grid sản phẩm với hình ảnh, giá, bộ đếm số lượng
- Xác nhận → cập nhật `formData.foodItems`

### 1.5 Validation Bước 1

```
✓ Thời gian đặt ≥ 30 phút
✓ Không trùng lịch đã đặt của cùng phòng, cùng ngày
  → Kiểm tra overlap: checkIn/checkOut vs booking.startTime/endTime
```

**Lỗi hiển thị**: Banner đỏ dưới nội dung step (`errors.duration`, `errors.time`)

---

## Bước 2: Thông Tin Khách Hàng

**Component**: `Step2.tsx` | **Validation**: `validateStep2()`

### 2.1 Thông tin bắt buộc

| Field | Validation | Lỗi |
|-------|-----------|------|
| Họ và tên (*) | `trim() !== ""` | "Vui lòng nhập họ và tên" |
| Số điện thoại (*) | Regex `/^[0-9]{10,11}$/` (sau khi bỏ khoảng trắng) | "Số điện thoại không hợp lệ" |
| Ảnh CMND/CCCD (*) | `idImages.length > 0`, tối đa 3 ảnh | "Vui lòng upload ảnh CMND/CCCD" |

### 2.2 Tóm tắt đặt phòng (read-only)

Hiển thị dạng card grid:
```
┌─────────┬──────────┬─────────┬──────────┬──────────┐
│ Phòng   │ Hình thức│ Thời gian│ Hạng phòng│ Người lớn│
│ P101    │ Giờ      │ 3 giờ   │ VIP      │ 2 người  │
└─────────┴──────────┴─────────┴──────────┴──────────┘

┌──────────────────────┬──────────────────────┐
│ Nhận phòng           │ Trả phòng            │
│ 20/03/2026 - 14:00   │ 20/03/2026 - 17:00   │
└──────────────────────┴──────────────────────┘

────────────────────────────────────────────────
Giá phòng                          507,000 VNĐ
Đồ ăn & uống                       45,000 VNĐ
────────────────────────────────────────────────
TỔNG THANH TOÁN                    552,000 VNĐ
────────────────────────────────────────────────
• Hình thức: Chuyển khoản
• Thanh toán trong vòng 5 phút sau khi đặt phòng
```

### 2.3 Thông tin bổ sung

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| Ghi chú | Không | Textarea, yêu cầu đặc biệt |
| Voucher | Không | Mã giảm giá (chưa có logic xử lý) |
| Chấp nhận điều khoản (*) | **Có** | Checkbox + link xem nội quy |

### 2.4 Nội quy Homestay (Dialog)

Click "Chấp nhận điều khoản" → mở dialog hiển thị 9 điều nội quy → nút "Đã hiểu" → tự check acceptTerms.

---

## Bước 3: Thanh Toán

**Component**: `Step3.tsx` | **Validation**: `validateStep3()` (chỉ check `acceptTerms`)

### 3.1 Thông tin chuyển khoản

```
Nội dung CK: "DP {tên phòng} {ngày nhận phòng DD/MM/YYYY}"
Ví dụ:       "DP P101 20/03/2026"
```

### 3.2 QR Code thanh toán

```
Nguồn:     VietQR API
Ngân hàng: MB Bank
STK:       0123456789
Chủ TK:    CHON CINEHOME
URL mẫu:   https://img.vietqr.io/image/MB-{STK}-compact2.png
            ?amount={totalPrice}
            &addInfo={nội dung CK encoded}
            &accountName=CHON%20CINEHOME
```

- Hiển thị QR code inline
- Nút "Tải ảnh QR" (download PNG)
- Cảnh báo: thanh toán trong 5 phút

### 3.3 Submit

Nhấn **"Đặt phòng"** → validate `acceptTerms` → tạo booking object:

```typescript
{
  roomId:     formData.roomId,
  startTime:  formData.checkInTime,    // "HH:mm"
  endTime:    formData.checkOutTime,   // "HH:mm"
  guestName:  formData.guestName,
  guestPhone: formData.guestPhone,
  status:     "pending",
  note:       formData.note,
  adults:     formData.adults,
  foodItems:  selectedFoodItems,
  totalPrice: price + foodTotal,
}
```

→ `onBookingCreate(newBooking)` callback
→ Đóng BookingModal
→ Mở PaymentModal (hiển thị QR + info chuyển khoản)
→ Booking mới xuất hiện trên lịch với status `pending`

---

## Post-Booking: Modal Thanh Toán

**Component**: `PaymentModal.tsx`

```
┌──────────────────────────────┐
│    ✓ Đặt phòng thành công!   │
│                              │
│       ┌────────────┐         │
│       │  QR Code   │         │
│       │  (VietQR)  │         │
│       └────────────┘         │
│                              │
│  Ngân hàng:    MB Bank       │
│  Số TK:        0123456789    │
│  Chủ TK:       CHON CINEHOME│
│  Số tiền:      552,000 VNĐ  │
│  Nội dung CK:  DP P101 ...  │
│                              │
│  ┌────────┐  ┌─────────────┐ │
│  │  Đóng  │  │ Đã chuyển khoản│
│  └────────┘  └─────────────┘ │
└──────────────────────────────┘
```

**Actions**:
- "Đóng" → close modal, booking vẫn `pending`
- "Đã chuyển khoản" → close modal (chưa có logic verify thanh toán)

---

## State Machine — Trạng thái Booking

```
                    ┌──────────────────────────────┐
                    │                              │
  User đặt phòng   │         ┌─────────┐          │
  ────────────────▶ │         │ pending │          │
                    │         └────┬────┘          │
                    │              │                │
                    │     Xác nhận thanh toán       │
                    │     (chưa implement)          │
                    │              │                │
                    │              ▼                │
                    │        ┌──────────┐          │
                    │        │confirmed │          │
                    │        └────┬─────┘          │
                    │             │                 │
                    │      Khách nhận phòng         │
                    │      (chưa implement)         │
                    │             │                 │
                    │             ▼                 │
                    │       ┌───────────┐          │
                    │       │checked-in │          │
                    │       └─────┬─────┘          │
                    │             │                 │
                    │       Khách trả phòng         │
                    │       (chưa implement)        │
                    │             │                 │
                    │             ▼                 │
                    │      ┌────────────┐          │
                    │      │checked-out │          │
                    │      └────────────┘          │
                    │                              │
                    └──────────────────────────────┘

  Trạng thái hiện tại:  pending | confirmed | checked-in | checked-out
  Type:                  BookingStatus (src/types/schedule.ts:15)
```

---

## Data Flow Diagram

```
RoomSchedule                    BookingModal                    Backend (chưa có)
─────────────                   ────────────                    ─────────────────
     │                               │
     │  click ô trống                │
     │  (roomId, time)               │
     ├──────────────────────────────▶│
     │                               │
     │                     ┌─────────┤
     │                     │ Step 1  │ ← formData (local state)
     │                     │ Step 2  │ ← useBookingForm hook
     │                     │ Step 3  │ ← validation per step
     │                     └─────────┤
     │                               │
     │  onBookingCreate(newBooking)   │
     │◀──────────────────────────────┤
     │                               │
     │  localBookings.push(booking)  │           POST /api/bookings
     │  (client-side only)           │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ▶ (TODO)
     │                               │
     │  Re-render timeline           │
     │  (booking block hiện lên)     │
     │                               │
```

---

## Validation Summary

| Bước | Field | Rule | Error Message |
|------|-------|------|---------------|
| 1 | duration | `≥ 0.5 giờ` | Thời gian đặt phòng tối thiểu 30 phút |
| 1 | time overlap | Không trùng booking cùng phòng + ngày | Khung giờ này đã có người đặt |
| 2 | guestName | `trim() !== ""` | Vui lòng nhập họ và tên |
| 2 | guestPhone | `/^[0-9]{10,11}$/` | Số điện thoại không hợp lệ |
| 2 | idImages | `length > 0` | Vui lòng upload ảnh CMND/CCCD |
| 3 | acceptTerms | `=== true` | Vui lòng đồng ý với điều khoản |

---

## Component Map

```
src/
├── components/
│   ├── schedule/
│   │   └── room-schedule.tsx          ← Lịch phòng (entry point)
│   │
│   └── booking-calendar-form/
│       ├── booking-modal.tsx          ← Modal chính (orchestrator)
│       └── booking-modal/
│           ├── index.ts               ← Barrel exports
│           ├── constants.ts           ← BOOKING_MODES, HOURS, MINUTES
│           ├── validation.ts          ← validateStep1/2/3
│           ├── useBookingForm.ts      ← Custom hook (state + logic)
│           ├── StepIndicator.tsx      ← Progress bar (1→2→3)
│           ├── Step1.tsx              ← Chọn phòng & thời gian
│           ├── Step2.tsx              ← Thông tin khách hàng
│           ├── Step3.tsx              ← Thanh toán QR
│           ├── FoodModal.tsx          ← Chọn đồ ăn/uống
│           ├── PaymentModal.tsx       ← QR + info chuyển khoản
│           ├── ImageUpload.tsx        ← Upload ảnh CCCD
│           └── Snowfall.tsx           ← Hiệu ứng tuyết
│
├── types/
│   └── schedule.ts                    ← BookingFormData, Booking, Room, PriceConfig
│
└── utils/
    └── helpers.ts                     ← formatPrice, calculateDuration, timeToMinutes
```

---

## Các Điểm Cần Phát Triển (TODO)

### Ưu tiên cao
| # | Hạng mục | Mô tả |
|---|----------|-------|
| 1 | **Backend API** | POST /api/bookings, GET /api/bookings?date=, GET /api/rooms |
| 2 | **Xác nhận thanh toán** | Webhook từ ngân hàng hoặc admin duyệt → `pending` → `confirmed` |
| 3 | **Voucher logic** | Validate mã, tính % hoặc số tiền giảm, trừ vào totalPrice |
| 4 | **Multi-day booking** | Overlap check hiện chỉ so sánh cùng ngày, cần xử lý cross-day |

### Ưu tiên trung bình
| # | Hạng mục | Mô tả |
|---|----------|-------|
| 5 | **Admin quản lý booking** | Danh sách booking, đổi status, cancel, refund |
| 6 | **Thông báo** | SMS/Zalo xác nhận booking cho khách |
| 7 | **Giá động** | Phụ thu cuối tuần, lễ, peak hours |
| 8 | **Auth guard** | Bảo vệ admin routes, session management |

### Ưu tiên thấp
| # | Hạng mục | Mô tả |
|---|----------|-------|
| 9 | **Booking history** | Khách tra cứu lịch sử đặt phòng bằng SĐT |
| 10 | **Cancel/Modify** | Khách hủy/sửa booking (trước X giờ) |
| 11 | **Extra hour billing** | Tự tính phụ thu khi khách trả muộn |
| 12 | **Analytics** | Dashboard thống kê doanh thu, tỉ lệ lấp phòng |

---

## Lưu Ý Kỹ Thuật

1. **Giá VIP hourlyRate = 21,000đ** — có thể là lỗi nhập liệu (quá thấp so với standard 169,000đ). Cần xác nhận lại.

2. **Overlap check chỉ hoạt động cùng ngày** — booking qua đêm (overnight, daily) có thể bị overlap nhưng không bị phát hiện nếu booking mới ở ngày khác.

3. **FoodItems duplicate** — `FOOD_ITEMS` có 2 item "Pepsi" với giá khác nhau (11,000đ vs 115,000đ), có thể là lỗi data.

4. **totalPrice trong PaymentModal** — sử dụng `price + foodTotal` từ BookingModal nhưng không tính `comboTotal` vì combo được tính ở Step1/Step2 riêng. Cần đồng bộ cách tính.

5. **Không có persistence** — booking chỉ lưu trong local state (`localBookings`), refresh page sẽ mất hết. Cần backend hoặc ít nhất localStorage.

6. **Bank account hardcoded** — STK `0123456789` rõ ràng là placeholder, cần thay bằng STK thật trước khi deploy.
