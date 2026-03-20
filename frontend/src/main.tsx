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
import { AdminSettingsPage } from './components/layouts/admin-pages.tsx';
import { BookingSchedule } from './components/admin/booking-schedule.tsx';
import { CustomerList } from './components/admin/customer-list.tsx';
import { CustomerDetail } from './components/admin/customer-detail.tsx';
import { PromoManager } from './components/admin/promo-manager.tsx';
import { TelegramConfig } from './components/admin/telegram-config.tsx';
import { RevenueDashboard } from './components/admin/revenue-dashboard.tsx';
import { RoomManagement } from './components/admin/room-management.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/" element={<Home />} />
          <Route path="/chi-nhanh" element={<LocationPage />} />
          <Route path="/chi-nhanh/:id" element={<DestinationPage />} />
          <Route path="/hang-phong/:id" element={<RoomDetailRoute />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<RevenueDashboard />} />
          <Route path="bookings" element={<BookingSchedule />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="promos" element={<PromoManager />} />
          <Route path="telegram" element={<TelegramConfig />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="management" element={<RoomManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
