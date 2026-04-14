import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * GigShieldIntro
 * Shows an animated "GigShield" logo intro on a pure-black screen,
 * then fades out to reveal the real page content (children).
 */
export default function GigShieldIntro({ children }) {
  const [introVisible, setIntroVisible] = useState(true);
  const [childVisible, setChildVisible] = useState(false);

  const introRef = useRef(null);
  const letterRefs = useRef([]);
  const shieldRef = useRef(null);
  const glowRef = useRef(null);
  const taglineRef = useRef(null);
  const scanLineRef = useRef(null);
  const particlesRef = useRef([]);

  const brand = "GigShield".split("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Fade out the intro overlay
          gsap.to(introRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
              setIntroVisible(false);
              setChildVisible(true);
            },
          });
        },
      });

      // 1. Scan line sweeps down
      tl.fromTo(
        scanLineRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.6, ease: "power3.out" },
        0
      )
        .to(scanLineRef.current, { opacity: 0, duration: 0.3 }, 0.7);

      // 2. Shield icon draws in
      tl.fromTo(
        shieldRef.current,
        { scale: 0, rotation: -30, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.9,
          ease: "back.out(1.7)",
        },
        0.4
      );

      // 3. Letters stagger in
      tl.fromTo(
        letterRefs.current,
        { y: 60, opacity: 0, skewX: 8 },
        {
          y: 0,
          opacity: 1,
          skewX: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: "power3.out",
        },
        0.7
      );

      // 4. Glow pulse
      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
        1.0
      );

      // 5. Tagline fades up
      tl.fromTo(
        taglineRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
        1.6
      );

      // 6. Particles float up
      particlesRef.current.forEach((p, i) => {
        if (!p) return;
        tl.fromTo(
          p,
          { y: 30, opacity: 0, scale: 0 },
          {
            y: -40,
            opacity: 0.6,
            scale: 1,
            duration: 1.5 + i * 0.15,
            ease: "power1.out",
          },
          1.2 + i * 0.08
        );
      });

      // 7. Hold then outro begins (handled by onComplete after 3.5 s)
      tl.to({}, { duration: 0.6 }, 3.2);
    }, introRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── INTRO OVERLAY ─────────────────────────────────────── */}
      {introVisible && (
        <div
          ref={introRef}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden select-none"
        >
          {/* Scan line */}
          <div
            ref={scanLineRef}
            className="absolute top-1/2 left-0 w-full h-px bg-white/30 origin-left"
            style={{ transform: "scaleX(0)" }}
          />

          {/* Ambient glow */}
          <div
            ref={glowRef}
            className="absolute w-[40rem] h-[18rem] rounded-full pointer-events-none opacity-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, transparent 70%)",
            }}
          />

          {/* Floating particles */}
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              ref={(el) => (particlesRef.current[i] = el)}
              className="absolute rounded-full opacity-0 pointer-events-none"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: "rgba(255,255,255,0.5)",
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 40}%`,
              }}
            />
          ))}

          {/* Shield SVG icon */}
          <div ref={shieldRef} className="mb-6 opacity-0">
            <svg
              width="56"
              height="64"
              viewBox="0 0 56 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M28 2L4 12V30C4 44.4 14.8 57.8 28 62C41.2 57.8 52 44.4 52 30V12L28 2Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M28 14L12 20V30C12 40.4 19.2 49.8 28 53C36.8 49.8 44 40.4 44 30V20L28 14Z"
                fill="white"
                fillOpacity="0.08"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Checkmark */}
              <polyline
                points="20,31 26,37 36,25"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Brand letters */}
          <div className="flex items-end gap-[0.03em] overflow-hidden">
            {brand.map((char, i) => (
              <span
                key={i}
                ref={(el) => (letterRefs.current[i] = el)}
                className="font-black text-white tracking-tight leading-none opacity-0"
                style={{
                  fontSize: "clamp(3rem, 10vw, 7rem)",
                  fontFamily:
                    "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {char}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <p
            ref={taglineRef}
            className="mt-4 text-white/40 text-sm md:text-base font-medium tracking-[0.25em] uppercase opacity-0"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Income Protection · Built for Gig Workers
          </p>

          {/* Bottom rule */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20"
          >
            <div className="w-5 h-8 border border-white/50 rounded-full flex justify-center pt-1.5">
              <div className="w-0.5 h-2 bg-white rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* ── ACTUAL PAGE CONTENT ───────────────────────────────── */}
      <div
        style={{
          opacity: childVisible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
