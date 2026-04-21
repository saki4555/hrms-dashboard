// These should already be there from previous steps, just verify:
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useEffect, useState } from "react"; // add to existing react import
import { useEmployeeLiteSearch } from "@/hooks/use-lite-search";
// ─────────────────────────────────────────────────────────────────────────────
//  EMPLOYEE FILTER COMBOBOX
// ─────────────────────────────────────────────────────────────────────────────

export default function EmployeeFilterCombobox({ value, onValueChange }) {
  const [open, setOpen]               = useState(false);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);

  const { data: employees = [], isFetching } = useEmployeeLiteSearch(search);

  // Clear internal selected state when value is cleared externally
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  const handleSelect = (emp) => {
    setSelected(emp);
    onValueChange(String(emp.id));
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onValueChange("");
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "h-9 justify-between font-normal gap-2",
            selected ? "w-[220px]" : "w-[180px]",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage
                  src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selected.id}`}
                />
                <AvatarFallback className={cn("text-[9px] font-semibold text-white", getAvatarColor(selected.name))}>
                  {selected.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm text-foreground">{selected.name}</span>
            </div>
          ) : (
            <span className="text-sm">Search employee...</span>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {selected ? (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
                className="rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <IconX className="h-3.5 w-3.5" />
              </span>
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type name or emp no..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                <Spinner className="h-4 w-4" />
                <span className="text-sm">Searching...</span>
              </div>
            )}
            {!isFetching && search.length >= 2 && employees.length === 0 && (
              <CommandEmpty>No employees found.</CommandEmpty>
            )}
            {!isFetching && search.length < 2 && (
              <CommandEmpty className="py-4 text-xs text-center text-muted-foreground">
                Type at least 2 characters to search
              </CommandEmpty>
            )}
            {!isFetching && employees.length > 0 && (
              <CommandGroup>
                {employees.map((emp) => (
                  <CommandItem
                    key={emp.id}
                    value={String(emp.id)}
                    onSelect={() => handleSelect(emp)}
                    className="gap-3 py-2"
                  >
                    {/* Avatar */}
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage
                        src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${emp.id}`}
                      />
                      <AvatarFallback className={cn("text-xs font-semibold text-white", getAvatarColor(emp.name))}>
                        {emp.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + Emp No */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">{emp.name}</span>
                      <span className="text-xs text-muted-foreground">{emp.empNo}</span>
                    </div>

                    {/* Check mark */}
                    <Check className={cn(
                      "h-4 w-4 shrink-0",
                      selected?.id === emp.id ? "opacity-100 text-primary" : "opacity-0"
                    )} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}