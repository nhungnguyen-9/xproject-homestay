# Design Prompt — Booking Flow Screens

> Prompt cho designer agent hiện thực hóa bản thiết kế đặt phòng trong `nhacam.pen`.
> Dựa trên: `docs/BOOKING-FLOW.md` + codebase hiện tại + design system có sẵn.

---

## MỤC TIÊU

Thiết kế **7 screens** hoàn chỉnh cho luồng đặt phòng homestay "Chốn Cinehome", bao gồm:

1. **Booking Timeline** (đã có `tUSlg` — cần refine)
2. **Booking Modal — Step 1**: Chọn phòng & thời gian & dịch vụ
3. **Booking Modal — Step 2**: Thông tin khách hàng
4. **Booking Modal — Step 3**: Thanh toán QR
5. **Food Modal**: Chọn đồ ăn/uống
6. **Payment Success Modal**: Xác nhận đặt phòng thành công
7. **Booking Flow Overview**: Sơ đồ tổng quan 3 bước (infographic)

---

## DESIGN SYSTEM CÓ SẴN

### File & Components

- **File**: `/home/tav/Documents/xproject-homestay/frontend/nhacam.pen`
- **Design Library frame**: `kIG75`

### Reusable Components (dùng `ref` để tái sử dụng)

| ID | Name | Mô tả |
|----|------|--------|
| `HMk3M` | Button/Primary | Nền rose `$Primary` (#f87171f2), text trắng, border-radius 8, padding 10×16 |
| `daYkS` | Button/Secondary | Nền trắng, viền #CBD5E1, text #334155, border-radius 8, padding 10×16 |
| `yiCaw` | Input/Field | Nền trắng, viền #CBD5E1, placeholder #94A3B8, border-radius 8, width 300, padding 10×12 |
| `4k41w` | Card/Default | Nền trắng, viền #E2E8F0, border-radius 12, padding 16, gap 8 |
| `wMI5t` | Badge/Default | Nền #DCFCE7, text #166534, border-radius 999, padding 4×10 |

### Color Palette

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `$Primary` | `#f87171f2` | CTA buttons, active states, step indicators, accent |
| Primary Hover | `#f55f5f` | Hover state cho primary buttons |
| Secondary | `#334155` | Text chính, headings |
| Surface / App BG | `#F8FAFC` | Nền trang, nền modal overlay |
| Card BG | `#FFFFFF` | Nền card, nền modal content |
| Border | `#E2E8F0` | Viền card, divider |
| Light Border | `#F3F4F6` | Viền nhẹ, section divider |
| Muted Text | `#64748B` | Text phụ, label, description |
| Placeholder | `#94A3B8` | Input placeholder text |
| Success Green | `#03c068` | Current time indicator, success states |
| Warning Amber | `#FEF3C7` nền / `#F59E0B` text | Cảnh báo thời gian, tips |
| Error Red | `#FEE2E2` nền / `#DC2626` text | Validation errors |
| Booking Block Gradient | `linear-gradient(90deg, #FF7272, #FFC0A9)` | Booking blocks trên timeline |
| Button Gradient | `linear-gradient(135deg, #FF5A5F, #FFB199)` | Filter buttons active |
| Room Label Gradient | `linear-gradient(135deg, #FFB9A7, #FFDFD3)` | Room name labels |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Modal Title | Inter | 24px | 700 (Bold) |
| Step Title | Inter | 18px | 700 (Bold) |
| Section Heading | Inter | 16px | 600 (Semibold) |
| Body Text | Inter | 14px | 400 (Normal) |
| Label | Inter | 13-14px | 500-600 (Medium-Semibold) |
| Small/Caption | Inter | 12px | 400-600 |
| Price Highlight | Inter | 20-24px | 700 (Bold) |

### Spacing & Radius

| Token | Value |
|-------|-------|
| Modal padding | 20-24px |
| Card padding | 16px |
| Section gap | 16-20px |
| Element gap | 8-12px |
| Border radius (modal) | 16px |
| Border radius (card) | 12px |
| Border radius (button) | 8px |
| Border radius (badge) | 999px |
| Border radius (input) | 8px |

---

## SCREEN 1: Booking Timeline (refine `tUSlg`)

> Frame đã có: `tUSlg` (1440×900). Cần thêm interaction states.

### Bổ sung cần thiết

1. **Hover state cho ô trống**: Highlight nhẹ `#FFF1F2` khi hover vào vùng trống trên timeline
2. **Tooltip khi hover booking block**: Hiện tên khách + thời gian
3. **Legend rõ ràng hơn**: 3 items — Đã đặt (rose gradient), Trống (trắng viền), Thời gian hiện tại (xanh `#03c068`)
4. **Empty state**: Khi không có booking nào trong ngày → hiện text "Chưa có lịch đặt phòng nào"

---

## SCREEN 2: Booking Modal — Step 1 (refine `iHCJ1`)

> Frame đã có: `iHCJ1` (1210×480). Cần mở rộng thêm phần Food & Drinks.

### Layout tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header]  "Đặt phòng"          ①─────②─────③  StepIndicator   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bước 1: Chọn phòng và thời gian                               │
│  Vui lòng chọn phòng và thời gian đặt phòng                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Hình thức:  [Theo giờ]  [Theo ngày]  [Qua đêm]        │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Hạng phòng │ Phòng │ Thời gian nhận      │ Thời gian trả │ │
│  │ Tiêu chuẩn │ [P01▾]│ [date] [14h] [00]   │ [date] [17h]  │ │
│  │            │       │                      │ Dự kiến: 3h   │ │
│  │            │       │                      │ 507,000 VNĐ   │ │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Đồ ăn & Uống                          [🛒 Thêm món]    │    │
│  │ Phòng không có sẵn đồ ăn & nước uống.                  │    │
│  │                                                         │    │
│  │ Combo đặc biệt:                                        │    │
│  │ ○ 1 Mỳ Ly + 1 Xúc Sích + 1 Suối         25,000 VNĐ   │    │
│  │ ● 2 Áo Giáp                               20,000 VNĐ   │    │
│  │ ○ 1 Snack + 1 Suối                        15,000 VNĐ   │    │
│  │                                                         │    │
│  │ ── Món đã chọn ─────────────────────────                │    │
│  │ Pepsi ×2                                   22,000 VND   │    │
│  │                                      Tổng: 42,000 VND  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                              [Huỷ]    [Tiếp tục →]             │
└─────────────────────────────────────────────────────────────────┘
```

### Chi tiết thiết kế

**Header (border-bottom #F3F4F6)**:
- Title "Đặt phòng": Inter 24px bold #1F2937
- StepIndicator: 3 circles (28px), active = `$Primary` fill + white text, inactive = #E5E7EB fill + #9CA3AF text
- Connector lines giữa circles: 24px width, 2px height
- Step labels dưới circles: Inter 12px, active = `$Primary`, inactive = #9CA3AF

**Mode selector buttons**:
- Active: `$Primary` fill, white text, rounded 8
- Inactive: white fill, #6B7280 text, border #E5E7EB, rounded 8
- Size: padding 8×16, font 13px semibold

**Room & Time table**:
- Grid 15 columns (desktop) hoặc stacked (mobile)
- Date input: border #CBD5E1, rounded 8
- Time selects: width 64px (hour) + 56px (minute)
- Price text: Inter 16px bold `$Primary`
- Duration text: Inter 13px semibold #6B7280

**Food & Drinks section**:
- Card nền trắng, viền #E2E8F0, rounded 12
- "Thêm món" button: nền #F97316 (orange-500), text trắng, icon ShoppingCart
- Combo items: toggle list, selected = border `$Primary` + bg #FFF1F2, unselected = border #F3F4F6
- Checkbox indicator: circle 20px, selected = `$Primary` fill + white check icon

**Footer (border-top #F3F4F6)**:
- "Huỷ": ghost button, text #6B7280
- "Tiếp tục →": ref `HMk3M` (Button/Primary), min-width 120px

---

## SCREEN 3: Booking Modal — Step 2 (MỚI)

> Tạo frame mới: 1210×720

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header]  "Đặt phòng"          ①─────②─────③                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bước 2: Thông tin khách hàng                                   │
│  Vui lòng nhập thông tin khách hàng và xác nhận đặt phòng       │
│                                                                 │
│  ┌──────────────────────────┬──────────────────────────┐        │
│  │ Họ và tên *              │ Số điện thoại *           │        │
│  │ [________________]       │ [________________]        │        │
│  └──────────────────────────┴──────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📷 Ảnh chứng minh *                                     │    │
│  │ Upload ảnh CMND/CCCD hoặc VNeID, Passport (tối đa 3)   │    │
│  │ ┌──────┐  ┌──────┐  ┌──────┐                           │    │
│  │ │  +   │  │ img  │  │ img  │                            │    │
│  │ │Upload│  │      │  │      │                            │    │
│  │ └──────┘  └──────┘  └──────┘                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────── Thông tin đặt phòng ─────────────────┐    │
│  │ ┌──────┐┌────────┐┌────────┐┌──────────┐┌────────────┐ │    │
│  │ │Phòng ││Hình thức││Thời gian││Hạng phòng ││Người lớn │ │    │
│  │ │P101  ││Giờ     ││3 giờ   ││VIP       ││2 người    │ │    │
│  │ └──────┘└────────┘└────────┘└──────────┘└────────────┘ │    │
│  │ ┌────────────────────┐┌────────────────────┐            │    │
│  │ │Nhận phòng          ││Trả phòng           │            │    │
│  │ │20/03/2026 - 14:00  ││20/03/2026 - 17:00  │            │    │
│  │ └────────────────────┘└────────────────────┘            │    │
│  │ ─────────────────────────────────────────────           │    │
│  │ Giá phòng                          507,000 VNĐ         │    │
│  │ Đồ ăn & uống                       42,000 VNĐ          │    │
│  │ ═══════════════════════════════════════════════          │    │
│  │ TỔNG THANH TOÁN                    549,000 VNĐ          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Ghi chú:  [Nhập ghi chú...]                            │    │
│  │ 🎫 Voucher: [Nhập mã voucher...]                        │    │
│  │ ☑ Chấp nhận điều khoản đặt phòng & chính sách... *     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     [← Quay lại]    [Tiếp tục →]               │
└─────────────────────────────────────────────────────────────────┘
```

### Chi tiết thiết kế

**Customer info fields** (2 columns, md:grid-cols-2):
- Card nền trắng, viền #E2E8F0, rounded 12, padding 16
- Label: Inter 14px medium #374151, required `*` = #DC2626
- Input: ref `yiCaw`, width `fill_container`
- Error state: input border #FCA5A5, error text Inter 12px #DC2626

**ID Image Upload section**:
- Card nền trắng, viền #E2E8F0, rounded 12, padding 16
- Upload box: 80×80px, dashed border #CBD5E1, rounded 8, icon "+" center
- Image preview: 80×80px, rounded 8, object-fit cover
- Max 3 slots hiển thị

**Booking Summary card**:
- Nền #F3F4F6 (gray-100), rounded 16, padding 16
- Info chips: nền trắng, rounded 12, padding 10
  - Label: Inter 12px #9CA3AF
  - Value: Inter 14px semibold #1F2937
- Price breakdown:
  - Line items: Inter 14px, label #9CA3AF, value #374151
  - Total line: border-top, Inter 20px bold `$Primary` (#f87171)
- Payment note: Inter 14px #6B7280
  - "Hình thức: Chuyển khoản"
  - "Thanh toán trong vòng 5 phút"

**Note & Voucher section**:
- Ghi chú: Textarea ref style từ `yiCaw` nhưng taller (height 80)
- Voucher: ref `yiCaw` + icon 🎫
- Checkbox điều khoản:
  - Checkbox 16×16px, checked = `$Primary` fill + white check
  - Link "Chấp nhận điều khoản": text `$Primary`, underline
  - Required `*` = #DC2626

**Footer**:
- "← Quay lại": ref `daYkS` (Button/Secondary) + ChevronLeft icon
- "Tiếp tục →": ref `HMk3M` (Button/Primary) + ChevronRight icon

---

## SCREEN 4: Booking Modal — Step 3 (MỚI)

> Tạo frame mới: 1210×600

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header]  "Đặt phòng"          ①─────②─────③                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Thanh Toán                           Hình thức: Chuyển khoản   │
│                                                                 │
│  ┌──────────────────────────────────┬──────────────────────┐    │
│  │ Nội Dung Chuyển Khoản            │                      │    │
│  │                                  │   ┌──────────────┐   │    │
│  │ B1: Mở app ngân hàng/ví, chọn   │   │              │   │    │
│  │     Quét mã QR hoặc CK thủ công │   │   QR CODE    │   │    │
│  │                                  │   │   (VietQR)   │   │    │
│  │ B2: Ghi nội dung CK:            │   │              │   │    │
│  │     DP P101 20/03/2026           │   └──────────────┘   │    │
│  │                                  │   [Tải ảnh QR]       │    │
│  │ ┌──────────────────────────────┐ │   Quét để thanh toán │    │
│  │ │ Số tiền cần thanh toán:      │ │                      │    │
│  │ │ 549,000 VNĐ                  │ │                      │    │
│  │ └──────────────────────────────┘ │                      │    │
│  └──────────────────────────────────┴──────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⏱️ Vui lòng thanh toán trong vòng 5 phút để giữ chỗ     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     [← Quay lại]    [✓ Đặt phòng]              │
└─────────────────────────────────────────────────────────────────┘
```

### Chi tiết thiết kế

**Title row**: flex horizontal, justify space-between
- "Thanh Toán": Inter 24px bold #1F2937
- "Hình thức: Chuyển khoản": Inter 14px #6B7280

**Content grid**: 3 columns (md:grid-cols-3)
- Left (col-span-2): Card nền trắng, rounded 12, padding 16, shadow-sm
  - Instructions: Inter 14px #374151
  - Transfer content highlight: Inter 16px bold #1F2937
  - Price box: nền #FFFBEB (amber-50), rounded 12, padding 12
    - Label: Inter 14px #6B7280
    - Amount: Inter 24px bold `$Primary`
- Right (col-span-1): Card nền trắng, rounded 12, padding 16, shadow-sm, centered
  - QR image: 192×192px, nền trắng, inner shadow, rounded 8
  - Download button: nền #2563EB (blue-600), text trắng, rounded 8, padding 8×16
  - Caption: Inter 12px #9CA3AF

**Warning banner**:
- Nền #FFFBEB (amber-50), rounded 12, padding 12
- Icon ⏱️ + text Inter 14px #92400E
- "5 phút" = bold

**Footer**:
- "← Quay lại": ref `daYkS`
- "✓ Đặt phòng": ref `HMk3M`, icon Check trước text

---

## SCREEN 5: Food Modal (MỚI)

> Tạo frame mới: 980×640

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header rose] Đồ ăn & uống                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  [Sản phẩm]│  │  [Sản phẩm]│  │  [Sản phẩm]│                │
│  │            │  │            │  │            │                │
│  │  [Image]   │  │  [Image]   │  │  [Image]   │                │
│  │            │  │            │  │            │                │
│  │ Pepsi      │  │ Mỳ Ly     │  │ Sting      │                │
│  │ 11,000đ    │  │ 20,000đ   │  │ 15,000đ   │                │
│  │ [−] 2 [+]  │  │ [−] 0 [+] │  │ [−] 1 [+] │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ ... row 2  │  │            │  │            │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ 3 sản phẩm              Tổng: 57,000đ   [Hủy] [Xác nhận (3)] │
└─────────────────────────────────────────────────────────────────┘
```

### Chi tiết thiết kế

**Header**:
- Nền `$Primary` (#f87171f2), rounded-top 12
- Text "Đồ ăn & uống": Inter 18px semibold white
- Padding 12×16

**Product grid**: 3 columns, gap 16, padding 12
- Product card: nền trắng, border #F3F4F6 (selected: border `$Primary`), rounded 12, padding 12
  - Tag "Sản phẩm": badge nền #DBEAFE text #2563EB, 12px, absolute top-right
  - Image area: 192px height, nền #F9FAFB, rounded 8, object-fit contain
  - Name: Inter 14px medium #1F2937
  - Price: Inter 14px semibold `$Primary`
  - Quantity controls: flex horizontal, centered
    - "−" button: 32×32px, nền #E5E7EB, rounded 8, disabled opacity 0.5
    - Count: Inter 14px semibold, center, flex-1
    - "+" button: 32×32px, nền `$Primary`, text white, rounded 8

**Footer** (sticky bottom, border-top #E5E7EB):
- Left: "{n} sản phẩm" Inter 14px #374151
- Right group:
  - Total: "Tổng cộng" Inter 12px #9CA3AF + amount Inter 18px bold `$Primary`
  - "Hủy": ref `daYkS`
  - "Xác nhận ({n})": ref `HMk3M`

---

## SCREEN 6: Payment Success Modal (MỚI)

> Tạo frame mới: 420×560

### Layout

```
┌───────────────────────────────────┐
│                                   │
│         ┌──────────────┐          │
│         │  ✓ (green)   │          │
│         └──────────────┘          │
│    Đặt phòng thành công!          │
│    Vui lòng thanh toán để         │
│    hoàn tất đặt phòng             │
│                                   │
│         ┌──────────────┐          │
│         │              │          │
│         │   QR CODE    │          │
│         │   (VietQR)   │          │
│         │              │          │
│         └──────────────┘          │
│                                   │
│  ┌──────────────────────────────┐ │
│  │ Ngân hàng      MB Bank      │ │
│  │ Số tài khoản   0123456789   │ │
│  │ Chủ tài khoản  CHON CINEHOME│ │
│  │ Số tiền        549,000 VNĐ  │ │
│  │ Nội dung CK    DP P101 ...  │ │
│  └──────────────────────────────┘ │
│                                   │
│  ┌──────────┐  ┌────────────────┐ │
│  │   Đóng   │  │ Đã chuyển khoản│ │
│  └──────────┘  └────────────────┘ │
└───────────────────────────────────┘
```

### Chi tiết thiết kế

**Success icon**:
- Circle 48×48px, nền #DCFCE7 (green-100)
- Icon CreditCard 24×24px, fill #16A34A (green-600)

**Title section** (centered):
- "Đặt phòng thành công!": Inter 18px bold #1F2937
- Sub: Inter 14px #6B7280

**QR Code**:
- 192×192px, nền trắng, viền #E5E7EB, rounded 12, shadow-inner

**Transfer info table**:
- Nền #F9FAFB, rounded 12, padding 16
- Rows: flex justify-between, gap 8
  - Label: Inter 14px #9CA3AF
  - Value: Inter 14px medium #1F2937
  - Amount value: Inter 14px bold #16A34A (green-600)
  - Transfer content value: Inter 14px medium #16A34A

**Action buttons**:
- "Đóng": ref `daYkS`, flex-1
- "Đã chuyển khoản": nền #16A34A, hover #15803D, text white, rounded 8, flex-1

---

## SCREEN 7: Booking Flow Overview (MỚI — Infographic)

> Tạo frame mới: 1440×500. Dùng cho trang "Hướng dẫn" hoặc marketing.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│              Quy trình đặt phòng tại Chốn Cinehome                     │
│              Chỉ 3 bước đơn giản để có phòng nghỉ ưng ý                │
│                                                                         │
│   ┌────────────┐       ┌────────────┐       ┌────────────┐             │
│   │     ①      │ ────▶ │     ②      │ ────▶ │     ③      │             │
│   │  🏠 icon   │       │  📝 icon   │       │  💳 icon   │             │
│   │            │       │            │       │            │             │
│   │ Chọn phòng │       │ Điền thông │       │ Thanh toán │             │
│   │ & dịch vụ  │       │ tin khách  │       │ QR Code    │             │
│   │            │       │            │       │            │             │
│   │ • Hình thức│       │ • Họ tên   │       │ • Quét QR  │             │
│   │ • Phòng    │       │ • SĐT      │       │ • CK ngân  │             │
│   │ • Thời gian│       │ • CCCD     │       │   hàng     │             │
│   │ • Đồ ăn   │       │ • Điều khoản│       │ • 5 phút   │             │
│   └────────────┘       └────────────┘       └────────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết thiết kế

**Nền**: gradient nhẹ `linear-gradient(135deg, #FFF1F2, #FFFBEB, #F0FDF4)` (rose→amber→green)

**Title section** (centered):
- Main: Inter 28px black #1F2937
- Sub: Inter 16px #6B7280

**Step cards**: 3 cards, flex horizontal, gap 32, connected by arrow lines
- Card: nền trắng, rounded 16, padding 24, shadow `0 4px 24px rgba(0,0,0,0.06)`, width 340
- Step number circle: 48×48px, nền `$Primary`, text white 20px bold
- Icon area: 48×48px, emoji hoặc lucide icon
- Title: Inter 18px bold #1F2937
- Description bullets: Inter 14px #6B7280, gap 4
- Arrow connector: line 48px, stroke #E2E8F0, 2px, with arrowhead

**Step card accent colors** (subtle top border 3px):
- Step 1: `$Primary` (#f87171)
- Step 2: #F59E0B (amber-500)
- Step 3: #16A34A (green-600)

---

## VALIDATION & ERROR STATES

Thiết kế thêm các error state variants (có thể đặt bên cạnh screen chính):

### Input Error State
- Border: #FCA5A5 (red-300)
- Focus ring: #DC2626
- Error message bên dưới: Inter 12px #DC2626
- Ví dụ: "Số điện thoại không hợp lệ"

### Time Conflict Error
- Banner: nền #FEE2E2, rounded 12, padding 12
- Icon ⚠️ + text Inter 14px #991B1B
- "Khung giờ này đã có người đặt"

### Duration Error
- Banner: nền #FEE2E2, rounded 12, padding 12
- "Thời gian đặt phòng tối thiểu 30 phút"

### Terms Required Error
- Checkbox label turns #DC2626
- Error text dưới: Inter 12px #DC2626 "Vui lòng đồng ý với điều khoản"

---

## QUY TẮC CHUNG CHO DESIGNER AGENT

1. **Luôn dùng component có sẵn** — ref `HMk3M`, `daYkS`, `yiCaw`, `4k41w`, `wMI5t` thay vì tạo mới
2. **Dùng flexbox layout** — vertical cho container chính, horizontal cho rows. Không dùng absolute trừ khi bắt buộc
3. **Dùng `fill_container`** cho width của children trong flex layout, không hardcode pixel
4. **Dùng `$Primary`** variable cho tất cả accent colors, không hardcode `#f87171f2`
5. **Font luôn là Inter** — tất cả weights từ 400-900
6. **Text phải có `fill`** — text không có fill sẽ invisible
7. **Mỗi screen là 1 top-level frame** — đặt cạnh nhau, gap ~100px
8. **Đặt `placeholder: true`** khi bắt đầu tạo frame, bỏ khi hoàn thành
9. **Kiểm tra bằng `get_screenshot`** sau mỗi screen
10. **Responsive**: Thiết kế desktop-first (1210px-1440px width), mobile adaptation sẽ làm sau
11. **Tất cả text tiếng Việt** — dùng đúng nội dung trong layout ở trên
12. **Shadow cho modal**: `{ type: "shadow", shadowType: "outer", offset: { x: 0, y: 25 }, blur: 44, spread: -12, color: "#00000040" }`

---

## THỨ TỰ THỰC HIỆN

```
1. Đọc design system     → batch_get components + get_variables
2. Tìm vùng trống        → find_empty_space_on_canvas
3. Tạo 6 placeholder     → batch_design (6 frames, placeholder: true)
4. Screen 2 (Step 1)     → refine iHCJ1 hoặc tạo mới
5. Screen 3 (Step 2)     → tạo mới, nhiều form elements nhất
6. Screen 4 (Step 3)     → tạo mới, QR + payment info
7. Screen 5 (Food Modal) → tạo mới, product grid
8. Screen 6 (Success)    → tạo mới, nhỏ nhất
9. Screen 7 (Overview)   → tạo mới, infographic
10. Verify tất cả        → get_screenshot từng screen
11. Bỏ placeholder flags → batch_design update placeholder: false
```
