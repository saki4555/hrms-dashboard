import { useEffect, useRef, useState } from "react";

const breakpoints = [
  { name: "3XS", min: 0,    max: 287,  color: "bg-rose-500" },
  { name: "2XS", min: 288,  max: 319,  color: "bg-pink-500" },
  { name: "XS",  min: 320,  max: 383,  color: "bg-orange-500" },
  { name: "SM",  min: 384,  max: 447,  color: "bg-yellow-500" },
  { name: "MD",  min: 448,  max: 511,  color: "bg-lime-500" },
  { name: "LG",  min: 512,  max: 575,  color: "bg-emerald-500" },
  { name: "XL",  min: 576,  max: 671,  color: "bg-teal-500" },
  { name: "2XL", min: 672,  max: 767,  color: "bg-cyan-500" },
  { name: "3XL", min: 768,  max: 895,  color: "bg-sky-500" },
  { name: "4XL", min: 896,  max: 1023, color: "bg-blue-500" },
  { name: "5XL", min: 1024, max: 1151, color: "bg-violet-500" },
  { name: "6XL", min: 1152, max: 1279, color: "bg-purple-500" },
  { name: "7XL", min: 1280, max: Infinity, color: "bg-fuchsia-500" },
];

function getBreakpoint(width) {
  return breakpoints.find((bp) => width >= bp.min && width <= bp.max);
}

/**
 * Drop this anywhere inside SidebarInset (or any container marked with @container).
 * It uses ResizeObserver on its own parent to report container width — not viewport width.
 * Built for Tailwind v4 — no @tailwindcss/container-queries plugin needed.
 *
 * Usage:
 *   <ContentSizeIndicator />
 *
 * Optional props:
 *   position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"  (default: "bottom-right")
 *   showBreakpointBar?: boolean  (default: true)
 */
export function ContentSizeIndicator({
  position = "bottom-right",
  showBreakpointBar = true,
}) {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Observe the closest scrollable/sized parent — i.e. SidebarInset / main content area
    const target = el.closest("main") ?? el.parentElement;
    if (!target) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });

    ro.observe(target);
    return () => ro.disconnect();
  }, []);

  const bp = getBreakpoint(size.width);

  const positionClass = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left":  "bottom-4 left-4",
    "top-right":    "top-4 right-4",
    "top-center":     "top-2 left-2/3 -translate-x-2/3",
  }[position];

  return (
    <div
      ref={ref}
      className={`fixed ${positionClass} z-[9999] font-mono text-xs select-none`}
    >
      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-950/90 shadow-2xl shadow-black/40 backdrop-blur-md">
        {/* Header row */}
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Breakpoint badge */}
          <span
            className={`${bp?.color ?? "bg-gray-500"} rounded-md px-2 py-0.5 text-[11px] font-bold text-white tracking-widest transition-colors duration-300`}
          >
            @{bp?.name ?? "?"}
          </span>

          {/* Dimensions */}
          <span className="text-gray-300">
            <span className="text-white font-semibold">{size.width}</span>
            <span className="text-gray-500 mx-0.5">×</span>
            <span className="text-white font-semibold">{size.height}</span>
            <span className="text-gray-500 ml-1">px</span>
          </span>
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