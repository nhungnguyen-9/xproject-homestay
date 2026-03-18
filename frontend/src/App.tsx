import { Toaster } from "sonner"
import { Footer } from "./components/footer/footer"
import { Header } from "./components/header/header"
import { Outlet } from "react-router";
import MainHearts from "./components/common/MainHearts"
import MainSnowfall from "./components/common/MainSnowfall"

/**
 * Thành phần App chính - Layout bao quanh toàn bộ ứng dụng
 * Bao gồm Header, nội dung chính (Outlet) và Footer
 */
function App() {
  return (
    <>
      {/* Container chính bao phủ toàn màn hình với cấu trúc flex-column */}
      <div className="flex min-h-screen flex-col">
        {/* Thanh Header của ứng dụng */}
        <Header
          onLogoClick={() => (window.location.hash = "#locations")}
        />
        
        {/* Phần nội dung thay đổi theo đường dẫn định tuyến */}
        <main className="relative">
          {/* Các hiệu ứng trang trí nền (đang tạm thời bị comment) */}
          {/* <MainHearts />
          <MainSnowfall flakes={30} /> */}
          <Outlet />
        </main>
        
        {/* Chân trang ứng dụng */}
        <Footer />
      </div>
      
      {/* Thành phần thông báo (toast notifications) với giao diện hiện đại */}
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
