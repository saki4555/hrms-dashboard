import { cn } from "@/lib/utils";

export function SectionCard({ title, icon: Icon, gradient, children, fieldCount, filledCount }) {
  const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className={cn("px-6 py-4 flex items-center justify-between bg-gradient-to-r opacity-90", gradient)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        {fieldCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-white/80">{filledCount}/{fieldCount}</span>
          </div>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}