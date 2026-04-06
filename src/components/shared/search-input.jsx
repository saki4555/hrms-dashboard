import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * SearchInput
 *
 * Props:
 *   value          — controlled value
 *   onChange       — change handler (native input event)
 *   onClear        — called when ✕ is clicked
 *   placeholder    — defaults to "Search…"
 *   className      — applied to the wrapper div
 *   inputClassName — applied to the Input element
 *   disabled       — passed through to the input
 */
export function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search…",
  className,
  inputClassName,
  disabled,
  ...props
}) {
  const hasValue = String(value).length > 0;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />

      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-9", hasValue && "pr-8", inputClassName)}
        {...props}
      />

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          aria-label="Clear search"
          className="absolute right-2.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}