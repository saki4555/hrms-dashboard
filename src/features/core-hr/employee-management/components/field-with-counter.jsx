import { Check } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


export function FieldWithCounter({ form, name, label, placeholder, maxLength, disabled }) {
  const value = form.watch(name) || "";
  const pct = value.length / maxLength;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                placeholder={placeholder}
                disabled={disabled}
                {...field}
                className={cn(
                  "transition-all duration-200",
                  !fieldState.error && field.value && "border-emerald-500/50 focus-visible:ring-emerald-500/20",
                )}
              />
              {field.value && !fieldState.error && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
              )}
            </div>
          </FormControl>
          <div className="flex justify-between items-center">
            <FormMessage className="text-xs" />
            {maxLength && (
              <span className={cn(
                "text-xs ml-auto",
                pct > 0.9 ? "text-destructive" : pct > 0.7 ? "text-amber-500" : "text-muted-foreground",
              )}>
                {value.length}/{maxLength}
              </span>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}


