import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HLSVideoProps {
  src: string;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  style?: React.CSSProperties;
  /** Only initialize when in viewport */
  lazy?: boolean;
  /** Parent controls visibility */
  isVisible?: boolean;
}

export const HLSVideo = ({
  src,
  className,
  poster,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  style,
  lazy = true,
  isVisible = true,
}: HLSVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading: only init when near viewport
  useEffect(() => {
    if (!lazy) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy]);

  // Pause/play based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (!isVisible) {
      video.pause();
      return;
    }

    // Resume if we were playing
    if (autoPlay && video.paused) {
      video.play().catch(() => {});
    }
  }, [isVisible, shouldLoad, autoPlay]);

  // HLS init
  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let safariListener: (() => void) | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 15,        // cap buffer to save memory
        maxMaxBufferLength: 30,
        capLevelToPlayerSize: true,  // don't load 4K on small screens
        autoStartLoad: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay && isVisible) video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onLoaded = () => {
        if (autoPlay && isVisible) video.play().catch(() => {});
      };
      video.addEventListener("loadedmetadata", onLoaded);
      safariListener = () => video.removeEventListener("loadedmetadata", onLoaded);
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      if (safariListener) safariListener();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, autoPlay, shouldLoad, isVisible]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {shouldLoad && (
        <video
          ref={videoRef}
          className={className}
          poster={poster}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          style={style}
        />
      )}
    </div>
  );
};
