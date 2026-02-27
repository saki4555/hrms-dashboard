import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function SmartRadioGroup({ form, name, label, options, disabled }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <div className="flex flex-wrap gap-2 pt-1">
            {options.map((opt) => {
              const val = String(opt.value ?? opt);
              const lbl = opt.label ?? opt;
              const isSelected = String(field.value) === val;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => field.onChange(val)}
                  onBlur={field.onBlur}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}