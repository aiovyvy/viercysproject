"use client";
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Architectural mask enhancement; content is fully visible without JS. */
export function ScrollReveal({
  children,
  scene,
  className = "",
}: {
  children: ReactNode;
  scene: string;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        if (scene === "courtyard" || scene === "sunset") {
          gsap.fromTo(
            root.current?.querySelector("img") ?? [],
            {
              scale: 1.18,
              filter:
                scene === "sunset" ? "sepia(.65) brightness(1.2)" : "none",
            },
            {
              scale: 1,
              filter: "sepia(0) brightness(1)",
              ease: "none",
              scrollTrigger: {
                trigger: root.current,
                start: "top 85%",
                end: "top 15%",
                scrub: true,
              },
            },
          );
        }
        gsap.fromTo(
          root.current,
          { clipPath: "inset(8% 18% 0% 18% round 48% 48% 0 0)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0% 0% 0 0)",
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top 85%",
              end: "top 15%",
              scrub: true,
            },
          },
        );
      }, root);
      return () => context.revert();
    });
    // Parent entrance pinning changes document offsets after child effects run.
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refresh);
      media.revert();
    };
  }, [scene]);
  return (
    <div ref={root} className={className} data-scene={scene}>
      {children}
    </div>
  );
}
