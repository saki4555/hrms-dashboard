// src\features\attendance\attendance-list.jsx
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { format } from "date-fns";
import { Link } from "react-router";
import {
  RefreshCw,
  AlertCircle,
  Clock,
  Users,
  ChevronDown,
  EyeOff,
  Download,
  FileText,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  ChevronsUpDown,
  Check,
  CalendarIcon,
  CpuIcon,
  Pencil,
  CalendarClockIcon,
} from "lucide-react";
import { IconSelector, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";

import {
  useEmployeeLiteSearch,
  useSupervisorLiteSearch,
} from "@/hooks/use-lite-search";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useHrLocations } from "@/features/settings/work-structure/locations/queries";
import { useShifts } from "@/features/settings/work-structure/shift/queries";

import { useAttendance, useAttendanceSummary, buildExportUrl } from "./queries";
import AttendanceDetailDialog from "./attendance-detail-dialog";
import { DataTable } from "@/components/shared/data-table";
import ProcessAttendanceDialog from "./process-attendance-dialog";
import ManualEditDialog from "./manual-edit-dialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";
import { ROLES } from "@/config/roles";
// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PRESENT: {
    label: "Present",
    icon: CheckCircle2,
    class: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  LATE: {
    label: "Late",
    icon: AlertTriangle,
    class: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  EARLY_LEAVE: {
    label: "Early Leave",
    icon: LogOut,
    class: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    class: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  HOLIDAY: {
    label: "Holiday",
    icon: CalendarIcon,
    class: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  WEEKLY_OFF: {
    label: "Weekly Off",
    icon: CalendarIcon,
    class: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
  ON_LEAVE: {
    label: "On Leave",
    icon: LogOut,
    class: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  },
  UNSCHEDULED: {
    label: "Unscheduled",
    icon: AlertCircle,
    class: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    class: "bg-muted text-muted-foreground border-border",
  },
};

// Maps TanStack column id → Oracle column name
const SORT_COLUMN_MAP = {
  employee: "FIRST_NAME",
  ATTENDANCE_DATE: "ATTENDANCE_DATE",
};

// Reverse: Oracle column name → TanStack column id
const REVERSE_SORT_MAP = {
  FIRST_NAME: "employee",
  ATTENDANCE_DATE: "ATTENDANCE_DATE",
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const fmtDate = (dt) => {
  if (!dt) return "—";
  try {
    return format(new Date(dt), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

const fmtTime = (dt) => {
  if (!dt) return "—";
  try {
    return format(new Date(dt), "hh:mm a");
  } catch {
    return "—";
  }
};

const toISO = (dateObj) => {
  if (!dateObj) return "";
  try {
    return format(new Date(dateObj), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const today = format(new Date(), "yyyy-MM-dd");
// ─────────────────────────────────────────────────────────────────────────────
//  STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-xs font-medium", cfg.class)}
    >
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
    {
      key: "TOTAL",
      label: "Total",
      icon: Users,
      color: "text-foreground",
      bg: "bg-muted/50",
    },
    {
      key: "PRESENT",
      label: "Present",
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      key: "LATE",
      label: "Late",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      key: "EARLY_LEAVE",
      label: "Early Leave",
      icon: LogOut,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      key: "ABSENT",
      label: "Absent",
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
    {
      key: "HOLIDAY",
      label: "Holiday",
      icon: CalendarIcon,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    {
      key: "WEEKLY_OFF",
      label: "Weekly Off",
      icon: CalendarIcon,
      color: "text-slate-600",
      bg: "bg-slate-500/10",
    },
    {
      key: "ON_LEAVE",
      label: "On Leave",
      icon: LogOut,
      color: "text-cyan-600",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
      {cards.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                bg,
              )}
            >
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {isLoading ? (
                <div className="h-5 w-8 bg-muted animate-pulse rounded mt-0.5" />
              ) : (
                <p className={cn("text-xl font-bold", color)}>
                  {summary?.[key] ?? 0}
                </p>
              )}
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
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
      >
        {children}
        {column.getCanSort() &&
          (column.getIsSorted() === "desc" ? (
            <ArrowDown />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp />
          ) : (
            <IconSelector />
          ))}
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
                className="pl-2 [&_svg]:text-muted-foreground"
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

// ─────────────────────────────────────────────────────────────────────────────
//  DATE RANGE PICKER
// ─────────────────────────────────────────────────────────────────────────────

function DateRangePicker({ fromDate, toDate, onChange, onClear }) {
  const dateRange = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    if (!from) return undefined;
    return { from, to };
  }, [fromDate, toDate]);

  const handleSelect = (range) => {
    if (!range) {
      onChange({ from: null, to: null });
      return;
    }
    onChange({
      from: range.from ? toISO(range.from) : null,
      to: range.to ? toISO(range.to) : null,
    });
  };

  const hasValue = !!fromDate;

  const label = useMemo(() => {
    if (!fromDate) return null;
    const from = format(new Date(fromDate), "LLL dd, yy");
    if (!toDate || toDate === fromDate) return from;
    const to = format(new Date(toDate), "LLL dd, yy");
    return `${from} – ${to}`;
  }, [fromDate, toDate]);

  return (
    <Popover>
      {" "}
      {/* ✅ No open/onOpenChange — uncontrolled */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 min-w-[160px] justify-start gap-2 px-2.5 font-normal",
            !hasValue && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{label ?? "Pick a date"}</span>
          {hasValue && (
            <span
              role="button"
              className="ml-1 rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <IconX className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
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
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-green-600" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-blue-600" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-red-600" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceList() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  // ── URL state via nuqs ──────────────────────────────────────────────────────
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(20),
  );
  const [fromDate, setFromDate] = useQueryState(
    "fromDate",
    parseAsString.withDefault(""),
  );
  const [toDate, setToDate] = useQueryState(
    "toDate",
    parseAsString.withDefault(""),
  );
  const [employeeId, setEmployeeId] = useQueryState(
    "employeeId",
    parseAsString.withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault("ATTENDANCE_DATE"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsString.withDefault("DESC"),
  );
  const [companyId, setCompanyId] = useQueryState(
    "companyId",
    parseAsString.withDefault(""),
  );
  const [orgId, setOrgId] = useQueryState(
    "orgId",
    parseAsString.withDefault(""),
  );
  const [locationId, setLocationId] = useQueryState(
    "locationId",
    parseAsString.withDefault(""),
  );
  const [shiftId, setShiftId] = useQueryState(
    "shiftId",
    parseAsString.withDefault(""),
  );
  const [supervisorId, setSupervisorId] = useQueryState(
    "supervisorId",
    parseAsString.withDefault(""),
  );

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [columnVisibility, setColumnVisibility] = useState({});

  // Employee combobox
  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [supOpen, setSupOpen] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { data: employees = [], isFetching: empFetching } =
    useEmployeeLiteSearch(empSearch);
  const { data: supervisors = [], isFetching: supFetching } =
    useSupervisorLiteSearch(supSearch);
  const { data: companies = [] } = useCompanies();
  const { data: organizations = [] } = useOrganizations();
  const { data: locations = [] } = useHrLocations();
  const { data: shifts = [] } = useShifts();

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState(null);
  const [detailDate, setDetailDate] = useState(null);
  const [detailEmployeeName, setDetailEmployeeName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

 
  const { user } = useAuth();
  const isAdminOrHR =
    user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.HR);

  useEffect(() => {
    if (!fromDate && !toDate) {
      setFromDate(today);
      setToDate(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Backend params ──────────────────────────────────────────────────────────
  const backendParams = useMemo(() => {
    const isSingleDay = fromDate && (!toDate || toDate === fromDate);
    return {
      page,
      limit,
      date: isSingleDay ? fromDate : "",
      fromDate: !isSingleDay ? fromDate : "",
      toDate: !isSingleDay ? toDate : "",
      employeeId,
      supervisorId,
      companyId,
      orgId,
      locationId,
      shiftId,
      status,
      sortBy,
      sortOrder,
    };
  }, [
    page,
    limit,
    fromDate,
    toDate,
    employeeId,
    supervisorId,
    companyId,
    orgId,
    locationId,
    shiftId,
    status,
    sortBy,
    sortOrder,
  ]);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAttendance(backendParams);

  console.log("Attendances -->", response);

  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary({
    date: backendParams.date,
    fromDate: backendParams.fromDate,
    toDate: backendParams.toDate,
  });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const rows = response?.data ?? [];
  const total = response?.pagination?.total ?? 0;
  const pageCount = response?.pagination?.totalPages ?? 1;

  // ── Sorting bridge ──────────────────────────────────────────────────────────
  const sorting = useMemo(() => {
    if (!sortBy) return [];
    const columnId = REVERSE_SORT_MAP[sortBy] ?? sortBy;
    return [{ id: columnId, desc: sortOrder === "DESC" }];
  }, [sortBy, sortOrder]);

  const onSortingChange = useCallback(
    (updaterOrValue) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (next.length === 0) {
        setSortBy("ATTENDANCE_DATE");
        setSortOrder("DESC");
      } else {
        const col = SORT_COLUMN_MAP[next[0].id] ?? "ATTENDANCE_DATE";
        setSortBy(col);
        setSortOrder(next[0].desc ? "DESC" : "ASC");
        setPage(1);
      }
    },
    [sorting, setSortBy, setSortOrder, setPage],
  );

  // ── Pagination bridge ───────────────────────────────────────────────────────
  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: limit,
    }),
    [page, limit],
  );

  const onPaginationChange = useCallback(
    (updaterOrValue) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;
      setPage(next.pageIndex + 1);
      setLimit(next.pageSize);
    },
    [pagination, setPage, setLimit],
  );

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const hasActiveFilters =
    employeeId ||
    supervisorId ||
    companyId ||
    orgId ||
    locationId ||
    shiftId ||
    fromDate ||
    toDate ||
    status;

  const clearAllFilters = () => {
    setFromDate(null);
    setToDate(null);
    setEmployeeId(null);
    setSupervisorId(null);
    setCompanyId(null);
    setOrgId(null);
    setLocationId(null);
    setShiftId(null);
    setStatus(null);
    setSelectedEmployee(null);
    setEmpSearch("");
    setSelectedSupervisor(null);
    setSupSearch("");
    setPage(1);
  };

  // ── Detail dialog opener ────────────────────────────────────────────────────
  const openDetail = (row) => {
    const name = [row.TITLE, row.FIRST_NAME, row.LAST_NAME]
      .filter(Boolean)
      .join(" ");
    const d = row.ATTENDANCE_DATE
      ? format(new Date(row.ATTENDANCE_DATE), "yyyy-MM-dd")
      : null;
    setDetailEmployeeId(row.EMP_NO);
    setDetailDate(d);
    setDetailEmployeeName(name);
    setDetailOpen(true);
  };

  // ── Export params ───────────────────────────────────────────────────────────
  const exportParams = useMemo(
    () => ({
      date: backendParams.date,
      fromDate: backendParams.fromDate,
      toDate: backendParams.toDate,
      employeeId,
      supervisorId,
      status,
    }),
    [backendParams, employeeId, supervisorId, status],
  );

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "employee",
        accessorFn: (row) => `${row.FIRST_NAME} ${row.LAST_NAME}`,
        header: ({ column }) => (
          <SortHeader column={column}>Employee</SortHeader>
        ),
        cell: ({ row }) => {
          const r = row.original;
          const fullName = [r.TITLE, r.FIRST_NAME, r.LAST_NAME]
            .filter(Boolean)
            .join(" ");
          const initials = [r.FIRST_NAME?.[0], r.LAST_NAME?.[0]]
            .filter(Boolean)
            .join("")
            .toUpperCase();
          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${r.EMPLOYEE_ID}`}
                />
                <AvatarFallback
                  className={cn(
                    "text-xs font-semibold text-white",
                    getAvatarColor(fullName),
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium leading-tight truncate">
                  {fullName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.EMP_NO}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "ATTENDANCE_DATE",
        header: ({ column }) => <SortHeader column={column}>Date</SortHeader>,
        cell: ({ row }) => (
          <div className="text-sm">
            {fmtDate(row.getValue("ATTENDANCE_DATE"))}
          </div>
        ),
      },
      {
        header: "Clock-in & Out",
        cell: ({ row }) => {
          const { IN_TIME, OUT_TIME, WORK_MINUTES } = row.original;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-medium">{fmtTime(IN_TIME)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-xs">
                {formatDuration(WORK_MINUTES)}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{fmtTime(OUT_TIME)}</span>
            </div>
          );
        },
      },
      {
        header: "Overtime",
        cell: ({ row }) => {
          const { OVERTIME_MINUTES } = row.original;
          if (!OVERTIME_MINUTES || OVERTIME_MINUTES === 0)
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="text-orange-500 font-medium text-sm">
              {formatDuration(OVERTIME_MINUTES)}
            </span>
          );
        },
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
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => openDetail(row.original)}
            >
              <Clock className="h-3.5 w-3.5" />
              Punches
            </Button>

            {/* Edit button — Admin & HR only */}
            {isAdminOrHR && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => {
                  setSelectedAttendance(row.original);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        ),
      },
    ],
    [isAdminOrHR],
  );

  // ── TanStack table ──────────────────────────────────────────────────────────
  const table = useReactTable({
    data: rows,
    columns,
    pageCount,
    state: { pagination, columnVisibility, sorting },
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading)
    return (
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
  if (isError)
    return (
      <div>
        <PageHeader onRefetch={refetch} isFetching={isFetching} />
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Attendance</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load attendance data."}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={isFetching}
                className="w-fit"
              >
                {isFetching ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                )}
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

      {/* //! DON'T DELETE */}
      {/* <SummaryCards summary={summary} isLoading={summaryLoading} /> */}

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          {/* ── Filter Bar ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onChange={({ from, to }) => {
                setFromDate(from || null);
                setToDate(to || null);
                setPage(1);
              }}
              onClear={() => {
                setFromDate(null);
                setToDate(null);
                setPage(1);
              }}
            />

            {/* Employee combobox */}
            <Popover open={empOpen} onOpenChange={setEmpOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "h-9 w-[240px] justify-between font-normal px-2",
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
                          className={cn(
                            "text-[10px] font-semibold text-white",
                            getAvatarColor(selectedEmployee.name),
                          )}
                        >
                          {selectedEmployee.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-foreground">
                        {selectedEmployee.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({selectedEmployee.empNo})
                      </span>
                    </div>
                  ) : (
                    <span>Filter by employee...</span>
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
                          setEmployeeId(null);
                          setPage(1);
                        }}
                      >
                        <IconX className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[300px] p-0" align="start">
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
                    {!empFetching &&
                      empSearch.length >= 2 &&
                      employees.length === 0 && (
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
                            setEmployeeId(String(emp.id));
                            setPage(1);
                            setEmpOpen(false);
                          }}
                        >
                          <Avatar className="h-6 w-6 shrink-0 mr-2">
                            <AvatarImage
                              src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${emp.id}`}
                            />
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-semibold text-white",
                                getAvatarColor(emp.name),
                              )}
                            >
                              {emp.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{emp.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground shrink-0">
                            {emp.empNo}
                          </span>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4 shrink-0",
                              selectedEmployee?.id === emp.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

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
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                <SelectItem value="WEEKLY_OFF">Weekly Off</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="UNSCHEDULED">Unscheduled</SelectItem>
              </SelectContent>
            </Select>

            {/* Company */}
            <FilterCombobox
              placeholder="All Companies"
              options={companies.map((c) => ({
                label: c.COMPANY_NAME,
                value: String(c.COMPANY_ID),
              }))}
              value={companyId}
              onValueChange={(v) => {
                setCompanyId(v || null);
                setPage(1);
              }}
            />

            {/* Organization */}
            <FilterCombobox
              placeholder="All Organizations"
              options={organizations.map((o) => ({
                label: o.NAME,
                value: String(o.ID),
              }))}
              value={orgId}
              onValueChange={(v) => {
                setOrgId(v || null);
                setPage(1);
              }}
            />

            {/* Location */}
            <FilterCombobox
              placeholder="All Locations"
              options={locations.map((l) => ({
                label: l.LOCATION_NAME,
                value: String(l.ID),
              }))}
              value={locationId}
              onValueChange={(v) => {
                setLocationId(v || null);
                setPage(1);
              }}
            />

            {/* Shift */}
            <FilterCombobox
              placeholder="All Shifts"
              options={shifts.map((s) => ({
                label: `${s.NAME} ${s.START_TIME}–${s.END_TIME}`,
                value: String(s.SHIFT_ID),
              }))}
              value={shiftId}
              onValueChange={(v) => {
                setShiftId(v || null);
                setPage(1);
              }}
            />
            {/* Supervisor / Team filter */}
            <Popover open={supOpen} onOpenChange={setSupOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "h-9 w-[240px] justify-between font-normal px-2",
                    !selectedSupervisor && "text-muted-foreground",
                  )}
                >
                  {selectedSupervisor ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage
                          src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selectedSupervisor.employeeId}`}
                        />
                        <AvatarFallback
                          className={cn(
                            "text-[10px] font-semibold text-white",
                            getAvatarColor(selectedSupervisor.name),
                          )}
                        >
                          {selectedSupervisor.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-foreground">
                        {selectedSupervisor.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({selectedSupervisor.empNo})
                      </span>
                    </div>
                  ) : (
                    <span>Filter by team...</span>
                  )}
                  <div className="flex items-center gap-0.5 ml-1 shrink-0">
                    {selectedSupervisor && (
                      <span
                        role="button"
                        className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupervisor(null);
                          setSupSearch("");
                          setSupervisorId(null);
                          setPage(1);
                        }}
                      >
                        <IconX className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[300px] p-0" align="start">
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
                    {!supFetching &&
                      supSearch.length >= 2 &&
                      supervisors.length === 0 && (
                        <CommandEmpty>No supervisors found.</CommandEmpty>
                      )}
                    {!supFetching && supSearch.length < 2 && (
                      <CommandEmpty>Type at least 2 characters.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {supervisors.map((sup) => (
                        <CommandItem
                          key={sup.employeeId}
                          value={String(sup.employeeId)}
                          onSelect={() => {
                            setSelectedSupervisor(sup);
                            setSupervisorId(String(sup.employeeId));
                            setPage(1);
                            setSupOpen(false);
                          }}
                        >
                          <Avatar className="h-6 w-6 shrink-0 mr-2">
                            <AvatarImage
                              src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${sup.employeeId}`}
                            />
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-semibold text-white",
                                getAvatarColor(sup.name),
                              )}
                            >
                              {sup.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{sup.name}</span>
                          <span className="ml-1 text-xs text-muted-foreground shrink-0">
                            {sup.empNo}
                          </span>
                          {/* role badge */}
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px] px-1.5 py-0 h-4 shrink-0"
                          >
                            {sup.role}
                          </Badge>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4 shrink-0",
                              selectedSupervisor?.employeeId === sup.employeeId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Reset all */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 border border-dashed text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* ── Table Toolbar ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between py-1">
            <p className="text-sm font-medium text-muted-foreground">
              {isFetching
                ? "Loading records..."
                : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} found`}
            </p>

            <div className="flex items-center gap-2">
              <ExportButton exportParams={exportParams} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-medium shadow-sm"
                  >
                    Columns{" "}
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  {table
                    .getAllColumns()
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

          {/* ── Table ──────────────────────────────────────────────────── */}
          <DataTable
            table={table}
            columns={columns}
            isFetching={isFetching}
            loadingLabel="Loading Attendances…"
            empty={{
              colSpan: columns.length,
              icon: Clock,
              title: "No Attendance Records Found",
            }}
          />

          <DataTablePagination table={table} />
        </div>
      </div>

      <AttendanceDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        employeeId={detailEmployeeId}
        date={detailDate}
        employeeName={detailEmployeeName}
      />
      <ManualEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        attendance={selectedAttendance}
        showConfirmation={showConfirmation}
      />

      <ConfirmationDialog />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ isFetching, onRefetch }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            Attendance
          </h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setOpen(true)}
          >
            <CalendarClockIcon className="h-4 w-4" />
            Process / Reprocess
          </Button>

          {onRefetch && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefetch}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("h-4 w-4", isFetching && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </div>

      <ProcessAttendanceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function FilterCombobox({ placeholder, options, value, onValueChange }) {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const hasValue = !!value;

  return (
    <Combobox
      items={options.map((o) => o.label)}
      value={selectedLabel}
      onValueChange={(label) => {
        if (!label) {
          onValueChange("");
          return;
        }
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
            <ComboboxItem key={label} value={label}>
              {label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
