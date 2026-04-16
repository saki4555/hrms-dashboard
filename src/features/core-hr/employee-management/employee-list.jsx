import { useState, useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";

import { format } from "date-fns";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  RefreshCw, Pencil, Trash2, FileTextIcon,
  AlertCircle, Users, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown,
  EyeOff,
} from "lucide-react";
import { IconCirclePlus, IconSelector, IconX } from "@tabler/icons-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Combobox, ComboboxContent, ComboboxEmpty,
  ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { Spinner }              from "@/components/ui/spinner";
import { DataTablePagination }  from "@/components/DataTablePagination";

import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import {
  useEmployees, useDeleteEmployee,
  
} from "./queries";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { usePersonTypes } from "../employee-types/queries";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { usePositions } from "@/features/settings/work-structure/hr-position/queries";
import { useCountries } from "@/features/settings/work-structure/country/queries";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/avatar-utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatSimpleDate = (d) => {
  if (!d) return "N/A";
  return format(new Date(d), "MMM d, yyyy");
};

// Maps TanStack column id → Oracle column name
const SORT_COLUMN_MAP = {
  EMP_NO:    "EMP_NO",
  fullName:  "FIRST_NAME",
  JOIN_DATE: "JOIN_DATE",
};

// Reverse: Oracle column name → TanStack column id (for reading URL back into table)
const REVERSE_SORT_MAP = {
  EMP_NO:        "EMP_NO",
  FIRST_NAME:    "fullName",
  JOIN_DATE:     "JOIN_DATE",
  CREATION_DATE: "createdAt",
};




// ── Sortable Column Header ────────────────────────────────────────────────────

function SortHeader({ column, children, className }) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className
        )}
      >
        {children}
        {column.getCanSort() && (
          column.getIsSorted() === "desc" ? <ArrowDown /> :
          column.getIsSorted() === "asc"  ? <ArrowUp />   :
                                            <IconSelector />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-28">
        {column.getCanSort() && (
          <>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
              checked={column.getIsSorted() === "asc"}
              onClick={() => column.toggleSorting(false)}
            >
              <ArrowUp />
              Asc
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
              checked={column.getIsSorted() === "desc"}
              onClick={() => column.toggleSorting(true)}
            >
              <ArrowDown />
              Desc
            </DropdownMenuCheckboxItem>
            {column.getIsSorted() && (
              <DropdownMenuItem
                className="pl-2 [&_svg]:text-muted-foreground "
                onClick={() => column.clearSorting()}
              >
                <IconX />
                Reset
              </DropdownMenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <DropdownMenuCheckboxItem
            className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
            checked={!column.getIsVisible()}
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeOff />
            Hide
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EmployeeList() {
  const navigate = useNavigate();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // ── URL State via nuqs ─────────────────────────────────────────────────────
  // These are the ONLY source of truth — no useState for filters
  const [page,       setPage]       = useQueryState("page",       parseAsInteger.withDefault(1));
  const [limit,      setLimit]      = useQueryState("limit",      parseAsInteger.withDefault(10));
  const [search,     setSearch]     = useQueryState("search",     parseAsString.withDefault(""));
  const [sortBy,     setSortBy]     = useQueryState("sortBy",     parseAsString.withDefault("CREATION_DATE"));
  const [sortOrder,  setSortOrder]  = useQueryState("sortOrder",  parseAsString.withDefault("DESC"));
  const [gender,     setGender]     = useQueryState("gender",     parseAsString.withDefault(""));
  const [personType, setPersonType] = useQueryState("personType", parseAsString.withDefault(""));
  const [companyId,  setCompanyId]  = useQueryState("companyId",  parseAsString.withDefault(""));
  const [positionId, setPositionId] = useQueryState("positionId", parseAsString.withDefault(""));
  const [countryId,  setCountryId]  = useQueryState("countryId",  parseAsString.withDefault(""));

  // Local state only for the search input (so typing is snappy before debounce)
  const [searchInput, setSearchInput] = useState(search);

  // ── Table UI state (not in URL — not needed after page reload) ─────────────
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection,     setRowSelection]     = useState({});

  // ── Backend params (passed to react-query) ─────────────────────────────────
  const backendParams = useMemo(() => ({
    page, limit, search, sortBy, sortOrder,
    gender, personType, companyId, positionId, countryId,
  }), [page, limit, search, sortBy, sortOrder, gender, personType, companyId, positionId, countryId]);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEmployees(backendParams);

  console.log("response", response);

  // Lookup data for filter dropdowns
  const { data: personTypes = [] } = usePersonTypes();
  const { data: companies   = [] } = useCompanies();
  const { data: positions   = [] } = usePositions();
  const { data: countries   = [] } = useCountries();

  const deleteEmployeeMutation = useDeleteEmployee();

  // ── Derived ────────────────────────────────────────────────────────────────
  const employees  = response?.data        ?? [];
  const total      = response?.total       ?? 0;
  const pageCount  = response?.totalPages  ?? 1;

  // ── Debounced Search ───────────────────────────────────────────────────────
  const debouncedSearch = useDebouncedCallback((val) => {
    setSearch(val || null);
    setPage(1);
  }, 300);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  // ── Sorting bridge: TanStack [{id, desc}] ↔ backend sortBy + sortOrder ─────
const sorting = useMemo(() => {
  if (!sortBy) return [];
  // Convert Oracle column name back to TanStack column id
  const columnId = REVERSE_SORT_MAP[sortBy] ?? sortBy;
  return [{ id: columnId, desc: sortOrder === "DESC" }];
}, [sortBy, sortOrder]);

  const onSortingChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function"
      ? updaterOrValue(sorting)
      : updaterOrValue;

    if (next.length === 0) {
      setSortBy("CREATION_DATE");
      setSortOrder("DESC");
    } else {
      // Map TanStack column id → Oracle column name
      const oracleCol = SORT_COLUMN_MAP[next[0].id] ?? "CREATION_DATE";
      setSortBy(oracleCol);
      setSortOrder(next[0].desc ? "DESC" : "ASC");
      setPage(1);
    }
  }, [sorting, setSortBy, setSortOrder, setPage]);

  // ── Pagination bridge ──────────────────────────────────────────────────────
  const pagination = useMemo(() => ({
    pageIndex: page - 1,
    pageSize:  limit,
  }), [page, limit]);

  const onPaginationChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function"
      ? updaterOrValue(pagination)
      : updaterOrValue;
    setPage(next.pageIndex + 1);
    setLimit(next.pageSize);
  }, [pagination, setPage, setLimit]);

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const hasActiveFilters = search || gender || personType || companyId || positionId || countryId;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch(null);
    setGender(null);
    setPersonType(null);
    setCompanyId(null);
    setPositionId(null);
    setCountryId(null);
    setPage(1);
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async (emp) => {
    const confirmed = await showConfirmation({
      title: "Delete employee?",
      description: `Delete "${emp.FIRST_NAME} ${emp.LAST_NAME}" (${emp.EMP_NO})? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteEmployeeMutation.mutateAsync(emp.PERSON_ID);
      toast.success("Employee deleted successfully!");
    } catch (e) {
      toast.error(e?.message || "Failed to delete employee.");
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding:  false,
    },
   {
  id: "fullName",
  // accessorFn: (row) => `${row.TITLE || ""} ${row.FIRST_NAME } ${row.LAST_NAME}`.trim(),
  accessorFn: (row) =>
  [row.TITLE, row.FIRST_NAME, row.LAST_NAME]
    .filter(Boolean)
    .join(" "),
  header: ({ column }) => <SortHeader column={column}>Employee</SortHeader>,
  cell: ({ row }) => {
    const emp = row.original;
    const fullName = `${emp.FIRST_NAME ?? ""} ${emp.LAST_NAME ?? ""}`.trim();
    const initials = `${emp.FIRST_NAME?.[0] ?? ""}${emp.LAST_NAME?.[0] ?? ""}`.toUpperCase();

   const avatarColor = getAvatarColor(fullName);

    return (
      <div className="flex items-center gap-3 py-1">
        <Avatar className="h-8 w-8 shrink-0">
           <AvatarImage
          src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${emp.PERSON_ID}`}
        />
          <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColor)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium leading-tight">
            {emp.TITLE && (
              <span className="text-muted-foreground mr-1">{emp?.TITLE}</span>
            )}
            {fullName}
          </span>
          <span className="text-xs text-muted-foreground">ID : {emp.EMP_NO}</span>
        </div>
      </div>
    );
  },
},
    {
      id: "GENDER",
      accessorKey: "GENDER",
      header: "Gender",
      cell: ({ row }) => <div>{row.getValue("GENDER") || "N/A"}</div>,
      enableSorting: false,
    },
    {
      id: "JOIN_DATE",
      accessorKey: "JOIN_DATE",
      header: ({ column }) => <SortHeader column={column}>Join Date</SortHeader>,
      cell: ({ row }) => (
        <div className="ps-2 font-light">{formatSimpleDate(row.getValue("JOIN_DATE"))}</div>
      ),
    },
    {
      id: "personType",
      accessorFn: (row) => row.personType?.PERSON_TYPE ?? row.PERSON_TYPE_ID,
      header: "Person Type",
      cell: ({ row }) => {
        const label = row.original.personType?.PERSON_TYPE ?? row.original.PERSON_TYPE_ID;
        return <Badge variant="outline">{label || "N/A"}</Badge>;
      },
      enableSorting: false,
    },
    {
      id: "company",
      accessorFn: (row) => row.assignment?.COMPANY_NAME ?? "",
      header: "Company",
      cell: ({ row }) => (
        <div>{row.original.assignment?.COMPANY_NAME || "N/A"}</div>
      ),
      enableSorting: false,
    },
    {
      id: "position",
      accessorFn: (row) => row.assignment?.POSITION_TITLE ?? "",
      header: "Position",
      cell: ({ row }) => (
        <div>{row.original.assignment?.POSITION_TITLE || "N/A"}</div>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding:  false,
      enableSorting: false,
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-1">
            {/* <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => navigate(`/core-hr/employee-management/update/${emp.PERSON_ID}`)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => navigate(`/core-hr/employee-management/update-modern/${emp.PERSON_ID}`)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Modern</span>
            </Button> */}
            <Button
              variant="outline" size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
              onClick={() => handleDelete(emp)}
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending
                ? <Spinner data-icon="inline-start" />
                : <Trash2 className="h-4 w-4" />}
              <span className="sr-only">Delete</span>
            </Button>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => navigate(`/core-hr/employee-management/employee-details/${emp.PERSON_ID}`)}
            >
              <FileTextIcon className="w-4 h-4" />
              <span className="sr-only">Details</span>
            </Button>
          </div>
        );
      },
    },
  ], [deleteEmployeeMutation.isPending]);

  // ── TanStack Table ─────────────────────────────────────────────────────────
  const table = useReactTable({
    data:      employees,
    columns,
    pageCount,
    state:     { sorting, pagination, columnVisibility, rowSelection },
    onSortingChange,
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    getCoreRowModel:          getCoreRowModel(),
    manualPagination: true,  // backend handles pagination
    manualSorting:    true,  // backend handles sorting
    manualFiltering:  true,  // backend handles filtering
  });

  // ── Combobox options ───────────────────────────────────────────────────────
  const personTypeOptions = personTypes.map((pt) => ({
    label: pt.PERSON_TYPE,
    value: String(pt.PERSON_TYPE_ID),
  }));
  const companyOptions = companies.map((c) => ({
    label: c.COMPANY_NAME,
    value: String(c.COMPANY_ID),
  }));
  const positionOptions = positions.map((p) => ({
    label: p.TITLE,
    value: String(p.POSITION_ID),
  }));
  const countryOptions = countries.map((c) => ({
    label: c.COUNTRY_NAME,
    value: String(c.COUNTRY_ID),
  }));

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <PageHeader disabled />
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div>
        <PageHeader onRefetch={() => refetch()} isFetching={isFetching} />
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Employees</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load employees."}</p>
              <Button
                variant="outline" size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-fit"
              >
                {isFetching
                  ? <><Spinner className="mr-2 h-4 w-4" /> Retrying...</>
                  : <><RefreshCw className="mr-2 h-4 w-4" /> Retry</>}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        isFetching={isFetching}
        onRefetch={() => refetch()}
        onAdd={() => navigate("/core-hr/employees/add")}
        onAddModern={() => navigate("/core-hr/employees/add-modern")}
      />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Search — debounced 300ms */}
            <Input
              placeholder="Search name, emp no, NID..."
              value={searchInput}
              onChange={handleSearchChange}
              className="h-9 w-[220px]"
            />

            {/* Gender — Select (only 3 fixed options → no need for combobox) */}
            <Select
              value={gender || "all"}
              onValueChange={(v) => {
                setGender(v === "all" ? null : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Person Type — Combobox (dynamic from API) */}
            <FilterCombobox
              placeholder="Person Type"
              options={personTypeOptions}
              value={personType}
              onValueChange={(v) => { setPersonType(v || null); setPage(1); }}
            />

            {/* Company — Combobox */}
            <FilterCombobox
              placeholder="Company"
              options={companyOptions}
              value={companyId}
              onValueChange={(v) => { setCompanyId(v || null); setPage(1); }}
            />

            {/* Position — Combobox */}
            <FilterCombobox
              placeholder="Position"
              options={positionOptions}
              value={positionId}
              onValueChange={(v) => { setPositionId(v || null); setPage(1); }}
            />

            {/* Country — Combobox */}
            <FilterCombobox
              placeholder="Country"
              options={countryOptions}
              value={countryId}
              onValueChange={(v) => { setCountryId(v || null); setPage(1); }}
            />

            {/* Reset all filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 border border-dashed" onClick={clearAllFilters}>
                Reset
                <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Column visibility — pushed to the right */}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table.getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize"
                        checked={col.getIsVisible()}
                        onCheckedChange={(v) => col.toggleVisibility(!!v)}
                      >
                        {col.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Result count */}
          <p className="text-sm text-muted-foreground">
            {isFetching
              ? "Loading..."
              : `${total.toLocaleString()} employee${total !== 1 ? "s" : ""} found`}
          </p>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className="font-medium">
                        {header.isPlaceholder ? null : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {isFetching ? (
                  // Skeleton rows while fetching
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
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
                          <EmptyMedia variant="icon"><Users /></EmptyMedia>
                          <EmptyTitle>No Employees Found</EmptyTitle>
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

      <ConfirmationDialog />
    </div>
  );
}

// ── Reusable FilterCombobox ───────────────────────────────────────────────────
// options: [{ label: string, value: string }]
// value: current selected value (string)
// onValueChange: (value: string) => void

function FilterCombobox({ placeholder, options, value, onValueChange }) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const hasValue = !!value;

  return (
    <Combobox
      items={options.map((o) => o.label)}
      value={selectedLabel}
      onValueChange={(label) => {
        if (!label) { onValueChange(""); return; }
        const opt = options.find((o) => o.label === label);
        onValueChange(opt?.value ?? "");
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
         showTrigger={!hasValue}  // chevron when nothing selected
        showClear={hasValue}     // X only when something is selected       
        // className="h-9 w-[160px]"
      />
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(label) => (
            <ComboboxItem key={label} value={label}>
              {label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
// ── Page Header ───────────────────────────────────────────────────────────────

function PageHeader({ isFetching, onRefetch, onAdd, onAddModern, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Employees</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground/80">
                  Employee Management
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button
              variant="outline" size="icon"
              onClick={onRefetch}
              disabled={isFetching || disabled}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button onClick={onAdd} disabled={disabled}>
            <IconCirclePlus size={18} className="mr-1" />
            Add Employee
          </Button>
          <Button onClick={onAddModern} disabled={disabled}>
            <IconCirclePlus size={18} className="mr-1" />
            Add Employee Modern
          </Button>
        </div>
      </div>
    </div>
  );
}