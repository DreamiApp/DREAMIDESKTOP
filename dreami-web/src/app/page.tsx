// src/app/page.tsx
"use client";

import { useEffect, useRef } from "react";

/* -------------------- Local types -------------------- */
type Star = {
  x: number; y: number; z: number;
  vx: number; vy: number;
  r: number;
  tw: number;
};

type Nebula = {
  x: number; y: number; r: number;
  vx: number; vy: number;
  hue: number; alpha: number;
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ---------------------------
   * Scroll lock (only on Home)
   * --------------------------- */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevBehavior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";            // disable scroll
    document.body.style.overscrollBehavior = "none";    // stop iOS bounce

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevBehavior;
    };
  }, []);

  /* ---------------------------
   * Background starfield
   * --------------------------- */
  useEffect(() => {
    document.body.classList.remove("no-js");

    const canvas = canvasRef.current;
    if (!canvas) return;

    // TS-safe: narrow after null check (no 'possibly null' error)
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    // Respect reduced motion (live)
    let prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = prefersReduced.matches;
    const onReducedMotionChange = () => {
      reduceMotion = prefersReduced.matches;
      if (reduceMotion) {
        ctx.clearRect(0, 0, w, h);
        drawNebulas();
        drawStars(0);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else {
        if (!rafId) rafId = requestAnimationFrame(step);
      }
    };
    prefersReduced.addEventListener?.("change", onReducedMotionChange);

    // Simulation state
    let stars: Star[] = [];
    let nebulas: Nebula[] = [];
    let w = 0, h = 0, dpr = 1;
    let rafId: number | null = null;
    let paused = false;

    function initSky() {
      const vw = document.documentElement.clientWidth;
      const vh = Math.round(window.visualViewport?.height ?? window.innerHeight);

      const area = vw * vh;
      const starCount = Math.max(80, Math.floor(area / 11000));
      stars = Array.from({ length: starCount }, (): Star => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        r: Math.random() * 1.3 + 0.4,
        tw: Math.random() * Math.PI * 2,
      }));

      const nebulaCount = 5;
      nebulas = Array.from({ length: nebulaCount }, (): Nebula => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 0.25 + 0.15) * Math.max(w, h),
        vx: (Math.random() - 0.5) * 0.03,
        vy: (Math.random() - 0.5) * 0.03,
        hue: 255 + Math.random() * 60,
        alpha: 0.035 + Math.random() * 0.035,
      }));

      if (reduceMotion) {
        ctx.clearRect(0, 0, w, h);
        drawNebulas();
        drawStars(0);
      }
    }

    function currentDPRCap() {
      const smallScreen = (document.documentElement.clientWidth || window.innerWidth) <= 640;
      return Math.min(window.devicePixelRatio || 1, smallScreen ? 1.5 : 2);
    }

    function resize() {
      dpr = currentDPRCap();

      const cssW = Math.round(document.documentElement.clientWidth);
      const cssH = Math.round(window.visualViewport?.height ?? window.innerHeight);

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";

      w = canvas.width;
      h = canvas.height;

      // ts-expect-error – TS can't infer ctx type from getContext narrow; it's fine at runtime
      (ctx as CanvasRenderingContext2D).setTransform(1, 0, 0, 1, 0, 0);
      initSky();
    }

    function drawNebulas() {
      for (const n of nebulas) {
        n.x += n.vx * dpr;
        n.y += n.vy * dpr;

        if (n.x < -n.r) n.x = w + n.r;
        if (n.x > w + n.r) n.x = -n.r;
        if (n.y < -n.r) n.y = h + n.r;
        if (n.y > h + n.r) n.y = -n.r;

        const g = (ctx as CanvasRenderingContext2D).createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 70%, 70%, ${n.alpha})`);
        g.addColorStop(1, `hsla(${n.hue}, 70%, 70%, 0)`);

        (ctx as CanvasRenderingContext2D).globalCompositeOperation = "screen";
        (ctx as CanvasRenderingContext2D).fillStyle = g;
        (ctx as CanvasRenderingContext2D).beginPath();
        (ctx as CanvasRenderingContext2D).arc(n.x, n.y, n.r, 0, Math.PI * 2);
        (ctx as CanvasRenderingContext2D).fill();
      }
      (ctx as CanvasRenderingContext2D).globalCompositeOperation = "lighter";
    }

    function drawStars(t: number) {
      for (const s of stars) {
        s.x += s.vx * dpr;
        s.y += s.vy * dpr;

        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;

        const tw = 0.5 + 0.5 * Math.sin(t / 1400 + s.tw);
        const a = (0.2 + 0.45 * s.z) * tw;

        (ctx as CanvasRenderingContext2D).beginPath();
        (ctx as CanvasRenderingContext2D).fillStyle = `rgba(255,255,255,${a})`;
        (ctx as CanvasRenderingContext2D).arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        (ctx as CanvasRenderingContext2D).fill();
      }
    }

    function step(t = 0) {
      if (paused || reduceMotion) return;
      (ctx as CanvasRenderingContext2D).clearRect(0, 0, w, h);
      drawNebulas();
      drawStars(t);
      rafId = requestAnimationFrame(step);
    }

    let resizeTimer: number | undefined;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 100);
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", debouncedResize);
    vv?.addEventListener("scroll", debouncedResize);

    window.addEventListener("orientationchange", debouncedResize);
    window.addEventListener("resize", debouncedResize);

    let dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDprChange = () => {
      dprQuery.removeEventListener?.("change", onDprChange);
      dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener?.("change", onDprChange);
      debouncedResize();
    };
    dprQuery.addEventListener?.("change", onDprChange);

    document.addEventListener("visibilitychange", () => {
      paused = document.hidden;
      if (!paused && !reduceMotion) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(step);
      }
    });

    resize();
    if (!reduceMotion) rafId = requestAnimationFrame(step);

    return () => {
      vv?.removeEventListener("resize", debouncedResize);
      vv?.removeEventListener("scroll", debouncedResize);
      window.removeEventListener("orientationchange", debouncedResize);
      window.removeEventListener("resize", debouncedResize);
      prefersReduced.removeEventListener?.("change", onReducedMotionChange);
      dprQuery.removeEventListener?.("change", onDprChange);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  /* ---------------------------
   * Markup
   * --------------------------- */
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <canvas id="bg-canvas" ref={canvasRef} aria-hidden="true" />

      <header>
        <div className="container">{/* logo/nav optional */}</div>
      </header>

      <main id="main" className="container" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="highlight">Your Dream Companion</div>
          <h1 id="hero-title" className="title">DREAMI</h1>
          <p className="subheader">
            Capture, analyze, and interpret your dreams over a lifetime.
          </p>
        </section>
      </main>

      <noscript>
        <style>{`#bg-canvas{display:none}`}</style>
      </noscript>
    </>
  );
}
