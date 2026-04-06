import { Home, FileText, CreditCard, ArrowRight } from "lucide-react"

const BOOKING_STEPS = [
    {
        num: 1,
        icon: <Home className="h-8 w-8 text-[#F87171]" />,
        title: "Chọn phòng & dịch vụ",
        items: ["Hình thức đặt phòng", "Chọn phòng phù hợp", "Thời gian nhận/trả", "Đồ ăn & dịch vụ"],
        border: "border-[#F87171]",
    },
    {
        num: 2,
        icon: <FileText className="h-8 w-8 text-[#F59E0B]" />,
        title: "Điền thông tin khách",
        items: ["Họ tên khách hàng", "Số điện thoại", "Ảnh CMND/CCCD", "Chấp nhận điều khoản"],
        border: "border-[#F59E0B]",
    },
    {
        num: 3,
        icon: <CreditCard className="h-8 w-8 text-[#22C55E]" />,
        title: "Thanh toán QR Code",
        items: ["Quét mã QR VietQR", "Chuyển khoản ngân hàng", "Thanh toán trong 5 phút"],
        border: "border-[#22C55E]",
    },
]

const BOOKING_GUIDE = [
    { color: "bg-[#FFBEA0]", badge: "bg-[#F08A5D]", text: "Tham khảo thông tin, giá phòng và lịch trống tại link." },
    { color: "bg-[#FFD3A1]", badge: "bg-[#F7A440]", text: "Gọi điện hoặc nhắn tin trực tiếp (Zalo/Fanpage) để được Home tư vấn." },
    { color: "bg-[#FFF3A0]", badge: "bg-[#F4C430]", text: "Xác nhận đặt phòng, thanh toán (banking) và gửi hóa đơn/CCCD." },
    { color: "bg-[#F9C3D1]", badge: "bg-[#E26D8A]", text: "Nhận hướng dẫn check-in chi tiết từ admin." },
]

const CHECKIN_STEPS = [
    "Nhập pass vào hộp khóa trước cửa để mở mã cửa cuộn.",
    "Vào bên trong bấm nút để bảng điều khiển mở hoặc đóng từ bên trong.",
    "Nhập pass home đã cung cấp để mở hộp khóa lấy chìa vào phòng.",
]

const CHECKIN_IMAGES = [
    "./images/generated-1773764444394.png",
    "./images/generated-1773764463695.png",
    "./images/generated-1773764486731.png",
]

export const InstructionPage = () => {
    return (
        <div className="flex flex-col gap-0">

            {/* Section 1 — Booking Flow */}
            <section
                className="px-4 py-16 sm:px-8"
                style={{ background: "linear-gradient(135deg, #FFF0F0 0%, #FFF8EC 40%, #F0FFF4 100%)" }}
            >
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10 text-center">
                        <h2 className="text-2xl font-extrabold text-[#2B2B2B] sm:text-[30px]">
                            Quy trình đặt phòng tại Nhà Cam
                        </h2>
                        <p className="mt-2 text-sm text-[#9B8B7A]">Chỉ 3 bước đơn giản để có phòng nghỉ ưng ý</p>
                    </div>

                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        {BOOKING_STEPS.map((step, i) => (
                            <div key={step.num} className="flex flex-1 items-center">
                                {/* Card */}
                                <div className={`relative flex flex-1 flex-col gap-4 rounded-2xl border-t-4 bg-white px-6 pb-6 pt-10 shadow-sm ${step.border}`}>
                                    {/* Number badge — centered top */}
                                    <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-[#F87171] text-sm font-extrabold text-white shadow">
                                        {step.num}
                                    </div>
                                    {/* Icon */}
                                    <div className="flex justify-center">{step.icon}</div>
                                    {/* Title */}
                                    <h3 className="text-center text-base font-extrabold text-[#2B2B2B]">{step.title}</h3>
                                    {/* Items */}
                                    <ul className="flex flex-col gap-1.5">
                                        {step.items.map((item) => (
                                            <li key={item} className="flex items-start gap-1.5 text-sm text-[#4B4540]">
                                                <span className="shrink-0 text-[#9B8B7A]">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Arrow */}
                                {i < BOOKING_STEPS.length - 1 && (
                                    <ArrowRight className="mx-3 hidden h-5 w-5 shrink-0 text-[#C4B5A8] sm:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 2 — Hướng dẫn đặt phòng & Check-in */}
            <section className="px-4 py-14 sm:px-8" style={{ background: "linear-gradient(135deg, #FFF0F0 0%, #FFF8EC 40%, #F0FFF4 100%)" }}>
                <div className="mx-auto max-w-5xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold text-[#E36B3D] sm:text-[28px]">
                            Hướng dẫn đặt phòng & check-in
                        </h2>
                    </div>

                    {/* 2-col layout */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                        {/* LEFT — 4 booking steps */}
                        <div className="flex flex-col gap-3">
                            {BOOKING_GUIDE.map((step, i) => (
                                <div key={i} className={`flex items-start gap-3 rounded-xl ${step.color} px-4 py-3`}>
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.badge} text-md font-extrabold text-white`}>
                                        {i + 1}
                                    </span>
                                    <p className="text-sm font-medium text-[#2B2B2B]">{step.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT — Checkin/Checkout + hướng dẫn checkin */}
                        <div className="flex flex-col gap-4 rounded-2xl">
                            {/* Checkin & Checkout row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-[#BFE7C9] p-4">
                                    <h3 className="mb-1.5 text-md font-extrabold text-[#14532D]">Checkin</h3>
                                    <p className="text-xs leading-relaxed text-[#14532D]">
                                        Nhập pass admin đã gửi vào hộp khóa trước cửa, lấy chìa khóa mở phòng. Có thể checkin muộn.
                                    </p>
                                </div>
                                <div className="rounded-xl bg-[#FFB38B] p-4">
                                    <h3 className="mb-1.5 text-md font-extrabold text-[#7C2D12]">Checkout</h3>
                                    <p className="text-xs leading-relaxed text-[#7C2D12]">
                                        Vui lòng kiểm tra tư trang, tắt thiết bị điện, đóng cửa và để chìa khóa lại vào hộp khóa. Checkout đúng giờ giúp Home bạn nhé.
                                    </p>
                                </div>
                            </div>

                            {/* Hướng dẫn checkin */}
                            <div className="shadow-sm rounded-2xl p-4 my-2 bg-[#FFF7E6]">
                                <h3 className="mb-3 text-lg font-extrabold text-[#B45309]">Hướng dẫn checkin</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Images */}
                                    <div className="flex flex-col gap-3">
                                        {CHECKIN_IMAGES.map((src, i) => (
                                            <img
                                                key={i}
                                                src={src}
                                                alt={`checkin-${i + 1}`}
                                                className="h-34 w-full rounded-xl object-cover"
                                            />
                                        ))}
                                    </div>

                                    {/* Steps */}
                                    <div className="flex flex-col gap-3">
                                        {CHECKIN_STEPS.map((step, i) => (
                                            <div key={i} className="flex items-start gap-2 rounded-xl bg-white p-3">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-sm font-extrabold text-white">
                                                    {i + 1}
                                                </span>
                                                <p className="text-sm font-semibold leading-relaxed text-[#3A2F2A]">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    )
}
