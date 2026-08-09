import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const BlurText = ({ text, className, delay = 0 }: BlurTextProps) => {
  const words = text.split(" ");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <h1 ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={
            isVisible
              ? { filter: "blur(0px)", opacity: 1, y: 0 }
              : { filter: "blur(10px)", opacity: 0, y: 50 }
          }
          transition={{
            duration: 0.35,
            delay: delay / 1000 + i * 0.1,
            ease: "easeOut",
          }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
};
