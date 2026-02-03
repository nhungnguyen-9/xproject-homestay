import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import { loadEmittersPlugin } from "tsparticles-plugin-emitters"
import type { Engine } from "tsparticles-engine"
import { useCallback, useMemo } from "react"

type Props = {
    count?: number
    emitterY?: number
    speed?: number
    className?: string
}

export default function MainHearts({ count, emitterY = 95, speed = 0.7, className = "" }: Props) {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine)
        await loadEmittersPlugin(engine)
    }, [])

    // show a random 10-12 hearts by default if `count` not provided
    const heartCount = useMemo(() => {
        if (typeof count === "number") return count
        return 8 + Math.floor(Math.random() * 3)
    }, [count])

    return (
        <Particles
            id="main-hearts"
            className={`absolute inset-0 pointer-events-none ${className}`}
            init={particlesInit}
            options={{
                fullScreen: false,
                fpsLimit: 60,
                particles: {
                    // spawn a fixed number of hearts which drift upwards
                    number: { value: heartCount, density: { enable: false, area: 10000 } },
                    shape: { type: "character", character: { value: ["❤", "💕", "💖"], font: "Verdana" } },
                    color: { value: ["#ffdce6", "#ffeef6", "#fff5f8", "#ffffff"] },
                    opacity: { value: 0.5 },
                    size: { value: { min: 7, max: 14 } },
                    move: { enable: true, speed, direction: "top", random: true, straight: false, outModes: { default: "out", top: "destroy" } },
                },
                detectRetina: true,
            }}
        />
    )
}
