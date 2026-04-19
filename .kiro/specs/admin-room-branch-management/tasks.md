# Implementation Plan: Admin Room & Branch Management

## Overview

Triển khai tính năng quản lý phòng và chi nhánh cho Admin Panel. Backend đã có sẵn CRUD cho rooms/branches — cần thêm trường `perMinuteRate`, cập nhật validators, và xây dựng UI quản lý đầy đủ trên frontend. Sử dụng TypeScript cho cả frontend (React + Vite) và backend (Hono + Drizzle ORM).

## Tasks

- [x] 1. Cập nhật Backend Schema và Validators cho perMinuteRate
  - [x] 1.1 Thêm cột `per_minute_rate` vào schema rooms
    - Thêm `perMinuteRate: integer('per_minute_rate').notNull().default(0)` vào `backend/src/db/schema/rooms.ts`
    - Chạy `drizzle-kit generate` để tạo migration file
    - _Requirements: 4.1, 4.3_

  - [x] 1.2 Cập nhật room validator để yêu cầu perMinuteRate
    - Thêm `perMinuteRate: z.number().int().min(1, 'Giá theo phút phải lớn hơn 0')` vào `createRoomSchema` trong `backend/src/validators/room.ts`langfuse 
    - Cập nhật `updateRoomSchema` (đã dùng `.partial()` nên tự động cập nhật)
    - _Requirements: 1.5, 4.3_

  - [x] 1.3 Tạo branch validator riêng
    - Tạo file `backend/src/validators/branch.ts` với `createBranchSchema` và `updateBranchSchema`
    - Validate: name (required, min 1), address (required, min 1), district (optional), phone (optional)
    - Cập nhật `backend/src/routes/branches.ts` để import validator mới thay vì inline schema
    - _Requirements: 5.3, 5.4_

  - [ ]* 1.4 Viết property test cho room validation (Property 4)
    - **Property 4: Room validation rejects invalid data**
    - Dùng `fast-check` để generate payloads với name rỗng, type không hợp lệ, hoặc perMinuteRate ≤ 0
    - Verify API trả về 400 status code với error messages mô tả
    - **Validates: Requirements 1.4, 1.5, 4.3**

  - [ ]* 1.5 Viết property test cho branch validation (Property 7)
    - **Property 7: Branch validation rejects invalid data**
    - Dùng `fast-check` để generate payloads với name rỗng hoặc address rỗng
    - Verify API trả về 400 status code với error messages mô tả
    - **Validates: Requirements 5.3, 5.4**

- [x] 2. Checkpoint — Đảm bảo backend schema và validators hoạt động
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.

- [x] 3. Cập nhật Frontend Types và Services
  - [x] 3.1 Cập nhật RoomDetail type thêm perMinuteRate
    - Thêm `perMinuteRate: number` vào interface `RoomDetail` trong `frontend/src/types/room.ts`
    - Thêm type `CreateRoomPayload` cho form tạo/sửa phòng
    - _Requirements: 4.1_

  - [x] 3.2 Tạo Branch types
    - Tạo file `frontend/src/types/branch.ts` với interface `Branch` và `CreateBranchPayload`
    - Fields: id, name, address, district, phone, createdAt, updatedAt
    - _Requirements: 5.2_

  - [x] 3.3 Thêm CRUD methods vào roomService
    - Thêm `create()`, `update()`, `deactivate()` vào `frontend/src/services/roomService.ts`
    - `create`: POST /rooms với CreateRoomPayload
    - `update`: PUT /rooms/:id với Partial<CreateRoomPayload>
    - `deactivate`: DELETE /rooms/:id (soft delete)
    - _Requirements: 1.1, 2.2, 3.1_

  - [x] 3.4 Tạo branchService
    - Tạo file `frontend/src/services/branchService.ts`
    - Implement: `getAll()`, `getById()`, `create()`, `update()` sử dụng `apiFetch`
    - _Requirements: 5.1, 6.2_

  - [ ]* 3.5 Viết property test cho per-minute rate calculation (Property 3)
    - **Property 3: Per-minute rate hourly calculation**
    - Dùng `fast-check` để generate perMinuteRate dương ngẫu nhiên
    - Verify: hourly equivalent = perMinuteRate × 60, total cost = perMinuteRate × duration
    - **Validates: Requirements 1.3, 4.4**

  - [ ]* 3.6 Viết property test cho price formatting (Property 9)
    - **Property 9: Room display contains required pricing info**
    - Dùng `fast-check` để generate perMinuteRate dương ngẫu nhiên
    - Verify: formatted string khớp pattern "{number} đ/phút" và number = perMinuteRate
    - **Validates: Requirements 4.2, 7.4**

- [x] 4. Xây dựng UI quản lý chi nhánh (Branch Management)
  - [x] 4.1 Tạo component BranchFormModal
    - Tạo file `frontend/src/components/admin/branch-form-modal.tsx`
    - Form fields: tên chi nhánh (required), địa chỉ (required), quận/huyện (optional), số điện thoại (optional)
    - Hỗ trợ cả mode tạo mới và chỉnh sửa (pre-fill data khi edit)
    - Hiển thị validation errors inline cho từng field
    - _Requirements: 5.2, 5.3, 6.1, 6.3_

  - [x] 4.2 Tạo component BranchManagement page
    - Tạo file `frontend/src/components/admin/branch-management.tsx`
    - Hiển thị danh sách chi nhánh dạng bảng/card
    - Nút "Thêm chi nhánh" mở BranchFormModal ở mode tạo mới
    - Nút "Sửa" trên mỗi chi nhánh mở BranchFormModal ở mode chỉnh sửa
    - Hiển thị toast success/error sau mỗi thao tác CRUD
    - _Requirements: 5.1, 5.5, 6.2, 6.4_

  - [ ]* 4.3 Viết property test cho branch CRUD round-trip (Property 6)
    - **Property 6: Branch creation and update round-trip**
    - Dùng `fast-check` để generate branch data hợp lệ (name, address non-empty)
    - Verify: tạo branch → fetch → fields khớp; update → fetch → fields thay đổi đúng
    - **Validates: Requirements 5.1, 6.2**

- [x] 5. Xây dựng UI quản lý phòng (Room Management CRUD)
  - [x] 5.1 Tạo component RoomFormModal
    - Tạo file `frontend/src/components/admin/room-form-modal.tsx`
    - Form fields: tên phòng (required), loại phòng select (required), chi nhánh dropdown (load từ branchService), giá theo phút (required, > 0), hiển thị hourly equivalent (perMinuteRate × 60), hourlyRate, dailyRate, overnightRate, extraHourRate, số khách tối đa, mô tả, tiện nghi (tag input)
    - Hỗ trợ mode tạo mới và chỉnh sửa (pre-fill data khi edit)
    - Hiển thị validation errors inline
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 8.1_

  - [x] 5.2 Mở rộng RoomManagement page với CRUD đầy đủ
    - Cập nhật `frontend/src/components/admin/room-management.tsx`
    - Thêm nút "Thêm phòng" mở RoomFormModal ở mode tạo mới
    - Thêm nút "Sửa" trên mỗi phòng mở RoomFormModal ở mode chỉnh sửa
    - Thêm nút "Vô hiệu hóa" với confirmation dialog trước khi deactivate
    - Hiển thị perMinuteRate trong thông tin phòng
    - Hiển thị toast success/error sau mỗi thao tác
    - Giữ nguyên chức năng quản lý hình ảnh hiện có
    - _Requirements: 1.6, 2.4, 3.1, 3.2, 3.4_

  - [ ]* 5.3 Viết property test cho room CRUD round-trip (Property 1 & 2)
    - **Property 1: Room creation round-trip**
    - **Property 2: Room update round-trip**
    - Dùng `fast-check` để generate room data hợp lệ (name non-empty, type in ['standard','vip','supervip'], perMinuteRate > 0)
    - Verify: tạo room → fetch → fields khớp; update partial → fetch → updated fields thay đổi, non-updated giữ nguyên
    - **Validates: Requirements 1.1, 2.2, 4.1**

  - [ ]* 5.4 Viết property test cho active room filtering (Property 5)
    - **Property 5: Active room filtering invariant**
    - Dùng `fast-check` để generate tập rooms với isActive mixed
    - Verify: GET /rooms chỉ trả về rooms có isActive=true; room đã soft-delete không xuất hiện
    - **Validates: Requirements 3.1, 3.3, 7.1, 7.3**

- [x] 6. Checkpoint — Đảm bảo CRUD phòng và chi nhánh hoạt động
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.

- [x] 7. Cập nhật User-facing UI và Routing
  - [x] 7.1 Cập nhật User Room List hiển thị perMinuteRate
    - Cập nhật các component hiển thị phòng cho user (room-card, booking page) để hiển thị giá theo phút dạng "X đ/phút"
    - Đảm bảo chỉ hiển thị phòng active (đã có sẵn qua API filter)
    - _Requirements: 4.2, 7.2, 7.3, 7.4_

  - [x] 7.2 Thêm routes cho Room Management và Branch Management
    - Thêm route `rooms` → `RoomManagement` (cập nhật page hiện có tại path `management`)
    - Thêm route `branches` → `BranchManagement` trong admin layout tại `frontend/src/main.tsx`
    - Cập nhật AdminLayout sidebar/navigation nếu cần
    - _Requirements: 1.2, 5.2_

  - [ ]* 7.3 Viết property test cho branch filtering (Property 8)
    - **Property 8: Branch filtering for rooms**
    - Dùng `fast-check` để generate branchId filter
    - Verify: GET /rooms?branchId=X chỉ trả về rooms có branchId === X
    - **Validates: Requirements 8.3**

- [x] 8. Final checkpoint — Đảm bảo toàn bộ tính năng hoạt động
  - Đảm bảo tất cả tests pass, hỏi user nếu có thắc mắc.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để ra MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Checkpoints đảm bảo kiểm tra tăng dần sau mỗi giai đoạn
- Property tests sử dụng `vitest` + `fast-check` để validate correctness properties từ design
- Backend đã có sẵn CRUD endpoints — chỉ cần thêm perMinuteRate và tách validator cho branch
- Frontend giữ nguyên pattern hiện có: `apiFetch` + React state + `sonner` toast
