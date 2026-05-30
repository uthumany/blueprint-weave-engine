import { motion } from "framer-motion";

// Stylized DNA double-helix rendered with SVG + CSS rotation.
export function DnaHelix() {
  const rungs = Array.from({ length: 22 });
  return (
    <div className="relative w-full h-full flex items-center justify-center [perspective:1200px]">
      <div className="relative h-[420px] w-[180px] animate-helix">
        {rungs.map((_, i) => {
          const t = i / rungs.length;
          const y = t * 420;
          const angle = t * 720; // 2 full twists
          const rad = (angle * Math.PI) / 180;
          const x1 = Math.cos(rad) * 70;
          const x2 = -x1;
          const opacity = 0.35 + Math.abs(Math.sin(rad)) * 0.65;
          return (
            <div
              key={i}
              className="absolute left-1/2 top-0 flex items-center"
              style={{ transform: `translate(-50%, ${y}px)`, opacity }}
            >
              <div
                className="h-px w-[160px] bg-gradient-to-r from-lime/0 via-lime to-magenta/80"
                style={{
                  transform: `scaleX(${0.3 + Math.abs(Math.cos(rad)) * 0.7})`,
                }}
              />
              <div
                className="absolute size-2 rounded-full bg-lime glow-lime"
                style={{ transform: `translateX(${x1}px)` }}
              />
              <div
                className="absolute size-2 rounded-full bg-magenta"
                style={{
                  transform: `translateX(${x2}px)`,
                  boxShadow: "0 0 16px oklch(0.72 0.27 340 / 0.6)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* concentric rings */}
      <motion.div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        {[260, 360, 460].map((s, i) => (
          <div
            key={s}
            className="absolute rounded-full border border-border"
            style={{ width: s, height: s, opacity: 0.5 - i * 0.12 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
