import { useState, useMemo, useCallback } from "react";
import {
  flexRender, getCoreRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Trash2, AlertCircle, RefreshCw, UserCog, ArrowUp, ArrowDown, ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { format } from "date-fns";
import { IconEdit, IconPlus, IconSelector, IconX } from "@tabler/icons-react";

import { Button }  from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { useEmployeeLiteSearch, useSupervisorLiteSearch } from "@/hooks/use-lite-search";

import { useSupervisorAssignments, useRemoveSupervisor } from "./queries";
import AssignSupervisorDialog from "./assign-supervisor-dialog";
import UpdateSupervisorDialog from "./update-supervisor-dialog";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SORT_COLUMN_MAP = {
  employee:    "EMP_FIRST_NAME",
  supervisor:  "SUP_FIRST_NAME",
  ASSIGNED_ON: "ASSIGNED_ON",
};

const REVERSE_SORT_MAP = {
  EMP_FIRST_NAME: "employee",
  SUP_FIRST_NAME: "supervisor",
  ASSIGNED_ON:    "ASSIGNED_ON",
};

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM dd, yyyy"); } catch { return "—"; }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeCell({ firstName, lastName, empNo, title, personId }) {
  const fullName    = [title, firstName, lastName].filter(Boolean).join(" ");
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const initials    = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${personId}`} />
        <AvatarFallback className={cn("text-xs font-semibold text-white", getAvatarColor(fullName))}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-medium leading-tight truncate">{displayName}</span>
        <span className="text-xs text-muted-foreground">{empNo}</span>
      </div>
    </div>
  );
}

function SortHeader({ column, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5
          hover:bg-accent focus:outline-none data-[state=open]:bg-accent
          [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
      >
        {children}
        {column.getIsSorted() === "desc" ? <ArrowDown />
          : column.getIsSorted() === "asc" ? <ArrowUp />
          : <IconSelector />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        <DropdownMenuCheckboxItem
          className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
          checked={column.getIsSorted() === "asc"}
          onClick={() => column.toggleSorting(false)}
        >
          <ArrowUp className="mr-2 h-4 w-4" /> Asc
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
          checked={column.getIsSorted() === "desc"}
          onClick={() => column.toggleSorting(true)}
        >
          <ArrowDown className="mr-2 h-4 w-4" /> Desc
        </DropdownMenuCheckboxItem>
        {column.getIsSorted() && (
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <IconX className="mr-2 h-4 w-4" /> Reset
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Reusable combobox filter — used for both employee and supervisor
function PersonCombobox({
  open, onOpenChange,
  search, onSearchChange,
  selected, onSelect, onClear,
  placeholder, data, isFetching,
  showRole = false,
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "h-9 w-[250px] justify-between font-normal px-2",
            !selected && "text-muted-foreground",
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage
                  src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selected.id}`}
                />
                <AvatarFallback
                  className={cn("text-[10px] font-semibold text-white", getAvatarColor(selected.name))}
                >
                  {selected.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm text-foreground">{selected.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">({selected.empNo})</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <div className="flex items-center gap-0.5 ml-1 shrink-0">
            {selected && (
              <span
                role="button"
                className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
              >
                <IconX className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type 2+ characters..."
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-4">
                <Spinner className="h-4 w-4" />
              </div>
            )}
            {!isFetching && search.length >= 2 && data.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!isFetching && search.length < 2 && (
              <CommandEmpty>Type at least 2 characters.</CommandEmpty>
            )}
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.id}
                  value={String(item.id)}
                  onSelect={() => onSelect(item)}
                >
                  <Avatar className="h-6 w-6 shrink-0 mr-2">
                    <AvatarImage
                      src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${item.id}`}
                    />
                    <AvatarFallback
                      className={cn("text-[10px] font-semibold text-white", getAvatarColor(item.name))}
                    >
                      {item.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{item.name}</span>
                  {showRole && item.role && (
                    <span className="ml-2 text-xs text-muted-foreground shrink-0">{item.role}</span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">{item.empNo}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4 shrink-0",
                      selected?.id === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SupervisorList() {
  // ── URL state (nuqs) ────────────────────────────────────────────────────────
  const [page,         setPage]         = useQueryState("page",         parseAsInteger.withDefault(1));
  const [limit,        setLimit]        = useQueryState("limit",        parseAsInteger.withDefault(20));
  const [employeeId,   setEmployeeId]   = useQueryState("employeeId",   parseAsString.withDefault(""));
  const [supervisorId, setSupervisorId] = useQueryState("supervisorId", parseAsString.withDefault(""));
  const [sortBy,       setSortBy]       = useQueryState("sortBy",       parseAsString.withDefault("ASSIGNED_ON"));
  const [sortOrder,    setSortOrder]    = useQueryState("sortOrder",    parseAsString.withDefault("DESC"));

  // ── Local UI ──────────────────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState({});
  const [isAssignOpen,     setIsAssignOpen]     = useState(false);
  const [isUpdateOpen,     setIsUpdateOpen]     = useState(false);
  const [selected,         setSelected]         = useState(null);

  // Employee combobox
  const [empOpen,          setEmpOpen]          = useState(false);
  const [empSearch,        setEmpSearch]        = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  // Supervisor combobox
  const [supOpen,            setSupOpen]            = useState(false);
  const [supSearch,          setSupSearch]          = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { data: supervisors = [], isFetching: supFetching } = useSupervisorLiteSearch(supSearch);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // ── Backend params ────────────────────────────────────────────────────────────
  const backendParams = useMemo(() => ({
    page, limit, employeeId, supervisorId, sortBy, sortOrder,
  }), [page, limit, employeeId, supervisorId, sortBy, sortOrder]);

  // ── Query ─────────────────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading, isError, error, refetch, isFetching,
  } = useSupervisorAssignments(backendParams);

  const rows      = response?.data ?? [];
  const total     = response?.pagination?.total     ?? 0;
  const pageCount = response?.pagination?.totalPages ?? 1;

  // ── Mutations ──────────────────────────────────────────────────────────────────
  const removeMutation = useRemoveSupervisor();

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleEdit   = (row) => { setSelected(row); setIsUpdateOpen(true); };

  const handleRemove = async (row) => {
    const empName = [row.EMP_FIRST_NAME, row.EMP_LAST_NAME].filter(Boolean).join(" ");
    const confirmed = await showConfirmation({
      title:       "Remove supervisor?",
      description: `Remove supervisor assignment for "${empName}"? This cannot be undone.`,
      confirmText: "Remove", cancelText: "Cancel", variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await removeMutation.mutateAsync(row.ID);
      toast.success("Supervisor removed successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to remove supervisor.");
    }
  };

  const clearFilters = () => {
    setEmployeeId(null);   setSelectedEmployee(null);   setEmpSearch("");
    setSupervisorId(null); setSelectedSupervisor(null); setSupSearch("");
    setPage(1);
  };

  const hasActiveFilters = employeeId || supervisorId;

  // ── Sorting bridge ─────────────────────────────────────────────────────────────
  const sorting = useMemo(() => {
    if (!sortBy) return [];
    const columnId = REVERSE_SORT_MAP[sortBy] ?? sortBy;
    return [{ id: columnId, desc: sortOrder === "DESC" }];
  }, [sortBy, sortOrder]);

  const onSortingChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    if (next.length === 0) { setSortBy("ASSIGNED_ON"); setSortOrder("DESC"); }
    else {
      setSortBy(SORT_COLUMN_MAP[next[0].id] ?? "ASSIGNED_ON");
      setSortOrder(next[0].desc ? "DESC" : "ASC");
      setPage(1);
    }
  }, [sorting, setSortBy, setSortOrder, setPage]);

  // ── Pagination bridge ──────────────────────────────────────────────────────────
  const pagination = useMemo(() => ({ pageIndex: page - 1, pageSize: limit }), [page, limit]);

  const onPaginationChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
    setPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  }, [pagination, setPage, setLimit]);

  // ── Columns ────────────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: "employee",
      accessorFn: (row) => [row.EMP_FIRST_NAME, row.EMP_LAST_NAME].filter(Boolean).join(" "),
      header: ({ column }) => <SortHeader column={column}>Employee</SortHeader>,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <EmployeeCell
            firstName={r.EMP_FIRST_NAME} lastName={r.EMP_LAST_NAME}
            empNo={r.EMP_NO} title={r.EMP_TITLE} personId={r.PERSON_ID}
          />
        );
      },
    },
    {
      id: "supervisor",
      accessorFn: (row) => [row.SUP_FIRST_NAME, row.SUP_LAST_NAME].filter(Boolean).join(" "),
      header: ({ column }) => <SortHeader column={column}>Supervisor</SortHeader>,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <EmployeeCell
            firstName={r.SUP_FIRST_NAME} lastName={r.SUP_LAST_NAME}
            empNo={r.SUP_EMP_NO} title={r.SUP_TITLE} personId={r.SUPERVISOR_ID}
          />
        );
      },
    },
    {
      accessorKey: "ASSIGNED_ON",
      header: ({ column }) => <SortHeader column={column}>Assigned On</SortHeader>,
      cell: ({ row }) => (
        <div className="ps-2 font-light text-sm">{formatDate(row.getValue("ASSIGNED_ON"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false, enableSorting: false,
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => handleEdit(assignment)}>
                    <IconEdit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Change Supervisor</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(assignment)}
                    disabled={removeMutation.isPending}>
                    {removeMutation.isPending
                      ? <Spinner data-icon="inline-start" />
                      : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
    },
  ], [removeMutation.isPending]);

  // ── Table ──────────────────────────────────────────────────────────────────────
  const table = useReactTable({
    data:     rows,
    columns,
    pageCount,
    state:    { pagination, columnVisibility, sorting },
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel:   getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination:  true,
    manualSorting:     true,
    manualFiltering:   true,
  });

  // ── Loading ────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div>
      <PageHeader disabled />
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────────
  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAssignOpen(true)} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Supervisor Assignments</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load data."}</p>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
              {isFetching
                ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  // ── Main ───────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAssignOpen(true)} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Employee filter */}
            <PersonCombobox
              open={empOpen}           onOpenChange={setEmpOpen}
              search={empSearch}       onSearchChange={setEmpSearch}
              selected={selectedEmployee}
              data={employees}         isFetching={empFetching}
              placeholder="Filter by employee..."
              onSelect={(emp) => {
                setSelectedEmployee(emp);
                setEmployeeId(String(emp.id));
                setPage(1);
                setEmpOpen(false);
                setEmpSearch("");
              }}
              onClear={() => {
                setSelectedEmployee(null);
                setEmployeeId(null);
                setEmpSearch("");
                setPage(1);
              }}
            />

            {/* Supervisor filter */}
            <PersonCombobox
              open={supOpen}           onOpenChange={setSupOpen}
              search={supSearch}       onSearchChange={setSupSearch}
              selected={selectedSupervisor}
              data={supervisors}       isFetching={supFetching}
              placeholder="Filter by supervisor..."
              showRole
              onSelect={(sup) => {
                setSelectedSupervisor(sup);
                setSupervisorId(String(sup.id));
                setPage(1);
                setSupOpen(false);
                setSupSearch("");
              }}
              onClear={() => {
                setSelectedSupervisor(null);
                setSupervisorId(null);
                setSupSearch("");
                setPage(1);
              }}
            />

            {/* Reset all */}
            {hasActiveFilters && (
              <Button
                variant="ghost" size="sm"
                className="h-9 border border-dashed text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isFetching
                ? "Loading..."
                : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-md border">
            {isFetching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 rounded-md">
                <div className="flex items-center gap-2.5 rounded-lg bg-background/90 px-4 py-2.5 shadow-md border text-sm font-medium">
                  <Spinner className="h-4 w-4" />
                  Loading…
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="font-medium">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><UserCog /></EmptyMedia>
                          <EmptyTitle>No Supervisor Assignments Found</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </div>

      {isAssignOpen && (
        <AssignSupervisorDialog
          open={isAssignOpen}
          onOpenChange={setIsAssignOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateOpen && (
        <UpdateSupervisorDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          showConfirmation={showConfirmation}
          assignment={selected}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Supervisor Assignments</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Supervisor Assignments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button variant="outline" size="icon" onClick={onRefetch} disabled={isFetching || disabled}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          )}
          <Button onClick={onAdd} disabled={disabled}>
            <IconPlus size={18} className="mr-1" />
            Assign Supervisor
          </Button>
        </div>
      </div>
    </div>
  );
}