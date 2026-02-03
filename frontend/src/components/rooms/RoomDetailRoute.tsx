import { useMemo } from "react"
import { useLocation, useParams } from "react-router"
import { RoomDetailPage } from "./room-detail-page"
import { destinationSuites } from "../../data/destination-suites"
import { locationBranches } from "../../data/locations"

export default function RoomDetailRoute() {
  const params = useParams()
  const location = useLocation()
  const suiteId = params.id ?? ""
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const locId = search.get("loc") ?? undefined

  const suite = destinationSuites.find((s) => s.id === suiteId)
  const branch = locId ? locationBranches.find((b) => String(b.id) === String(locId)) : undefined

  if (!suite) {
    return <div className="p-6">Phòng không tìm thấy.</div>
  }

  return <RoomDetailPage suite={suite} locationName={branch?.name ?? ""} />
}
