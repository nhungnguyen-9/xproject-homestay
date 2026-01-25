import { Toaster } from "sonner"
import { Header } from "./components/header"
import { Footer } from "./components/footer"

function App() {
  return (
    <>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <Header />

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
