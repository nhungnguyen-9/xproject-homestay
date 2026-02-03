import { useEffect } from "react"
import { useLocation } from "react-router"

export function ScrollToTop({ smooth = false }: { smooth?: boolean }) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" })
  }, [pathname, smooth])

  return null
}
