import { useState } from "react";
import { Check, ChevronsUpDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function CascadeCombobox({ value, items, idKey, nameKey, placeholder, disabled, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal transition-all duration-200",
            !value && "text-muted-foreground",
            disabled && "opacity-50",
            value && "border-emerald-500/50",
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          {disabled && !value ? (
            <Lock className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item[idKey]}
                  value={item[nameKey]}
                  onSelect={() => { onSelect(item); setOpen(false); }}
                >
                  {item[nameKey]}
                  <Check className={cn("ml-auto h-4 w-4", value === item[nameKey] ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}