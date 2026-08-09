import React, { useEffect, useRef, useState } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  className?: string;
  /** Render children only when in viewport */
  lazy?: boolean;
  /** Root margin for early loading */
  rootMargin?: string;
}

export const LazySection = ({
  children,
  className,
  lazy = true,
  rootMargin = "200px",
}: LazySectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : null}
    </div>
  );
};
