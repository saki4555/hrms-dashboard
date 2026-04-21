import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Check, ChevronsUpDown, UserCog } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useUpdateSupervisor } from "./queries";
import { useSupervisorLiteSearch } from "@/hooks/use-lite-search";

const formSchema = z.object({
  supervisorId: z.number({ required_error: "Supervisor is required" }),
});

export default function UpdateSupervisorDialog({ open, onOpenChange, showConfirmation, assignment }) {
  const updateMutation = useUpdateSupervisor();

  const [supOpen, setSupOpen] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  // ↓ supervisor-only search — filters by Supervisor / Team Lead / Manager roles
  const { data: supervisors = [], isFetching: supFetching } = useSupervisorLiteSearch(supSearch);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { supervisorId: undefined },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (assignment) {
      form.reset({ supervisorId: assignment.SUPERVISOR_ID });
      setSelectedSupervisor({
        id:    assignment.SUPERVISOR_ID,
        name:  [assignment.SUP_TITLE, assignment.SUP_FIRST_NAME, assignment.SUP_LAST_NAME].filter(Boolean).join(" "),
        empNo: assignment.SUP_EMP_NO || "",
        role:  null, // not available from the existing assignment row
      });
      setSupSearch("");
    }
  }, [assignment]);

  const onSubmit = async (data) => {
    if (!assignment?.ID) return toast.error("Assignment ID is missing");
    try {
      await updateMutation.mutateAsync({
        id: assignment.ID,
        data: {
          SUPERVISOR_ID: data.supervisorId,
          UPDATED_BY:    "admin", // TODO: replace with logged-in user
        },
      });
      toast.success("Supervisor updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update supervisor.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard", cancelText: "Keep Editing", variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = updateMutation.isPending;
  const empName = assignment
  ? [assignment.EMP_TITLE, assignment.EMP_FIRST_NAME, assignment.EMP_LAST_NAME]
      .filter(Boolean)
      .join(" ")
  : "";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Supervisor</DialogTitle>
              <DialogDescription>Change supervisor for "{empName}"</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* ── Current Employee — read only ──────────────────────────────── */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Employee</p>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{empName}</span>
                  <span className="text-xs text-muted-foreground">{assignment?.EMP_NO}</span>
                </div>
                <Badge variant="outline" className="ml-auto">Current</Badge>
              </div>
            </div>

            {/* ── New Supervisor ────────────────────────────────────────────── */}
            <FormField control={form.control} name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Supervisor <span className="text-destructive">*</span></FormLabel>
                  <Popover open={supOpen} onOpenChange={setSupOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline" role="combobox" disabled={isSubmitting}
                          className={cn("w-full justify-between font-normal", !selectedSupervisor && "text-muted-foreground")}
                        >
                          {selectedSupervisor
                            ? `${selectedSupervisor.name}${selectedSupervisor.empNo ? ` (${selectedSupervisor.empNo})` : ""}`
                            : "Search by name or emp no..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type 2+ characters..."
                          value={supSearch}
                          onValueChange={setSupSearch}
                        />
                        <CommandList>
                          {supFetching && (
                            <div className="flex items-center justify-center py-4">
                              <Spinner className="h-4 w-4" />
                            </div>
                          )}
                          {!supFetching && supSearch.length < 2 && (
                            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                          )}
                          {!supFetching && supSearch.length >= 2 && supervisors.length === 0 && (
                            <CommandEmpty>No supervisors found.</CommandEmpty>
                          )}
                          {!supFetching && supervisors.length > 0 && (
                            <CommandGroup>
                              {supervisors.map((sup) => (
                                <CommandItem
                                  key={sup.id}
                                  value={String(sup.id)}
                                  onSelect={() => {
                                    setSelectedSupervisor(sup);
                                    field.onChange(sup.id);
                                    setSupOpen(false);
                                    setSupSearch("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedSupervisor?.id === sup.id ? "opacity-100" : "opacity-0")} />
                                  <span>{sup.name}</span>
                                  {sup.role && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {sup.role}
                                    </Badge>
                                  )}
                                  <span className="ml-auto text-xs text-muted-foreground">{sup.empNo}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting
                  ? <><Spinner className="mr-2 h-4 w-4" />Updating...</>
                  : "Update Supervisor"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}