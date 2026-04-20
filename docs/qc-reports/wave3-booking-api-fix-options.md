# Wave 3 — Fix Booking API 401 Unauthorized

## Root Cause

**File:** `backend/src/routes/bookings.ts:12`

Middleware `authMiddleware + requirePermission('bookings')` được áp dụng blanket lên **TẤT CẢ** booking routes (kể cả GET). Trang đặt phòng khách hàng (`/dat-phong`) là public — không có token → backend trả **401 Unauthorized** → toast "Không tải được lịch đặt phòng".

**Regression từ commit** `889ec7f "feat: migrate FE services to API"` — khi migrate sang real API, page public bị vạ lây auth policy vốn dành cho admin.

**Xác minh:**
```bash
$ curl -s http://localhost:3001/api/v1/bookings?date=2026-04-20 -i
HTTP/1.1 401 Unauthorized
{"error":"Unauthorized: Missing token"}
```

**Đã loại trừ:** Server down (running :3001), CORS (configured), Migration 0005 (chỉ additive columns).

---

## Option A — Public GET + Strip PII (Khuyến nghị)

### Cách hoạt động
- Xóa blanket auth middleware tại `bookings.ts:12`
- `GET /bookings?date=...` mở public — ai cũng gọi được (không cần login)
- Response cho **anonymous** bị cắt bớt thông tin nhạy cảm, chỉ trả **8 field** đủ để hiển thị lịch:

| Field | Mục đích |
|---|---|
| `id` | Định danh booking |
| `roomId` | Xác định phòng nào |
| `date` | Ngày booking |
| `startTime` | Giờ bắt đầu |
| `endTime` | Giờ kết thúc |
| `status` | Trạng thái (confirmed/pending/checked-in...) |
| `category` | Loại booking (guest/internal) |
| `internalTag` | Tag nội bộ (cleaning/maintenance...) |

- **Admin** (có token) vẫn nhận **đầy đủ** tất cả fields: `guestName, guestPhone, note, totalPrice, foodItems, customerId, createdBy...`
- Pattern giống hệt `GET /rooms` đang hoạt động tốt

### Ưu điểm
- Khách vào `/dat-phong` xem được lịch trống/bận ngay, **không cần đăng nhập**
- UX tốt cho khách hàng — vào là thấy, chọn phòng luôn
- Frontend **không cần sửa gì** (chỉ backend)
- Theo đúng pattern đã có (rooms API)

### Nhược điểm / Rủi ro
- Nếu **QUÊN strip PII** → `guestName`, `guestPhone` của khách lộ ra internet
- Cần code cẩn thận phía backend để đảm bảo projection đúng
- API public có thể bị bot scrape (giải quyết bằng rate-limit nếu cần)

### Scope sửa
- **Backend**: `routes/bookings.ts` — xóa blanket middleware, auth per-route cho CUD, DTO projection cho anonymous
- **Frontend**: `BookingPage.tsx:45` — thêm `console.error(err)` trước `toast.error()` (hygiene)
- **Effort**: ~30 phút, 2 agents parallel

---

## Option B — Bắt Login Mới Xem Lịch

### Cách hoạt động
- Wrap trang `/dat-phong` trong `ProtectedRoute` ở `main.tsx`
- Khách phải đăng nhập mới xem được lịch phòng
- Giữ nguyên backend auth hiện tại, không sửa gì

### Ưu điểm
- **Đơn giản** — chỉ sửa 1 dòng frontend (`main.tsx`)
- Không lo rò rỉ PII — mọi request đều có auth
- Không cần rate-limit

### Nhược điểm / Rủi ro
- Khách hàng mới **không thể xem lịch phòng** trước khi tạo tài khoản
- UX kém — người ta muốn xem phòng trống rồi mới quyết định đặt
- Đây là trang **dành cho khách hàng**, bắt login là barrier lớn → giảm conversion
- Không phù hợp với mô hình homestay (walk-in / online khách mới)

### Scope sửa
- **Frontend**: `main.tsx` — wrap `/dat-phong` trong `ProtectedRoute`
- **Effort**: ~5 phút, 1 agent

---

## Rate-limit (Câu hỏi phụ — chỉ áp dụng nếu chọn Option A)

Nếu chọn Option A, API public có thể bị bot scrape data hàng loạt. Rate-limit sẽ chặn điều này.

| Mức độ | Giải pháp |
|---|---|
| Không cần ngay | Quy mô homestay nhỏ, traffic thấp, chưa cần |
| Cơ bản | 60 requests/phút/IP — chặn bot đơn giản |
| Nâng cao | Cloudflare/WAF — chặn bot phức tạp (tương lai) |

**Khuyến nghị**: Chưa cần rate-limit ngay. Có thể thêm sau khi cần.

---

## So sánh tổng quan

| Tiêu chí | Option A | Option B |
|---|---|---|
| UX khách hàng | Tốt — xem ngay | Kém — phải login |
| Bảo mật PII | Cần projection cẩn thận | An toàn mặc định |
| Effort | ~30 phút | ~5 phút |
| Phù hợp homestay | Có | Không |
| Risk | Medium (PII nếu quên strip) | Low |
| Frontend changes | Không | 1 dòng |
| Backend changes | Có (per-route auth + DTO) | Không |

---

## Quyết định cần chốt

1. **Chọn Option A hay B?**
2. **Nếu A**: 8 field public DTO ở trên đủ chưa? Cần thêm field nào không?
3. **Rate-limit**: Cần ngay hay để sau?
