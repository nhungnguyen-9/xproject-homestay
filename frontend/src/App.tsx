import { Toaster } from "sonner"
import { Header } from "./components/header/header"
import { Footer } from "./components/footer/footer"

function App() {
  return (
    <>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
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
          <main className="flex-1 overflow-y-auto bg-[#f8f8f8]">
            Main
          </main>

          <Footer />
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
