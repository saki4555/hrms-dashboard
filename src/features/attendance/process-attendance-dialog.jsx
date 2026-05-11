// src/features/attendance/process-attendance-dialog.jsx

import { useState, useMemo } from "react";
import { subDays, startOfDay, format } from "date-fns";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { IconX } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DatePicker } from "@/components/DatePicker";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { useEmployeeLiteSearch } from "@/hooks/use-lite-search";
import { useProcessAttendance, useReprocessEmployee } from "./queries";

const toISO = (date) => (date ? format(date, "yyyy-MM-dd") : "");

export default function ProcessAttendanceDialog({ open, onOpenChange }) {
  const [bulkFrom, setBulkFrom] = useState(null);
  const [bulkTo, setBulkTo]     = useState(null);
  const [empFrom, setEmpFrom]   = useState(null);
  const [empTo, setEmpTo]       = useState(null);

  // Employee combobox state
  const [empOpen, setEmpOpen]               = useState(false);
  const [empSearch, setEmpSearch]           = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  console.log("selected employee", selectedEmployee);

  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  const yesterday = useMemo(() => startOfDay(subDays(new Date(), 1)), []);

  const bulkMutation = useProcessAttendance();
  const empMutation  = useReprocessEmployee();

  const resetAll = () => {
    setBulkFrom(null);
    setBulkTo(null);
    setEmpFrom(null);
    setEmpTo(null);
    setSelectedEmployee(null);
    setEmpSearch("");
  };

  const handleClose = () => {
    resetAll();
    onOpenChange(false);
  };

  const handleBulk = async () => {
    try {
      const data = await bulkMutation.mutateAsync({
        fromDate: toISO(bulkFrom),
        toDate: toISO(bulkTo),
      });
      toast.success(`Processed ${data.updatedRows} records`);
      resetAll();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Processing failed");
    }
  };

  const handleEmployee = async () => {
    try {
      const data = await empMutation.mutateAsync({
        employeeId: selectedEmployee.id,
        fromDate: toISO(empFrom),
        toDate: toISO(empTo),
      });

     
     
      toast.success(`Reprocessed ${data.updatedRows} records`);
      resetAll();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Reprocess failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Attendance</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="bulk">
          <TabsList className="w-full">
            <TabsTrigger value="bulk" className="flex-1">Bulk (Date Range)</TabsTrigger>
            <TabsTrigger value="employee" className="flex-1">Single Employee</TabsTrigger>
          </TabsList>

          {/* ── Bulk ── */}
          <TabsContent value="bulk" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Process all ATT_LOG data for a date range. Use this for backfill when device data arrives late.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>From</Label>
                <DatePicker
                  className="w-full"
                  placeholder="Select from date"
                  value={bulkFrom}
                  onChange={setBulkFrom}
                  disabled={{ after: yesterday }}
                />
              </div>
              <div className="space-y-1">
                <Label>To</Label>
                <DatePicker
                  className="w-full"
                  placeholder="Select to date"
                  value={bulkTo}
                  onChange={setBulkTo}
                  disabled={{ after: yesterday }}
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!bulkFrom || !bulkTo || bulkMutation.isPending}
              onClick={handleBulk}
            >
              {bulkMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Run Process
            </Button>
          </TabsContent>

          {/* ── Single Employee ── */}
          <TabsContent value="employee" className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Reprocess a single employee — use after correcting their shift assignment.
            </p>

            {/* ── Employee combobox ── */}
            <div className="space-y-1">
              <Label>Employee</Label>
              <Popover open={empOpen} onOpenChange={setEmpOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal px-2",
                      !selectedEmployee && "text-muted-foreground",
                    )}
                  >
                    {selectedEmployee ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage
                            src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selectedEmployee.id}`}
                          />
                          <AvatarFallback
                            className={cn("text-[10px] font-semibold text-white", getAvatarColor(selectedEmployee.name))}
                          >
                            {selectedEmployee.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm text-foreground">{selectedEmployee.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">({selectedEmployee.empNo})</span>
                      </div>
                    ) : (
                      <span>Search employee...</span>
                    )}
                    <div className="flex items-center gap-0.5 ml-1 shrink-0">
                      {selectedEmployee && (
                        <span
                          role="button"
                          className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployee(null);
                            setEmpSearch("");
                          }}
                        >
                          <IconX className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
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
                      {!empFetching && empSearch.length >= 2 && employees.length === 0 && (
                        <CommandEmpty>No employees found.</CommandEmpty>
                      )}
                      {!empFetching && empSearch.length < 2 && (
                        <CommandEmpty>Type at least 2 characters.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={String(emp.id)}
                            onSelect={() => {
                              setSelectedEmployee(emp);
                              setEmpOpen(false);
                              setEmpSearch("");
                            }}
                          >
                            <Avatar className="h-6 w-6 shrink-0 mr-2">
                              <AvatarImage
                                src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${emp.id}`}
                              />
                              <AvatarFallback
                                className={cn("text-[10px] font-semibold text-white", getAvatarColor(emp.name))}
                              >
                                {emp.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{emp.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground shrink-0">{emp.empNo}</span>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4 shrink-0",
                                selectedEmployee?.id === emp.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>From</Label>
                <DatePicker
                  className="w-full"
                  placeholder="Select from date"
                  value={empFrom}
                  onChange={setEmpFrom}
                  disabled={{ after: yesterday }}
                />
              </div>
              <div className="space-y-1">
                <Label>To</Label>
                <DatePicker
                  className="w-full"
                  placeholder="Select to date"
                  value={empTo}
                  onChange={setEmpTo}
                  disabled={{ after: yesterday }}
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!selectedEmployee || !empFrom || !empTo || empMutation.isPending}
              onClick={handleEmployee}
            >
              {empMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Reprocess Employee
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}