# Taban Ngunar — Portfolio

Personal portfolio site for Taban Ngunar, Data Scientist & Cloud Engineer / Refugee Tech Advocate.

Built with React 19, Vite, TypeScript, and Tailwind CSS 4, using a dark "liquid glass" design system, plus an interactive Three.js art piece.

## Stack

- **React 19** + **Vite 6** — app shell and dev server
- **TypeScript**
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Motion** (`motion/react`) — scroll reveals and micro-interactions
- **hls.js** — HLS background video playback
- **Three.js** — interactive 3D art section
- **lucide-react** — icons

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`.

Other scripts:

```bash
npm run build     # production build to /dist
npm run preview   # preview the production build locally
npm run clean     # remove /dist
npm run lint      # type-check with tsc (no emit)
```

## Required: add your 3D model

The "Digital Craft" section on the homepage loads a GLB model at `/taban.glb`.

1. Place your `taban.glb` file directly inside the `public/` folder, so the path is:
   ```
   public/taban.glb
   ```

Vite serves everything in `public/` from the site root, so no code changes are needed — the component already requests `/taban.glb`.

If the file isn't present, the section still renders (the damaged-helmet wireframe effect works independently), and the browser console will log a reminder instead of failing silently.

## Environment variables

Copy `.env.example` to `.env` and fill in values as needed:

```bash
cp .env.example .env
```

## Project structure

```
├── index.html                  Entry HTML, fonts, page title/meta
├── metadata.json                App name/description metadata
├── public/
│   └── taban.glb                 ← your 3D model goes here
├── src/
│   ├── main.tsx                  React root render
│   ├── App.tsx                   All page sections (single-page site)
│   ├── index.css                 Tailwind theme tokens + liquid-glass CSS
│   ├── hooks/
│   │   ├── useInView.ts          IntersectionObserver hook for lazy sections
│   │   └── useIsMobile.ts        Mobile breakpoint detection hook
│   ├── components/
│   │   ├── BlurText.tsx          Word-by-word blur-in animated heading
│   │   ├── HLSVideo.tsx          HLS background video player (lazy + visibility-aware)
│   │   ├── LazyVideo.tsx         Lazy-loading wrapper for raw <video> elements
│   │   ├── LazySection.tsx       IntersectionObserver-based section lazy loader
│   │   ├── ArtPiece.tsx          Interactive Three.js scene (see below)
│   │   └── Terminal.tsx          Interactive terminal emulator
│   └── lib/
│       └── utils.ts              `cn()` class-merging helper
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Page sections (in order)

1. **Hero** — headline, intro, GitHub/LinkedIn links
2. **Digital Craft** — the interactive 3D art piece (`ArtPiece.tsx`)
3. **Data Has Changed** — approach statement, HLS video background
4. **How I Work** — two-row feature layout (data pipelines, cloud architecture)
5. **Expertise** — Data Science / Cloud Engineering / Refugee Tech / Open Source
6. **About** — bio + professional journey
7. **Mission** — mission statement panel, HLS video background
8. **Projects** — GitHub project cards + closing CTA
9. **Contact** — contact details + message form
10. **Footer** — nav links, HLS video background

## Performance & Mobile Optimizations

This portfolio is heavily media-rich (5 video players + Three.js WebGL). The following optimizations keep it fast and stable:

### Lazy Loading

- **HLSVideo** — Uses `IntersectionObserver` with `rootMargin: "200px"` to only initialize hls.js when the section is near the viewport.
- **LazyVideo** — Same lazy-loading pattern for raw `<video>` elements (used in CapabilitiesChess).
- **LazySection** — Optional wrapper to defer rendering entire sections until scrolled into view.

### Visibility-Aware Playback

- Videos automatically **pause** when scrolled off-screen and **resume** when visible again.
- This prevents mobile browsers from exhausting their limited concurrent video decoder slots (typically 1–2).

### Three.js GPU Safety

- **Mobile fallback** — `ArtPiece` detects touch devices and screens < 768px, showing a graceful placeholder instead of initializing WebGL.
- **GPU memory cleanup** — `Blob.dispose()` properly releases `WebGLRenderTarget`s, shader materials, and geometry buffers on unmount.
- **Power preference** — Renderer uses `powerPreference: "low-power"` to reduce GPU clock on mobile.
- **DPR cap** — Pixel ratio capped at `1.5` to prevent retina screens from over-rendering.

### HLS Memory Tuning

- `maxBufferLength: 15` — caps HLS forward buffer to ~15 seconds (default is much higher).
- `maxMaxBufferLength: 30` — hard ceiling on total buffer size.
- `capLevelToPlayerSize: true` — prevents loading 4K streams on small screens.

### Safari Cleanup

- The native Safari HLS fallback now properly removes its `loadedmetadata` event listener on unmount, preventing listener accumulation.

## About the Digital Craft section

`ArtPiece.tsx` is a self-contained Three.js scene: a GLTF face model, a "damaged helmet" mesh revealed by moving your cursor (via a framebuffer feedback shader), and an animated wireframe overlay. Drag to orbit, move the cursor to paint.

It was adapted from a standalone HTML/JS sketch into a React component:

- Sizes itself to its parent section instead of the full browser window
- Cleans up its renderer, event listeners, and animation loop on unmount
- Uses `// @ts-nocheck` — the shader string-patching (`onBeforeCompile`) doesn't type-check cleanly against Three.js's public types, so this file opts out of strict checking rather than fighting the compiler over untyped shader internals

### Mobile Behavior

On mobile/touch devices, the 3D scene is replaced with a static placeholder:

```
┌─────────────────────────────┐
│                             │
│      Digital Craft          │
│  Interactive 3D experience  │
│   available on desktop      │
│                             │
└─────────────────────────────┘
```

This avoids GPU thermal throttling and WebGL context loss on low-end devices.

## Notes

- The contact form currently simulates a submission (a `setTimeout` + success state) — it doesn't send a real email yet. Wire it up to an email service or backend endpoint before relying on it for real inquiries.
- Background videos (Hero, Mission, Footer, "Data Has Changed") point to your own Mux/CloudFront assets — replace the URLs in `App.tsx` if those change.
- If you experience crashes on older mobile devices, check that `disableOnMobile` is `true` on `ArtPiece` and that HLS videos are using the `isVisible` prop.
