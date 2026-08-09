// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ArtPieceProps {
  className?: string;
  /** Disable on mobile to prevent crashes */
  disableOnMobile?: boolean;
}

export const ArtPiece = ({
  className,
  disableOnMobile = true,
}: ArtPieceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "mobile"
  >("loading");
  const [isVisible, setIsVisible] = useState(false);

  // Detect mobile
  useEffect(() => {
    if (!disableOnMobile) return;
    const check = () => {
      const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
      if (isMobile) setStatus("mobile");
    };
    check();
  }, [disableOnMobile]);

  // IntersectionObserver: only init when in view
  useEffect(() => {
    if (status === "mobile") return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  // Main Three.js setup
  useEffect(() => {
    if (status === "mobile") return;
    if (!isVisible) return;

    const container = containerRef.current;
    if (!container) return;

    const initTimeout = setTimeout(() => {
      initScene();
    }, 100);

    let cancelled = false;
    const cleanupFns: Array<() => void> = [];
    let rafId = 0;

    function initScene() {
      const el = containerRef.current;
      if (!el || cancelled) return;

      const rect = el.getBoundingClientRect();
      const w = Math.max(rect.width, 300);
      const h = Math.max(rect.height, 400);

      if (w === 0 || h === 0) {
        setStatus("error");
        return;
      }

      // ─── Scene ──────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f7);

      const camera = new THREE.PerspectiveCamera(30, w / h, 1, 100);
      camera.position.set(-1, 0, 0).setLength(15);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power", // save battery on mobile
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap DPR
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      el.appendChild(renderer.domElement);

      // ─── Resize ─────────────────────────────────────────────────────────
      const handleResize = () => {
        if (!containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        const nw = Math.max(r.width, 300);
        const nh = Math.max(r.height, 400);
        if (nw === 0 || nh === 0) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        blob.setSize(nw, nh);
      };
      window.addEventListener("resize", handleResize);
      cleanupFns.push(() => window.removeEventListener("resize", handleResize));

      // ─── Controls ───────────────────────────────────────────────────────
      const camShift = new THREE.Vector3(0, 1, 0);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.object.position.add(camShift);
      controls.target.add(camShift);

      // ─── Lights ─────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(5, 10, 5);
      scene.add(dirLight);

      // ─── Ping-Pong Blob ─────────────────────────────────────────────────
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
              void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
              }
            `,
            fragmentShader: `
              precision mediump float;
              varying vec2 vUv;
              uniform float dTime;
              uniform float aspect;
              uniform vec2 pointer;
              uniform float pointerDown;
              uniform float pointerRadius;
              uniform float pointerDuration;
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
      cleanupFns.push(() => {
        el.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      });

      // ─── Load Models ────────────────────────────────────────────────────
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
        if (cancelled) return;

        if (helmet && helmet.material) {
          const helmetUniforms = { texBlob: { value: blob.getTexture() } };

          helmet.material.onBeforeCompile = (shader: any) => {
            shader.uniforms.texBlob = helmetUniforms.texBlob;
            shader.vertexShader = `
              varying vec4 vPosProj;
              ${shader.vertexShader}
            `.replace(
              `#include <project_vertex>`,
              `#include <project_vertex>
vPosProj = gl_Position;
`,
            );
            shader.fragmentShader = `
              uniform sampler2D texBlob;
              varying vec4 vPosProj;
              ${shader.fragmentShader}
            `.replace(
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

      // ─── Animation Loop ─────────────────────────────────────────────────
      const clock = new THREE.Clock();

      const animate = () => {
        if (cancelled) return;
        rafId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.1);
        controls.update();
        blob.render(dt);
        renderer.render(scene, camera);
      };
      animate();

      // 🔥 CRITICAL: Comprehensive cleanup
      cleanupFns.push(() => {
        cancelAnimationFrame(rafId);
        cancelled = true;
        controls.dispose();
        blob.dispose();

        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        renderer.dispose();
        renderer.forceContextLoss();

        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      });
    }

    return () => {
      clearTimeout(initTimeout);
      cleanupFns.forEach((fn) => fn());
    };
  }, [isVisible, status]);

  if (status === "mobile") {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full min-h-[400px] flex items-center justify-center bg-neutral-100 rounded-2xl ${className || ""}`}
      >
        <div className='text-center px-6'>
          <p className='text-neutral-500 text-sm font-medium'>Digital Craft</p>
          <p className='text-neutral-400 text-xs mt-1'>
            Interactive 3D experience available on desktop
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
