# Misprint Background Interaction — Framer Component

An interactive procedural Framer background inspired by misregistered print, risograph textures, halftone dithering, shifting ink layers, and imperfect analog color separation.

Move the pointer across the component and the ink separations react, slip, and drift apart for a tactile printed feel.

## Live Preview

https://misprintbackground.framer.website/

## What it does

Misprint Background renders a responsive animated print field using Canvas 2D. Layered procedural noise, Bayer dithering, color separation, checkerboard texture, and pointer-driven displacement combine to create an evolving risograph-inspired background without external assets.

## Highlights

- Interactive pointer-driven ink separation
- Procedural risograph / misprint aesthetic
- Bayer-dithered pixel texture
- Animated ink flow
- Responsive rendering
- Adaptive cell budget for better performance
- DPR capped for practical rendering cost
- Automatic offscreen pausing
- Browser visibility pausing
- Reduced-motion support
- Framer static-renderer support
- ResizeObserver-based responsive updates
- Six palette modes
- No external images or CSS required

## Presets

- **Classic** — bright primary misprint colors
- **CMYK** — cyan, magenta, yellow, and print-inspired separation
- **Candy** — playful pastel and neon tones
- **Retro** — muted vintage print colors
- **Mono** — restrained grayscale-inspired palette
- **Custom** — unlocks all individual color controls

## Framer Controls

The component exposes controls for:

- Preset
- Paper color
- Grid color
- Halo color
- Base ink color
- Overlap color
- Shifted color
- Far-shift color
- Pixel Size
- Speed
- Interaction
- Interaction Strength
- Interaction Spread
- Paused state

Custom color controls only appear when the **Custom** preset is selected.

## Installation

1. Open your Framer project.
2. Create a new Code Component.
3. Copy the contents of `KarimSaifMisprintBackground.tsx`.
4. Paste it into the Framer code editor.
5. Save the component.
6. Drag **KarimSaifMisprintBackground** onto the canvas.
7. Adjust the preset, colors, speed, pixel size, and interaction controls from the Framer property panel.

## Performance

The component includes safeguards for use inside Framer:

- Maximum procedural cell budget
- DPR cap
- Reduced-motion handling
- Static-renderer handling
- IntersectionObserver offscreen pausing
- Browser visibility pausing
- ResizeObserver updates
- RAF cleanup
- Event listener cleanup

## Built for Framer

The component supports flexible width and height and includes the required Framer layout annotations for responsive Code Components.

## Author

Created and customized for Framer by **Karim Saif**.

- X: https://x.com/karimsaif0
- Email: karimsaif010@gmail.com
- Live Preview: https://misprintbackground.framer.website/
- GitHub: https://github.com/karimsaif0/Misprint-Background-Interaction-Framer-Component-

## License

Use and customize the component in your Framer projects. If you redistribute or build on the source publicly, attribution to Karim Saif is appreciated.
