# 🎯 MASTER SPEC: Triển khai Giao diện Nhà Cam (nhacam.pen)

**Phiên bản:** 1.1
**Trạng thái:** Sẵn sàng thực thi
**Đặc tính:** Giữ nguyên Tech Stack hiện tại | Không can thiệp logic hiện có | Chú thích Tiếng Việt bắt buộc.

---

## 🏗️ 1. NỀN TẢNG KỸ THUẬT (TECH STACK)
Coder Agent phải tuân thủ nghiêm ngặt:
- **Core:** React 19 + TypeScript.
- **Styling:** Tailwind CSS 4 (Sử dụng `@theme` trong CSS).
- **UI Libs:** Radix UI (Dialog, Select, Checkbox), Lucide Icons.
- **Animation:** Framer Motion 12+.
- **Routing:** React Router 7 (Cấu trúc lồng nhau).

---

## 🎨 2. QUY CHUẨN DESIGN TOKENS (TỪ NHACAM.PEN)

### 🔴 Color Palette
- `primary`: `#F87171` (Rose 400)
- `secondary`: `#334155` (Slate 700)
- `background`: `#FFFFFF`
- `surface`: `#F8FAFC` (Slate 50)
- `border`: `#E2E8F0` (Slate 200)

### 🖋️ Typography & Borders
- **Font:** `Inter`, sans-serif.
- **Radius:** 
  - Atom (Button/Input): `8px` (`rounded-lg`)
  - Molecule (Card/Modal): `12px` (`rounded-xl`)
  - Full: `999px` (`rounded-full`)

---

## 🛠️ 3. LỘ TRÌNH TRIỂN KHAI (TASK LIST)

### 🔹 TASK 1: Design System & Atom Components
**Mục tiêu:** Đồng bộ hóa các thành phần UI nhỏ nhất.
- **Skill yêu cầu:** `@[skills/clean-code]`, `@[skills/frontend-design]`
- **Công việc:**
  1. Cập nhật mã màu `#F87171` vào `src/index.css`.
  2. Refactor `src/components/ui/button.tsx` hỗ trợ variant `primary` (rose-400) và `secondary` (viền xám).
  3. Cập nhật `src/components/ui/input.tsx` với padding và border-color chuẩn thiết kế.
  4. Tạo component `Badge` tại `src/components/ui/badge.tsx` cho trạng thái Booking.

### 🔹 TASK 2: Layout Dashboard & Navigation
**Mục tiêu:** Xây dựng khung xương cho hệ thống quản lý.
- **Skill yêu cầu:** `@[skills/app-builder]`, `@[skills/frontend-design]`
- **Công việc:**
  1. Tạo `AdminLayout` trong `src/components/layouts/`.
  2. Triển khai Sidebar điều hướng (từ frame `4UJTQ`).
  3. Giữ nguyên cấu trúc `Header` và `Footer` hiện tại, chỉ cập nhật màu sắc hiển thị.

### 🔹 TASK 3: Nâng cấp Booking Modal & Mobile UI
**Mục tiêu:** Tối ưu trải nghiệm đặt phòng trên đa thiết bị.
- **Skill yêu cầu:** `@[skills/mobile-design]`, `@[skills/behavioral-modes]`
- **Công việc:**
  1. Cập nhật `BookingModal` theo thiết kế frame `QTtxj` (bản Mobile).
  2. Tăng cường Animation khi chuyển bước bằng `AnimatePresence` (Framer Motion).
  3. Đảm bảo Touch Area cho các nút tối thiểu 44px.

### 🔹 TASK 4: Quản lý Dữ liệu & Danh sách (Table)
**Mục tiêu:** Hiển thị thông tin booking chuyên nghiệp.
- **Skill yêu cầu:** `@[skills/api-patterns]`, `@[skills/frontend-design]`
- **Công việc:**
  1. Xây dựng component `BookingTable` sử dụng cấu trúc `frame-based table` (Row > Cell).
  2. Map dữ liệu từ `src/data/demo-schedule.ts` vào giao diện mới.

---

## 📝 4. PHONG CÁCH CODE (CONVENTIONS)
- **File naming:** `kebab-case` (vd: `booking-modal.tsx`).
- **Variable naming:** `camelCase` cho props, `PascalCase` cho Component.
- **Comments:** Giữ nguyên và bổ sung chú thích Tiếng Việt cho các block logic quan trọng.
- **Structure:** Không thay đổi vị trí các file logic như `useBookingForm.ts`.

---

## 🏁 5. KIỂM TRA & NGHIỆM THU
- **Skill yêu cầu:** `@[skills/lint-and-validate]`, `@[skills/webapp-testing]`
- **Tiêu chí:**
  - Không có lỗi ESLint/TypeScript.
  - Giao diện khớp >95% so với `nhacam.pen` (Kiểm tra bằng `get_screenshot`).
  - Lighthouse Performance Score > 90.

---
**Hành động tiếp theo:** Coder Agent hãy đọc file này và bắt đầu thực hiện **TASK 1**.
