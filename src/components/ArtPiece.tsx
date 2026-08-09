// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ArtPieceProps {
  className?: string;
}

export const ArtPiece = ({ className }: ArtPieceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Give React a tick to render the container with proper dimensions
    const initTimeout = setTimeout(() => {
      initScene();
    }, 100);

    let cancelled = false;
    const cleanupFns: Array<() => void> = [];

    function initScene() {
      const el = containerRef.current;
      if (!el || cancelled) return;

      const rect = el.getBoundingClientRect();
      const w = Math.max(rect.width, 300);
      const h = Math.max(rect.height, 400);

      if (w === 0 || h === 0) {
        console.warn("ArtPiece: container has zero dimensions", rect);
        setStatus("error");
        return;
      }

      console.log("ArtPiece: init", { w, h });

      // ─── Scene ──────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f7);

      const camera = new THREE.PerspectiveCamera(30, w / h, 1, 100);
      camera.position.set(-1, 0, 0).setLength(15);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        // Try taban.glb
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
                console.log("ArtPiece: taban.glb loaded");
              }
              resolve();
            },
            undefined,
            (err) => {
              console.warn("ArtPiece: taban.glb failed", err);
              resolve();
            },
          );
        }),
        // Try helmet
        new Promise<void>((resolve) => {
          loader.load(
            "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
            (gltf) => {
              helmet = gltf.scene.children[0];
              if (helmet && helmet.material) {
                console.log("ArtPiece: helmet loaded");
              }
              resolve();
            },
            undefined,
            (err) => {
              console.warn("ArtPiece: helmet failed", err);
              resolve();
            },
          );
        }),
      ]).then(() => {
        if (cancelled) return;

        // Setup helmet with blob reveal
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

          // Wireframe
          const wireGeo = helmet.geometry.clone().rotateX(Math.PI * 0.5);
          const wireMat = new THREE.MeshBasicMaterial({
            color: 0x444444,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
          });
          const wire = new THREE.Mesh(wireGeo, wireMat);
          wire.scale.setScalar(3.5);
          wire.position.set(0, 1.5, 0.75);
          scene.add(wire);
        }

        setStatus("ready");
      });

      // ─── Fallback geometry (always visible) ─────────────────────────────
      const fallbackGroup = new THREE.Group();

      const icoGeo = new THREE.IcosahedronGeometry(2.2, 1);
      const icoMat = new THREE.MeshBasicMaterial({
        color: 0x555555,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const ico = new THREE.Mesh(icoGeo, icoMat);
      ico.position.set(0, 1, 0);
      fallbackGroup.add(ico);

      const coreGeo = new THREE.IcosahedronGeometry(1.0, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 1, 0);
      fallbackGroup.add(core);

      scene.add(fallbackGroup);

      // ─── Render Loop ────────────────────────────────────────────────────
      const clock = new THREE.Clock();

      renderer.setAnimationLoop(() => {
        if (cancelled) return;
        const dt = clock.getDelta();

        controls.update();
        blob.render(dt);

        if (helmet && helmet.material && helmet.material.uniforms) {
          helmet.material.uniforms.texBlob.value = blob.getTexture();
        }

        ico.rotation.y += 0.003;
        ico.rotation.x += 0.002;
        core.rotation.y -= 0.005;
        core.rotation.z += 0.002;

        renderer.render(scene, camera);
      });

      cleanupFns.push(() => {
        renderer.setAnimationLoop(null);
        controls.dispose();
        renderer.dispose();
        blob.rtRead.dispose();
        blob.rtWrite.dispose();
        if (renderer.domElement.parentElement === el) {
          el.removeChild(renderer.domElement);
        }
      });
    }

    return () => {
      cancelled = true;
      clearTimeout(initTimeout);
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        position: "relative",
        display: "block",
        background: "#f5f5f7",
      }}
    >
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#999",
            zIndex: 10,
          }}
        >
          Loading 3D scene...
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#c00",
            zIndex: 10,
          }}
        >
          3D scene failed to initialize. Check console.
        </div>
      )}
    </div>
  );
};
