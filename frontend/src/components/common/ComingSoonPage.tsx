export const ComingSoonPage = () => (
    <div className="flex min-h-[60vh] items-center justify-center px-8 py-16">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-12">
            {/* Rocket illustration */}
            <div className="relative flex h-52 w-52 shrink-0 items-end justify-center rounded-full bg-[#1B3A5C]">
                {/* Stars */}
                <span className="absolute left-8 top-8 h-3 w-3 rounded-full bg-red-400" />
                <span className="absolute right-10 top-12 h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="absolute left-14 bottom-16 h-2 w-2 rounded-full bg-red-400" />
                <span className="absolute right-8 bottom-20 h-2 w-2 rounded-full bg-yellow-300" />

                {/* Rocket body */}
                <div className="relative mb-4 flex flex-col items-center">
                    <img src="https://cdn-icons-png.flaticon.com/512/5731/5731863.png" alt="" />
                </div>
            </div>

            {/* Text */}
            <div className="text-center sm:text-left">
                <h1 className="font-['Georgia',serif] text-6xl font-bold italic text-[#1B3A5C] leading-tight sm:text-7xl">
                    Coming<br />Soon
                </h1>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1B3A5C]/60">
                    This page is under<br />construction
                </p>
            </div>
        </div>
    </div>
)
