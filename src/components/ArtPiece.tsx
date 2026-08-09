// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ArtPieceProps {
  className?: string;
}

// ─── Device Tier Detection ────────────────────────────────────────────
function getDeviceTier(): "low" | "mid" | "high" {
  if (typeof window === "undefined") return "high";
  const width = window.innerWidth;
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isLowEnd = width < 480 || memory < 2 || cores < 4;
  const isMidEnd = width < 1024 || memory < 4 || cores < 6;
  if (isLowEnd) return "low";
  if (isMidEnd) return "mid";
  return "high";
}

// ─── Debounce helper ──────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export const ArtPiece = ({ className }: ArtPieceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadProgress, setLoadProgress] = useState(0);

  // All Three.js state lives here — survives re-renders, never in React state
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    blob: any;
    clock: THREE.Clock;
    helmet: any;
    head: any;
    rafId: number;
    animating: boolean;
    lastFrameTime: number;
    frameInterval: number;
    resizeObserver: ResizeObserver | null;
    visible: boolean;
    disposed: boolean;
    tier: "low" | "mid" | "high";
    blobScale: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tier = getDeviceTier();
    const dpr =
      tier === "low"
        ? 0.5
        : tier === "mid"
          ? 1.0
          : Math.min(window.devicePixelRatio, 1.5);
    const blobScale = tier === "low" ? 0.5 : tier === "mid" ? 0.75 : 1.0;
    const targetFPS = tier === "high" ? 60 : 30;
    const frameInterval = 1000 / targetFPS;

    // ─── Build Renderer ─────────────────────────────────────────────
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width, 300);
    const h = Math.max(rect.height, 400);

    if (w === 0 || h === 0) {
      setStatus("error");
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f7);

    const camera = new THREE.PerspectiveCamera(30, w / h, 1, 100);
    camera.position.set(-1, 0, 0).setLength(15);

    const renderer = new THREE.WebGLRenderer({
      antialias: tier !== "low",
      alpha: false,
      powerPreference: tier === "high" ? "high-performance" : "low-power",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    // ─── Controls ───────────────────────────────────────────────────
    const camShift = new THREE.Vector3(0, 1, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.object.position.add(camShift);
    controls.target.add(camShift);

    // ─── Lights ───────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // ─── Blob (Feedback Shader) ─────────────────────────────────────
    class Blob {
      renderer: THREE.WebGLRenderer;
      rtRead: THREE.WebGLRenderTarget;
      rtWrite: THREE.WebGLRenderTarget;
      uniforms: Record<string, THREE.IUniform>;
      rtScene: THREE.Mesh;
      rtCamera: THREE.Camera;
      material: THREE.ShaderMaterial;
      scale: number;

      constructor(
        renderer: THREE.WebGLRenderer,
        width: number,
        height: number,
        scale: number,
      ) {
        this.renderer = renderer;
        this.scale = scale;
        const bw = Math.max(1, Math.floor(width * scale));
        const bh = Math.max(1, Math.floor(height * scale));

        const rtOptions: THREE.RenderTargetOptions = {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.UnsignedByteType,
          depthBuffer: false,
          stencilBuffer: false,
        };

        this.rtRead = new THREE.WebGLRenderTarget(bw, bh, rtOptions);
        this.rtWrite = new THREE.WebGLRenderTarget(bw, bh, rtOptions);

        this.uniforms = {
          pointer: { value: new THREE.Vector2().setScalar(10) },
          pointerDown: { value: 1 },
          pointerRadius: { value: 0.375 },
          pointerDuration: { value: 2.5 },
          aspect: { value: bw / bh },
          prevFrame: { value: this.rtRead.texture },
          dTime: { value: 0 },
        };

        this.material = new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
          `,
          fragmentShader: `
            precision mediump float;
            varying vec2 vUv;
            uniform float dTime, aspect, pointerDown, pointerRadius, pointerDuration;
            uniform vec2 pointer;
            uniform sampler2D prevFrame;
            void main() {
              float duration = pointerDuration;
              float rVal = texture2D(prevFrame, vUv).r;
              rVal -= clamp(dTime / duration, 0.0, 0.1);
              rVal = clamp(rVal, 0.0, 1.0);
              float f = 0.0;
              if (pointerDown > 0.5) {
                vec2 uv = (vUv - 0.5) * 2.0 * vec2(aspect, 1.0);
                vec2 mouse = pointer * vec2(aspect, 1.0);
                f = 1.0 - smoothstep(pointerRadius * 0.1, pointerRadius, distance(uv, mouse));
              }
              rVal += f * 0.1;
              rVal = clamp(rVal, 0.0, 1.0);
              gl_FragColor = vec4(vec3(rVal), 1.0);
            }
          `,
        });

        this.rtScene = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          this.material,
        );
        this.rtCamera = new THREE.Camera();
      }

      render(dt: number) {
        this.uniforms.dTime.value = dt;
        this.uniforms.prevFrame.value = this.rtRead.texture;
        this.renderer.setRenderTarget(this.rtWrite);
        this.renderer.render(this.rtScene, this.rtCamera);
        this.renderer.setRenderTarget(null);
        const temp = this.rtRead;
        this.rtRead = this.rtWrite;
        this.rtWrite = temp;
      }

      getTexture() {
        return this.rtRead.texture;
      }

      setSize(w: number, h: number) {
        const bw = Math.max(1, Math.floor(w * this.scale));
        const bh = Math.max(1, Math.floor(h * this.scale));
        this.rtRead.setSize(bw, bh);
        this.rtWrite.setSize(bw, bh);
        this.uniforms.aspect.value = bw / bh;
      }

      dispose() {
        this.rtRead.dispose();
        this.rtWrite.dispose();
        this.material.dispose();
        (this.rtScene.geometry as THREE.BufferGeometry).dispose();
      }
    }

    const blob = new Blob(renderer, w, h, blobScale);

    // ─── Pointer Events ───────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      blob.uniforms.pointer.value.x =
        ((e.clientX - rect.left) / rect.width) * 2 - 1;
      blob.uniforms.pointer.value.y =
        -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onPointerLeave = () => {
      blob.uniforms.pointer.value.setScalar(10);
    };

    container.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    // ─── Resize (debounced) ─────────────────────────────────────────
    const handleResize = debounce(() => {
      const s = stateRef.current;
      if (!s || s.disposed) return;
      const r = container.getBoundingClientRect();
      const nw = Math.max(r.width, 300);
      const nh = Math.max(r.height, 400);
      if (nw === 0 || nh === 0) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      blob.setSize(nw, nh);
    }, 200);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ─── Load Models ──────────────────────────────────────────────────
    const loader = new GLTFLoader();
    let helmet: any = null;
    let head: any = null;

    const loadHelmet = new Promise<void>((resolve) => {
      loader.load(
        "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
        (gltf) => {
          helmet = gltf.scene.children[0];
          resolve();
        },
        (xhr) => {
          if (xhr.total > 0)
            setLoadProgress(Math.round((xhr.loaded / xhr.total) * 50));
        },
        () => resolve(),
      );
    });

    const loadHead = new Promise<void>((resolve) => {
      loader.load(
        "/taban.glb",
        (gltf) => {
          const h = gltf.scene.children[0];
          if (h && h.geometry) {
            h.geometry.rotateY(Math.PI * 0.01);
            h.scale.setScalar(4.724);
            h.position.set(0.226, -0.569, 0.63);
            scene.add(h);
            head = h;
          }
          resolve();
        },
        (xhr) => {
          if (xhr.total > 0)
            setLoadProgress(50 + Math.round((xhr.loaded / xhr.total) * 50));
        },
        () => resolve(),
      );
    });

    Promise.all([loadHelmet, loadHead]).then(() => {
      const s = stateRef.current;
      if (!s || s.disposed) return;

      if (helmet && helmet.material) {
        const helmetUniforms = { texBlob: { value: blob.getTexture() } };

        helmet.material.onBeforeCompile = (shader: any) => {
          shader.uniforms.texBlob = helmetUniforms.texBlob;
          shader.vertexShader =
            `varying vec4 vPosProj; ${shader.vertexShader}`.replace(
              `#include <project_vertex>`,
              `#include <project_vertex>
              vPosProj = gl_Position;
            `,
            );
          shader.fragmentShader =
            `uniform sampler2D texBlob; varying vec4 vPosProj; ${shader.fragmentShader}`.replace(
              `#include <color_fragment>`,
              `vec2 blobUV = ((vPosProj.xy / vPosProj.w) + 1.0) * 0.5;
              vec4 blobData = texture2D(texBlob, blobUV);
              if (blobData.r < 0.01) discard;
              #include <color_fragment>
            `,
            );
        };

        helmet.scale.setScalar(3.5);
        helmet.position.set(0, 1.5, 0.75);
        scene.add(helmet);

        // Wireframe (skip on low tier to save GPU)
        if (tier !== "low") {
          const wireGeo = new THREE.WireframeGeometry(helmet.geometry);
          const wireMat = new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.15,
          });
          const wireframe = new THREE.LineSegments(wireGeo, wireMat);
          helmet.add(wireframe);
        }
      }

      setStatus("ready");
    });

    // ─── Animation Loop (frame-capped) ──────────────────────────────
    const clock = new THREE.Clock();
    let rafId = 0;
    let lastFrameTime = 0;
    let animating = true;
    let visible = true;

    const state = {
      renderer,
      scene,
      camera,
      controls,
      blob,
      clock,
      helmet,
      head,
      rafId,
      animating,
      lastFrameTime,
      frameInterval,
      resizeObserver,
      visible,
      disposed: false,
      tier,
      blobScale,
    };
    stateRef.current = state;

    const animate = (time: number) => {
      const s = stateRef.current;
      if (!s || s.disposed) return;
      s.rafId = requestAnimationFrame(animate);

      if (!s.animating || !s.visible) return;

      // Frame skip for FPS capping
      const elapsed = time - s.lastFrameTime;
      if (elapsed < s.frameInterval) return;
      s.lastFrameTime = time - (elapsed % s.frameInterval);

      const dt = Math.min(s.clock.getDelta(), 0.1);
      s.controls.update();
      s.blob.render(dt);
      s.renderer.render(s.scene, s.camera);
    };
    animate(0);

    // ─── Visibility Handling ────────────────────────────────────────
    const onVisibilityChange = () => {
      const s = stateRef.current;
      if (!s) return;
      s.visible = document.visibilityState === "visible";
      if (s.visible) {
        s.clock = new THREE.Clock();
        s.lastFrameTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ─── IntersectionObserver (pause/resume, NEVER destroy) ─────────
    const io = new IntersectionObserver(
      ([entry]) => {
        const s = stateRef.current;
        if (!s) return;
        s.visible = entry.isIntersecting;
        if (s.visible) {
          s.clock = new THREE.Clock();
          s.lastFrameTime = performance.now();
        }
      },
      { threshold: 0, rootMargin: "50px" },
    );
    io.observe(container);

    // ─── Cleanup (only on unmount) ──────────────────────────────────
    return () => {
      const s = stateRef.current;
      if (!s || s.disposed) return;
      s.disposed = true;
      s.animating = false;
      cancelAnimationFrame(s.rafId);

      document.removeEventListener("visibilitychange", onVisibilityChange);
      io.disconnect();
      s.resizeObserver?.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);

      s.controls.dispose();
      s.blob.dispose();

      s.scene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material))
            object.material.forEach((m: any) => m.dispose());
          else object.material.dispose();
        }
      });

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      stateRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[300px] sm:min-h-[400px] ${className || ""}`}
    >
      {status === "loading" && (
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-neutral-400'>
          <div className='w-8 h-8 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin' />
          <span>
            Loading 3D scene… {loadProgress > 0 ? `${loadProgress}%` : ""}
          </span>
        </div>
      )}
      {status === "error" && (
        <div className='absolute inset-0 flex items-center justify-center text-sm text-red-400'>
          Failed to initialize 3D scene
        </div>
      )}
    </div>
  );
};
