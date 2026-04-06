# 📋 Đặc tả Kỹ thuật: Tính năng Quản lý Hình ảnh Phòng (Admin)

**Ngày tạo:** 17/03/2026
**Mục tiêu:** Xây dựng giao diện cho phép Admin upload và thay đổi tối đa 5 hình ảnh cho mỗi phòng. Dữ liệu này sẽ được phản ánh trực tiếp lên các `Room Card` ngoài trang chủ.
**Yêu cầu cốt lõi:**
- Giữ nguyên Tech Stack: React 19, TypeScript, Tailwind 4.
- Giữ nguyên phong cách đặt tên biến và cấu trúc codebase.
- Hỗ trợ tối đa 5 ảnh/phòng.
- Sẵn sàng cho việc mở rộng lưu trữ vào Database (API) sau này.
- Bổ sung chú thích Tiếng Việt cho các block logic mới.

---

## 🏗️ 1. CẬP NHẬT CẤU TRÚC DỮ LIỆU (`src/types/schedule.ts`)

Bổ sung trường `images` vào interface `Room`:
```typescript
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  images?: string[]; // Mảng chứa tối đa 5 URL hình ảnh
}
```

---

## 📝 2. DANH SÁCH TASK TRIỂN KHAI

### Task 1: Xây dựng Component `ImageUpload` Admin
- [ ] Tạo file `src/components/ui/image-upload.tsx`.
- [ ] Giao diện: Hiển thị 5 ô (slots) cho mỗi phòng.
- [ ] Chức năng:
  - Cho phép chọn ảnh từ máy tính (sử dụng `URL.createObjectURL` để hiển thị mockup).
  - Có nút "Xóa" ảnh hiện tại.
  - Kéo thả để thay đổi thứ tự ảnh (tùy chọn nâng cao).
- [ ] Style: Bo góc 8px, viền đứt nét (`border-dashed`) khi chưa có ảnh.

### Task 2: Trang Quản lý Phòng (`src/components/admin/room-management.tsx`)
- [ ] Tạo trang quản lý danh sách phòng trong dashboard admin.
- [ ] Hiển thị danh sách phòng hiện có (map từ `data/locations.ts` hoặc dữ liệu mẫu).
- [ ] Với mỗi phòng, hiển thị component `ImageUpload` để admin thay đổi ảnh.
- [ ] Thêm nút "Lưu thay đổi" (Hiện tại chỉ log ra console hoặc lưu vào `localStorage` để demo).

### Task 3: Đồng bộ dữ liệu với `RoomCard`
- [ ] Cập nhật logic lấy dữ liệu phòng tại `src/components/home/home.tsx` để truyền mảng `images` mới vào `RoomCard`.
- [ ] Đảm bảo nếu phòng chưa có ảnh, `RoomCard` sẽ sử dụng ảnh mặc định (fallback).

### Task 4: Tối ưu hóa & Clean Code
- [ ] Viết các chú thích Tiếng Việt giải thích luồng xử lý ảnh.
- [ ] Đảm bảo các hàm xử lý ảnh sẵn sàng để thay thế bằng lời gọi API (vd: `uploadImageToServer`).

---

## 🛠️ 3. KỸ THUẬT LƯU Ý
- **Skill:** `@[skills/clean-code]`, `@[skills/frontend-design]`.
- **Constraint:** Ảnh mockup nên được xử lý dưới dạng `base64` hoặc `blob URL` để hiển thị tức thì mà không cần server.
- **Validation:** Kiểm tra định dạng file (jpg, png, webp) và dung lượng tối đa (vd: 2MB/ảnh).

---

**Hành động:** Coder Agent hãy đọc file này và bắt đầu thực hiện **Task 1** (Tạo component ImageUpload).
