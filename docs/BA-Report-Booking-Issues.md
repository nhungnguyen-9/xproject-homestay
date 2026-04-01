# 📝 BÁO CÁO RÀ SOÁT LỖI VÀ BẤT CẬP HỆ THỐNG BOOKING - XPROJECT HOMESTAY

**Người báo cáo:** IT Business Analyst
**Mức độ:** Cực kỳ quan trọng (Critical)
**Phạm vi:** Luồng đặt phòng (Booking Flow), Logic tính giá và Kiểm tra trùng lịch.

---

## 1. LỖI DỮ LIỆU & CẤU HÌNH (DATA BUGS)

### 🔴 1.1 Sai lệch giá phòng VIP (Nghiêm trọng)
*   **Vị trí:** `frontend/src/types/schedule.ts` -> `ROOM_PRICES`
*   **Hiện trạng:** Giá theo giờ của hạng **VIP** đang để là `21,000đ/giờ`. Trong khi hạng **Standard** là `169,000đ/giờ`.
*   **Hệ quả:** Thất thoát doanh thu nghiêm trọng nếu khách hàng đặt phòng VIP.
*   **Yêu cầu:** Kiểm tra và cập nhật lại đúng giá (dự kiến là `210,000đ` hoặc tương đương theo phân hạng).

### 🟡 1.2 Dữ liệu đồ ăn (Food Items) bị lặp và sai giá
*   **Vị trí:** `frontend/src/types/schedule.ts` -> `FOOD_ITEMS`
*   **Hiện trạng:**
    *   Sản phẩm "Pepsi" xuất hiện 2 lần với giá `11,000đ` và `115,000đ`.
    *   Danh sách ID bị trùng lặp hoặc không đồng nhất (ID 1-6 bị lặp lại các tên món).
*   **Yêu cầu:** Làm sạch danh sách sản phẩm, chuẩn hóa ID và đơn giá.

---

## 2. LỖI LOGIC NGHIỆP VỤ (BUSINESS LOGIC BUGS)

### 🔴 2.1 Logic kiểm tra trùng phòng (Overlap Check) bị hỏng
*   **Vị trí:** `frontend/src/components/booking-calendar-form/booking-modal/validation.ts` -> `validateStep1`
*   **Lỗi:** Code hiện tại chỉ so sánh giờ nếu `checkInDate` trùng với `selectedDate`.
*   **Kịch bản lỗi:** Khách A đặt phòng từ 22:00 hôm nay đến 09:00 sáng mai (Overnight). Khách B đặt từ 01:00 sáng mai đến 03:00 sáng mai. Hệ thống sẽ **KHÔNG** báo trùng vì hai ngày khác nhau.
*   **Yêu cầu:** Chuyển toàn bộ thời gian về đối tượng `Date` (hoặc Unix Timestamp) để so sánh khoảng thời gian `[Start, End]` một cách tuyệt đối, không phụ thuộc vào chuỗi giờ phút đơn thuần.

### 🔴 2.2 Cách tính giá cho hình thức "Qua đêm" và "Theo ngày"
*   **Vị trí:** `useBookingForm.ts` -> logic tính `price`.
*   **Bất cập:** Hiện tại đang dùng `Math.ceil(duration / 24)` cho cả `daily` và `overnight`.
*   **Vấn đề:** Đặt "Qua đêm" (từ 22:00 - 09:00 sáng mai = 11 tiếng) nếu chia 24 và `ceil` sẽ ra 1 ngày. Tuy nhiên, nếu khách đặt quá giờ (ví dụ đến 11:00 mới trả), hệ thống chưa có logic tính **Phụ thu giờ thêm (extraHourRate)**.
*   **Yêu cầu:** Tách biệt logic tính giá gốc của gói (Base Rate) và phụ thu quá giờ (Extra Hours).

---

## 3. BẤT CẬP VỀ TRẢI NGHIỆM & VẬN HÀNH (UX/OPERATIONAL ISSUES)

### 🟠 3.1 Thiếu tính năng lưu trữ (Persistence)
*   **Vấn đề:** Toàn bộ booking hiện tại chỉ lưu ở `local state`. F5 trình duyệt là mất hết dữ liệu.
*   **Yêu cầu:** Triển khai kết nối Backend API. Trước mắt cần dùng `localStorage` để demo không bị mất dữ liệu.

### 🟠 3.2 Nội dung chuyển khoản (VietQR) chưa tối ưu
*   **Vị trí:** `Step3.tsx` và `PaymentModal.tsx`.
*   **Vấn đề:** Nội dung CK đang là `DP {tên phòng} {ngày}`. Tuy nhiên, nếu 1 ngày phòng đó có nhiều khách đặt theo giờ, Admin sẽ không biết giao dịch này của ai.
*   **Yêu cầu:** Thêm **Mã đơn hàng (Booking ID)** hoặc **4 số cuối SĐT khách** vào nội dung chuyển khoản để đối soát tự động dễ hơn (Ví dụ: `DP P101 0988 2003`).

### 🟠 3.3 Placeholder tài khoản ngân hàng
*   **Hiện trạng:** STK đang là `0123456789`.
*   **Rủi ro:** Khách hàng có thể chuyển nhầm vào tài khoản mẫu nếu Dev quên cập nhật khi Go-live.
*   **Yêu cầu:** Đưa STK và thông tin ngân hàng vào file `.env` hoặc cấu hình tập trung để dễ quản lý.

---

## 4. GỢI Ý NÂNG CẤP (RECOMENDATIONS)

1.  **Quản lý trạng thái:** Cần thêm trạng thái `Confirmed` sau khi Admin nhấn xác nhận đã nhận tiền, thay vì chỉ có `Pending`.
2.  **Validator hình ảnh:** Step 2 yêu cầu ảnh CCCD nhưng chưa check dung lượng hoặc định dạng file, có thể gây crash khi upload file quá lớn.
3.  **Booking History:** Thêm tính năng cho phép khách tra cứu lại trạng thái đặt phòng của mình qua số điện thoại.

---

**BA Note:** *Team Dev cần ưu tiên fix mục 1.1 và 2.1 ngay lập tức vì đây là lỗi gây thiệt hại trực tiếp về tiền và vận hành phòng.*
