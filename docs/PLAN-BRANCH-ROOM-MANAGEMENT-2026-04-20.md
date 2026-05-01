# Plan: Chức năng Quản lý Chi nhánh & Phòng theo Chi nhánh

**Ngày:** 2026-04-20
**Branch đích:** `dev-vu`
**Author:** Software Engineer Lead

---

## 1. Yêu cầu từ user

1. Admin tạo chi nhánh mới tại `/admin/branches` (CRUD chi nhánh)
2. Trong chi nhánh có thể thêm phòng mới (quản lý phòng theo chi nhánh)
3. Giao diện khách hàng hiển thị chi nhánh + phòng mới ngay sau khi admin tạo

---

## 2. Phân tích code hiện có (gap analysis)

### ✅ ĐÃ CÓ (~80% tính năng đã xong)

| Thành phần | File | Trạng thái |
|---|---|---|
| **DB Schema** | `backend/src/db/schema/branches.ts` | ✅ Đủ: id, name, phone, address, district, images, timestamps |
| **DB FK** | `backend/src/db/schema/rooms.ts:25` | ✅ `branchId` FK references branches.id + index |
| **BE Branch routes** | `backend/src/routes/branches.ts` (113 LOC) | ✅ Full CRUD + image upload/delete, GET công khai |
| **BE Branch service** | `backend/src/services/branchService.ts` | ✅ getAll, getById, create, update, remove |
| **BE Room filter by branch** | `backend/src/routes/rooms.ts:14-19` | ✅ `GET /rooms?branchId=X` đã support |
| **BE Room validator** | `backend/src/validators/room.ts:13` | ✅ `branchId` optional nullable |
| **FE Branch service** | `frontend/src/services/branchService.ts` | ✅ 100% API |
| **FE Admin Branch UI** | `frontend/src/components/admin/branch-management.tsx` (261 LOC) | ✅ CRUD + upload ảnh + confirm delete |
| **FE Branch Form Modal** | `branch-form-modal.tsx` (367 LOC) | ✅ Create + Edit |
| **FE Room Form có dropdown Branch** | `room-form-modal.tsx:70-90` | ✅ Load branches khi mở modal |
| **FE Home hiển thị chi nhánh** | `home.tsx:6-47` | ✅ Load branches + BranchCard + click navigate |
| **FE Lọc phòng theo chi nhánh** | `rest-room/RestRoomPage.tsx:37-67` | ✅ Parse `?branchId=` + fetch rooms + hiển thị header chi nhánh |
| **FE roomService filter** | `services/roomService.ts:22-24` | ✅ `getAll({ branchId, type })` |

### ⚠️ CÒN THIẾU / CẦN CẢI THIỆN

| Gap | Mức | Mô tả |
|---|---|---|
| **G1. Admin RoomManagement không filter/group theo chi nhánh** | 🟡 Trung | `room-management.tsx` chưa hiện tên branch của từng phòng, chưa có dropdown lọc theo chi nhánh → khó quản lý khi có nhiều chi nhánh |
| **G2. Không có shortcut "Thêm phòng vào chi nhánh này" từ /admin/branches** | 🟡 Trung | User phải rời trang branches, sang `/admin/management`, mở form, chọn lại branch. Nên có nút trực tiếp trong `BranchCard` |
| **G3. Xóa chi nhánh không kiểm tra rooms ràng buộc** | 🔴 Cao | `branchService.remove()` chỉ `DELETE`, FK sẽ fail (hoặc orphan) khi branch có rooms. Cần business logic: từ chối xóa nếu còn phòng HOẶC SET NULL `rooms.branch_id` |
| **G4. Trang khách hàng không tự cập nhật khi admin tạo chi nhánh/phòng mới** | 🟡 Trung | Home + RestRoomPage fetch 1 lần khi mount. Cần polling / refresh trigger / SSE |
| **G5. Không có loading/empty state cho dropdown branch trong RoomFormModal** | 🟢 Thấp | Hiện silently fail — có thể gây confusion khi admin tạo phòng mà chưa có branch nào |
| **G6. Chưa có test cho branch flows** | 🟡 Trung | Không có file test nào cho branchService BE/FE |
| **G7. BranchFormModal validation** | 🟢 Thấp | Cần verify validation (name bắt buộc, address bắt buộc, phone format…) |

---

## 3. Kế hoạch phân rã task

### 🎯 Nguyên tắc phân rã

- Mỗi task độc lập, có acceptance criteria rõ ràng
- Chạy song song khi không có dependency
- Task có nhãn `[BE]`/`[FE]`/`[DB]` để phân agent
- Nhãn `[P0]` = bắt buộc cho yêu cầu user, `[P1]` = bổ sung UX, `[P2]` = nice-to-have

### 📋 Danh sách tasks

---

#### **T1. [DB/BE] [P0] Xử lý xóa chi nhánh khi còn rooms**

**Assignee:** `senior-database` + `senior-backend`
**Dependencies:** None
**File sửa:** `backend/src/services/branchService.ts`, `backend/src/routes/branches.ts`, có thể cần migration mới

**Mô tả:**
- Trước khi DELETE branch, kiểm tra còn rooms tham chiếu `branch_id` không.
- **Quyết định kiến trúc (đề xuất)**: Hard block — nếu còn `rooms` active thì trả 409 Conflict với message "Không thể xóa chi nhánh còn X phòng. Hãy chuyển hoặc vô hiệu hóa các phòng trước."
- Alternative: SET `rooms.branch_id = NULL` (nhưng gây orphan rooms trong UI công khai)

**Acceptance criteria:**
- [ ] `DELETE /branches/:id` trả 409 nếu có rooms.branch_id = :id AND is_active = true
- [ ] Error message bằng tiếng Việt, kèm số phòng còn lại
- [ ] Frontend `BranchManagement` bắt 409 và hiển thị toast thông báo rõ
- [ ] Test integration: tạo branch + 2 rooms → DELETE → expect 409

---

#### **T2. [FE] [P0] Shortcut "Thêm phòng" từ trang /admin/branches**

**Assignee:** `senior-frontend`
**Dependencies:** None
**File sửa:** `frontend/src/components/admin/branch-management.tsx`

**Mô tả:**
- Thêm button **"+ Thêm phòng"** trong `BranchCard` (bên cạnh Sửa/Xóa)
- Click → mở `RoomFormModal` với `branchId` đã prefill → submit tạo phòng
- Alternative đơn giản: `navigate('/admin/management?openCreate=true&branchId=' + branch.id)`
- Và `RoomManagement` đọc query `branchId` + `openCreate` để auto mở modal với branch đã chọn

**Acceptance criteria:**
- [ ] Click "Thêm phòng" trong BranchCard → modal tạo phòng mở ra, dropdown branch đã chọn sẵn chi nhánh tương ứng
- [ ] Sau khi tạo thành công, toast success và quay về trang branches
- [ ] Phòng mới xuất hiện khi refresh trang `/admin/management`

---

#### **T3. [FE] [P0] Filter & nhóm phòng theo chi nhánh trong RoomManagement**

**Assignee:** `senior-frontend`
**Dependencies:** None
**File sửa:** `frontend/src/components/admin/room-management.tsx`

**Mô tả:**
- Thêm dropdown **"Xem theo chi nhánh"** ở header (all / per-branch)
- Hiển thị badge tên chi nhánh trong card phòng
- Option B (đẹp hơn): group phòng theo branch như accordion/section

**Acceptance criteria:**
- [ ] Dropdown filter có option "Tất cả chi nhánh" + từng chi nhánh
- [ ] Filter thay đổi → gọi `roomService.getAll({ branchId })` (không re-fetch toàn bộ)
- [ ] Card phòng hiển thị tên chi nhánh (lấy từ `branches` đã fetch map theo `branchId`)
- [ ] Rooms chưa gán chi nhánh được nhóm riêng ở cuối danh sách

---

#### **T4. [FE] [P1] Trang khách hàng tự động cập nhật**

**Assignee:** `senior-frontend`
**Dependencies:** None
**File sửa:** `frontend/src/components/home/home.tsx`, `frontend/src/components/rest-room/RestRoomPage.tsx`

**Mô tả (đề xuất MVP — polling):**
- Polling mỗi 60s khi tab active (dùng `document.visibilityState`)
- Cache by key: nếu response identical (compare length + updated_at max) → không re-render
- Alternative: thêm manual "Refresh" button ở góc
- Advanced (P2): Server-Sent Events `/api/v1/events/branches` broadcast khi admin CUD

**Acceptance criteria:**
- [ ] Home polling branches mỗi 60s khi tab visible
- [ ] RestRoomPage polling rooms (kèm branchId filter) mỗi 60s
- [ ] Không polling khi tab ẩn (tiết kiệm network)
- [ ] Khi có data mới, UI update mượt (không flash)

---

#### **T5. [BE] [P1] Endpoint `GET /branches/:id/rooms` convenience**

**Assignee:** `senior-backend`
**Dependencies:** None
**File sửa:** `backend/src/routes/branches.ts`

**Mô tả:**
- Thêm endpoint `GET /branches/:id/rooms` trả rooms thuộc chi nhánh (khác với `GET /rooms?branchId=X` ở chỗ validate branch tồn tại trước)
- Công khai, dùng cho trang khách hàng
- Không bắt buộc (đã có `/rooms?branchId=X`) — chỉ là convenience + better error

**Acceptance criteria:**
- [ ] `GET /branches/xxx/rooms` trả 404 nếu branch không tồn tại
- [ ] Trả array rooms (join branch info optional)
- [ ] Có test

---

#### **T6. [FE] [P1] Validation RoomFormModal khi chưa có branch**

**Assignee:** `senior-frontend`
**Dependencies:** None
**File sửa:** `room-form-modal.tsx`

**Mô tả:**
- Nếu `branches.length === 0` khi mở modal → disable form + thông báo "Vui lòng tạo chi nhánh trước"
- Có link CTA "Đi tới /admin/branches"

**Acceptance criteria:**
- [ ] Modal tạo phòng mở ra khi chưa có branch → hiện empty state với CTA
- [ ] Không submit được nếu chưa có branch

---

#### **T7. [BE] [P1] Kiểm thử (integration test) branch + room flows**

**Assignee:** `senior-backend`
**Dependencies:** T1, T5
**File tạo:** `backend/src/routes/__tests__/branches.test.ts`

**Mô tả:**
- Test flow: admin login → create branch → create room with branchId → GET /branches → GET /rooms?branchId → update branch → DELETE (conflict nếu còn rooms)

**Acceptance criteria:**
- [ ] 5+ test cases passing với `vitest run`
- [ ] Coverage cho happy path + 409 conflict + 404

---

#### **T8. [FE] [P2] Trang khách hàng: nav bar thêm dropdown "Chi nhánh"**

**Assignee:** `senior-frontend`
**Dependencies:** None
**File sửa:** `frontend/src/components/header/header.tsx`

**Mô tả:**
- Header dropdown "Chi nhánh" list các branches → click → nav tới `/phong-nghi?branchId=X`

**Acceptance criteria:**
- [ ] Dropdown load branches từ API
- [ ] Click item → navigate đúng
- [ ] Mobile responsive

---

## 4. Ma trận dependencies & thứ tự

```
P0 (phải làm):
  T1 (BE+DB) ─┐
  T2 (FE) ────┼──► Release MVP
  T3 (FE) ────┘

P1 (ngay sau MVP):
  T4 (FE) — independent
  T5 (BE) ─┐
  T7 (BE) ─┴► sau T1+T5
  T6 (FE) — independent

P2 (tuần sau):
  T8 (FE)
```

**Đề xuất sprint 1 (3-4 ngày):** T1 + T2 + T3 (song song vì khác module)
**Sprint 2 (2 ngày):** T4 + T5 + T6
**Sprint 3:** T7 + T8

---

## 5. Rủi ro & lưu ý

| Rủi ro | Mitigation |
|---|---|
| FK `rooms.branch_id` hiện không có `onDelete` policy → xóa branch sẽ fail postgres constraint | T1 block ở application layer trước; về lâu dài cân nhắc migration thêm `ON DELETE SET NULL` |
| Branch có nhiều images (5) → upload chậm | Đã batch; thêm progress bar nếu cần |
| Polling 60s × N user = load không đáng kể | OK với traffic hiện tại; đổi SSE sau nếu scale |
| Branch name không unique → trùng tên | Cân nhắc unique index trên `name` (migration mới) — cần xác nhận với user |

---

## 6. Checklist giao cho agents

- [ ] `senior-database`: T1 (phần DB — cân nhắc `ON DELETE SET NULL`)
- [ ] `senior-backend`: T1 (service logic), T5, T7
- [ ] `senior-frontend`: T2, T3, T4, T6, T8

---

## 7. Acceptance criteria tổng (user-facing)

- [x] Yêu cầu #1: Admin tạo chi nhánh mới tại `/admin/branches` → **ĐÃ CÓ**, cần polish
- [ ] Yêu cầu #2: Trong chi nhánh có thể thêm phòng mới → **T2 + T3**
- [ ] Yêu cầu #3: Giao diện khách hàng cập nhật ngay → **T4 (polling)**
