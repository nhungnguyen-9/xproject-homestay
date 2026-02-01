import { Toaster } from "sonner"
import { Header } from "./components/header/header"
import { Footer } from "./components/footer/footer"
// import RoomSchedule from "./components/schedule"
// import { demoBookings, demoRooms } from "./data/demo-schedule"

function App() {
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header />

        {/* hero */}
        <div className="w-full h-[420px] overflow-hidden">
          <img
            src="https://ohdidi.vn/uploads/static/HOMES/tp-ho-chi-minh/Saison%20Homestay%20-%20Vo%20Th%E1%BB%8B%20Sau/saison_home_2_8.jpg"
            alt="hero"
            className="w-full h-full object-cover"
          />
        </div>

        {/* main */}
        <main className="flex-1 bg-[#f8f8f8] p-6">
          {/* <RoomSchedule
            date={new Date()}
            rooms={demoRooms}
            bookings={demoBookings}
            startHour={0}
            endHour={22}
            onDateChange={(date) => console.log('Date changed:', date)}
            onBookingClick={(booking) => console.log('Booking clicked:', booking)}
          /> */}
        </main>

        <Footer />
      </div>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
