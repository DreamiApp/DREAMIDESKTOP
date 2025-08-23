// src/app/page.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

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

          {/* Hero CTA: opens Calendly in a new tab */}
          <div className="hero-actions">
            <Link
              href="https://calendly.com/dreamiapp/30min"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book a Dreami demo on Calendly"
              className="demo-btn"
            >
              Book a demo
            </Link>
          </div>
        </section>
      </main>

      <noscript>
        <style>{`#bg-canvas{display:none}`}</style>
      </noscript>

      {/* Scoped styles for the demo button (unchanged) */}
      <style jsx>{`
        .hero-actions{
          margin-top: 24px;
          display: flex;
          justify-content: center;
        }
        .demo-btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 12px 18px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-radius: 9999px;
          border: 1px solid var(--btn-border, rgba(255,255,255,0.55));
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
          box-shadow: 0 6px 24px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06);
          color: #fff;
          text-decoration: none;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: transform .15s ease, box-shadow .2s ease, background-color .2s ease, opacity .2s ease;
        }
        .demo-btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.1);
        }
        .demo-btn:active{
          transform: translateY(0);
          opacity: 0.95;
        }
        .demo-btn:focus-visible{
          outline: 2px solid #fff;
          outline-offset: 3px;
        }
      `}</style>
    </>
  );
}
