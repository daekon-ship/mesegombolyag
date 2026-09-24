import { motion, useReducedMotion } from "framer-motion";

/** The organic thread that opens the story in the hero, winding toward the portrait. */
export function HeroThread({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 600 700"
      fill="none"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d="M40 40c120 10 150 70 90 130-70 70-40 150 60 160 110 11 90 110 10 160-55 35-60 90-10 150"
        stroke="var(--color-ochre)"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.55 }}
        transition={reduce ? { duration: 0 } : { duration: 2.2, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.circle
        cx="190"
        cy="640"
        r="4"
        fill="var(--color-terracotta)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={reduce ? { duration: 0 } : { delay: 2.3, duration: 0.5 }}
      />
    </svg>
  );
}
