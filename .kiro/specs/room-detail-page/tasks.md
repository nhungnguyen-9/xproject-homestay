# Implementation Plan: Room Detail Page

## Overview

Implement the Room Detail Page (`/phong-nghi/:id`) — a user-facing page displaying room images, amenities, and a booking schedule timeline for all rooms in the same branch. The implementation refactors the existing `RoomDetailRoute` and `RoomDetailPage` components to fetch real data from `roomService` and `bookingService`, introduces new `RoomImageGallery` and `RoomAmenitiesOverview` components, and wires everything into the existing route structure.

## Tasks

- [x] 1. Create RoomImageGallery component
  - [x] 1.1 Create `frontend/src/components/rooms/RoomImageGallery.tsx` with the `fillImageSlots` utility and collage layout
    - Implement `fillImageSlots(images, slots=5)` that cycles images via `images[i % images.length]` or returns placeholders for empty arrays
    - Build the collage layout matching RoomCard proportions: flex-5 (left large), flex-3 (center medium), flex-2 (right 3 stacked)
    - Use `object-cover` on all images, add descriptive `alt` attributes containing `roomName`
    - Implement responsive behavior: horizontal collage on ≥768px, vertical stack on <768px
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.2, 7.5_

  - [ ]* 1.2 Write property test for `fillImageSlots` — image slot filling
    - **Property 1: Image slot filling always produces exactly 5 slots**
    - **Validates: Requirements 2.3**

  - [ ]* 1.3 Write property test for alt attributes on gallery images
    - **Property 7: All gallery images have descriptive alt attributes**
    - **Validates: Requirements 7.5**

- [x] 2. Create RoomAmenitiesOverview component
  - [x] 2.1 Create `frontend/src/components/rooms/RoomAmenitiesOverview.tsx`
    - Accept `amenities: string[]` and `roomName: string` props
    - Map each amenity string to an emoji icon + label pair (matching existing pattern in RoomSchedule)
    - Display section title "Tổng Quan Tiện Nghi Phòng"
    - Show fallback message "Chưa có thông tin tiện nghi" when amenities array is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.2 Write property test for amenities rendering
    - **Property 4: All amenities are rendered**
    - **Validates: Requirements 4.2, 4.3**

- [x] 3. Checkpoint — Verify new components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Refactor RoomDetailPageRoute and RoomDetailPage to use real API data
  - [x] 4.1 Rewrite `frontend/src/components/rooms/RoomDetailRoute.tsx` to extract room ID from URL params and fetch data
    - Use `useParams()` to get `id` from `/phong-nghi/:id`
    - Fetch room detail via `roomService.getById(id)`
    - After room loads, fetch sibling rooms via `roomService.getAll({ branchId: room.branchId })` (skip if no branchId)
    - Fetch bookings via `bookingService.getByDate(dateStr)` for the selected date
    - Manage loading, error, and selectedDate state
    - Display loading indicator while fetching
    - Display "Phòng không tìm thấy" error with link back to `/phong-nghi` on 404 or fetch error
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Rewrite `frontend/src/components/rooms/room-detail-page.tsx` as a presentational component
    - Accept props: `room: RoomDetail`, `branchRooms: RoomDetail[]`, `bookings: Booking[]`, `selectedDate`, `onDateChange`, `onBookingCreate`
    - Render `RoomImageGallery` with images resolved via `imageUrl()` helper
    - Render `RoomAmenitiesOverview` with room's amenities
    - Map `RoomDetail[]` → `Room[]` using `toScheduleRoom()` and pass to existing `RoomSchedule`
    - Pass bookings, date, and callbacks to `RoomSchedule`
    - Use semantic HTML elements (section, headings) for proper document structure
    - _Requirements: 1.2, 1.3, 2.4, 5.1, 5.2, 7.1, 7.6_

  - [ ]* 4.3 Write property test for room type filtering
    - **Property 3: Room type filter displays exactly matching rooms**
    - **Validates: Requirements 3.5, 5.6**

- [x] 5. Register the `/phong-nghi/:id` route in main.tsx
  - [x] 5.1 Add the route inside the existing `App` layout route in `frontend/src/main.tsx`
    - Add `<Route path="/phong-nghi/:id" element={<RoomDetailPageRoute />} />` alongside the existing `/phong-nghi` route
    - Ensure the import for `RoomDetailPageRoute` is correct (it's already imported)
    - _Requirements: 1.1_

- [x] 6. Wire room card navigation to detail page
  - [x] 6.1 Update `GalleryGrid` or `RestRoomPage` to navigate to `/phong-nghi/:roomId` when a room card is clicked
    - Pass the room's actual ID to the navigation path
    - Ensure the click handler uses `navigate(`/phong-nghi/${room.id}`)` with the real room ID from the API
    - _Requirements: 1.1_

- [x] 7. Checkpoint — Verify routing and data flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Handle date change and booking creation integration
  - [x] 8.1 Implement date change callback in RoomDetailPageRoute
    - When `onDateChange` fires from RoomSchedule, update `selectedDate` state and re-fetch bookings via `bookingService.getByDate(newDateStr)`
    - _Requirements: 3.2, 3.3, 5.5_

  - [x] 8.2 Implement booking creation callback
    - When `onBookingCreate` fires, call `bookingService.create(newBooking)` and refresh the bookings list for the current date
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 8.3 Write property test for booking block position calculation
    - **Property 5: Booking block position is proportional to time**
    - **Validates: Requirements 5.3**

- [x] 9. Implement amenity legend filtering consistency
  - [x] 9.1 Ensure the amenity legend in RoomSchedule respects active room type filters
    - Verify the existing RoomSchedule footer legend only shows rooms matching active filters
    - If the legend is currently hardcoded, update it to dynamically render based on `filteredRooms` and their amenities from `RoomDetail`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 9.2 Write property test for amenity legend filter consistency
    - **Property 6: Amenity legend respects active room type filters**
    - **Validates: Requirements 6.2, 6.3**

- [x] 10. Responsive layout and accessibility polish
  - [x] 10.1 Ensure responsive behavior across all components
    - Verify Image Gallery stacks vertically on screens <768px
    - Verify Toolbar wraps filter tabs on narrow screens
    - Verify Schedule Timeline remains horizontally scrollable on all screen sizes
    - Add any missing responsive Tailwind classes
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 10.2 Add semantic HTML and accessibility attributes
    - Ensure all gallery images have descriptive `alt` attributes containing room name
    - Use semantic elements: `<section>`, `<h2>`, `<nav>` where appropriate
    - Verify the page renders within the existing Header/Footer layout
    - _Requirements: 7.1, 7.5, 7.6_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The existing `RoomSchedule` and `BookingModal` components are reused as-is — no modifications needed for their core logic
- The existing `RoomDetailRoute.tsx` and `room-detail-page.tsx` will be refactored in-place (not new files)
- Property tests use `fast-check` library with minimum 100 iterations per property
- `imageUrl()` from `roomService.ts` is already implemented and handles relative → absolute URL resolution
