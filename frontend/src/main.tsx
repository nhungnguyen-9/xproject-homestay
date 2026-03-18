import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";
import './index.css'
import App from './App.tsx'
import { Home } from './components/home/home.tsx';
import { LocationPage } from './components/locations/location-page.tsx';
import { DestinationPage } from './components/locations/destination-page.tsx';
import RoomDetailRoute from './components/rooms/RoomDetailRoute.tsx'
import { ScrollToTop } from './components/common/ScrollToTop.tsx';
import { AdminLayout } from './components/layouts/AdminLayout.tsx';
import {
  AdminBookingsPage,
  AdminDashboardPage,
  AdminRoomsPage,
  AdminSettingsPage,
} from './components/layouts/admin-pages.tsx';
import { RoomManagement } from './components/admin/room-management.tsx';

// Khởi tạo ứng dụng và gắn kết vào phần tử 'root' trong HTML
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Sử dụng BrowserRouter để quản lý định tuyến trong ứng dụng */}
    <BrowserRouter>
      {/* Thành phần giúp tự động cuộn lên đầu trang khi chuyển trang */}
      <ScrollToTop />
      <Routes>
        {/* Định nghĩa các đường dẫn (Routes) chính của ứng dụng */}
        <Route path="/" element={<App />}>
          {/* Trang chủ */}
          <Route path="/" element={<Home />} />
          {/* Danh sách các chi nhánh */}
          <Route path="/chi-nhanh" element={<LocationPage />} />
          {/* Chi tiết từng chi nhánh theo ID */}
          <Route path="/chi-nhanh/:id" element={<DestinationPage />} />
          {/* Chi tiết hạng phòng theo ID */}
          <Route path="/hang-phong/:id" element={<RoomDetailRoute />} />
        </Route>

        {/* Nhóm route khu vực quản lý nội bộ */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="management" element={<RoomManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
