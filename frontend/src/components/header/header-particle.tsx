import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { loadEmittersPlugin } from "tsparticles-plugin-emitters"
import type { Engine } from "tsparticles-engine"
import { useCallback } from "react"

/**
 * Hiệu ứng hạt hình trái tim bay lên — dùng trong thanh header
 */
export const HeartParticles = () => {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine)
        await loadEmittersPlugin(engine)
    }, [])

    return (
        <Particles
            id="tsparticles"
            className="absolute inset-0 pointer-events-none z-0"
            init={particlesInit}
            options={{
                fullScreen: false,
                fpsLimit: 60,
                particles: {
                    number: {
                        value: 8,
                        density: { enable: true, area: 1000 }
                    },
                    shape: {
                        type: "character",
                        character: {
                            value: ["❤", "💕"],
                            font: "Verdana",
                        },
                    },
                    color: { value: ["#ff6b9d", "#ffc0cb", "#f  fffff"] },
                    opacity: { value: 0.6 },
                    size: { value: { min: 10, max: 14 } },
                    move: {
                        enable: true,
                        speed: 0.9,
                        direction: "top",
                        random: true,
                        straight: false,
                        outModes: { default: "out", top: "destroy" }
                    }
                },
                emitters: {
                    position: { x: 50, y: 100 },
                    rate: { delay: 2.2, quantity: 1 },
                    size: { width: 120, height: 0 }
                },
                detectRetina: true,
            }}
        />
    )
}