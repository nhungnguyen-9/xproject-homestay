import { Button } from "@/components/ui/button"
import { FooterParticles } from "@/components/footer/footer-particle"

export const Footer = () => {
    return (
        <footer className="relative overflow-hidden border-t border-[#E2E8F0] bg-white">

            <FooterParticles />

            <div className="relative z-10 flex flex-col md:flex-row justify-around py-7 gap-6 md:gap-0 items-center md:items-start">
                <div className="w-full md:w-auto text-center md:text-left">
                    <img
                        src="https://github.com/shadcn.png"
                        alt="logo"
                        className="rounded-full w-12 h-12 mx-auto md:mx-0"
                    />
                    <p className="mt-3 italic text-sm text-slate-600">
                        Chốn lặng thinh - Vị đậm tình
                    </p>
                </div>

                <div className="w-full md:w-auto text-center md:text-left">
                    <h2 className="text-[#0F172A] font-semibold text-xl">
                        Chính sách
                    </h2>
                    <div className="bg-[#F87171] w-14 h-1 my-2 mx-auto md:mx-0"></div>

                    <p className="my-2 text-slate-700">Policy Privacy</p>
                    <p className="my-2 text-slate-700">Terms of Service</p>
                    <p className="my-2 text-slate-700">Hình thức thanh toán</p>
                    <p className="my-2 text-slate-700">Hướng dẫn sử dụng</p>
                    <p className="my-2 text-slate-700">Hướng dẫn Check in</p>
                </div>

                <div className="w-full md:w-auto text-center md:text-left">
                    <h2 className="text-[#0F172A] font-semibold text-xl">
                        Hỗ trợ thanh toán
                    </h2>
                    <div className="bg-[#F87171] w-14 h-1 my-2 mx-auto md:mx-0"></div>

                    <Button variant="outline" className="my-2">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/6/68/VietQR_Logo.svg"
                            alt="qr"
                            className="w-16"
                        />
                    </Button>
                </div>
            </div>

            <div className="relative z-10 text-center">
                <hr className="my-3 mx-auto w-1/2 border-slate-200" />
                <p className="my-3 text-slate-500">
                    © Copyright HomeStay XGroup 2025. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
