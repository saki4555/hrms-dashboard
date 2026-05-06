// src\features\core-hr\employee-management\components\combobox-field.jsx
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function ComboboxField({ form, name, label, items, idKey, nameKey, placeholder, disabled = false, onSelect }) {
  const [open, setOpen] = useState(false);
  const selectedId = form.watch(name);
  const selectedItem = items.find((item) => String(item[idKey]) === String(selectedId));

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <Popover modal={true} open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    "w-full justify-between font-normal transition-all duration-200",
                    !field.value && "text-muted-foreground",
                    fieldState.error && "border-destructive",
                    !fieldState.error && field.value && "border-emerald-500/50",
                  )}
                >
                  {selectedItem ? selectedItem[nameKey] : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
                <CommandList>
                  <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item[idKey]}
                        value={item[nameKey]}
                        onSelect={() => {
                          field.onChange(String(item[idKey]));
                          onSelect?.(item);
                          setOpen(false);
                        }}
                      >
                        {item[nameKey]}
                        <Check className={cn(
                          "ml-auto h-4 w-4",
                          String(field.value) === String(item[idKey]) ? "opacity-100" : "opacity-0",
                        )} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}