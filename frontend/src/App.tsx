import { Toaster } from "sonner"
import { Footer } from "./components/footer/footer"
import { Header } from "./components/header/header"
import { Outlet } from "react-router";

/**
 * Layout chính của ứng dụng, bao gồm Header, nội dung và Footer
 */
function App() {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header
          onLogoClick={() => (window.location.hash = "#locations")}
        />

        <main className="relative bg-background flex-1">
          {/* <MainHearts />
          <MainSnowfall flakes={30} /> */}
          <Outlet />
        </main>

        <Footer />
      </div>

      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
