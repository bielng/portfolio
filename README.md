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
2. Delete `public/PUT_TABAN_GLB_HERE.txt` once the real file is in place — it's just a placeholder note.

Vite serves everything in `public/` from the site root, so no code changes are needed — the component already requests `/taban.glb`.

If the file isn't present, the section still renders (the damaged-helmet wireframe effect works independently), and the browser console will log a reminder instead of failing silently.

## Environment variables

Copy `.env.example` to `.env` and fill in values as needed:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Only needed if you wire up a Gemini API integration later. Not currently used by any component. |
| `APP_URL` | Self-referential URL, useful if you add OAuth callbacks or server-side links later. |

`.env` is git-ignored; `.env.example` is tracked and safe to commit.

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
│   ├── components/
│   │   ├── BlurText.tsx          Word-by-word blur-in animated heading
│   │   ├── HLSVideo.tsx          HLS background video player
│   │   └── ArtPiece.tsx          Interactive Three.js scene (see below)
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

## About the Digital Craft section

`ArtPiece.tsx` is a self-contained Three.js scene: a GLTF face model, a "damaged helmet" mesh revealed by moving your cursor (via a framebuffer feedback shader), and an animated wireframe overlay. Drag to orbit, move the cursor to paint.

It was adapted from a standalone HTML/JS sketch into a React component:
- Sizes itself to its parent section instead of the full browser window
- Cleans up its renderer, event listeners, and animation loop on unmount
- Uses `// @ts-nocheck` — the shader string-patching (`onBeforeCompile`) doesn't type-check cleanly against Three.js's public types, so this file opts out of strict checking rather than fighting the compiler over untyped shader internals

## Notes

- The contact form currently simulates a submission (a `setTimeout` + success state) — it doesn't send a real email yet. Wire it up to an email service or backend endpoint before relying on it for real inquiries.
- Background videos (Hero, Mission, Footer, "Data Has Changed") point to your own Mux/CloudFront assets — replace the URLs in `App.tsx` if those change.
