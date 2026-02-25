import { useEffect, useState } from "react";

const breakpoints = [
  { name: "XS",  min: 0,    max: 639,  color: "bg-rose-500" },
  { name: "SM",  min: 640,  max: 767,  color: "bg-orange-500" },
  { name: "MD",  min: 768,  max: 1023, color: "bg-yellow-500" },
  { name: "LG",  min: 1024, max: 1279, color: "bg-lime-500" },
  { name: "XL",  min: 1280, max: 1535, color: "bg-emerald-500" },
  { name: "2XL", min: 1536, max: Infinity, color: "bg-sky-500" },
];

function getBreakpoint(width) {
  return breakpoints.find((bp) => width >= bp.min && width <= bp.max);
}

/**
 * Shows the current Tailwind viewport breakpoint (sm, md, lg, xl, 2xl).
 * Observes window width — includes sidebar + everything.
 *
 * Usage:
 *   <ViewportSizeIndicator />
 *
 * Optional props:
 *   position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"  (default: "bottom-left")
 *   showBreakpointBar?: boolean  (default: true)
 */
export function ViewportSizeIndicator({
  position = "bottom-left",
  showBreakpointBar = true,
}) {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const bp = getBreakpoint(size.width);

  const positionClass = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left":  "bottom-4 left-4",
    "top-right":    "top-4 right-4",
    "top-center":     "top-2 left-1/2 -translate-x-1/2",
  }[position];

  return (
    <div className={`fixed ${positionClass} z-[9999] font-mono text-xs select-none`}>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-950/90 shadow-2xl shadow-black/40 backdrop-blur-md">
        {/* Header row */}
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Breakpoint badge */}
          <span
            className={`${bp?.color ?? "bg-gray-500"} rounded-md px-2 py-0.5 text-[11px] font-bold text-white tracking-widest transition-colors duration-300`}
          >
            {bp?.name ?? "?"}
          </span>

          {/* Dimensions */}
          <span className="text-gray-300">
            <span className="text-white font-semibold">{size.width}</span>
            <span className="text-gray-500 mx-0.5">×</span>
            <span className="text-white font-semibold">{size.height}</span>
            <span className="text-gray-500 ml-1">px</span>
          </span>

          {/* Label to distinguish from container widget */}
          <span className="text-gray-600 text-[10px]">viewport</span>
        </div>

        {/* Breakpoint bar */}
        {showBreakpointBar && (
          <div className="flex h-1">
            {breakpoints.map((b) => (
              <div
                key={b.name}
                className={`flex-1 transition-opacity duration-300 ${b.color} ${
                  b.name === bp?.name ? "opacity-100" : "opacity-20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}