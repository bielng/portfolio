// This component ports a standalone Three.js sketch (originally a full-page
// vanilla HTML/JS file) into the portfolio as a self-contained section.
// Heavy use of onBeforeCompile shader string-patching doesn't type-check
// cleanly against three's public types, so this file opts out of strict
// checking rather than fighting the compiler over untyped shader internals.
// @ts-nocheck
import { useEffect, useRef } from "react";

interface ArtPieceProps {
  className?: string;
}

export const ArtPiece = ({ className }: ArtPieceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const cleanupFns: Array<() => void> = [];

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );

      if (cancelled || !container) return;

      const getSize = () => ({
        w: container.clientWidth || window.innerWidth,
        h: container.clientHeight || window.innerHeight,
      });

      // ─── Global Uniforms ────────────────────────────────────────────────
      const gu = {
        time: { value: 0 },
        dTime: { value: 0 },
        aspect: { value: getSize().w / getSize().h },
      };

      // ─── Blob (framebuffer feedback paint) ─────────────────────────────
      class Blob {
        renderer: any;
        fbTexture: any;
        rtOutput: any;
        uniforms: any;
        rtScene: any;
        rtCamera: any;

        constructor(renderer: any) {
          const { w, h } = getSize();
          this.renderer = renderer;

          this.fbTexture = { value: new THREE.FramebufferTexture(w, h) };
          this.rtOutput = new THREE.WebGLRenderTarget(w, h);

          this.uniforms = {
            pointer: { value: new THREE.Vector2().setScalar(10) },
            pointerDown: { value: 1 },
            pointerRadius: { value: 0.375 },
            pointerDuration: { value: 2.5 },
          };

          const onPointerMove = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            this.uniforms.pointer.value.x =
              ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.uniforms.pointer.value.y =
              -((e.clientY - rect.top) / rect.height) * 2 + 1;
          };
          const onPointerLeave = () => {
            this.uniforms.pointer.value.setScalar(10);
          };

          container.addEventListener("pointermove", onPointerMove);
          renderer.domElement.addEventListener("pointerleave", onPointerLeave);
          cleanupFns.push(() => {
            container.removeEventListener("pointermove", onPointerMove);
            renderer.domElement.removeEventListener(
              "pointerleave",
              onPointerLeave
            );
          });

          this.rtScene = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.MeshBasicMaterial({
              color: 0x000000,
              onBeforeCompile: (shader: any) => {
                shader.uniforms.dTime = gu.dTime;
                shader.uniforms.aspect = gu.aspect;
                shader.uniforms.pointer = this.uniforms.pointer;
                shader.uniforms.pointerDown = this.uniforms.pointerDown;
                shader.uniforms.pointerRadius = this.uniforms.pointerRadius;
                shader.uniforms.pointerDuration = this.uniforms.pointerDuration;
                shader.uniforms.fbTexture = this.fbTexture;

                shader.fragmentShader = `
                  uniform float dTime;
                  uniform float aspect;
                  uniform vec2  pointer;
                  uniform float pointerDown;
                  uniform float pointerRadius;
                  uniform float pointerDuration;
                  uniform sampler2D fbTexture;
                  ${shader.fragmentShader}
                `.replace(
                  `#include <color_fragment>`,
                  `#include <color_fragment>

                  float duration = pointerDuration;
                  float rVal = texture2D(fbTexture, vUv).r;

                  rVal -= clamp(dTime / duration, 0., 0.1);
                  rVal  = clamp(rVal, 0., 1.);

                  float f = 0.;
                  if (pointerDown > 0.5) {
                    vec2 uv    = (vUv - 0.5) * 2. * vec2(aspect, 1.);
                    vec2 mouse = pointer * vec2(aspect, 1.);
                    f = 1. - smoothstep(pointerRadius * 0.1, pointerRadius, distance(uv, mouse));
                  }
                  rVal += f * 0.1;
                  rVal  = clamp(rVal, 0., 1.);
                  diffuseColor.rgb = vec3(rVal);
                  `
                );
              },
            })
          );
          this.rtScene.material.defines = { USE_UV: "" };
          this.rtCamera = new THREE.Camera();
        }

        render() {
          this.renderer.setRenderTarget(this.rtOutput);
          this.renderer.render(this.rtScene, this.rtCamera);
          this.renderer.copyFramebufferToTexture(this.fbTexture.value);
          this.renderer.setRenderTarget(null);
        }

        setSize(w: number, h: number) {
          this.rtOutput.setSize(w, h);
        }
      }

      // ─── Renderer & Camera ──────────────────────────────────────────────
      const { w, h } = getSize();

      const scene = new THREE.Scene();
      // Near-white, matching the section's HTML background so the canvas
      // has no visible seam against the page around it.
      scene.background = new THREE.Color(0xf5f5f7);

      const camera = new THREE.PerspectiveCamera(30, w / h, 1, 100);
      camera.position.set(-1, 0, 0).setLength(15);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";

      const handleResize = () => {
        const { w: nw, h: nh } = getSize();
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        gu.aspect.value = camera.aspect;
      };
      window.addEventListener("resize", handleResize);
      cleanupFns.push(() => window.removeEventListener("resize", handleResize));

      // ─── Controls ───────────────────────────────────────────────────────
      const camShift = new THREE.Vector3(0, 1, 0);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.object.position.add(camShift);
      controls.target.add(camShift);

      // ─── Light ──────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(5, 10, 5);
      scene.add(dirLight);

      // ─── Blob ───────────────────────────────────────────────────────────
      const blob = new Blob(renderer);

      // ─── Models ─────────────────────────────────────────────────────────
      const loader = new GLTFLoader();

      try {
        const head = (await loader.loadAsync("/taban.glb")).scene.children[0];
        head.geometry.rotateY(Math.PI * 0.01);
        head.scale.setScalar(4.724);
        head.position.set(0.226, -0.569, 0.63);
        scene.add(head);
      } catch (err) {
        // Expected until taban.glb is added to /public — the rest of the
        // scene (helmet + blob effect) still renders fine without it.
        console.warn(
          "ArtPiece: couldn't load /taban.glb — add the file to the project's public/ folder.",
          err
        );
      }

      const helmet = (
        await loader.loadAsync(
          "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf"
        )
      ).scene.children[0];

      const helmetUniforms = { texBlob: { value: blob.rtOutput.texture } };

      helmet.material.onBeforeCompile = (shader: any) => {
        shader.uniforms.texBlob = helmetUniforms.texBlob;

        shader.vertexShader = `
          varying vec4 vPosProj;
          ${shader.vertexShader}
        `.replace(
          `#include <project_vertex>`,
          `#include <project_vertex>
          vPosProj = gl_Position;
          `
        );

        shader.fragmentShader = `
          uniform sampler2D texBlob;
          varying vec4 vPosProj;
          ${shader.fragmentShader}
        `.replace(
          `#include <clipping_planes_fragment>`,
          `
          vec2 blobUV   = ((vPosProj.xy / vPosProj.w) + 1.) * 0.5;
          vec4 blobData = texture(texBlob, blobUV);
          if (blobData.r < 0.01) discard;
          #include <clipping_planes_fragment>
          `
        );
      };

      helmet.scale.setScalar(3.5);
      helmet.position.set(0, 1.5, 0.75);
      scene.add(helmet);

      const helmetWire = new THREE.Mesh(
        helmet.geometry.clone().rotateX(Math.PI * 0.5),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
          onBeforeCompile: (shader: any) => {
            shader.uniforms.time = gu.time;

            shader.vertexShader = `
              varying float vYVal;
              ${shader.vertexShader}
            `.replace(
              `#include <begin_vertex>`,
              `#include <begin_vertex>
              vYVal = position.y;
              `
            );

            shader.fragmentShader = `
              uniform float time;
              varying float vYVal;
              ${shader.fragmentShader}
            `.replace(
              `#include <color_fragment>`,
              `#include <color_fragment>

              float y  = fract(vYVal * 0.25 + time * 0.5);
              float fY = smoothstep(0., 0.01, y) - smoothstep(0.02, 0.1, y);
              diffuseColor.a *= fY * 0.9 + 0.1;
              `
            );
          },
        })
      );
      helmetWire.scale.setScalar(3.5);
      helmetWire.position.set(0, 1.5, 0.75);
      scene.add(helmetWire);

      // ─── Render Loop ────────────────────────────────────────────────────
      const clock = new THREE.Clock();
      let t = 0;

      renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        t += dt;
        gu.time.value = t;
        gu.dTime.value = dt;

        controls.update();
        blob.render();
        renderer.render(scene, camera);
      });

      cleanupFns.push(() => {
        renderer.setAnimationLoop(null);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      });
    })();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return <div ref={containerRef} className={className} />;
};
