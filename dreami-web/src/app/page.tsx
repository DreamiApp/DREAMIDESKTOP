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
  const landscapeRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------------
   * Scroll lock (only on Home)
   * --------------------------- */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevBehavior = (document.body.style as any).overscrollBehavior;

    document.body.style.overflow = "hidden";                 // disable scroll
    (document.body.style as any).overscrollBehavior = "none"; // stop iOS bounce

    return () => {
      document.body.style.overflow = prevOverflow;
      (document.body.style as any).overscrollBehavior = prevBehavior;
    };
  }, []);

  /* ---------------------------------------------------------
   * Try to lock to portrait where supported (Android/PWA only)
   * --------------------------------------------------------- */
  useEffect(() => {
    const tryLock = async () => {
      try {
        const ori: any = (screen as any)?.orientation;
        if (ori?.lock) await ori.lock("portrait");
      } catch {
        /* iOS Safari will ignore this */
      }
    };
    // Orientation lock requires a user gesture
    const onFirstInput = () => { tryLock(); };
    window.addEventListener("pointerdown", onFirstInput, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstInput);
  }, []);

  /* ----------------------------------------
   * Block zoom (pinch + double-tap) on iOS
   * ---------------------------------------- */
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();

    // Safari gesture events (not in TS lib)
    document.addEventListener("gesturestart" as any, prevent, { passive: false } as any);
    document.addEventListener("gesturechange" as any, prevent, { passive: false } as any);
    document.addEventListener("gestureend" as any, prevent, { passive: false } as any);

    // Prevent double-tap zoom
    let last = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - last < 300) e.preventDefault();
      last = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("gesturestart" as any, prevent as any);
      document.removeEventListener("gesturechange" as any, prevent as any);
      document.removeEventListener("gestureend" as any, prevent as any);
      document.removeEventListener("touchend", onTouchEnd as any);
    };
  }, []);

  /* ---------------------------------------------------
   * Show overlay if a PHONE is in landscape (browser)
   * --------------------------------------------------- */
  useEffect(() => {
    const el = landscapeRef.current;
    if (!el) return;

    const isPhone = () =>
      matchMedia("(hover: none) and (pointer: coarse)").matches;

    const isLandscape = () =>
      matchMedia("(orientation: landscape)").matches;

    const smallViewport = () => {
      const vh = Math.round(window.visualViewport?.height ?? window.innerHeight);
      return vh <= 500; // guard to avoid tablets/desktops
    };

    const isStandalonePWA = () =>
      matchMedia("(display-mode: standalone)").matches;

    const update = () => {
      const show = isPhone() && isLandscape() && smallViewport() && !isStandalonePWA();
      el.style.display = show ? "grid" : "none";
    };

    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  /* ---------------------------
   * Background starfield
   * --------------------------- */
  useEffect(() => {
    document.body.classList.remove("no-js");

    const canvas = canvasRef.current;
    if (!canvas) return;

    // lock a non-null local so TS is happy in nested functions
    const cv = canvas as HTMLCanvasElement;

    const ctxMaybe = cv.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctxMaybe) return;
    const c = ctxMaybe; // non-null 2D context

    // Respect reduced motion (live)
    let prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = prefersReduced.matches;

    // Simulation state
    let stars: Star[] = [];
    let nebulas: Nebula[] = [];
    let w = 0, h = 0, dpr = 1;
    let rafId: number | null = null;
    let paused = false;

    const onReducedMotionChange = () => {
      reduceMotion = prefersReduced.matches;
      if (reduceMotion) {
        c.clearRect(0, 0, w, h);
        drawNebulas();
        drawStars(0);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else {
        if (!rafId) rafId = requestAnimationFrame(step);
      }
    };
    prefersReduced.addEventListener?.("change", onReducedMotionChange);

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
        c.clearRect(0, 0, w, h);
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

      cv.width = Math.floor(cssW * dpr);
      cv.height = Math.floor(cssH * dpr);
      cv.style.width = cssW + "px";
      cv.style.height = cssH + "px";

      w = cv.width;
      h = cv.height;

      c.setTransform(1, 0, 0, 1, 0, 0);
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

        const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 70%, 70%, ${n.alpha})`);
        g.addColorStop(1, `hsla(${n.hue}, 70%, 70%, 0)`);

        c.globalCompositeOperation = "screen";
        c.fillStyle = g;
        c.beginPath();
        c.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        c.fill();
      }
      c.globalCompositeOperation = "lighter";
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

        c.beginPath();
        c.fillStyle = `rgba(255,255,255,${a})`;
        c.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        c.fill();
      }
    }

    function step(t = 0) {
      if (paused || reduceMotion) return;
      c.clearRect(0, 0, w, h);
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

      {/* Landscape overlay (no extra CSS required) */}
      <div
        id="landscape-blocker"
        ref={landscapeRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          display: "none",
          zIndex: 9999,
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          className="lb-card"
          style={{
            background: "rgba(4,2,8,0.96)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "18px 20px",
            textAlign: "center",
            color: "#fff",
            backdropFilter: "blur(6px)",
            pointerEvents: "auto",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: 18, letterSpacing: ".04em" }}>
            Best in portrait
          </h2>
          <p style={{ margin: 0, color: "#D6D6E3", fontSize: 14 }}>
            Please rotate your device.
          </p>
        </div>
      </div>

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
