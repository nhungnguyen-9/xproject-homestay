import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { loadEmittersPlugin } from "tsparticles-plugin-emitters"
import type { Engine } from "tsparticles-engine"
import { useCallback } from "react"

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
                        density: { enable: true, area: 800 }
                    },
                    shape: {
                        type: "character",
                        character: {
                            value: ["❤", "💕"],
                            font: "Verdana",
                        },
                    },
                    color: { value: ["#ff6b9d", "#ffc0cb", "#ffffff"] },
                    opacity: { value: 0.7 },
                    size: { value: { min: 12, max: 18 } },
                    move: {
                        enable: true,
                        speed: 0.9,
                        direction: "top",
                        random: { enable: true, minimumValue: 0.25 },
                        straight: false,
                        outModes: { default: "out", top: "destroy" }
                    }
                },
                emitters: {
                    position: { x: 50, y: 100 },
                    rate: { delay: 0.5, quantity: 1 },
                    size: { width: 120, height: 0 }
                },
                detectRetina: true,
            }}
        />
    )
}
