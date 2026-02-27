import { useState } from "react";
import { Check, ChevronsUpDown, Lock } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function PositionComboboxField({ form, filteredPositions, selectedOrgId, orgPositionsLoading, grades, disabled }) {
  const [posOpen, setPosOpen] = useState(false);
  const fieldValue = form.watch("positionId");
  const isDisabled = disabled || !selectedOrgId || orgPositionsLoading;
  const selectedPosition = filteredPositions.find((pos) => String(pos.POSITION_ID) === String(fieldValue));

  const handlePositionSelect = (pos, fieldOnChange) => {
    fieldOnChange(String(pos.POSITION_ID));
    form.setValue("orgPositionId", String(pos.ID), { shouldValidate: false });
    if (pos.GRADE) {
      const matchedGrade = grades.find((g) => g.GRADE === pos.GRADE);
      if (matchedGrade) form.setValue("gradeId", String(matchedGrade.ID), { shouldValidate: true });
    }
    setPosOpen(false);
  };

  return (
    <FormField
      control={form.control}
      name="positionId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Position *</FormLabel>
          <Popover modal={true} open={posOpen} onOpenChange={setPosOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isDisabled}
                  className={cn(
                    "w-full justify-between font-normal",
                    !field.value && "text-muted-foreground",
                    field.value && "border-emerald-500/50",
                  )}
                >
                  {!selectedOrgId ? "Select an organization first"
                    : orgPositionsLoading ? "Loading..."
                    : selectedPosition ? selectedPosition.POSITION_TITLE
                    : "Select position"}
                  {!selectedOrgId
                    ? <Lock className="ml-2 h-3.5 w-3.5 opacity-40" />
                    : <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Command>
                <CommandInput placeholder="Search positions..." className="h-9" />
                <CommandList>
                  <CommandEmpty>
                    {filteredPositions.length === 0 ? "No positions for this org." : "No position found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredPositions.map((pos) => {
                      const isFull = pos.ACTUAL_COUNT >= pos.FTE;
                      return (
                        <CommandItem
                          key={pos.ID}
                          value={pos.POSITION_TITLE}
                          disabled={isFull}
                          onSelect={() => { if (!isFull) handlePositionSelect(pos, field.onChange); }}
                          className={isFull ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate">{pos.POSITION_TITLE}</span>
                            {pos.GRADE && (
                              <span className="text-xs text-muted-foreground">{pos.GRADE} · {pos.LEVELS}</span>
                            )}
                          </div>
                          {isFull ? (
                            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                              Full ({pos.ACTUAL_COUNT}/{pos.FTE})
                            </Badge>
                          ) : (
                            <Check className={cn("ml-auto h-4 w-4", String(field.value) === String(pos.POSITION_ID) ? "opacity-100" : "opacity-0")} />
                          )}
                        </CommandItem>
                      );
                    })}
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