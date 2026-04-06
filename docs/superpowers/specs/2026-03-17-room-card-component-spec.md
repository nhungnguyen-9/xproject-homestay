# 🏗️ Đặc tả Kỹ thuật: Room Card Component (Mẫu 1)

**Ngày tạo:** 17/03/2026
**Nguồn thiết kế:** `nhacam.pen` (ID: `Yf17n`)
**Vị trí triển khai dự kiến:** `src/components/rooms/room-card.tsx`

---

## 📐 1. THÔNG SỐ CONTAINER (VỎ BỌC)
- **Component ID:** `Yf17n`
- **Loại:** `frame`
- **Layout:** `vertical` (Dọc)
- **Chiều cao:** 340px
- **Chiều rộng:** `fill_container` (Thích ứng theo Grid)
- **Padding:** 14px
- **Gap (Khoảng cách giữa ảnh và text):** 12px
- **Bo góc (Corner Radius):** 20px
- **Nền (Fill):** `#FFFFFF` (Trắng)

---

## 🖼️ 2. CẤU TRÚC PHOTO COLLAGE (KHUNG ẢNH GHÉP)
- **ID:** `T9aIX`
- **Chiều cao:** 210px
- **Bo góc khung:** 16px
- **Padding:** 8px
- **Gap:** 8px
- **Bố cục:** Ngang (`horizontal`)

### 📸 Chi tiết các ô ảnh:

#### A. Khung Trái (Lớn) - `9KqpJ`
- **Chiều rộng:** 220px
- **Bo góc:** 14px
- **Ảnh:** `./images/generated-1773763923712.png`

#### B. Khung Giữa (Playable/Video) - `1yCVr`
- **Chiều rộng:** 108px
- **Bo góc:** 14px
- **Ảnh:** `./images/generated-1773764116868.png`
- **Overlay:**
  - Hình tròn nền (`lZNqg`): `#00000055`, Kích thước 44x44px.
  - Icon Play (`34xiC`): `lucide/play`, Màu `#FFFFFF`, Kích thước 20x20px.
  - Căn giữa cả 2 phần tử này trong khung.

#### C. Khung Phải (Cột ảnh nhỏ) - `U5YKS`
- **Chiều rộng:** 60px
- **Bố cục:** Dọc (`vertical`)
- **Gap:** 8px
- **Danh sách ảnh (Mỗi ảnh cao 60px, bo góc 14px):**
  - Ảnh R1 (`rLmEE`): `./images/generated-1773764146153.png`
  - Ảnh R2 (`CfH3W`): `./images/generated-1773764166795.png`
  - Ảnh R3 (`sNPry`): `./images/generated-1773764183697.png`

---

## 📝 3. THÔNG TIN VĂN BẢN (TYPOGRAPHY)

### Tên Phòng (`CtLuQ`)
- **Nội dung:** "Phòng Cam 01"
- **Font:** Inter
- **Kích thước:** 18px
- **Trọng số:** 800 (Extra Bold)
- **Màu sắc:** `#2B2B2B`

### Giá Phòng (`Ji6jm`)
- **Nội dung:** "3 tiếng/199K • Qua đêm/299K"
- **Font:** Inter
- **Kích thước:** 14px
- **Trọng số:** 600 (Semi Bold)
- **Màu sắc:** `#6A635B`

---

## 🛠️ 4. HƯỚNG DẪN TRIỂN KHAI (DÀNH CHO CODER AGENT)
1. **Flexbox Ratios:** Sử dụng Tailwind để chia tỉ lệ chiều rộng cho collage ảnh (vd: `flex-[220]`, `flex-[108]`, `flex-[60]`).
2. **Aspect Ratio:** Đảm bảo ảnh luôn giữ tỉ lệ và không bị méo (`object-cover`).
3. **Hover Effect:** Thêm hiệu ứng `hover:scale-[1.02]` và `transition` cho toàn bộ thẻ để tăng tính tương tác.
4. **Logic Chú thích:** Giữ nguyên chú thích Tiếng Việt khi code component này.
