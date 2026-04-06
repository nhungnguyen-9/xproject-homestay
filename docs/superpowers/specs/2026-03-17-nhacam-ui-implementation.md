# 📋 Tài liệu Triển khai Giao diện: Dự án Nhà Cam

**Ngày tạo:** 17/03/2026
**Mục tiêu:** Chuyển đổi thiết kế từ `nhacam.pen` thành giao diện React/Tailwind hoàn chỉnh, giữ vững kiến trúc và phong cách hiện tại của codebase.

---

## 🏗️ 1. Thông số Kỹ thuật & Design Tokens (Từ nhacam.pen)

### 🎨 Bảng màu (Color System)
- **Primary:** `#F87171` (Tương đương `rose-400` trong Tailwind).
- **Surface/Background:** `#FFFFFF` (Nền chính), `#F8FAFC` (Nền phụ/Sidebar).
- **Text:** 
  - Tiêu đề (Headings): `#0F172A` (slate-900)
  - Nội dung (Body): `#334155` (slate-700)
  - Mô tả phụ (Muted): `#64748B` (slate-500)
- **Status/Badge:**
  - Active: Text `#166534`, Bg `#DCFCE7` (emerald).
  - Pending: Text `#92400E`, Bg `#FEF3C7` (amber).

### 📐 Quy chuẩn UI
- **Typography:** Font **Inter**, Semibold (600) cho tiêu đề/nút, Regular (400) cho nội dung.
- **Border Radius:** `rounded-lg` (8px) cho Button/Input, `rounded-xl` (12px) cho Card.
- **Components:** Sử dụng Radix UI cho các thành phần tương tác (Dialog, Select...).

---

## 🛠️ 2. Hướng dẫn Kỹ thuật cho Coder Agent

### 📌 Nguyên tắc Cốt lõi
- **Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Framer Motion.
- **Naming Convention:** Giữ nguyên kiểu đặt tên `kebab-case` cho file, `PascalCase` cho Component, và `camelCase` cho biến/props.
- **Cấu trúc Thư mục:**
  - UI Components: `src/components/ui/`
  - Logic/Hooks: `src/components/booking-calendar-form/booking-modal/`
  - Types: `src/types/schedule.ts`

---

## 📝 3. Danh sách Task triển khai (Task Roadmap)

### Task 1: Đồng nhất hóa Design System (Sử dụng `@[skills/clean-code]`)
- [ ] Cập nhật biến màu chủ đạo trong `index.css` (Tailwind 4) thành `#F87171`.
- [ ] Refactor các component trong `src/components/ui/` (button, input, badge) để khớp với thông số padding/radius trong thiết kế.
- [ ] Đảm bảo toàn bộ ứng dụng sử dụng font **Inter**.

### Task 2: Hoàn thiện Dashboard Quản lý (Sử dụng `@[skills/frontend-design]`)
- [ ] Triển khai Layout Dashboard với Sidebar (từ frame `4UJTQ` trong thiết kế).
- [ ] Xây dựng bảng danh sách Booking (Table) theo cấu trúc: `Table -> Row -> Cell -> Content`.
- [ ] Tích hợp nhãn trạng thái (Badge) tương ứng với dữ liệu `BookingStatus`.

### Task 3: Nâng cấp luồng Booking Mobile (Sử dụng `@[skills/mobile-design]`)
- [ ] Tối ưu hóa giao diện `BookingModal` cho màn hình dọc (dựa trên frame `QTtxj`).
- [ ] Cập nhật `StepIndicator` để hiển thị mượt mà trên thiết bị di động.
- [ ] Đảm bảo các nút điều khiển (Tiếp tục/Quay lại) luôn nằm ở vị trí dễ chạm (Touch-friendly).

### Task 4: Kết nối Dữ liệu & Animation (Sử dụng `@[skills/behavioral-modes]`)
- [ ] Tích hợp `Framer Motion` vào các bước chuyển đổi (Step 1 -> Step 3) trong Modal.
- [ ] Đảm bảo các `EmptySlotClick` trên lịch mở đúng Modal với dữ liệu phòng tương ứng.
- [ ] Kiểm tra tính đúng đắn của logic tính giá trong `useBookingForm.ts` sau khi cập nhật UI.

---

## 🧪 4. Kiểm tra & Nghiệm thu (Sử dụng `@[skills/lint-and-validate]`)

- [ ] Chạy `python .agent/scripts/checklist.py .` để kiểm tra toàn bộ lỗi logic/lint.
- [ ] Chụp ảnh màn hình (screenshot) các màn hình chính và so sánh với `nhacam.pen`.
- [ ] Kiểm tra tính phản hồi (Responsive) trên 3 thiết bị: Desktop (1440px), Tablet (768px), Mobile (390px).

---

**⚠️ Ghi chú quan trọng:** Coder Agent tuyệt đối không được xóa bỏ các chú thích tiếng Việt đã được thêm vào trước đó trong các file `.tsx` và `.ts`.
