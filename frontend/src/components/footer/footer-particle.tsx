import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { useCallback } from "react"

/**
 * Hiệu ứng hạt hình trái tim nổi nhẹ — dùng làm nền cho chân trang
 */
export const FooterParticles = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const particlesInit = useCallback(async (engine: any) => {
        await loadSlim(engine)
    }, [])

    return (
        <Particles
            id="footer-particles"
            init={particlesInit}
            className="absolute inset-0 pointer-events-none z-0"
            options={{
                fullScreen: false,
                fpsLimit: 60,

                particles: {
                    number: {
                        value: 2,
                        density: {
                            enable: false,
                        },
                    },

                    shape: {
                        type: "character",
                        character: {
                            value: ["❤", "❤"],
                            font: "Verdana",
                        },
                    },

                    color: {
                        value: ["#ff6b9d", "#ffc0cb"],
                    },

                    opacity: { value: 0.9 },

                    size: { value: { min: 6, max: 10 } },

                    move: {
                        enable: true,
                        speed: 0.45,
                        direction: "none",
                        random: true,
                        straight: false,
                        outModes: { default: "bounce" },
                    },
                },

                detectRetina: true,
            }}
        />
    )
}
