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
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAssignSupervisor } from "./queries";
import { useEmployeeLiteSearch } from "@/hooks/use-employee-lite-search";

const formSchema = z.object({
  personId:     z.number({ required_error: "Employee is required" }),
  supervisorId: z.number({ required_error: "Supervisor is required" }),
}).refine((d) => d.personId !== d.supervisorId, {
  message: "Employee and supervisor cannot be the same person",
  path: ["supervisorId"],
});

export default function AssignSupervisorDialog({ open, onOpenChange, showConfirmation }) {
  const assignMutation = useAssignSupervisor();

  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  const [supOpen, setSupOpen] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { data: supervisors = [], isFetching: supFetching } = useEmployeeLiteSearch(supSearch);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { personId: undefined, supervisorId: undefined },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset({ personId: undefined, supervisorId: undefined });
      setSelectedEmployee(null);
      setSelectedSupervisor(null);
      setEmpSearch("");
      setSupSearch("");
    }
  }, [open]);

  const onSubmit = async (data) => {

    console.log("data--->", data);
  
   
    try {
      await assignMutation.mutateAsync({
        PERSON_ID:     data.personId,
        SUPERVISOR_ID: data.supervisorId,
        CREATED_BY:    23, // TODO: replace with logged-in user
      });
      toast.success("Supervisor assigned successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to assign supervisor.");
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

  const isSubmitting = assignMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Assign Supervisor</DialogTitle>
              <DialogDescription>Link an employee to their supervisor</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* Employee */}
            <FormField control={form.control} name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee <span className="text-destructive">*</span></FormLabel>
                  <Popover open={empOpen} onOpenChange={setEmpOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline" role="combobox" disabled={isSubmitting}
                          className={cn("w-full justify-between font-normal", !selectedEmployee && "text-muted-foreground")}
                        >
                          {selectedEmployee
                            ? `${selectedEmployee.name} (${selectedEmployee.empNo})`
                            : "Search by name or emp no..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type 2+ characters..."
                          value={empSearch}
                          onValueChange={setEmpSearch}
                        />
                        <CommandList>
                          {empFetching && (
                            <div className="flex items-center justify-center py-4">
                              <Spinner className="h-4 w-4" />
                            </div>
                          )}
                          {!empFetching && empSearch.length < 2 && (
                            <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                          )}
                          {!empFetching && empSearch.length >= 2 && employees.length === 0 && (
                            <CommandEmpty>No employees found.</CommandEmpty>
                          )}
                          {!empFetching && employees.length > 0 && (
                            <CommandGroup>
                              {employees.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={String(emp.id)}
                                  onSelect={() => {
                                    setSelectedEmployee(emp);
                                    field.onChange(emp.id);
                                    setEmpOpen(false);
                                    setEmpSearch("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedEmployee?.id === emp.id ? "opacity-100" : "opacity-0")} />
                                  <span>{emp.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{emp.empNo}</span>
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

            {/* Supervisor */}
            <FormField control={form.control} name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisor <span className="text-destructive">*</span></FormLabel>
                  <Popover open={supOpen} onOpenChange={setSupOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline" role="combobox" disabled={isSubmitting}
                          className={cn("w-full justify-between font-normal", !selectedSupervisor && "text-muted-foreground")}
                        >
                          {selectedSupervisor
                            ? `${selectedSupervisor.name} (${selectedSupervisor.empNo})`
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
                            <CommandEmpty>No employees found.</CommandEmpty>
                          )}
                          {!supFetching && supervisors.length > 0 && (
                            <CommandGroup>
                              {supervisors.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={String(emp.id)}
                                  onSelect={() => {
                                    setSelectedSupervisor(emp);
                                    field.onChange(emp.id);
                                    setSupOpen(false);
                                    setSupSearch("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedSupervisor?.id === emp.id ? "opacity-100" : "opacity-0")} />
                                  <span>{emp.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{emp.empNo}</span>
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
                  ? <><Spinner className="mr-2 h-4 w-4" />Assigning...</>
                  : "Assign Supervisor"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}