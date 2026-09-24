import { motion, useReducedMotion } from "framer-motion";

interface BranchMotifProps {
  className?: string;
  color?: string;
  /** Skip the draw-in animation and render fully visible — for contexts
   * (like the static preview page) that never get a real scroll-into-view
   * moment for IntersectionObserver to fire on. */
  static?: boolean;
}

/**
 * Delicate root-and-branch line art, echoing the botanical illustrations
 * already used in Mesegombolyag's own visual identity.
 */
const TWIGS = [
  "M58 150c-14-6-24-3-34 7",
  "M58 150c14-8 26-5 36 5",
  "M60 110c-12-3-21 1-29 11",
  "M60 110c12-4 22 0 29 10",
  "M62 68c-10-2-17 3-22 12",
  "M62 68c10-3 18 1 23 10",
];

// A single whileInView observer on the parent <svg> drives every child via
// variants — giving each of the ~8 paths its own whileInView/viewport
// observer was unreliable (Framer Motion would silently skip alternating
// siblings' IntersectionObserver callbacks when many were registered at once).
export function BranchMotif({
  className = "",
  color = "var(--color-forest)",
  static: isStatic = false,
}: BranchMotifProps) {
  const reduce = useReducedMotion();

  if (isStatic) {
    return (
      <svg viewBox="0 0 120 220" fill="none" className={className} aria-hidden="true">
        <path
          d="M60 214V90c0-14 8-20 8-32s-10-16-10-30"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        {TWIGS.map((d) => (
          <path key={d} d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity={0.9} />
        ))}
        <circle cx="60" cy="26" r="3.2" fill={color} opacity={0.85} />
      </svg>
    );
  }

  const trunkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.9,
      transition: reduce ? { duration: 0 } : { duration: 1.6, ease: "easeInOut" as const },
    },
  };

  const circleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 0.85,
      scale: 1,
      transition: reduce ? { duration: 0 } : { delay: 1.2, duration: 0.4 },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 120 220"
      fill="none"
      className={className}
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.path
        d="M60 214V90c0-14 8-20 8-32s-10-16-10-30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        variants={trunkVariants}
      />
      {TWIGS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 0.9,
              transition: reduce
                ? { duration: 0 }
                : { duration: 1, ease: "easeInOut" as const, delay: 0.3 + i * 0.12 },
            },
          }}
        />
      ))}
      <motion.circle cx="60" cy="26" r="3.2" fill={color} variants={circleVariants} />
    </motion.svg>
  );
}
