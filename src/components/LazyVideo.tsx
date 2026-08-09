import React, { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
}

export const LazyVideo = ({
  src,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "metadata",
}: LazyVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Lazy init
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pause when off-screen
  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    const el = containerRef.current;
    if (!video || !el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (autoPlay) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad, autoPlay]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      {shouldLoad && (
        <video
          ref={videoRef}
          src={src}
          className={className}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={preload}
        />
      )}
    </div>
  );
};
