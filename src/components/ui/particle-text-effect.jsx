import { useEffect, useRef } from "react";

class Particle {
  constructor() {
    this.pos = { x: 0, y: 0 };
    this.vel = { x: 0, y: 0 };
    this.acc = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.closeEnoughTarget = 100;
    this.maxSpeed = 1;
    this.maxForce = 0.1;
    this.particleSize = 10;
    this.isKilled = false;
    this.startColor = { r: 0, g: 0, b: 0 };
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.colorWeight = 0;
    this.colorBlendRate = 0.01;
  }

  move() {
    let proximityMult = 1;
    const distance = Math.hypot(this.pos.x - this.target.x, this.pos.y - this.target.y);

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    };

    const magnitude = Math.hypot(towardsTarget.x, towardsTarget.y);
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    };

    const steerMagnitude = Math.hypot(steer.x, steer.y);
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce;
      steer.y = (steer.y / steerMagnitude) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;
    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx, drawAsPoints) {
    if (this.colorWeight < 1) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1);
    }

    const currentColor = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    };

    ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
      return;
    }

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  kill(width, height) {
    if (this.isKilled) {
      return;
    }

    const randomPos = this.generateRandomPos(width / 2, height / 2, (width + height) / 2);
    this.target.x = randomPos.x;
    this.target.y = randomPos.y;
    this.startColor = {
      r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
      g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
      b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
    };
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.colorWeight = 0;
    this.isKilled = true;
  }

  generateRandomPos(x, y, mag) {
    const randomX = Math.random() * 1000;
    const randomY = Math.random() * 500;
    const direction = {
      x: randomX - x,
      y: randomY - y,
    };
    const magnitude = Math.hypot(direction.x, direction.y);

    if (magnitude > 0) {
      direction.x = (direction.x / magnitude) * mag;
      direction.y = (direction.y / magnitude) * mag;
    }

    return {
      x: x + direction.x,
      y: y + direction.y,
    };
  }
}

const DEFAULT_WORDS = ["GIGSHIELD", "INCOME", "PROTECTED", "SHIFT", "AHEAD"];
const DRAW_AS_POINTS = true;

export function ParticleTextEffect({ words = DEFAULT_WORDS, className = "" }) {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const particlesRef = useRef([]);
  const frameCountRef = useRef(0);
  const wordIndexRef = useRef(0);

  const pixelSteps = 6;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const resizeCanvas = () => {
      const parentWidth = canvas.parentElement?.clientWidth || 900;
      const width = Math.max(360, Math.min(1000, parentWidth));
      const height = Math.round(width * 0.52);
      canvas.width = width;
      canvas.height = height;
    };

    const generateRandomPos = (x, y, mag) => {
      const randomX = Math.random() * 1000;
      const randomY = Math.random() * 500;
      const direction = {
        x: randomX - x,
        y: randomY - y,
      };
      const magnitude = Math.hypot(direction.x, direction.y);

      if (magnitude > 0) {
        direction.x = (direction.x / magnitude) * mag;
        direction.y = (direction.y / magnitude) * mag;
      }

      return {
        x: x + direction.x,
        y: y + direction.y,
      };
    };

    const nextWord = (word) => {
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      const offscreenCtx = offscreenCanvas.getContext("2d");
      if (!offscreenCtx) {
        return;
      }

      offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
      offscreenCtx.fillStyle = "white";
      offscreenCtx.font = `bold ${Math.max(56, canvas.width * 0.12)}px Arial`;
      offscreenCtx.textAlign = "center";
      offscreenCtx.textBaseline = "middle";
      offscreenCtx.fillText(word, canvas.width / 2, canvas.height / 2);

      const imageData = offscreenCtx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const newColor = {
        r: 103 + Math.random() * 80,
        g: 210 + Math.random() * 45,
        b: 255,
      };

      const particles = particlesRef.current;
      let particleIndex = 0;
      const coordsIndexes = [];

      for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
        coordsIndexes.push(i);
      }

      for (let i = coordsIndexes.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]];
      }

      coordsIndexes.forEach((pixelIndex) => {
        const alpha = pixels[pixelIndex + 3];
        if (alpha <= 0) {
          return;
        }

        const x = (pixelIndex / 4) % canvas.width;
        const y = Math.floor(pixelIndex / 4 / canvas.width);
        let particle;

        if (particleIndex < particles.length) {
          particle = particles[particleIndex];
          particle.isKilled = false;
          particleIndex += 1;
        } else {
          particle = new Particle();
          const randomPos = generateRandomPos(
            canvas.width / 2,
            canvas.height / 2,
            (canvas.width + canvas.height) / 2,
          );
          particle.pos.x = randomPos.x;
          particle.pos.y = randomPos.y;
          particle.maxSpeed = Math.random() * 6 + 4;
          particle.maxForce = particle.maxSpeed * 0.05;
          particle.particleSize = Math.random() * 6 + 6;
          particle.colorBlendRate = Math.random() * 0.0275 + 0.0025;
          particles.push(particle);
        }

        particle.startColor = {
          r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
          g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
          b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
        };
        particle.targetColor = newColor;
        particle.colorWeight = 0;
        particle.target.x = x;
        particle.target.y = y;
      });

      for (let i = particleIndex; i < particles.length; i += 1) {
        particles[i].kill(canvas.width, canvas.height);
      }
    };

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.fillStyle = "rgba(6, 10, 15, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i -= 1) {
        const particle = particlesRef.current[i];
        particle.move();
        particle.draw(ctx, DRAW_AS_POINTS);

        if (
          particle.isKilled &&
          (particle.pos.x < 0 ||
            particle.pos.x > canvas.width ||
            particle.pos.y < 0 ||
            particle.pos.y > canvas.height)
        ) {
          particlesRef.current.splice(i, 1);
        }
      }

      frameCountRef.current += 1;
      if (frameCountRef.current % 220 === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        nextWord(words[wordIndexRef.current]);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    nextWord(words[0]);
    animate();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [words]);

  return (
    <div className={`relative rounded-[2rem] border border-white/10 bg-[#05070a] shadow-2xl shadow-cyan-500/10 ${className}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.18),transparent_48%)]" />
      <canvas
        ref={canvasRef}
        className="relative z-10 block w-full rounded-[2rem]"
        style={{ height: "auto" }}
      />
      <div className="border-t border-white/8 px-5 py-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-200">
          Particle Signal Layer
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          A living brand canvas for GigShield’s AI-led protection story.
        </p>
      </div>
    </div>
  );
}

