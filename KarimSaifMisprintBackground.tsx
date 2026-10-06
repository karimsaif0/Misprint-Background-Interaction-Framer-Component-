/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

"use client"

import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    useIsStaticRenderer,
    useReducedMotion,
} from "framer"
import { useEffect, useRef, type CSSProperties } from "react"

type RGB = readonly [number, number, number]

type Preset = "Classic" | "CMYK" | "Candy" | "Retro" | "Mono" | "Custom"

interface KarimSaifMisprintBackgroundProps {
    preset: Preset
    backgroundColor: string
    gridColor: string
    haloColor: string
    baseColor: string
    overlapColor: string
    shiftedColor: string
    farShiftedColor: string
    pixelSize: number
    speed: number
    interaction: boolean
    interactionStrength: number
    interactionRadius: number
    paused: boolean
    style?: CSSProperties
}

interface Palette {
    paper: string
    grid: string
    halo: string
    base: string
    overlap: string
    shifted: string
    far: string
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

const SHIFT_U = -0.22
const SHIFT_W = 0.3

const MAX_DPR = 2
const MAX_CELLS = 65000
const MIN_CELL = 2
const MAX_CELL = 32

const PRESETS: Record<Exclude<Preset, "Custom">, Palette> = {
    Classic: {
        paper: "#FFFFFF",
        grid: "#B3ACA4",
        halo: "#55E3F0",
        base: "#2F5BF2",
        overlap: "#19EC2C",
        shifted: "#F0413A",
        far: "#F2EE12",
    },
    CMYK: {
        paper: "#F5F1E8",
        grid: "#AAA69D",
        halo: "#00D8E8",
        base: "#1261D7",
        overlap: "#00C86B",
        shifted: "#F12A65",
        far: "#FFD51C",
    },
    Candy: {
        paper: "#FFF7FC",
        grid: "#CBB8C8",
        halo: "#4DEBFF",
        base: "#7657FF",
        overlap: "#5BFFB5",
        shifted: "#FF4E91",
        far: "#FFE45E",
    },
    Retro: {
        paper: "#F1E4C8",
        grid: "#A59A83",
        halo: "#52B8B2",
        base: "#315F8C",
        overlap: "#6A9A67",
        shifted: "#C64D3C",
        far: "#D9A928",
    },
    Mono: {
        paper: "#F4F4F0",
        grid: "#A8A8A2",
        halo: "#C9C9C4",
        base: "#222222",
        overlap: "#666662",
        shifted: "#888883",
        far: "#D7D7D1",
    },
}

const fract = (value: number) => value - Math.floor(value)

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

const finite = (value: number, fallback: number) =>
    Number.isFinite(value) ? value : fallback

const hash = (x: number, y: number) =>
    fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453)

const noise = (x: number, y: number) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)

    const fx = x - ix
    const fy = y - iy

    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)

    const a = hash(ix, iy)
    const b = hash(ix + 1, iy)
    const c = hash(ix, iy + 1)
    const d = hash(ix + 1, iy + 1)

    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

export default function KarimSaifMisprintBackground(
    props: KarimSaifMisprintBackgroundProps
) {
    const {
        preset = "Classic",
        backgroundColor = "#FFFFFF",
        gridColor = "#B3ACA4",
        haloColor = "#55E3F0",
        baseColor = "#2F5BF2",
        overlapColor = "#19EC2C",
        shiftedColor = "#F0413A",
        farShiftedColor = "#F2EE12",
        pixelSize = 6,
        speed = 1,
        interaction = true,
        interactionStrength = 1,
        interactionRadius = 110,
        paused = false,
        style,
    } = props

    const hostRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const customPalette: Palette = {
        paper: backgroundColor,
        grid: gridColor,
        halo: haloColor,
        base: baseColor,
        overlap: overlapColor,
        shifted: shiftedColor,
        far: farShiftedColor,
    }

    const palette =
        preset === "Custom"
            ? customPalette
            : (PRESETS[preset] ?? PRESETS.Classic)

    const { paper, grid, halo, base, overlap, shifted, far } = palette

    useEffect(() => {
        const host = hostRef.current
        const canvas = canvasRef.current

        if (!host || !canvas) return

        const context = canvas.getContext("2d", { alpha: false })
        if (!context) return

        const buffer = document.createElement("canvas")
        const bufferContext = buffer.getContext("2d", {
            alpha: false,
            willReadFrequently: true,
        })

        if (!bufferContext) return

        let destroyed = false
        let animationFrame = 0
        let resizeFrame = 0

        let width = 1
        let height = 1

        let cell = Math.max(
            MIN_CELL,
            Math.min(MAX_CELL, Math.round(finite(pixelSize, 6)))
        )

        let columns = 1
        let rows = 1
        let imageData: ImageData | null = null
        let elapsed = 0
        let previousTime = 0
        let frameCount = 0
        let visible = true

        let pageVisible =
            typeof document === "undefined"
                ? true
                : document.visibilityState !== "hidden"

        const rate = Math.max(0, finite(speed, 1))

        const pointer = {
            x: 0,
            y: 0,
            strength: 0,
            target: 0,
        }

        const resolveRGB = (value: string, fallback: string): RGB => {
            bufferContext.save()
            bufferContext.clearRect(0, 0, 1, 1)
            bufferContext.fillStyle = fallback

            try {
                bufferContext.fillStyle = value || fallback
            } catch {
                bufferContext.fillStyle = fallback
            }

            bufferContext.fillRect(0, 0, 1, 1)
            const pixel = bufferContext.getImageData(0, 0, 1, 1).data
            bufferContext.restore()

            return [pixel[0], pixel[1], pixel[2]]
        }

        const paperRGB = resolveRGB(paper, "#FFFFFF")
        const gridRGB = resolveRGB(grid, "#B3ACA4")
        const haloRGB = resolveRGB(halo, "#55E3F0")
        const baseRGB = resolveRGB(base, "#2F5BF2")
        const overlapRGB = resolveRGB(overlap, "#19EC2C")
        const shiftedRGB = resolveRGB(shifted, "#F0413A")
        const farRGB = resolveRGB(far, "#F2EE12")

        const field = (u: number, w: number, time: number) => {
            const warp =
                noise(u * 0.35 + time * 0.05, w * 0.25 - time * 0.04) - 0.5

            const su = u * 0.32 - time * 0.08
            const sw = w * 1.1 + warp * 1.8

            return (
                noise(su, sw) * 0.6 +
                noise(su * 2.1 + 5.2, sw * 2.1 + 1.3) * 0.28 +
                noise(su * 4.3 + 9.7, sw * 4.3 + 3.1) * 0.12
            )
        }

        const draw = () => {
            if (destroyed || !imageData || columns < 1 || rows < 1) return

            const data = imageData.data
            const time = isStaticRenderer || reducedMotion ? 0 : elapsed
            const scale = 1 / 11
            const angle = 0.42
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)
            const step = Math.floor(time * 5)

            const pointerAmount = interaction
                ? Math.max(0, finite(interactionStrength, 1))
                : 0

            const radius = Math.max(8, finite(interactionRadius, 110))

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < columns; x++) {
                    const nx = x * scale
                    const ny = y * scale
                    const u = nx * cos + ny * sin
                    const w = -nx * sin + ny * cos

                    let pointerGlow = 0

                    if (interaction && pointer.strength > 0.001) {
                        const dx = x - pointer.x
                        const dy = y - pointer.y

                        pointerGlow =
                            pointer.strength *
                            pointerAmount *
                            Math.exp(-(dx * dx + dy * dy) / radius)
                    }

                    const slip = 1 + 2.4 * pointerGlow
                    const bloom = 0.1 * pointerGlow

                    const a = field(u, w, time) + bloom
                    const b =
                        field(u + SHIFT_U * slip, w - SHIFT_W * slip, time) +
                        bloom
                    const c =
                        field(
                            u + SHIFT_U * 2 * slip,
                            w - SHIFT_W * 2 * slip,
                            time
                        ) + bloom

                    let ink: RGB | null = null
                    let density = 0

                    if (c > 0.64 && b > 0.58 && a < 0.54) {
                        ink = farRGB
                        density = Math.min(0.8, 0.45 + (c - 0.64) * 6)
                    } else if (b > 0.6 && a > 0.5 && b > a + 0.02) {
                        ink = shiftedRGB
                        density = Math.min(0.62, 0.3 + (b - 0.6) * 5)
                    } else if (
                        a > 0.55 &&
                        b > 0.55 &&
                        Math.abs(b - a) < 0.008
                    ) {
                        ink = overlapRGB
                        density = 0.45
                    } else if (a > 0.57) {
                        ink = baseRGB
                        density = Math.min(0.75, 0.35 + (a - 0.57) * 6)
                    } else if (a > 0.49) {
                        ink = haloRGB
                        density = Math.min(0.5, (a - 0.49) * 5)
                    } else if (
                        hash(x + step * 13.1, y) < (a > 0.38 ? 0.02 : 0.004)
                    ) {
                        ink = haloRGB
                        density = 1
                    }

                    const clearing = clamp01(
                        (noise(
                            x * 0.035 + time * 0.06,
                            y * 0.05 - time * 0.03
                        ) -
                            0.5) *
                            3.5
                    )

                    const checker =
                        ((x + y) & 1) === 0 && hash(x, y) >= clearing

                    let color: RGB = checker ? gridRGB : paperRGB

                    if (ink) {
                        const streak =
                            (x & 1 ? 0.6 : 1) *
                            (hash(x, step) < 0.12 ? 0.5 : 1)

                        const threshold =
                            (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16

                        if (threshold < clamp01(density) * streak) {
                            color = ink
                        }
                    }

                    const index = (y * columns + x) * 4
                    data[index] = color[0]
                    data[index + 1] = color[1]
                    data[index + 2] = color[2]
                    data[index + 3] = 255
                }
            }

            bufferContext.putImageData(imageData, 0, 0)
            context.imageSmoothingEnabled = false
            context.clearRect(0, 0, width, height)
            context.drawImage(buffer, 0, 0, columns, rows, 0, 0, width, height)
        }

        const shouldAnimate = () =>
            !destroyed &&
            !isStaticRenderer &&
            !reducedMotion &&
            !paused &&
            rate > 0 &&
            visible &&
            pageVisible

        const stopAnimation = () => {
            if (!animationFrame) return
            cancelAnimationFrame(animationFrame)
            animationFrame = 0
        }

        const tick = (now: number) => {
            if (!shouldAnimate()) {
                animationFrame = 0
                return
            }

            const delta = Math.min(
                Math.max(0, (now - previousTime) / 1000),
                0.05
            )

            previousTime = now
            elapsed += delta * rate

            pointer.strength +=
                (pointer.target - pointer.strength) * Math.min(1, delta * 10)

            frameCount += 1

            if (frameCount % 2 === 0) {
                draw()
            }

            animationFrame = requestAnimationFrame(tick)
        }

        const startAnimation = () => {
            stopAnimation()

            if (!shouldAnimate()) {
                draw()
                return
            }

            previousTime = performance.now()
            animationFrame = requestAnimationFrame(tick)
        }

        const resize = () => {
            if (destroyed) return

            const rect = host.getBoundingClientRect()

            width = Math.max(1, rect.width)
            height = Math.max(1, rect.height)

            const requestedCell = Math.max(
                MIN_CELL,
                Math.min(MAX_CELL, Math.round(finite(pixelSize, 6)))
            )

            const estimatedCells =
                (width / requestedCell) * (height / requestedCell)

            const budgetScale =
                estimatedCells > MAX_CELLS
                    ? Math.sqrt(estimatedCells / MAX_CELLS)
                    : 1

            cell = Math.max(
                MIN_CELL,
                Math.min(MAX_CELL, Math.ceil(requestedCell * budgetScale))
            )

            columns = Math.max(1, Math.ceil(width / cell))
            rows = Math.max(1, Math.ceil(height / cell))

            const dpr = Math.min(
                MAX_DPR,
                Math.max(1, window.devicePixelRatio || 1)
            )

            const canvasWidth = Math.max(1, Math.round(width * dpr))
            const canvasHeight = Math.max(1, Math.round(height * dpr))

            if (
                canvas.width !== canvasWidth ||
                canvas.height !== canvasHeight
            ) {
                canvas.width = canvasWidth
                canvas.height = canvasHeight
            }

            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            context.setTransform(dpr, 0, 0, dpr, 0, 0)

            buffer.width = columns
            buffer.height = rows

            imageData = bufferContext.createImageData(columns, rows)
            draw()
        }

        const scheduleResize = () => {
            if (resizeFrame) {
                cancelAnimationFrame(resizeFrame)
            }

            resizeFrame = requestAnimationFrame(() => {
                resizeFrame = 0
                resize()
            })
        }

        const handlePointerMove = (event: PointerEvent) => {
            if (!interaction || isStaticRenderer || reducedMotion) return

            const rect = host.getBoundingClientRect()

            if (rect.width <= 0 || rect.height <= 0) return

            pointer.x = ((event.clientX - rect.left) / rect.width) * columns
            pointer.y = ((event.clientY - rect.top) / rect.height) * rows

            pointer.target = 1
        }

        const handlePointerEnter = (event: PointerEvent) => {
            if (!interaction) return

            handlePointerMove(event)
            pointer.target = 1
        }

        const handlePointerLeave = () => {
            pointer.target = 0
        }

        const handleVisibility = () => {
            pageVisible = document.visibilityState !== "hidden"
            startAnimation()
        }

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(scheduleResize)
                : null

        resizeObserver?.observe(host)

        const intersectionObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      entries => {
                          const entry = entries[0]
                          if (!entry) return
                          visible = entry.isIntersecting
                          startAnimation()
                      },
                      {
                          root: null,
                          threshold: 0,
                      }
                  )
                : null

        intersectionObserver?.observe(host)

        host.addEventListener("pointerenter", handlePointerEnter, {
            passive: true,
        })

        host.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })

        host.addEventListener("pointerleave", handlePointerLeave, {
            passive: true,
        })

        document.addEventListener("visibilitychange", handleVisibility)

        resize()

        if (isStaticRenderer || reducedMotion) {
            elapsed = 0
            pointer.strength = 0
            pointer.target = 0
            draw()
        } else {
            startAnimation()
        }

        return () => {
            destroyed = true

            stopAnimation()

            if (resizeFrame) {
                cancelAnimationFrame(resizeFrame)
            }

            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()

            host.removeEventListener("pointerenter", handlePointerEnter)
            host.removeEventListener("pointermove", handlePointerMove)
            host.removeEventListener("pointerleave", handlePointerLeave)

            document.removeEventListener("visibilitychange", handleVisibility)
        }
    }, [
        paper,
        grid,
        halo,
        base,
        overlap,
        shifted,
        far,
        pixelSize,
        speed,
        interaction,
        interactionStrength,
        interactionRadius,
        paused,
        isStaticRenderer,
        reducedMotion,
    ])

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: 1,
                overflow: "hidden",
                isolation: "isolate",
                backgroundColor: paper,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(KarimSaifMisprintBackground, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Classic", "CMYK", "Candy", "Retro", "Mono", "Custom"],
        optionTitles: ["Classic", "CMYK", "Candy", "Retro", "Mono", "Custom"],
        defaultValue: "Classic",
        displaySegmentedControl: false,
        description:
            "Selects a ready-made risograph color palette or Custom for manual color control.",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Paper",
        defaultValue: "#FFFFFF",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the paper color visible behind the checkerboard and printed ink layers.",
    },

    gridColor: {
        type: ControlType.Color,
        title: "Grid",
        defaultValue: "#B3ACA4",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the checkerboard pixel color underneath the misregistered print.",
    },

    haloColor: {
        type: ControlType.Color,
        title: "Halo",
        defaultValue: "#55E3F0",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the cyan outer ink used around the softer edges and print speckles.",
    },

    baseColor: {
        type: ControlType.Color,
        title: "Base",
        defaultValue: "#2F5BF2",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the primary ink color used for the main flowing printed shapes.",
    },

    overlapColor: {
        type: ControlType.Color,
        title: "Overlap",
        defaultValue: "#19EC2C",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the ink color revealed where closely aligned print separations overlap.",
    },

    shiftedColor: {
        type: ControlType.Color,
        title: "Shifted",
        defaultValue: "#F0413A",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the secondary offset ink color produced by the misregistered print effect.",
    },

    farShiftedColor: {
        type: ControlType.Color,
        title: "Far Shift",
        defaultValue: "#F2EE12",
        hidden: props => props.preset !== "Custom",
        description:
            "Sets the furthest displaced ink color along the edges of the print.",
    },

    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 6,
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        description:
            "Controls the size of the pixel cells. Smaller values create finer detail while larger values create a coarser risograph texture.",
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 0.05,
        description:
            "Controls the speed of the flowing print animation. Set to zero for a still result.",
    },

    interaction: {
        type: ControlType.Boolean,
        title: "Interaction",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Enables pointer interaction that pushes the ink separations further apart.",
    },

    interactionStrength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        hidden: props => !props.interaction,
        description:
            "Controls how strongly the ink separations slip apart around the pointer.",
    },

    interactionRadius: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 110,
        min: 20,
        max: 400,
        step: 5,
        hidden: props => !props.interaction,
        description:
            "Controls how widely the pointer influence spreads across the misregistered ink layers.",
    },

    paused: {
        type: ControlType.Boolean,
        title: "Paused",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Made with 💛 by @karimsaif0",
    },
})