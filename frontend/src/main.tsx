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
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
