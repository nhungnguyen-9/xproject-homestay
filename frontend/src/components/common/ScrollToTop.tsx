import { useEffect } from "react"
import { useLocation } from "react-router"

/**
 * Cuộn về đầu trang mỗi khi đường dẫn thay đổi — đặt ở gốc cây route
 */
export function ScrollToTop({ smooth = false }: { smooth?: boolean }) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" })
  }, [pathname, smooth])

  return null
}
