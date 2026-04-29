import { useState, useMemo, useCallback, useEffect } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "react-router";
import { RefreshCw, AlertCircle, Clock, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { cn } from "@/lib/utils";
import { IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle2, XCircle, AlertTriangle, LogOut, CalendarIcon } from "lucide-react";


import { useMyAttendance, useMyAttendanceSummary } from "./queries";
import AttendanceDetailDialog from "./attendance-detail-dialog";
import { useAuthV2 } from "../authentication-v2/use-auth-v2";

const fmtDate = (dt) => { if (!dt) return "—"; try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "—"; } };
const fmtTime = (dt) => { if (!dt) return "—"; try { return format(new Date(dt), "hh:mm a"); } catch { return "—"; } };
const formatDuration = (m) => { if (!m || m === 0) return "-"; const h = Math.floor(m / 60); const min = m % 60; if (h === 0) return `${min}m`; if (min === 0) return `${h}h`; return `${h}h ${min}m`; };

// Default to current month
const defaultFrom = format(startOfMonth(new Date()), "yyyy-MM-dd");
const defaultTo   = format(endOfMonth(new Date()),   "yyyy-MM-dd");

const SORT_COLUMN_MAP  = { ATTENDANCE_DATE: "ATTENDANCE_DATE" };
const REVERSE_SORT_MAP = { ATTENDANCE_DATE: "ATTENDANCE_DATE" };



// ── Shared UI — inline until extracted to attendance-shared.jsx ────────────
const STATUS_CONFIG = {
  PRESENT:     { label: "Present",     icon: CheckCircle2,  class: "bg-green-500/10 text-green-600 border-green-500/20"  },
  LATE:        { label: "Late",        icon: AlertTriangle, class: "bg-amber-500/10 text-amber-600 border-amber-500/20"  },
  EARLY_LEAVE: { label: "Early Leave", icon: LogOut,        class: "bg-blue-500/10 text-blue-600 border-blue-500/20"    },
  ABSENT:      { label: "Absent",      icon: XCircle,       class: "bg-red-500/10 text-red-600 border-red-500/20"       },
  HOLIDAY:     { label: "Holiday",     icon: CalendarIcon,  class: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  WEEKLY_OFF:  { label: "Weekly Off",  icon: CalendarIcon,  class: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  ON_LEAVE:    { label: "On Leave",    icon: LogOut,        class: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"    },
  UNSCHEDULED: { label: "Unscheduled", icon: AlertCircle,   class: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  PENDING:     { label: "Pending",     icon: Clock,         class: "bg-muted text-muted-foreground border-border"       },
};

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



const toISO = (dateObj) => { if (!dateObj) return ""; try { return format(new Date(dateObj), "yyyy-MM-dd"); } catch { return ""; } };

function DateRangePicker({ fromDate, toDate, onChange, onClear }) {
  const dateRange = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to   = toDate   ? new Date(toDate)   : undefined;
    if (!from) return undefined;
    return { from, to };
  }, [fromDate, toDate]);

  const hasValue = !!fromDate;
  const label = useMemo(() => {
    if (!fromDate) return null;
    const from = format(new Date(fromDate), "LLL dd, yy");
    if (!toDate || toDate === fromDate) return from;
    return `${from} – ${format(new Date(toDate), "LLL dd, yy")}`;
  }, [fromDate, toDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-9 min-w-[160px] justify-start gap-2 px-2.5 font-normal", !hasValue && "text-muted-foreground")}>
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{label ?? "Pick a date"}</span>
          {hasValue && (
            <span role="button" className="ml-1 rounded p-0.5 hover:bg-muted text-muted-foreground" onClick={(e) => { e.stopPropagation(); onClear(); }}>
              <IconX className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" defaultMonth={dateRange?.from} selected={dateRange}
          onSelect={(range) => {
            if (!range) { onChange({ from: null, to: null }); return; }
            onChange({ from: range.from ? toISO(range.from) : null, to: range.to ? toISO(range.to) : null });
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function AttendanceMy() {
  const { user }     = useAuthV2();
  const employeeId   = user?.employee_id;

  const [page,      setPage]      = useQueryState("page",      parseAsInteger.withDefault(1));
  const [limit,     setLimit]     = useQueryState("limit",     parseAsInteger.withDefault(20));
  const [fromDate,  setFromDate]  = useQueryState("fromDate",  parseAsString.withDefault(defaultFrom));
  const [toDate,    setToDate]    = useQueryState("toDate",    parseAsString.withDefault(defaultTo));
  const [status,    setStatus]    = useQueryState("status",    parseAsString.withDefault(""));
  const [sortBy,    setSortBy]    = useQueryState("sortBy",    parseAsString.withDefault("ATTENDANCE_DATE"));
  const [sortOrder, setSortOrder] = useQueryState("sortOrder", parseAsString.withDefault("DESC"));

  const [columnVisibility,  setColumnVisibility]  = useState({});
  const [detailOpen,        setDetailOpen]        = useState(false);
  const [detailEmployeeId,  setDetailEmployeeId]  = useState(null);
  const [detailDate,        setDetailDate]        = useState(null);
  const [detailEmployeeName,setDetailEmployeeName]= useState("");

  const backendParams = useMemo(() => ({
    page, limit, fromDate, toDate, status, sortBy, sortOrder,
  }), [page, limit, fromDate, toDate, status, sortBy, sortOrder]);

  const { data: response, isLoading, isError, error, refetch, isFetching } =
    useMyAttendance(employeeId, backendParams);

  const { data: summaryData } = useMyAttendanceSummary(employeeId, { fromDate, toDate });
  const summary = summaryData;
  console.log("summary", summary);

  const rows      = response?.data ?? [];
  const total     = response?.pagination?.total ?? 0;
  const pageCount = response?.pagination?.totalPages ?? 1;

  const sorting = useMemo(() => [{ id: REVERSE_SORT_MAP[sortBy] ?? sortBy, desc: sortOrder === "DESC" }], [sortBy, sortOrder]);

  const onSortingChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    if (next.length === 0) { setSortBy("ATTENDANCE_DATE"); setSortOrder("DESC"); }
    else { setSortBy(SORT_COLUMN_MAP[next[0].id] ?? "ATTENDANCE_DATE"); setSortOrder(next[0].desc ? "DESC" : "ASC"); setPage(1); }
  }, [sorting, setSortBy, setSortOrder, setPage]);

  const pagination         = useMemo(() => ({ pageIndex: page - 1, pageSize: limit }), [page, limit]);
  const onPaginationChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
    setPage(next.pageIndex + 1); setLimit(next.pageSize);
  }, [pagination, setPage, setLimit]);

  const openDetail = (row) => {
    const name = [row.TITLE, row.FIRST_NAME, row.LAST_NAME].filter(Boolean).join(" ");
    setDetailEmployeeId(row.EMP_NO);
    setDetailDate(row.ATTENDANCE_DATE ? format(new Date(row.ATTENDANCE_DATE), "yyyy-MM-dd") : null);
    setDetailEmployeeName(name);
    setDetailOpen(true);
  };

  const columns = useMemo(() => [
    {
      accessorKey: "ATTENDANCE_DATE",
      header: "Date",
      cell: ({ row }) => <div className="text-sm">{fmtDate(row.getValue("ATTENDANCE_DATE"))}</div>,
    },
    {
      header: "Clock-in & Out",
      cell: ({ row }) => {
        const { IN_TIME, OUT_TIME, WORK_MINUTES } = row.original;
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">{fmtTime(IN_TIME)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-xs">{formatDuration(WORK_MINUTES)}</span>
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
        if (!OVERTIME_MINUTES || OVERTIME_MINUTES === 0) return <span className="text-muted-foreground">-</span>;
        return <span className="text-orange-500 font-medium text-sm">{formatDuration(OVERTIME_MINUTES)}</span>;
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
              <span className="text-xs text-muted-foreground font-mono">{r.SHIFT_START} – {r.SHIFT_END}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Details",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => openDetail(row.original)}>
          <Clock className="h-3.5 w-3.5" /> Punches
        </Button>
      ),
    },
  ], []);

  const table = useReactTable({
    data: rows, columns, pageCount,
    state: { pagination, columnVisibility, sorting },
    onPaginationChange, onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, manualSorting: true, manualFiltering: true,
  });

  if (isLoading) return <div><PageHeader /><div className="bg-card rounded-md shadow-sm p-4"><div className="flex flex-col items-center justify-center py-16"><Spinner className="h-12 w-12 mb-4" /><p className="text-muted-foreground">Loading your attendance...</p></div></div></div>;
  if (isError)   return <div><PageHeader onRefetch={refetch} isFetching={isFetching} /><div className="bg-card rounded-md shadow-sm p-4"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error?.message}</AlertDescription></Alert></div></div>;

  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} />

      {/* Summary strip — shows month totals above the table */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          {[
            { key: "WORKING_DAYS",        label: "Working Days",   color: "text-foreground"  },
            { key: "ATTENDED_DAYS",        label: "Attended",       color: "text-green-600"   },
            { key: "LATE",                 label: "Late",           color: "text-amber-600"   },
            { key: "ABSENT",               label: "Absent",         color: "text-red-600"     },
            { key: "ON_LEAVE",             label: "On Leave",       color: "text-cyan-600"    },
            { key: "TOTAL_WORK_HOURS",     label: "Work Hours",     color: "text-blue-600"    },
            { key: "TOTAL_OVERTIME_HOURS", label: "Overtime Hours", color: "text-orange-500"  },
          ].map(({ key, label, color }) => (
            <Card key={key} className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn("text-xl font-bold mt-0.5", color)}>{summary[key] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              fromDate={fromDate} toDate={toDate}
              onChange={({ from, to }) => { setFromDate(from || null); setToDate(to || null); setPage(1); }}
              onClear={() => { setFromDate(defaultFrom); setToDate(defaultTo); setPage(1); }}
            />
            <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? null : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="EARLY_LEAVE">Early Leave</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                <SelectItem value="WEEKLY_OFF">Weekly Off</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              </SelectContent>
            </Select>
            {status && (
              <Button variant="ghost" size="sm" className="h-9 border border-dashed text-muted-foreground"
                onClick={() => { setStatus(null); setPage(1); }}>
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between py-1">
            <p className="text-sm font-medium text-muted-foreground">
              {isFetching ? "Loading..." : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} found`}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">Columns <ChevronDown className="ml-2 h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                {table.getAllColumns().filter((c) => c.getCanHide()).map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)}>
                    {c.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative overflow-hidden rounded-md border">
            {isFetching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 rounded-md">
                <div className="flex items-center gap-2.5 rounded-lg bg-background/90 px-4 py-2.5 shadow-md border text-sm font-medium">
                  <Spinner className="h-4 w-4" /> Loading…
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
                {rows.length ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <Empty><EmptyHeader><EmptyMedia variant="icon"><Clock /></EmptyMedia><EmptyTitle>No Records Found</EmptyTitle></EmptyHeader></Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </div>
      <AttendanceDetailDialog open={detailOpen} onOpenChange={setDetailOpen} employeeId={detailEmployeeId} date={detailDate} employeeName={detailEmployeeName} />
    </div>
  );
}

function PageHeader({ isFetching, onRefetch }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            My Attendance
          </h1>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>Self Service</BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>My Attendance</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

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
  );
}