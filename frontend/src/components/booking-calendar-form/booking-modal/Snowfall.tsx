import React from "react";

interface SnowfallProps {
    flakes?: number;
}

/**
 * Hiệu ứng tuyết rơi trang trí — tạo các bông tuyết CSS animation rơi ngẫu nhiên trong modal
 */
export const Snowfall: React.FC<SnowfallProps> = ({ flakes = 20 }) => {
    const snowflakes = React.useMemo(() => {
        return Array.from({ length: flakes }).map((_, i) => {
            const left = Math.random() * 100;
            const size = 3 + Math.random() * 6;
            const delay = Math.random() * 30;
            const duration = 18 + Math.random() * 18;
            const opacity = 0.35 + Math.random() * 0.45;
            const swing = (Math.random() * 20) - 10;
            return { key: i, left, size, delay, duration, opacity, swing };
        });
    }, [flakes]);

    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-[9999]">
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(-15vh); }
                    100% { transform: translateY(115vh); }
                }
                @keyframes sway {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(var(--swing)); }
                    100% { transform: translateX(0); }
                }
            `}</style>

            {snowflakes.map((f) => (
                <div
                    key={f.key}
                    style={{
                        position: "absolute",
                        left: `${f.left}%`,
                        top: `-20vh`,
                        width: `${f.size}px`,
                        height: `${f.size}px`,
                        pointerEvents: "none",
                        transform: "translateZ(0)",
                        willChange: "transform, opacity",
                        animation: `fall ${f.duration}s linear ${-f.delay}s infinite`,
                        opacity: f.opacity,
                    }}
                >
                    <div
                        style={{
                            width: `${f.size}px`,
                            height: `${f.size}px`,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.95)",
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            ["--swing" as any]: `${f.swing}px`,
                            animation: `sway ${Math.max(3, f.duration / 3)}s ease-in-out ${-f.delay}s infinite alternate`,
                            filter: "blur(0.2px)",
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default Snowfall;
