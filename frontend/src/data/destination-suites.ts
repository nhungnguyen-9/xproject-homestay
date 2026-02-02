import { Bath, Coffee, Flower2, MoonStar, Music, Projector, Sparkles, Wifi, Wine } from "lucide-react"
import type { ComponentType } from "react"
import imageHome1 from "../assets/image_home1.png"
import imageHome2 from "../assets/image_home2.png"
import imageHome3 from "../assets/image_home3.png"

export type DestinationSuite = {
  id: string
  title: string
  subtitle: string
  badge: string
  priceLabel: string
  highlights: { label: string; value: string }[]
  amenities: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string }[]
  image: string
}

export const destinationSuites: DestinationSuite[] = [
  {
    id: "standard",
    title: "Tiêu chuẩn",
    subtitle: "Khám phá phòng Instagram-ready",
    badge: "PHÒNG TIÊU CHUẨN",
    priceLabel: "2H chỉ từ 169K",
    highlights: [
      { label: "5 giờ", value: "259k" },
      { label: "Đêm", value: "299k" },
      { label: "Ngày", value: "399k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Coffee, label: "Set sáng tạo" },
      { icon: Projector, label: "Máy chiếu" },
    ],
    image: imageHome1,
  },
  {
    id: "deluxe",
    title: "Deluxe",
    subtitle: "Dịch vụ nâng cao & view thanh thản",
    badge: "PHÒNG DELUXE",
    priceLabel: "2H chỉ từ 249K",
    highlights: [
      { label: "5 giờ", value: "299k" },
      { label: "Đêm", value: "349k" },
      { label: "Ngày", value: "449k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Wine, label: "Mini bar" },
      { icon: MoonStar, label: "View phố đêm" },
    ],
    image: imageHome2,
  },
  {
    id: "suite-doi",
    title: "Suite đôi",
    subtitle: "Gonospace cho trải nghiệm riêng tư",
    badge: "SUITE ĐÔI",
    priceLabel: "2H chỉ từ 329K",
    highlights: [
      { label: "5 giờ", value: "359k" },
      { label: "Đêm", value: "399k" },
      { label: "Ngày", value: "499k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Sparkles, label: "Gương selfie" },
      { icon: Music, label: "Âm thanh sống động" },
    ],
    image: imageHome3,
  },
  {
    id: "premium",
    title: "Premium",
    subtitle: "Phòng decor sống động & thư giãn",
    badge: "PREMIUM STAY",
    priceLabel: "2H chỉ từ 369K",
    highlights: [
      { label: "5 giờ", value: "379k" },
      { label: "Đêm", value: "429k" },
      { label: "Ngày", value: "529k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Flower2, label: "Decor vườn" },
      { icon: Bath, label: "Bồn tắm đá muối" },
    ],
    image: imageHome1,
  },
  {
    id: "signature",
    title: "Signature",
    subtitle: "Không gian sáng tạo cho cặp đôi",
    badge: "SIGNATURE ROOM",
    priceLabel: "2H chỉ từ 389K",
    highlights: [
      { label: "5 giờ", value: "399k" },
      { label: "Đêm", value: "459k" },
      { label: "Ngày", value: "559k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Projector, label: "Máy chiếu" },
      { icon: Sparkles, label: "Gương selfie" },
    ],
    image: imageHome2,
  },
  {
    id: "garden",
    title: "Garden",
    subtitle: "Tone pastel & góc chill riêng",
    badge: "GARDEN VIEW",
    priceLabel: "2H chỉ từ 349K",
    highlights: [
      { label: "5 giờ", value: "359k" },
      { label: "Đêm", value: "409k" },
      { label: "Ngày", value: "509k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Flower2, label: "Decor vườn" },
      { icon: Coffee, label: "Set sáng tạo" },
    ],
    image: imageHome3,
  },
  {
    id: "citylight",
    title: "Citylight",
    subtitle: "View phố & ánh đèn lấp lánh",
    badge: "CITYLIGHT",
    priceLabel: "2H chỉ từ 419K",
    highlights: [
      { label: "5 giờ", value: "429k" },
      { label: "Đêm", value: "489k" },
      { label: "Ngày", value: "589k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: MoonStar, label: "View phố đêm" },
      { icon: Music, label: "Âm thanh sống động" },
    ],
    image: imageHome1,
  },
  {
    id: "wellness",
    title: "Wellness",
    subtitle: "Thư giãn với ánh sáng dịu",
    badge: "WELLNESS",
    priceLabel: "2H chỉ từ 399K",
    highlights: [
      { label: "5 giờ", value: "409k" },
      { label: "Đêm", value: "469k" },
      { label: "Ngày", value: "569k" },
    ],
    amenities: [
      { icon: Wifi, label: "Wifi miễn phí" },
      { icon: Bath, label: "Bồn tắm đá muối" },
      { icon: Wine, label: "Mini bar" },
    ],
    image: imageHome2,
  },
]
