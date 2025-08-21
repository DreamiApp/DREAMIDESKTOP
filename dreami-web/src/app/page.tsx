// src/app/page.tsx
"use client"; // Next.js: mark this component as client-side only

import { useEffect, useRef } from "react";

/* -------------------- Local types (replace all `any`) -------------------- */
type Star = {
  x: number; y: number; z: number;
  vx: number; vy: number;
  r: number;          // base radius (device px)
  tw: number;         // twinkle phase
};

type Nebula = {
  x: number; y: number; r: number;
  vx: number; vy: number;
  hue: number; alpha: number;
};

export default function Home() {
  // Canvas element we draw the background animation on                     // <canvas id="bg-canvas" />
  const canvasRef = useRef<HTMLCanvasElement | null>(null);                 // ref is populated after first render

  useEffect(() => {
    document.body.classList.remove("no-js");                                // progressive enhancement: signal JS is active

    /* ===========================
     * Canvas / Starfield Setup
     * =========================== */
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches; // respect user accessibility setting
    const canvas = canvasRef.current!;                                      // non-null because this effect runs after mount
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true })! as CanvasRenderingContext2D; // perf hint

    // Simulation state                                                     // kept outside render for performance
    let stars: Star[] = [];                                                 // array of star particles
    let nebulas: Nebula[] = [];                                             // array of soft nebula blobs
    let w: number, h: number, dpr: number, rafId: number | null = null;     // canvas width/height, device pixel ratio, RAF id
    let paused = false;                                                     // pause when tab is hidden

    /* ---------------------------
     * Initialize sky objects
     * --------------------------- */
    function initSky() {
      const area = innerWidth * innerHeight;                                // screen area (CSS pixels)
      const starCount = Math.max(80, Math.floor(area / 11000));             // scale star count with screen size
      stars = Array.from({ length: starCount }, (): Star => ({              // create stars with slight variance
        x: Math.random() * w,                                               // position x in device pixels
        y: Math.random() * h,                                               // position y in device pixels
        z: Math.random() * 0.6 + 0.4,                                       // depth factor (0.4–1.0) affects size/alpha
        vx: (Math.random() - 0.5) * 0.05,                                   // slow horizontal drift
        vy: (Math.random() - 0.5) * 0.05,                                   // slow vertical drift
        r: Math.random() * 1.3 + 0.4,                                       // base radius (device pixels before z)
        tw: Math.random() * Math.PI * 2,                                    // twinkle phase offset
      }));

      const nebulaCount = 5;                                                // number of large soft blobs
      nebulas = Array.from({ length: nebulaCount }, (): Nebula => ({
        x: Math.random() * w,                                               // start position
        y: Math.random() * h,
        r: (Math.random() * 0.25 + 0.15) * Math.max(w, h),                  // radius relative to viewport
        vx: (Math.random() - 0.5) * 0.03,                                   // very slow drift
        vy: (Math.random() - 0.5) * 0.03,
        hue: 255 + Math.random() * 60,                                      // cool purple/blue range
        alpha: 0.035 + Math.random() * 0.035,                               // very faint fill
      }));

      if (reduceMotion) {                                                   // if animations reduced, draw once
        ctx.clearRect(0, 0, w, h);
        drawNebulas();
        drawStars(0);
      }
    }

    /* ---------------------------
     * Handle canvas sizing / DPR
     * --------------------------- */
    function resize() {
      const cap = innerWidth <= 640 ? 1.5 : 2;                              // cap DPR to control fill-rate on small/large
      dpr = Math.min(window.devicePixelRatio || 1, cap);                    // final device pixel ratio used for backing store
      w = (canvas.width = Math.floor(innerWidth * dpr));                    // set canvas backing width in device pixels
      h = (canvas.height = Math.floor(innerHeight * dpr));                  // set canvas backing height in device pixels
      canvas.style.width = innerWidth + "px";                               // CSS size (logical pixels)
      canvas.style.height = innerHeight + "px";
      initSky();                                                            // recreate particles to fit new size
    }

    /* ---------------------------
     * Nebula painter
     * --------------------------- */
    function drawNebulas() {
      for (const n of nebulas) {
        // integrate motion                                                 // extremely slow drift for parallax feel
        n.x += n.vx * dpr;
        n.y += n.vy * dpr;

        // wrap around screen edges                                         // seamless looping
        if (n.x < -n.r) n.x = w + n.r;
        if (n.x > w + n.r) n.x = -n.r;
        if (n.y < -n.r) n.y = h + n.r;
        if (n.y > h + n.r) n.y = -n.r;

        // radial gradient with soft falloff                                // gives a glowing cloud look
        const g: CanvasGradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 70%, 70%, ${n.alpha})`);
        g.addColorStop(1, `hsla(${n.hue}, 70%, 70%, 0)`);

        ctx.globalCompositeOperation = "screen";                            // additive-like blending for glow
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "lighter";                             // keep additive feel for subsequent strokes
    }

    /* ---------------------------
     * Star painter (with twinkle)
     * --------------------------- */
    function drawStars(t: number) {
      for (const s of stars) {
        // integrate slow drift                                            // tiny motion creates life in the scene
        s.x += s.vx * dpr;
        s.y += s.vy * dpr;

        // wrap at edges                                                   // prevents disappearing stars
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;

        // twinkle factor                                                  // smooth pulsing brightness
        const tw = 0.5 + 0.5 * Math.sin(t / 1400 + s.tw);                  // 0..1 over time

        // alpha based on depth + twinkle                                  // nearer stars appear brighter
        const a = (0.2 + 0.45 * s.z) * tw;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${a})`;                          // white stars with varying opacity
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);                      // radius scaled by depth z
        ctx.fill();
      }
    }

    /* ---------------------------
     * Animation loop
     * --------------------------- */
    function step(t = 0) {
      if (paused || reduceMotion) return;                                   // stop when tab hidden or animations reduced
      ctx.clearRect(0, 0, w, h);                                           // clear full frame (device pixels)
      drawNebulas();                                                        // paint background glow
      drawStars(t);                                                         // paint stars on top
      rafId = requestAnimationFrame(step);                                  // schedule next frame
    }

    /* ---------------------------
     * Event wiring
     * --------------------------- */
    let resizeT: number | undefined;                                        // debounce timer id
    const onResize = () => {                                                // debounce to avoid thrashing on drag/rotate
      clearTimeout(resizeT);
      resizeT = window.setTimeout(resize, 120);
    };

    document.addEventListener("visibilitychange", () => {                   // pause when the tab is hidden
      paused = document.hidden;
      if (!paused && !reduceMotion) {
        if (rafId) cancelAnimationFrame(rafId);                             // reset RAF to avoid double loops
        rafId = requestAnimationFrame(step);
      }
    });

    // Initial layout + start loop
    resize();                                                               // compute DPR, size canvas, (re)spawn particles
    if (!reduceMotion) rafId = requestAnimationFrame(step);                 // kick off animation if allowed
    window.addEventListener("resize", onResize);                            // adapt to viewport changes
    window.addEventListener("DOMContentLoaded", () =>                       // subtle reveal class for CSS transitions
      requestAnimationFrame(() => document.body.classList.add("reveal"))
    );

    /* ---------------------------
     * Cleanup on unmount
     * --------------------------- */
    return () => {
      window.removeEventListener("resize", onResize);                       // remove listeners to avoid leaks
      if (rafId) cancelAnimationFrame(rafId);                               // stop animation loop
    };
  }, []);                                                                    // run once after mount

  /* ===========================
   * Markup
   * =========================== */
  return (
    <>
      {/* Accessibility skip link helps keyboard users jump to main content */}
      <a className="skip-link" href="#main">                                {/* styled via global CSS */}
        Skip to content
      </a>

      {/* Fullscreen animated background */}
      <canvas id="bg-canvas" ref={canvasRef} aria-hidden="true" />          {/* purely decorative */}

      {/* Header retained to hold a logo later (currently empty) */}
      <header>
        <div className="container">                                         {/* keep structure for future nav/brand */}
          {/* (optional) add a logo or leave empty */}
        </div>
      </header>

      {/* Main hero copy */}
      <main id="main" className="container" tabIndex={-1}>                  {/* tabIndex enables focus via skip link */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="highlight">Your Dream Companion</div>             {/* small tag above title */}
          <h1 id="hero-title" className="title">
            DREAMI
          </h1>
          <p className="subheader">
            Capture, analyze, and interpret your dreams over a lifetime.
          </p>
        </section>
      </main>

      {/* Fallback: hide canvas if JS disabled */}
      <noscript>
        <style>{`#bg-canvas{display:none}`}</style>                          {/* prevents empty box when no JS */}
      </noscript>
    </>
  );
}
