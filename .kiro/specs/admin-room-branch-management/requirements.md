# Requirements Document

## Introduction

Tính năng quản lý phòng và chi nhánh trong trang Admin cho hệ thống đặt phòng homestay. Admin có thể tạo mới, chỉnh sửa và vô hiệu hóa phòng với giá tính theo phút. Admin cũng có thể tạo và quản lý chi nhánh. Khi phòng mới được thêm, giao diện người dùng (user-facing UI) sẽ tự động cập nhật hiển thị phòng mới.

## Glossary

- **Admin_Panel**: Trang quản trị dành cho admin, nơi thực hiện các thao tác quản lý phòng và chi nhánh
- **Room_Management_UI**: Giao diện quản lý phòng trong Admin Panel, cho phép tạo/sửa/xóa phòng
- **Branch_Management_UI**: Giao diện quản lý chi nhánh trong Admin Panel, cho phép tạo/sửa chi nhánh
- **Room_API**: Backend API xử lý các thao tác CRUD cho phòng (endpoint `/rooms`)
- **Branch_API**: Backend API xử lý các thao tác CRUD cho chi nhánh (endpoint `/branches`)
- **User_Room_List**: Giao diện hiển thị danh sách phòng cho người dùng cuối (trang booking)
- **Per_Minute_Rate**: Giá phòng tính theo phút (VNĐ/phút), là đơn vị tính giá cơ bản cho phòng
- **Branch**: Chi nhánh/cơ sở của hệ thống homestay, mỗi chi nhánh có tên, địa chỉ và số điện thoại

## Requirements

### Requirement 1: Tạo phòng mới

**User Story:** As an admin, I want to create new rooms with per-minute pricing, so that I can expand the room inventory and offer flexible pricing to customers.

#### Acceptance Criteria

1. WHEN the admin submits the create room form with valid data, THE Room_API SHALL create a new room record in the database and return the created room details
2. THE Room_Management_UI SHALL display a form with fields: tên phòng, loại phòng (standard/vip/supervip), chi nhánh, mô tả, số khách tối đa, tiện nghi, và giá theo phút (Per_Minute_Rate)
3. WHEN the admin enters a Per_Minute_Rate value, THE Room_Management_UI SHALL display the calculated hourly equivalent (Per_Minute_Rate × 60) for reference
4. IF the admin submits the form with missing required fields (tên phòng, loại phòng, giá theo phút), THEN THE Room_Management_UI SHALL display specific validation error messages for each invalid field
5. IF the Room_API receives a request with invalid data, THEN THE Room_API SHALL return a 400 status code with descriptive error messages
6. WHEN a new room is created successfully, THE Room_Management_UI SHALL display a success notification and refresh the room list

### Requirement 2: Chỉnh sửa phòng

**User Story:** As an admin, I want to edit existing room details including pricing, so that I can keep room information up to date.

#### Acceptance Criteria

1. WHEN the admin selects a room to edit, THE Room_Management_UI SHALL populate the edit form with the current room data
2. WHEN the admin submits updated room data, THE Room_API SHALL update the room record and return the updated details
3. IF the admin submits invalid data during editing, THEN THE Room_Management_UI SHALL display validation errors without losing the entered data
4. WHEN a room is updated successfully, THE Room_Management_UI SHALL display a success notification and reflect the changes in the room list

### Requirement 3: Vô hiệu hóa phòng

**User Story:** As an admin, I want to deactivate rooms that are no longer available, so that they no longer appear to customers.

#### Acceptance Criteria

1. WHEN the admin confirms deactivation of a room, THE Room_API SHALL set the room status to inactive (soft delete)
2. THE Room_Management_UI SHALL display a confirmation dialog before deactivating a room
3. WHILE a room is inactive, THE User_Room_List SHALL exclude that room from the displayed list
4. WHEN a room is deactivated successfully, THE Room_Management_UI SHALL display a success notification and update the room list

### Requirement 4: Giá phòng tính theo phút

**User Story:** As an admin, I want room pricing to be calculated per minute, so that customers are charged fairly based on actual usage time.

#### Acceptance Criteria

1. THE Room_API SHALL store the Per_Minute_Rate as an integer value in VNĐ for each room
2. WHEN the User_Room_List displays room pricing, THE User_Room_List SHALL show the per-minute rate formatted as "X đ/phút"
3. THE Room_API SHALL accept and validate that Per_Minute_Rate is a positive integer greater than zero
4. WHEN calculating total booking cost, THE system SHALL multiply Per_Minute_Rate by the total number of minutes booked

### Requirement 5: Tạo chi nhánh mới

**User Story:** As an admin, I want to create new branches, so that I can expand the business to new locations.

#### Acceptance Criteria

1. WHEN the admin submits the create branch form with valid data, THE Branch_API SHALL create a new branch record and return the created branch details
2. THE Branch_Management_UI SHALL display a form with fields: tên chi nhánh, địa chỉ, quận/huyện, và số điện thoại
3. IF the admin submits the form with missing required fields (tên chi nhánh, địa chỉ), THEN THE Branch_Management_UI SHALL display specific validation error messages
4. IF the Branch_API receives a request with invalid data, THEN THE Branch_API SHALL return a 400 status code with descriptive error messages
5. WHEN a new branch is created successfully, THE Branch_Management_UI SHALL display a success notification and refresh the branch list

### Requirement 6: Chỉnh sửa chi nhánh

**User Story:** As an admin, I want to edit branch information, so that I can keep location details accurate.

#### Acceptance Criteria

1. WHEN the admin selects a branch to edit, THE Branch_Management_UI SHALL populate the edit form with the current branch data
2. WHEN the admin submits updated branch data, THE Branch_API SHALL update the branch record and return the updated details
3. IF the admin submits invalid data during editing, THEN THE Branch_Management_UI SHALL display validation errors without losing the entered data
4. WHEN a branch is updated successfully, THE Branch_Management_UI SHALL display a success notification and reflect the changes in the branch list

### Requirement 7: Cập nhật UI người dùng khi thêm phòng mới

**User Story:** As a user, I want to see newly added rooms on the booking page, so that I can book the latest available rooms.

#### Acceptance Criteria

1. WHEN a new room is created and marked as active, THE User_Room_List SHALL include the new room in the next data fetch
2. THE User_Room_List SHALL fetch room data from the Room_API on page load and display all active rooms
3. WHEN the User_Room_List fetches rooms, THE Room_API SHALL return only rooms where isActive is true
4. THE User_Room_List SHALL display each room with: tên phòng, loại phòng, giá theo phút, và hình ảnh

### Requirement 8: Liên kết phòng với chi nhánh

**User Story:** As an admin, I want to assign rooms to specific branches, so that rooms are organized by location.

#### Acceptance Criteria

1. WHEN creating or editing a room, THE Room_Management_UI SHALL display a dropdown to select the branch the room belongs to
2. THE Room_API SHALL store the branchId reference for each room
3. WHEN the User_Room_List filters by branch, THE Room_API SHALL return only rooms belonging to the selected branch
4. IF a room is created without selecting a branch, THEN THE Room_API SHALL accept the room with a null branchId value
