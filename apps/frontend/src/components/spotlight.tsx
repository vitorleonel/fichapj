"use client";

import { useEffect, useRef } from "react";

/**
 * A soft light that follows the pointer. Only this layer ships to the client —
 * the hero around it stays a Server Component.
 */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let box = layer.getBoundingClientRect();
    let frame = 0;
    let latest = { x: 0, y: 0 };

    const measure = () => {
      box = layer.getBoundingClientRect();
    };

    const paint = () => {
      frame = 0;
      layer.style.setProperty("--spot-x", `${latest.x - box.left}px`);
      layer.style.setProperty("--spot-y", `${latest.y - box.top}px`);
    };

    // One paint per frame, at the newest position, so the listener never
    // queues up behind a fast pointer.
    const onMove = (event: PointerEvent) => {
      latest = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="hero-spotlight pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}
