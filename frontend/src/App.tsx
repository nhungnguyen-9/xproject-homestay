import { Toaster } from "sonner"
import { Footer } from "./components/footer/footer"
import { Header } from "./components/header/header"
import { Outlet } from "react-router";
// import RoomSchedule from "./components/schedule"
// import { demoBookings, demoRooms } from "./data/demo-schedule"

function App() {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header
          onLogoClick={() => (window.location.hash = "#locations")}
        />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
