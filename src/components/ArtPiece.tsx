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
      const { OrbitControls } =
        await import("three/examples/jsm/controls/OrbitControls.js");
      const { GLTFLoader } =
        await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (cancelled || !container) return;

      const getSize = () => ({
        w: container.clientWidth || window.innerWidth,
        h: container.clientHeight || window.innerHeight,
      });

      const { w, h } = getSize();
      if (w === 0 || h === 0) {
        console.warn("ArtPiece: container has zero dimensions", { w, h });
        return;
      }

      console.log("ArtPiece: initializing", { w, h });

      // ─── Scene Setup ────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f7);

      const camera = new THREE.PerspectiveCamera(30, w / h, 1, 100);
      camera.position.set(-1, 0, 0).setLength(15);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      const handleResize = () => {
        const { w: nw, h: nh } = getSize();
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

      // ─── Ping-Pong Blob (framebuffer feedback) ──────────────────────────
      // Uses two render targets instead of copyFramebufferToTexture
      // This is the reliable, standard approach for feedback loops.
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

          // Swap
          const temp = this.rtRead;
          this.rtRead = this.rtWrite;
          this.rtWrite = temp;
        }

        getTexture() {
          // Return the texture that was JUST written to (now in rtRead after swap)
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
      cleanupFns.push(() => {
        container.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      });

      // ─── Models ─────────────────────────────────────────────────────────
      const loader = new GLTFLoader();
      let hasVisibleModel = false;

      // Load taban.glb
      try {
        const gltf = await loader.loadAsync("/taban.glb");
        const head = gltf.scene.children[0];
        if (head && head.geometry) {
          head.geometry.rotateY(Math.PI * 0.01);
          head.scale.setScalar(4.724);
          head.position.set(0.226, -0.569, 0.63);
          scene.add(head);
          hasVisibleModel = true;
          console.log("ArtPiece: taban.glb loaded successfully");
        }
      } catch (err) {
        console.warn("ArtPiece: /taban.glb not found or failed to load", err);
      }

      // Load helmet
      let helmet: any = null;
      try {
        const gltf = await loader.loadAsync(
          "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
        );
        helmet = gltf.scene.children[0];
        if (helmet && helmet.material) {
          hasVisibleModel = true;
          console.log("ArtPiece: helmet loaded successfully");
        }
      } catch (err) {
        console.warn("ArtPiece: helmet failed to load", err);
      }

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
            `
            vec2 blobUV = ((vPosProj.xy / vPosProj.w) + 1.0) * 0.5;
            vec4 blobData = texture2D(texBlob, blobUV);
            if (blobData.r < 0.01) discard;
            #include <color_fragment>
            `,
          );
        };

        helmet.scale.setScalar(3.5);
        helmet.position.set(0, 1.5, 0.75);
        scene.add(helmet);

        // Wireframe overlay
        const helmetWire = new THREE.Mesh(
          helmet.geometry.clone().rotateX(Math.PI * 0.5),
          new THREE.MeshBasicMaterial({
            color: 0x444444,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            onBeforeCompile: (shader: any) => {
              shader.uniforms.time = { value: 0 };

              shader.vertexShader = `
                varying float vYVal;
                ${shader.vertexShader}
              `.replace(
                `#include <project_vertex>`,
                `#include <project_vertex>
                vYVal = position.y;
                `,
              );

              shader.fragmentShader = `
                uniform float time;
                varying float vYVal;
                ${shader.fragmentShader}
              `.replace(
                `#include <color_fragment>`,
                `#include <color_fragment>
                float y = fract(vYVal * 0.25 + time * 0.5);
                float fY = smoothstep(0.0, 0.01, y) - smoothstep(0.02, 0.1, y);
                diffuseColor.a *= fY * 0.9 + 0.1;
                `,
              );
            },
          }),
        );
        helmetWire.scale.setScalar(3.5);
        helmetWire.position.set(0, 1.5, 0.75);
        scene.add(helmetWire);
      }

      // ─── Fallback: always-visible wireframe shape ───────────────────────
      const fallbackGroup = new THREE.Group();
      const fallbackGeo = new THREE.IcosahedronGeometry(2.5, 1);
      const fallbackMat = new THREE.MeshBasicMaterial({
        color: 0x666666,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
      fallbackMesh.position.set(0, 1, 0);
      fallbackGroup.add(fallbackMesh);

      // Inner glowing core
      const coreGeo = new THREE.IcosahedronGeometry(1.2, 0);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x999999,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(0, 1, 0);
      fallbackGroup.add(coreMesh);

      scene.add(fallbackGroup);

      // ─── Render Loop ────────────────────────────────────────────────────
      const clock = new THREE.Clock();
      let t = 0;

      renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        t += dt;

        controls.update();
        blob.render(dt);

        // Update helmet uniform every frame
        if (helmet && helmet.material) {
          helmet.material.uniforms.texBlob.value = blob.getTexture();
        }

        // Animate fallback
        fallbackMesh.rotation.y += 0.003;
        fallbackMesh.rotation.x += 0.002;
        coreMesh.rotation.y -= 0.005;
        coreMesh.rotation.z += 0.002;

        renderer.render(scene, camera);
      });

      cleanupFns.push(() => {
        renderer.setAnimationLoop(null);
        controls.dispose();
        renderer.dispose();
        blob.rtRead.dispose();
        blob.rtWrite.dispose();
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      });

      console.log("ArtPiece: render loop started");
    })();

    return () => {
      cancelled = true;
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
        minHeight: "300px",
        position: "relative",
        display: "block",
      }}
    />
  );
};
