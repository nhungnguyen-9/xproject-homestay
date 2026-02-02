import { useEffect, useState } from "react"
import { Toaster } from "sonner"
import { Footer } from "./components/footer/footer"
import { GalleryGrid } from "./components/gallery-grid"
import { Header } from "./components/header/header"
import { HeroBanner } from "./components/hero/hero-banner"
import { LocationPage } from "./components/locations/location-page"
import { DestinationPage } from "./components/locations/destination-page"
import { RoomDetailPage } from "./components/rooms/room-detail-page"
import { destinationSuites } from "./data/destination-suites"

function App() {
  const [view, setView] = useState<"home" | "locations" | "destination" | "room">("home")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === "#locations") {
        setView("locations")
        setSelectedLocation(null)
        setSelectedSuiteId(null)
      } else if (hash.startsWith("#destination-")) {
        setView("destination")
        setSelectedLocation(decodeURIComponent(hash.replace("#destination-", "")))
        setSelectedSuiteId(null)
      } else if (hash.startsWith("#room-")) {
        setView("room")
        setSelectedSuiteId(decodeURIComponent(hash.replace("#room-", "")))
      } else {
        setView("home")
        setSelectedLocation(null)
        setSelectedSuiteId(null)
      }
    }

    handleHashChange()

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <Header
          onLogoClick={() => (window.location.hash = "#locations")}
          onBranchClick={() => (window.location.hash = "#locations")}
        />
        {view === "home" ? (
          <>
            <HeroBanner />
            <GalleryGrid />
          </>
        ) : view === "locations" ? (
          <LocationPage
            onSelectLocation={(location) => {
              const encoded = encodeURIComponent(location.name)
              window.location.hash = `#destination-${encoded}`
            }}
          />
        ) : view === "destination" ? (
          <DestinationPage locationName={selectedLocation ?? "Homestay"} />
        ) : (
          <RoomDetailPage
            suite={destinationSuites.find((suite) => suite.id === selectedSuiteId) ?? destinationSuites[0]}
            locationName={selectedLocation ?? "Homestay"}
          />
        )}
        <Footer />
      </div>
      <Toaster richColors position="top-center" />
    </>
  )
}

export default App
