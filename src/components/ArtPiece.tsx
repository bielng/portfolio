// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ArtPieceProps {
  className?: string;
  /** Disable on small phones only (not tablets) */
  disableOnPhone?: boolean;
}

export const ArtPiece = ({
  className,
  disableOnPhone = true,
}: ArtPieceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "phone">(
    "loading",
  );

  // These refs survive re-renders and let us pause/resume without destroying
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    blob: any;
    clock: THREE.Clock;
    helmet: any;
    head: any;
    rafId: number;
    cancelled: boolean;
    animating: boolean;
    cleanupFns: Array<() => void>;
  } | null>(null);

  // ─── 1. Detect phones (NOT tablets) ───────────────────────────────────
  useEffect(() => {
    if (!disableOnPhone) return;

    const checkPhone = () => {
      const width = window.innerWidth;
      const coarsePointer =
        window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
      const isPhone = width < 640 && coarsePointer;
      if (isPhone) setStatus("phone");
    };

    checkPhone();
    window.addEventListener("resize", checkPhone);
    return () => window.removeEventListener("resize", checkPhone);
  }, [disableOnPhone]);

  // ─── 2. Visibility observer: pause/resume animation ───────────────────
  useEffect(() => {
    if (status === "phone") return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const s = sceneRef.current;
        if (!s) return;

        if (entry.isIntersecting) {
          // Resume
          if (!s.animating) {
            s.animating = true;
            s.clock = new THREE.Clock(); // reset delta to avoid jump
            animate();
          }
        } else {
          // Pause (DON'T destroy)
          s.animating = false;
          cancelAnimationFrame(s.rafId);
        }
      },
      { threshold: 0.05, rootMargin: "100px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  // ─── 3. Build scene once, keep alive until unmount ────────────────────
  useEffect(() => {
    if (status === "phone") return;

    const container = containerRef.current;
    if (!container) return;

    // Already built? Don't rebuild
    if (sceneRef.current) return;

    const initTimeout = setTimeout(() => {
      initScene();
    }, 50);

    function initScene() {
      const el = containerRef.current;
      if (!el || sceneRef.current) return;

      const rect = el.getBoundingClientRect();
      const w = Math.max(rect.width, 300);
      const h = Math.max(rect.height, 400);

      if (w === 0 || h === 0) {
        console.warn("ArtPiece: container has zero dimensions", rect);
        setStatus("error");
        return;
      }

      // ─── Scene ──────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f7);

      const camera = new THREE.PerspectiveCamera(30, w / h, 1, 100);
      camera.position.set(-1, 0, 0).setLength(15);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      el.appendChild(renderer.domElement);

      // ─── Resize ─────────────────────────────────────────────────────
      const handleResize = () => {
        if (!containerRef.current || !sceneRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        const nw = Math.max(r.width, 300);
        const nh = Math.max(r.height, 400);
        if (nw === 0 || nh === 0) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        sceneRef.current.blob.setSize(nw, nh);
      };
      window.addEventListener("resize", handleResize);

      // ─── Controls ───────────────────────────────────────────────────
      const camShift = new THREE.Vector3(0, 1, 0);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.object.position.add(camShift);
      controls.target.add(camShift);

      // ─── Lights ───────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(5, 10, 5);
      scene.add(dirLight);

      // ─── Ping-Pong Blob ───────────────────────────────────────────
      class Blob {
        renderer: any;
        rtRead: any;
        rtWrite: any;
        uniforms: any;
        rtScene: any;
        rtCamera: any;
        material: any;

        constructor(renderer: any, width: number, height: number) {
          this.renderer = renderer;
          const rtOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
          };
          this.rtRead = new THREE.WebGLRenderTarget(width, height, rtOptions);
          this.rtWrite = new THREE.WebGLRenderTarget(width, height, rtOptions);
          this.uniforms = {
            pointer: { value: new THREE.Vector2().setScalar(10) },
            pointerDown: { value: 1 },
            pointerRadius: { value: 0.375 },
            pointerDuration: { value: 2.5 },
            aspect: { value: width / height },
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
          this.rtRead.setSize(w, h);
          this.rtWrite.setSize(w, h);
          this.uniforms.aspect.value = w / h;
        }

        dispose() {
          this.rtRead.dispose();
          this.rtWrite.dispose();
          this.material.dispose();
          this.rtScene.geometry.dispose();
        }
      }

      const blob = new Blob(renderer, w, h);

      // Pointer events
      const onPointerMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        blob.uniforms.pointer.value.x =
          ((e.clientX - rect.left) / rect.width) * 2 - 1;
        blob.uniforms.pointer.value.y =
          -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };
      const onPointerLeave = () => {
        blob.uniforms.pointer.value.setScalar(10);
      };

      el.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerleave", onPointerLeave);

      // ─── Load Models ──────────────────────────────────────────────
      const loader = new GLTFLoader();
      let helmet: any = null;
      let head: any = null;

      Promise.allSettled([
        new Promise<void>((resolve) => {
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
            undefined,
            () => resolve(),
          );
        }),
        new Promise<void>((resolve) => {
          loader.load(
            "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
            (gltf) => {
              helmet = gltf.scene.children[0];
              resolve();
            },
            undefined,
            () => resolve(),
          );
        }),
      ]).then(() => {
        if (!sceneRef.current) return; // unmounted while loading

        if (helmet && helmet.material) {
          const helmetUniforms = { texBlob: { value: blob.getTexture() } };
          helmet.material.onBeforeCompile = (shader: any) => {
            shader.uniforms.texBlob = helmetUniforms.texBlob;
            shader.vertexShader =
              `varying vec4 vPosProj; ${shader.vertexShader}`.replace(
                `#include <project_vertex>`,
                `#include <project_vertex>\nvPosProj = gl_Position;\n`,
              );
            shader.fragmentShader =
              `uniform sampler2D texBlob; varying vec4 vPosProj; ${shader.fragmentShader}`.replace(
                `#include <color_fragment>`,
                `vec2 blobUV = ((vPosProj.xy / vPosProj.w) + 1.0) * 0.5;
vec4 blobData = texture2D(texBlob, blobUV);
if (blobData.r < 0.01) discard;
#include <color_fragment>\n`,
              );
          };
          helmet.scale.setScalar(3.5);
          helmet.position.set(0, 1.5, 0.75);
          scene.add(helmet);
          const wireGeo = new THREE.WireframeGeometry(helmet.geometry);
          const wireMat = new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.15,
          });
          const wireframe = new THREE.LineSegments(wireGeo, wireMat);
          helmet.add(wireframe);
        }
        setStatus("ready");
      });

      // ─── Animation Loop ─────────────────────────────────────────────
      const clock = new THREE.Clock();

      const state = {
        renderer,
        scene,
        camera,
        controls,
        blob,
        clock,
        helmet,
        head,
        rafId: 0,
        cancelled: false,
        animating: true,
        cleanupFns: [] as Array<() => void>,
      };

      // Register cleanup functions
      state.cleanupFns.push(() =>
        window.removeEventListener("resize", handleResize),
      );
      state.cleanupFns.push(() =>
        el.removeEventListener("pointermove", onPointerMove),
      );
      state.cleanupFns.push(() =>
        renderer.domElement.removeEventListener("pointerleave", onPointerLeave),
      );

      sceneRef.current = state;

      const animate = () => {
        const s = sceneRef.current;
        if (!s || s.cancelled || !s.animating) return;
        s.rafId = requestAnimationFrame(animate);
        const dt = Math.min(s.clock.getDelta(), 0.1);
        s.controls.update();
        s.blob.render(dt);
        s.renderer.render(s.scene, s.camera);
      };
      animate();
    }

    // ─── Unmount cleanup (ONLY called when component truly unmounts) ─
    return () => {
      clearTimeout(initTimeout);
      const s = sceneRef.current;
      if (!s) return;

      s.cancelled = true;
      s.animating = false;
      cancelAnimationFrame(s.rafId);
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

      s.renderer.dispose();
      s.renderer.forceContextLoss();
      if (s.renderer.domElement.parentNode) {
        s.renderer.domElement.parentNode.removeChild(s.renderer.domElement);
      }

      s.cleanupFns.forEach((fn) => fn());
      sceneRef.current = null;
    };
  }, [status]);

  if (status === "phone") {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-[400px] flex items-center justify-center bg-neutral-100 rounded-2xl ${className || ""}`}
      >
        <div className='text-center px-6'>
          <p className='text-neutral-500 text-sm font-medium'>Digital Craft</p>
          <p className='text-neutral-400 text-xs mt-1'>
            Interactive 3D experience available on larger screens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] ${className || ""}`}
    >
      {status === "loading" && (
        <div className='absolute inset-0 flex items-center justify-center text-sm text-neutral-400'>
          Loading 3D scene…
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
