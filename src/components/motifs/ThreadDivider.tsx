import { motion, useReducedMotion } from "framer-motion";

interface ThreadDividerProps {
  className?: string;
  color?: string;
  flip?: boolean;
}

/**
 * A single organically-curving thread that draws itself in on scroll.
 * Used between sections to carry the "fonal" motif through the page.
 */
export function ThreadDivider({ className = "", color = "var(--color-ochre)", flip }: ThreadDividerProps) {
  const reduce = useReducedMotion();

  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 400 60"
        fill="none"
        className="h-10 w-full sm:h-14"
        preserveAspectRatio="none"
        style={flip ? { transform: "scaleX(-1)" } : undefined}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.path
          d="M2 30c40-28 70-28 100 0s70 28 100 0 70-28 100 0 70 28 96 0"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 0.75,
              transition: reduce ? { duration: 0 } : { duration: 1.4, ease: "easeInOut" as const },
            },
          }}
        />
        <motion.circle
          cx="200"
          cy="30"
          r="3"
          fill={color}
          variants={{
            hidden: { opacity: 0, scale: 0 },
            visible: {
              opacity: 0.9,
              scale: 1,
              transition: reduce ? { duration: 0 } : { delay: 1, duration: 0.4 },
            },
          }}
        />
      </motion.svg>
    </div>
  );
}
