import React from "react"

interface SnowfallProps {
    flakes?: number
}

export const MainSnowfall: React.FC<SnowfallProps> = ({ flakes = 24 }) => {
    const snowflakes = React.useMemo(() => {
        return Array.from({ length: flakes }).map((_, i) => {
            const left = Math.random() * 100
            // slightly increase base size/range to make flakes a bit more visible
            const size = 6 + Math.random() * 10
            const delay = Math.random() * 10
            const duration = 10 + Math.random() * 14
            const opacity = 0.55 + Math.random() * 0.35
            const swing = (Math.random() * 30) - 15
            return { key: i, left, size, delay, duration, opacity, swing }
        })
    }, [flakes])

    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-20">
            <style>{`
        @keyframes fallMain { 0% { transform: translateY(-20vh) } 100% { transform: translateY(120vh) } }
        @keyframes swayMain { 0% { transform: translateX(0) } 50% { transform: translateX(var(--swing)) } 100% { transform: translateX(0) } }
      `}</style>

            {snowflakes.map((f) => (
                <div
                    key={f.key}
                    style={{
                        position: "absolute",
                        left: `${f.left}%`,
                        top: `-25vh`,
                        width: `${f.size * 1.8}px`,
                        height: `${f.size * 1.8}px`,
                        pointerEvents: "none",
                        transform: "translateZ(0)",
                        willChange: "transform, opacity",
                        animation: `fallMain ${f.duration}s linear ${-f.delay}s infinite`,
                        opacity: f.opacity,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg
                        width={f.size * 1.12}
                        height={f.size * 1.12}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            // @ts-ignore
                            ["--swing" as any]: `${f.swing}px`,
                            animation: `swayMain ${Math.max(3, f.duration / 3)}s ease-in-out ${-f.delay}s infinite alternate`,
                            transformOrigin: "center",
                            opacity: 1,
                            display: "block",
                        }}
                        aria-hidden
                    >
                        <g stroke="rgba(255,255,255,0.9)" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" fill="none">
                            <g transform="translate(12,12)">
                                <path d="M0 -6 L0 -2" />
                                <path d="M0 2 L0 6" />
                                <path d="M-4 -3 L-2 -1" />
                                <path d="M4 3 L2 1" />
                                <path d="M-4 3 L-2 1" />
                                <path d="M4 -3 L2 -1" />
                                <circle cx="0" cy="0" r="1.0" fill="rgba(255,255,255,0.92)" />
                            </g>
                        </g>
                    </svg>
                </div>
            ))}
        </div>
    )
}

export default MainSnowfall
