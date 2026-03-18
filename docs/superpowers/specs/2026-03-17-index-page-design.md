# 📋 Tài liệu Triển khai: Giao diện Trang chủ (Index) - Mẫu 1

**Ngày tạo:** 17/03/2026
**Mục tiêu:** Tái thiết kế trang chủ (`Home`) theo frame "Mẫu 1 — Trang chủ & Danh sách phòng" trong file `nhacam.pen`.
**Yêu cầu cốt lõi:**
- Giữ nguyên Tech Stack: React 19, TypeScript, Tailwind 4, Framer Motion.
- Giữ nguyên phong cách đặt tên biến (`camelCase` cho biến, `PascalCase` cho Component).
- Tuân thủ cấu trúc codebase hiện tại.
- Bổ sung chú thích Tiếng Việt cho các block logic mới.

---

## 🏗️ 1. THÔNG SỐ THIẾT KẾ (TỪ NHACAM.PEN - MẪU 1)

### 🎨 Màu sắc & Nền
- **Background chính:** `#F6F0E8` (màu be nhạt/pastel).
- **Card Background:** `#FFFFFF` (trắng thuần).
- **Text:** 
  - Tiêu đề chính: `#2B2B2B` (xám đậm gần đen).
  - Nội dung phụ: `#6A635B` (xám ấm).

### 📐 Bố cục (Layout)
- **Padding tổng thể:** 32px (`p-8`).
- **Khoảng cách giữa các phần (Gap):** 24px (`gap-6`).

---

## 📝 2. DANH SÁCH TASK TRIỂN KHAI

### Task 1: Cập nhật Hero Section (`src/components/hero/hero-banner.tsx`)
- [ ] Thay đổi cấu trúc 3 phase hiện tại sang cấu trúc tĩnh nhưng tập trung (focused) hơn.
- [ ] **Chiều cao:** Cố định 420px.
- [ ] **Bo góc:** 24px (`rounded-3xl`).
- [ ] **Nội dung:**
  - Tiêu đề: "Nhà Cam HOMESTAY", Font chữ: Sử dụng Serif (như 'Playfair Display' hoặc serif hệ thống) để giả lập font 'Molenilo', size 64px, bold 800.
  - Phụ đề: "Cozy • Chill • Ấm áp", Font: Inter, size 18px, semibold.
- [ ] **Background:** Sử dụng ảnh `imageHome1` (hoặc ảnh placeholder chất lượng cao) làm hình nền bao phủ (`object-cover`).
- [ ] **Animation:** Thêm hiệu ứng vào (fade-in) nhẹ nhàng cho text bằng `motion.div`.

### Task 2: Triển khai Rooms Header & Filters (`src/components/home/home.tsx` hoặc component mới)
- [ ] Thêm tiêu đề "Danh sách phòng" (size 28px, bold 800, color `#2B2B2B`).
- [ ] Thêm dải bộ lọc (Filters):
  - Kiểu dáng: Nút dạng "Pill" (bo tròn 999px).
  - Màu nền: Trắng (`bg-white`).
  - Hiệu ứng: Scale nhẹ khi hover.

### Task 3: Tái cấu trúc Danh sách phòng (`src/components/gallery-grid.tsx` hoặc tạo mới `RoomGrid.tsx`)
- [ ] Thay thế `GalleryGrid` hiện tại bằng grid hiển thị thẻ phòng (`Room Card`).
- [ ] **Cấu trúc Thẻ phòng (Room Card):**
  - Bo góc: 20px (`rounded-[20px]`).
  - Nền: Trắng, Shadow nhẹ.
  - Padding: 14px.
  - Phần trên: Ảnh collage hoặc ảnh chính (bo góc 16px).
  - Tiêu đề: "Phòng Cam 0x" (18px, bold 800).
  - Thông tin giá: "3 tiếng/199K • Qua đêm/299K" (14px, bold 600, color `#6A635B`).
- [ ] **Layout:** Grid 3 cột trên Desktop, 1 cột trên Mobile.

### Task 4: Tinh chỉnh Style tổng thể (`src/index.css` & `src/App.tsx`)
- [ ] Cập nhật màu nền body thành `#F6F0E8` để đồng nhất với thiết kế.
- [ ] Đảm bảo sự mượt mà (smooth scrolling) khi chuyển giữa các phần.

---

## 🛠️ 3. KỸ THUẬT LƯU Ý
- **Skill:** `@[skills/frontend-design]`, `@[skills/clean-code]`.
- **Constraint:** Tuyệt đối không xóa bỏ logic của `framer-motion` nếu nó đang phục vụ cho trải nghiệm mượt mà, chỉ cập nhật lại `variants` và `initial/animate` states cho phù hợp với UI mới.
- **Naming:** Tạo các sub-components trong cùng file hoặc thư mục tương ứng nếu component quá lớn.

---

**Hành động:** Coder Agent hãy đọc file này và bắt đầu thực hiện **Task 1** trước.
