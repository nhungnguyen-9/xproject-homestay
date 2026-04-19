import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from 'sonner';
import './index.css'
import App from './App.tsx'
import { Home } from './components/home/home.tsx';
import { LocationPage } from './components/locations/location-page.tsx';
import { DestinationPage } from './components/locations/destination-page.tsx';
import RoomDetailRoute from './components/rooms/RoomDetailRoute.tsx'
import { ScrollToTop } from './components/common/ScrollToTop.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { AdminLayout } from './components/layouts/AdminLayout.tsx';
import { AdminSettingsPage } from './components/layouts/admin-pages.tsx';
import { BookingSchedule } from './components/admin/booking-schedule.tsx';
import { CustomerList } from './components/admin/customer-list.tsx';
import CustomerDetailRoute from './components/admin/CustomerDetailRoute.tsx';
import { PromoManager } from './components/admin/promo-manager.tsx';
import { TelegramConfig } from './components/admin/telegram-config.tsx';
import { RevenueDashboard } from './components/admin/revenue-dashboard.tsx';
import { RoomManagement } from './components/admin/room-management.tsx';
import { BranchManagement } from './components/admin/branch-management.tsx';
import { StaffManagement } from './components/admin/staff-management.tsx';
import * as bookingService from './services/bookingService';
import * as customerService from './services/customerService';
import * as promoService from './services/promoService';
import * as telegramService from './services/telegramService';
import { BookingPage } from './components/booking/BookingPage.tsx';
import { ImageLibraryPage } from './components/images-library/ImageLibraryPage.tsx';
import { RestRoomPage } from './components/rest-room/RestRoomPage.tsx';
import { ComingSoonPage } from './components/common/ComingSoonPage.tsx';
import { InstructionPage } from './components/instruction/InstructionPage.tsx';

/** Khởi tạo các service (nạp dữ liệu mẫu vào localStorage lần đầu) */
bookingService.init();
customerService.init();
promoService.init();
telegramService.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<Home />} />
          <Route path="/phong-nghi" element={<RestRoomPage />} />
          <Route path="/phong-nghi/:id" element={<RoomDetailRoute />} />
          <Route path="/huong-dan" element={<InstructionPage />} />
          <Route path="/dat-phong" element={<BookingPage />} />
          <Route path="/thu-vien-anh" element={<ImageLibraryPage />} />
          <Route path="/chinh-sach" element={<ComingSoonPage />} />
          <Route path="/huong-dan" element={<InstructionPage />} />
        </Route>

        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<RevenueDashboard />} />
            <Route path="bookings" element={<BookingSchedule />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetailRoute />} />
            <Route path="promos" element={<PromoManager />} />
            <Route path="telegram" element={<TelegramConfig />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="management" element={<RoomManagement />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="staff" element={<StaffManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
