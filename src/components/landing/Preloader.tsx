import { useEffect, useState } from "react";
import catAvatar from "@/assets/space-cat-avatar.png";

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [gone, setGone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(100, p + 6 + Math.random() * 14);
      setProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => setGone(true), 250);
        setTimeout(() => setHidden(true), 1100);
      }
    }, 90);
    return () => clearInterval(id);
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-space-deep transition-all duration-700 ${
        gone ? "pointer-events-none opacity-0 scale-105" : "opacity-100"
      }`}
      aria-hidden={gone}
    >
      <div className="relative">
        <div className="absolute inset-0 -m-8 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
        <img
          src={catAvatar}
          alt="Opera AI space cat loading"
          width={816}
          height={816}
          className="relative h-32 w-32 animate-float drop-shadow-[0_0_30px_var(--glow)]"
        />
      </div>
      <p className="mt-8 font-display text-sm font-semibold tracking-[0.35em] uppercase text-muted-foreground">
        Opera AI
      </p>
      <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">initializing orbit… {progress}%</p>
    </div>
  );
}
