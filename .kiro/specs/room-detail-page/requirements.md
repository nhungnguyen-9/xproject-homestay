# Requirements Document

## Introduction

Trang Chi Tiết Phòng (Room Detail Page) là trang user-facing hiển thị thông tin chi tiết của một phòng nghỉ tại homestay, bao gồm: bộ sưu tập ảnh phòng, tiện nghi phòng, và lịch trình đặt phòng (timeline) của tất cả các phòng cùng chi nhánh. Người dùng có thể lọc theo loại phòng, chọn ngày xem lịch, và xem trạng thái phòng trống/đã đặt theo thời gian thực.

## Glossary

- **Room_Detail_Page**: Trang chi tiết phòng hiển thị cho người dùng cuối (user-facing), truy cập qua URL `/phong-nghi/:id`
- **Image_Gallery**: Khu vực hiển thị ảnh phòng dạng collage (ảnh lớn bên trái, ảnh trung bên giữa, 3 ảnh nhỏ xếp dọc bên phải)
- **Toolbar**: Thanh công cụ chứa nút Hướng dẫn, bộ chọn ngày, và bộ lọc loại phòng
- **Room_Type_Filter**: Bộ lọc loại phòng theo tab: Tiêu chuẩn, VIP, SuperVip
- **Date_Picker**: Bộ chọn ngày để lọc lịch trình đặt phòng
- **Amenities_Overview**: Khu vực hiển thị tổng quan tiện nghi của phòng đang xem
- **Schedule_Timeline**: Biểu đồ Gantt hiển thị lịch đặt phòng theo giờ cho tất cả phòng cùng chi nhánh
- **Amenity_Legend**: Khu vực ghi chú tiện nghi riêng của từng phòng trong timeline
- **Branch**: Chi nhánh homestay mà phòng thuộc về
- **RoomDetail**: Kiểu dữ liệu chứa thông tin đầy đủ của phòng (name, type, branchId, images, amenities, rates...)
- **Booking**: Thông tin một lượt đặt phòng với thời gian bắt đầu/kết thúc

## Requirements

### Requirement 1: Page Routing and Data Loading

**User Story:** As a user, I want to navigate to a room detail page by clicking a room card, so that I can view detailed information about that room.

#### Acceptance Criteria

1. WHEN a user clicks a room card on the `/phong-nghi` page, THE Room_Detail_Page SHALL navigate to `/phong-nghi/:id` where `:id` is the room's unique identifier
2. WHEN the Room_Detail_Page loads, THE Room_Detail_Page SHALL fetch room data using the `roomService.getById(id)` method
3. WHEN the Room_Detail_Page loads, THE Room_Detail_Page SHALL fetch all rooms in the same branch using `roomService.getAll({ branchId })` for the Schedule_Timeline
4. IF the room ID does not exist or the API returns an error, THEN THE Room_Detail_Page SHALL display a user-friendly error message indicating the room was not found
5. WHILE the room data is loading, THE Room_Detail_Page SHALL display a loading indicator

### Requirement 2: Image Gallery Display

**User Story:** As a user, I want to see a large image gallery of the room, so that I can visually assess the room before booking.

#### Acceptance Criteria

1. WHEN the Room_Detail_Page renders with room data, THE Image_Gallery SHALL display room images in a collage layout: one large image on the left, one medium image in the center, and three small images stacked vertically on the right
2. THE Image_Gallery SHALL use the same collage layout proportions as the existing RoomCard component (flex-5 left, flex-3 center, flex-2 right)
3. IF the room has fewer than 5 images, THEN THE Image_Gallery SHALL reuse available images to fill all 5 slots
4. THE Image_Gallery SHALL render images using the `imageUrl()` helper from roomService to resolve relative paths to absolute URLs
5. THE Image_Gallery SHALL apply `object-cover` styling to maintain aspect ratio without distortion

### Requirement 3: Toolbar with Instructions, Date Picker, and Room Type Filter

**User Story:** As a user, I want to filter the schedule by date and room type, so that I can find available time slots for my preferred room category.

#### Acceptance Criteria

1. THE Toolbar SHALL display a "Hướng dẫn" (Instructions) button that navigates to the `/huong-dan` page
2. THE Toolbar SHALL display a Date_Picker with the current date pre-selected
3. WHEN the user selects a new date in the Date_Picker, THE Schedule_Timeline SHALL update to show bookings for the selected date
4. THE Toolbar SHALL display Room_Type_Filter tabs for "Tiêu chuẩn", "VIP", and "SuperVip"
5. WHEN the user toggles a Room_Type_Filter tab, THE Schedule_Timeline SHALL show or hide rooms matching that type
6. THE Toolbar SHALL render all filter tabs as active (selected) by default on page load

### Requirement 4: Room Amenities Overview

**User Story:** As a user, I want to see the amenities of the room I'm viewing, so that I can understand what facilities are included.

#### Acceptance Criteria

1. WHEN the Room_Detail_Page renders with room data, THE Amenities_Overview SHALL display the section title "Tổng Quan Tiện Nghi Phòng"
2. THE Amenities_Overview SHALL display all amenities from the current room's `amenities` array
3. THE Amenities_Overview SHALL display each amenity with an appropriate icon and label
4. IF the room has no amenities defined, THEN THE Amenities_Overview SHALL display a message indicating no amenities are available

### Requirement 5: Room Schedule Timeline

**User Story:** As a user, I want to see a timeline of all room bookings at the same branch, so that I can identify available time slots across all rooms.

#### Acceptance Criteria

1. THE Schedule_Timeline SHALL display a Gantt-chart-style timeline with room names as rows and hours (00h to 22h+) as columns
2. THE Schedule_Timeline SHALL display all rooms belonging to the same branch as the currently viewed room
3. THE Schedule_Timeline SHALL display booked time slots as colored blocks with start and end times visible
4. THE Schedule_Timeline SHALL provide a horizontal scrollbar when the timeline content exceeds the visible width
5. WHEN the user selects a date via the Date_Picker, THE Schedule_Timeline SHALL fetch and display bookings for that specific date
6. WHEN the user toggles Room_Type_Filter tabs, THE Schedule_Timeline SHALL filter displayed rooms by the active room types
7. THE Schedule_Timeline SHALL display a current-time indicator line when viewing today's date

### Requirement 6: Room Amenity Legend

**User Story:** As a user, I want to see room-specific amenity notes below the timeline, so that I can quickly compare unique features of each room.

#### Acceptance Criteria

1. THE Amenity_Legend SHALL display below the Schedule_Timeline with the title "Ghi chú tiện nghi"
2. THE Amenity_Legend SHALL list each room name followed by its distinctive amenity or feature (e.g., "G01: 1 giường đôi", "P102: ban công thoáng")
3. THE Amenity_Legend SHALL only display rooms that are currently visible in the Schedule_Timeline (respecting active filters)

### Requirement 7: Responsive Layout and Accessibility

**User Story:** As a user, I want the room detail page to work well on both desktop and mobile devices, so that I can view room information from any device.

#### Acceptance Criteria

1. THE Room_Detail_Page SHALL render within the existing site layout (Header at top, Footer at bottom)
2. THE Room_Detail_Page SHALL adapt the Image_Gallery layout for mobile screens (stack vertically on screens narrower than 768px)
3. THE Toolbar SHALL wrap filter tabs to a new line on narrow screens while maintaining usability
4. THE Schedule_Timeline SHALL remain horizontally scrollable on all screen sizes
5. THE Image_Gallery SHALL include descriptive `alt` attributes on all images for screen reader accessibility
6. THE Room_Detail_Page SHALL use semantic HTML elements (headings, sections, navigation) for proper document structure

### Requirement 8: Booking Creation from Timeline

**User Story:** As a user, I want to create a booking by clicking an empty time slot on the timeline, so that I can quickly reserve a room.

#### Acceptance Criteria

1. WHEN the user clicks an empty time slot on the Schedule_Timeline, THE Room_Detail_Page SHALL open the booking modal pre-filled with the selected room and time
2. THE booking modal SHALL pre-fill the selected date from the Date_Picker
3. WHEN a booking is successfully created, THE Schedule_Timeline SHALL refresh to display the new booking block
4. THE Schedule_Timeline SHALL display a "+" icon on hover over empty time slots to indicate clickability
