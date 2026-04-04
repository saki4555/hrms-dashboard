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
import { Link } from "react-router";
import {
  RefreshCw, AlertCircle, Clock, Users,
  ChevronDown, EyeOff, Download, FileText,
  ArrowUp, ArrowDown, CheckCircle2,
  XCircle, AlertTriangle, LogOut,
} from "lucide-react";
import { IconSelector, IconX } from "@tabler/icons-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { Spinner }             from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { DatePicker }          from "@/components/DatePicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Combobox, ComboboxContent, ComboboxEmpty,
  ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox";

import { cn }                from "@/lib/utils";
import { getAvatarColor }    from "@/lib/avatar-utils";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

import { useCompanies }      from "@/features/settings/work-structure/company/queries";
import { useOrganizations }  from "@/features/settings/work-structure/organization/queries";

import {
  useAttendance,
  useAttendanceSummary,
  buildExportUrl,
} from "./queries";
import AttendanceDetailDialog from "./attendance-detail-dialog";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PRESENT:     { label: "Present",     icon: CheckCircle2, class: "bg-green-500/10 text-green-600 border-green-500/20"  },
  LATE:        { label: "Late",        icon: AlertTriangle, class: "bg-amber-500/10 text-amber-600 border-amber-500/20"  },
  EARLY_LEAVE: { label: "Early Leave", icon: LogOut,        class: "bg-blue-500/10 text-blue-600 border-blue-500/20"    },
  ABSENT:      { label: "Absent",      icon: XCircle,       class: "bg-red-500/10 text-red-600 border-red-500/20"       },
  PENDING:     { label: "Pending",     icon: Clock,         class: "bg-muted text-muted-foreground border-border"        },
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmtDate = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "—"; }
};

const fmtTime = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "HH:mm"); } catch { return "—"; }
};

const toISO = (dateObj) => {
  if (!dateObj) return "";
  try { return format(new Date(dateObj), "yyyy-MM-dd"); } catch { return ""; }
};

// ─────────────────────────────────────────────────────────────────────────────
//  STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", cfg.class)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUMMARY CARDS
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCards({ summary, isLoading }) {
  const cards = [
    { key: "TOTAL",       label: "Total",       icon: Users,        color: "text-foreground",  bg: "bg-muted/50"           },
    { key: "PRESENT",     label: "Present",     icon: CheckCircle2, color: "text-green-600",   bg: "bg-green-500/10"       },
    { key: "LATE",        label: "Late",        icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-500/10"       },
    { key: "EARLY_LEAVE", label: "Early Leave", icon: LogOut,       color: "text-blue-600",    bg: "bg-blue-500/10"        },
    { key: "ABSENT",      label: "Absent",      icon: XCircle,      color: "text-red-600",     bg: "bg-red-500/10"         },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      {cards.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {isLoading
                ? <div className="h-5 w-8 bg-muted animate-pulse rounded mt-0.5" />
                : <p className={cn("text-xl font-bold", color)}>
                    {summary?.[key] ?? 0}
                  </p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SORT HEADER
// ─────────────────────────────────────────────────────────────────────────────

function SortHeader({ column, children, className }) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{children}</div>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5",
        "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
        "data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className
      )}>
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
              <ArrowUp /> Asc
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
              checked={column.getIsSorted() === "desc"}
              onClick={() => column.toggleSorting(true)}
            >
              <ArrowDown /> Desc
            </DropdownMenuCheckboxItem>
          </>
        )}
        {column.getCanHide() && (
          <DropdownMenuCheckboxItem
            className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto [&_svg]:text-muted-foreground"
            checked={!column.getIsVisible()}
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeOff /> Hide
          </DropdownMenuCheckboxItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILTER COMBOBOX (reused from employee list pattern)
// ─────────────────────────────────────────────────────────────────────────────

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
        showTrigger={!hasValue}
        showClear={hasValue}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results.</ComboboxEmpty>
        <ComboboxList>
          {(label) => (
            <ComboboxItem key={label} value={label}>{label}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORT BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function ExportButton({ exportParams }) {
  const handleExport = (fmt) => {
    const url = buildExportUrl(fmt, exportParams);
    window.open(url, "_blank");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Choose format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-green-600" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-blue-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-600" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceList() {
  // ── URL state via nuqs ──────────────────────────────────────────────────────
  const [page,       setPage]       = useQueryState("page",       parseAsInteger.withDefault(1));
  const [limit,      setLimit]      = useQueryState("limit",      parseAsInteger.withDefault(20));
  const [search,     setSearch]     = useQueryState("search",     parseAsString.withDefault(""));
  const [date,       setDate]       = useQueryState("date",       parseAsString.withDefault(""));
  const [fromDate,   setFromDate]   = useQueryState("fromDate",   parseAsString.withDefault(""));
  const [toDate,     setToDate]     = useQueryState("toDate",     parseAsString.withDefault(""));
  const [employeeId, setEmployeeId] = useQueryState("employeeId", parseAsString.withDefault(""));
  const [companyId,  setCompanyId]  = useQueryState("companyId",  parseAsString.withDefault(""));
  const [orgId,      setOrgId]      = useQueryState("orgId",      parseAsString.withDefault(""));
  const [locationId, setLocationId] = useQueryState("locationId", parseAsString.withDefault(""));
  const [status,     setStatus]     = useQueryState("status",     parseAsString.withDefault(""));

  // Local state — search input is local before debounce
  const [searchInput,      setSearchInput]      = useState(search);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Detail dialog state
  const [detailOpen,        setDetailOpen]        = useState(false);
  const [detailEmployeeId,  setDetailEmployeeId]  = useState(null);
  const [detailDate,        setDetailDate]        = useState(null);
  const [detailEmployeeName, setDetailEmployeeName] = useState("");

  // ── Filter mode: "single-date" | "range" ───────────────────────────────────
  const [filterMode, setFilterMode] = useQueryState(
    "mode",
    parseAsString.withDefault("single-date")
  );

  // ── Lookup data ─────────────────────────────────────────────────────────────
  const { data: companies     = [] } = useCompanies();
  const { data: organizations = [] } = useOrganizations();

  // ── Backend params ──────────────────────────────────────────────────────────
  const backendParams = useMemo(() => ({
    page, limit, search,
    date:       filterMode === "single-date" ? date     : "",
    fromDate:   filterMode === "range"       ? fromDate : "",
    toDate:     filterMode === "range"       ? toDate   : "",
    employeeId, companyId, orgId, locationId, status,
  }), [page, limit, search, date, fromDate, toDate,
      employeeId, companyId, orgId, locationId, status, filterMode]);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading, isError, error, refetch, isFetching,
  } = useAttendance(backendParams);

  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary({
    date:     filterMode === "single-date" ? date     : "",
    fromDate: filterMode === "range"       ? fromDate : "",
    toDate:   filterMode === "range"       ? toDate   : "",
  });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const rows      = response?.data            ?? [];
  const total     = response?.pagination?.total     ?? 0;
  const pageCount = response?.pagination?.totalPages ?? 1;

  // ── Debounced search ────────────────────────────────────────────────────────
  const debouncedSearch = useDebouncedCallback((val) => {
    setSearch(val || null);
    setPage(1);
  }, 300);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  // ── Pagination bridge ───────────────────────────────────────────────────────
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

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const hasActiveFilters = search || date || fromDate || toDate ||
                           employeeId || companyId || orgId || locationId || status;

  const clearAllFilters = () => {
    setSearchInput(""); setSearch(null);
    setDate(null); setFromDate(null); setToDate(null);
    setEmployeeId(null); setCompanyId(null); setOrgId(null);
    setLocationId(null); setStatus(null);
    setPage(1);
  };

  // ── Detail dialog opener ────────────────────────────────────────────────────
  const openDetail = (row) => {
    const name = [row.TITLE, row.FIRST_NAME, row.LAST_NAME].filter(Boolean).join(" ");
    const d    = row.ATTENDANCE_DATE
      ? format(new Date(row.ATTENDANCE_DATE), "yyyy-MM-dd")
      : null;
    setDetailEmployeeId(row.EMPLOYEE_ID);
    setDetailDate(d);
    setDetailEmployeeName(name);
    setDetailOpen(true);
  };

  // ── Combobox options ────────────────────────────────────────────────────────
  const companyOptions = companies.map((c) => ({
    label: c.COMPANY_NAME,
    value: String(c.COMPANY_ID),
  }));
  const orgOptions = organizations.map((o) => ({
    label: o.NAME,
    value: String(o.ID),
  }));

  // ── Export params (same filters, no pagination) ─────────────────────────────
  const exportParams = useMemo(() => ({
    search,
    date:       filterMode === "single-date" ? date     : "",
    fromDate:   filterMode === "range"       ? fromDate : "",
    toDate:     filterMode === "range"       ? toDate   : "",
    employeeId, companyId, orgId, locationId, status,
  }), [search, date, fromDate, toDate, employeeId,
      companyId, orgId, locationId, status, filterMode]);

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: "employee",
      accessorFn: (row) => `${row.FIRST_NAME} ${row.LAST_NAME}`,
      header: ({ column }) => <SortHeader column={column}>Employee</SortHeader>,
      cell: ({ row }) => {
        const r        = row.original;
        const fullName = [r.TITLE, r.FIRST_NAME, r.LAST_NAME].filter(Boolean).join(" ");
        const initials = [r.FIRST_NAME?.[0], r.LAST_NAME?.[0]].filter(Boolean).join("").toUpperCase();
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${r.EMPLOYEE_ID}`}
              />
              <AvatarFallback className={cn("text-xs font-semibold text-white", getAvatarColor(fullName))}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium leading-tight truncate">{fullName}</span>
              <span className="text-xs text-muted-foreground">{r.EMP_NO}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "ATTENDANCE_DATE",
      header: ({ column }) => <SortHeader column={column}>Date</SortHeader>,
      cell: ({ row }) => (
        <div className="text-sm">{fmtDate(row.getValue("ATTENDANCE_DATE"))}</div>
      ),
    },
    {
      accessorKey: "IN_TIME",
      header: "In Time",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-sm font-mono text-green-600 font-medium">
          {fmtTime(row.getValue("IN_TIME"))}
        </div>
      ),
    },
    {
      accessorKey: "OUT_TIME",
      header: "Out Time",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-sm font-mono text-red-500 font-medium">
          {fmtTime(row.getValue("OUT_TIME"))}
        </div>
      ),
    },
    {
      accessorKey: "STATUS",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.getValue("STATUS")} />,
    },
    {
      accessorKey: "SHIFT_NAME",
      header: "Shift",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm">{r.SHIFT_NAME ?? "—"}</span>
            {r.SHIFT_START && r.SHIFT_END && (
              <span className="text-xs text-muted-foreground font-mono">
                {r.SHIFT_START} – {r.SHIFT_END}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "COMPANY_NAME",
      header: "Company",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("COMPANY_NAME") ?? "—"}</div>
      ),
    },
    {
      accessorKey: "LOCATION_NAME",
      header: "Location",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("LOCATION_NAME") ?? "—"}</div>
      ),
    },
    {
      id: "actions",
      header: "Details",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="outline" size="sm" className="h-7 text-xs gap-1.5"
          onClick={() => openDetail(row.original)}
        >
          <Clock className="h-3.5 w-3.5" />
          Punches
        </Button>
      ),
    },
  ], []);

  // ── TanStack table ──────────────────────────────────────────────────────────
  const table = useReactTable({
    data:     rows,
    columns,
    pageCount,
    state:    { pagination, columnVisibility },
    onPaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel:          getCoreRowModel(),
    manualPagination: true,
    manualSorting:    true,
    manualFiltering:  true,
  });

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) return (
    <div>
      <PageHeader />
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading attendance...</p>
        </div>
      </div>
    </div>
  );

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Attendance</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load attendance data."}</p>
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

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} />

      {/* Summary cards */}
      <SummaryCards summary={summary} isLoading={summaryLoading} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">

          {/* ── Filter Bar ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Filter mode toggle */}
            <Select
              value={filterMode}
              onValueChange={(v) => {
                setFilterMode(v);
                setDate(null); setFromDate(null); setToDate(null);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-date">Single Date</SelectItem>
                <SelectItem value="range">Date Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Date picker(s) */}
            {filterMode === "single-date" ? (
              <DatePicker
                value={date ? new Date(date) : undefined}
                onChange={(d) => { setDate(toISO(d) || null); setPage(1); }}
                placeholder="Pick a date"
                className="h-9 w-[160px]"
              />
            ) : (
              <>
                <DatePicker
                  value={fromDate ? new Date(fromDate) : undefined}
                  onChange={(d) => { setFromDate(toISO(d) || null); setPage(1); }}
                  placeholder="From date"
                  className="h-9 w-[150px]"
                />
                <DatePicker
                  value={toDate ? new Date(toDate) : undefined}
                  onChange={(d) => { setToDate(toISO(d) || null); setPage(1); }}
                  placeholder="To date"
                  className="h-9 w-[150px]"
                />
              </>
            )}

            {/* Search */}
            <Input
              placeholder="Search name, emp no..."
              value={searchInput}
              onChange={handleSearchChange}
              className="h-9 w-[200px]"
            />

            {/* Status */}
            <Select
              value={status || "all"}
              onValueChange={(v) => {
                setStatus(v === "all" ? null : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="EARLY_LEAVE">Early Leave</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
              </SelectContent>
            </Select>

            {/* Company */}
            <FilterCombobox
              placeholder="Company"
              options={companyOptions}
              value={companyId}
              onValueChange={(v) => { setCompanyId(v || null); setPage(1); }}
            />

            {/* Organization */}
            <FilterCombobox
              placeholder="Organization"
              options={orgOptions}
              value={orgId}
              onValueChange={(v) => { setOrgId(v || null); setPage(1); }}
            />

            {/* Reset */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 border border-dashed" onClick={clearAllFilters}>
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Right side — Export + Column visibility */}
            <div className="ml-auto flex items-center gap-2">
              <ExportButton exportParams={exportParams} />

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
              : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} found`}
          </p>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-md border">
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
                {isFetching ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length ? (
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
                          <EmptyMedia variant="icon"><Clock /></EmptyMedia>
                          <EmptyTitle>No Attendance Records Found</EmptyTitle>
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

      {/* Detail dialog */}
      <AttendanceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        employeeId={detailEmployeeId}
        date={detailDate}
        employeeName={detailEmployeeName}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ isFetching, onRefetch }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Attendance</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Attendance Management</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Attendance Records</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {onRefetch && (
          <Button variant="outline" size="icon" onClick={onRefetch} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        )}
      </div>
    </div>
  );
}