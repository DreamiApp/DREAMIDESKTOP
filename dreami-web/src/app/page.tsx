// src/app/page.tsx
"use client";

import { useEffect, useRef } from "react";

/* -------------------- Local types -------------------- */
type Star = {
  x: number; y: number; z: number;
  vx: number; vy: number;
  r: number; tw: number;
};
type Nebula = {
  x: number; y: number; r: number;
  vx: number; vy: number;
  hue: number; alpha: number;
};

/** Extend CSSStyleDeclaration for overscrollBehavior (older DOM libs omit it) */
type OverscrollStyle = CSSStyleDeclaration & { overscrollBehavior?: string };

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ---------------------------
   * Scroll lock (keeps edges clean)
   * --------------------------- */
  useEffect(() => {
    const bodyStyle = document.body.style as OverscrollStyle;
    const prevOverflow = bodyStyle.overflow;
    const prevBehavior = bodyStyle.overscrollBehavior;

    bodyStyle.overflow = "hidden";
    bodyStyle.overscrollBehavior = "none";

    return () => {
      bodyStyle.overflow = prevOverflow;
      bodyStyle.overscrollBehavior = prevBehavior;
    };
  }, []);

  /* ----------------------------------------
   * Block zoom (pinch + double-tap) on iOS
   * ---------------------------------------- */
  useEffect(() => {
    const prevent: EventListener = (e) => e.preventDefault();
    const nonPassive: AddEventListenerOptions = { passive: false };

    document.addEventListener("gesturestart", prevent, nonPassive);
    document.addEventListener("gesturechange", prevent, nonPassive);
    document.addEventListener("gestureend", prevent, nonPassive);

    // Prevent double-tap zoom
    let last = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - last < 300) e.preventDefault();
      last = now;
    };
    document.addEventListener("touchend", onTouchEnd, nonPassive);

    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  /* ---------------------------
   * Background starfield
   * --------------------------- */
  useEffect(() => {
    document.body.classList.remove("no-js");

    // 1) Lock non-null canvas element
    const maybeEl = canvasRef.current as HTMLCanvasElement | null;
    if (!maybeEl) return;
    const cv: HTMLCanvasElement = maybeEl;

    // 2) Lock non-null drawing context
    const maybeCtx = cv.getContext("2d", { alpha: true, desynchronized: true });
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = prefersReduced.matches;

    let stars: Star[] = [];
    let nebulas: Nebula[] = [];
    let w = 0, h = 0, dpr = 1;
    let rafId: number | null = null;
    let paused = false;

    const onReducedMotionChange = () => {
      reduceMotion = prefersReduced.matches;
      if (reduceMotion) {
        ctx.clearRect(0, 0, w, h);
        drawNebulas();
        drawStars(0);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(step);
      }
    };
    prefersReduced.addEventListener?.("change", onReducedMotionChange);

    function currentDPRCap() {
      const smallScreen =
        (document.documentElement.clientWidth || window.innerWidth) <= 640;
      return Math.min(window.devicePixelRatio || 1, smallScreen ? 1.5 : 2);
    }

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
      const diag = Math.hypot(w, h);
      nebulas = Array.from({ length: nebulaCount }, (): Nebula => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 0.22 + 0.18) * diag, // diagonal-based radius fills landscape
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

    function resize() {
      dpr = currentDPRCap();

      // Measure rendered size (CSS fills safe areas)
      const rect = cv.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));

      cv.width = Math.floor(cssW * dpr);
      cv.height = Math.floor(cssH * dpr);

      w = cv.width;
      h = cv.height;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
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

        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 70%, 70%, ${n.alpha})`);
        g.addColorStop(1, `hsla(${n.hue}, 70%, 70%, 0)`);

        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "lighter";
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

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step(t = 0) {
      if (paused || reduceMotion) return;
      ctx.clearRect(0, 0, w, h);
      drawNebulas();
      drawStars(t);
      rafId = requestAnimationFrame(step);
    }

    let resizeTimer: number | undefined;
    const debouncedResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 100);
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", debouncedResize);
    vv?.addEventListener("scroll", debouncedResize);

    window.addEventListener("orientationchange", debouncedResize);
    window.addEventListener("resize", debouncedResize);

    let dprQuery: MediaQueryList = matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
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
