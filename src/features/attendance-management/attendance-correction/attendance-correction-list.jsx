// src/features/attendance-management/attendance-correction/attendance-correction-list.jsx
import { useState, useMemo, useCallback } from "react";
import {
  flexRender, getCoreRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { format } from "date-fns";
import { Link } from "react-router";
import {
  Trash2, AlertCircle, RefreshCw, ClipboardEdit,
  ChevronDown, CalendarIcon, ArrowUp, ArrowDown, Check, X,
} from "lucide-react";
import { IconCircleDashedPlus, IconX, IconSelector } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";
import { cn } from "@/lib/utils";
import { ROLES } from "@/config/roles";

import {
  useAllCorrections,
  useTeamCorrections,
  useEmployeeCorrections,
  useApproveCorrection,
  useRejectCorrection,
  useDeleteCorrection,
} from "./queries";
import AddCorrectionRequestSheet from "./add-correction-request-sheet";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_VARIANT = {
  PENDING:  "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const SORT_COLUMN_MAP = {
  EMPLOYEE_NAME:   "FIRST_NAME",
  CORRECTION_DATE: "CORRECTION_DATE",
  CORRECTION_ID:   "CORRECTION_ID",
  CREATED_DATE:    "CREATED_DATE",
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const toISO      = (d) => { try { return format(new Date(d), "yyyy-MM-dd");            } catch { return ""; } };
const fmtDate    = (d) => { try { return format(new Date(d), "dd MMM yyyy");           } catch { return "—"; } };
const fmtTime    = (d) => { try { return format(new Date(d), "hh:mm a");               } catch { return "—"; } };
const fmtDateTime = (d) => { try { return format(new Date(d), "dd MMM yyyy, hh:mm a"); } catch { return "—"; } };

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return <Badge variant={STATUS_VARIANT[status] || "outline"}>{status || "N/A"}</Badge>;
}

function SortHeader({ column, children }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
        {children}
        {column.getIsSorted() === "desc" ? <ArrowDown /> : column.getIsSorted() === "asc" ? <ArrowUp /> : <IconSelector />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        <DropdownMenuCheckboxItem className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
          checked={column.getIsSorted() === "asc"} onClick={() => column.toggleSorting(false)}>
          <ArrowUp className="mr-2 h-4 w-4" /> Asc
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem className="relative pr-8 pl-2 [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
          checked={column.getIsSorted() === "desc"} onClick={() => column.toggleSorting(true)}>
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

function DateRangePicker({ fromDate, toDate, onChange, onClear }) {
  const dateRange = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to   = toDate   ? new Date(toDate)   : undefined;
    return from ? { from, to } : undefined;
  }, [fromDate, toDate]);

  const label = useMemo(() => {
    if (!fromDate) return null;
    const from = format(new Date(fromDate), "LLL dd, yy");
    if (!toDate || toDate === fromDate) return from;
    return `${from} – ${format(new Date(toDate), "LLL dd, yy")}`;
  }, [fromDate, toDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-9 min-w-[160px] justify-start gap-2 px-2.5 font-normal", !fromDate && "text-muted-foreground")}>
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{label ?? "Pick a date"}</span>
          {fromDate && (
            <span role="button" className="ml-1 rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onClear(); }}>
              <IconX className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" defaultMonth={dateRange?.from} selected={dateRange} numberOfMonths={2}
          onSelect={(range) => {
            if (!range) { onChange({ from: null, to: null }); return; }
            onChange({ from: range.from ? toISO(range.from) : null, to: range.to ? toISO(range.to) : null });
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COLUMNS
// ─────────────────────────────────────────────────────────────────────────────

function buildColumns({ isAdminOrHR, isSupervisor, onApprove, onReject, onDelete, approvePending, rejectPending, deletePending }) {
  const cols = [];

  if (isAdminOrHR || isSupervisor) {
    cols.push({
      accessorKey: "EMPLOYEE_NAME",
      header: ({ column }) => <SortHeader column={column}>Employee</SortHeader>,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("EMPLOYEE_NAME") || "—"}</div>
          {row.original.EMP_NO && <div className="text-xs text-muted-foreground">{row.original.EMP_NO}</div>}
        </div>
      ),
    });
  }

  cols.push(
    {
      accessorKey: "CORRECTION_DATE",
      header: ({ column }) => <SortHeader column={column}>Date</SortHeader>,
      cell: ({ row }) => <div className="font-medium">{fmtDate(row.getValue("CORRECTION_DATE"))}</div>,
    },
    {
      accessorKey: "REQUESTED_IN_TIME",
      header: "Req. In",
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.getValue("REQUESTED_IN_TIME");
        return t ? <div className="tabular-nums">{fmtTime(t)}</div> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "REQUESTED_OUT_TIME",
      header: "Req. Out",
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.getValue("REQUESTED_OUT_TIME");
        return t ? <div className="tabular-nums">{fmtTime(t)}</div> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "REASON",
      header: "Reason",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-muted-foreground text-sm">
          {row.getValue("REASON") || "—"}
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
      accessorKey: "APPROVER_NAME",
      header: "Actioned By",
      enableSorting: false,
      cell: ({ row }) => {
        const name   = row.getValue("APPROVER_NAME");
        const empNo  = row.original.APPROVER_EMP_NO;
        const status = row.original.STATUS;
        if ((status !== "APPROVED" && status !== "REJECTED") || !name)
          return <span className="text-muted-foreground">—</span>;
        return (
          <div>
            <div className="text-sm font-medium">{name}</div>
            {empNo && <div className="text-xs text-muted-foreground">{empNo}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: "APPROVED_ON",
      header: "Actioned On",
      enableSorting: false,
      cell: ({ row }) => {
        const status     = row.original.STATUS;
        const actionedOn = row.getValue("APPROVED_ON");
        if ((status !== "APPROVED" && status !== "REJECTED") || !actionedOn)
          return <span className="text-muted-foreground">—</span>;
        return <div className="text-sm text-muted-foreground">{fmtDateTime(actionedOn)}</div>;
      },
    },
    {
      accessorKey: "CREATED_DATE",
      header: ({ column }) => <SortHeader column={column}>Submitted On</SortHeader>,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{fmtDateTime(row.getValue("CREATED_DATE"))}</div>
      ),
    },
  );

  // ── Actions ────────────────────────────────────────────────────────────────
  if (isAdminOrHR || isSupervisor) {
    cols.push({
      id: "actions",
      header: "Actions",
      enableHiding:  false,
      enableSorting: false,
      cell: ({ row }) => {
        const corr = row.original;
        if (corr.STATUS !== "PENDING") return null;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm"
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onApprove(corr)} disabled={approvePending || rejectPending}>
              {approvePending ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">Approve</span>
            </Button>
            <Button variant="ghost" size="sm"
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onReject(corr)} disabled={approvePending || rejectPending}>
              {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">Reject</span>
            </Button>
          </div>
        );
      },
    });
  } else {
    cols.push({
      id: "actions",
      header: "Actions",
      enableHiding:  false,
      enableSorting: false,
      cell: ({ row }) => {
        const corr = row.original;
        if (corr.STATUS !== "PENDING") return null;
        return (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(corr)} disabled={deletePending}>
            {deletePending ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            <span className="sr-only">Cancel</span>
          </Button>
        );
      },
    });
  }

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceCorrectionList() {
  const { user }   = useAuth();
  const personId   = user?.employee_id;

  const isAdminOrHR  = user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.HR);
  const isSupervisor = !isAdminOrHR && user?.roles?.includes(ROLES.SUPERVISOR);
  const isEmployee   = !isAdminOrHR && !isSupervisor;

  // ── URL state ─────────────────────────────────────────────────────────────
  const [page,      setPage]      = useQueryState("page",      parseAsInteger.withDefault(1));
  const [limit,     setLimit]     = useQueryState("limit",     parseAsInteger.withDefault(20));
  const [fromDate,  setFromDate]  = useQueryState("fromDate",  parseAsString.withDefault(""));
  const [toDate,    setToDate]    = useQueryState("toDate",    parseAsString.withDefault(""));
  const [status,    setStatus]    = useQueryState("status",    parseAsString.withDefault(""));
  const [sortBy,    setSortBy]    = useQueryState("sortBy",    parseAsString.withDefault("CORRECTION_ID"));
  const [sortOrder, setSortOrder] = useQueryState("sortOrder", parseAsString.withDefault("DESC"));

  const [columnVisibility, setColumnVisibility] = useState({});
  const [isAddSheetOpen,   setIsAddSheetOpen]   = useState(false);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // ── Shared query params ───────────────────────────────────────────────────
  const queryParams = useMemo(() => ({
    page, limit, fromDate, toDate, status, sortBy, sortOrder,
  }), [page, limit, fromDate, toDate, status, sortBy, sortOrder]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const adminQuery      = useAllCorrections(queryParams);
  const supervisorQuery = useTeamCorrections(isSupervisor ? personId : null, queryParams);
  const employeeQuery   = useEmployeeCorrections(isEmployee ? personId : null, queryParams);

  const activeQuery = isAdminOrHR ? adminQuery : isSupervisor ? supervisorQuery : employeeQuery;
  const { isLoading, isError, error, refetch, isFetching } = activeQuery;

  const rows      = activeQuery.data?.data                   ?? [];
  const total     = activeQuery.data?.pagination?.total      ?? rows.length;
  const pageCount = activeQuery.data?.pagination?.totalPages ?? 1;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const approveMutation = useApproveCorrection();
  const rejectMutation  = useRejectCorrection();
  const deleteMutation  = useDeleteCorrection();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleApprove = async (corr) => {
    const confirmed = await showConfirmation({
      title:       "Approve Correction Request?",
      description: `Approve the attendance correction for ${corr.EMPLOYEE_NAME} on ${fmtDate(corr.CORRECTION_DATE)}? The attendance record will be updated and reclassified automatically.`,
      confirmText: "Yes, Approve",
      cancelText:  "Cancel",
      variant:     "default",
    });
    if (!confirmed) return;
    try {
      await approveMutation.mutateAsync({ id: corr.CORRECTION_ID, approverId: user?.employee_id ?? user?.id });
      toast.success("Correction approved and attendance updated.");
    } catch (e) { toast.error(e?.message || "Failed to approve."); }
  };

  const handleReject = async (corr) => {
    const confirmed = await showConfirmation({
      title:       "Reject Correction Request?",
      description: `Reject the attendance correction for ${corr.EMPLOYEE_NAME} on ${fmtDate(corr.CORRECTION_DATE)}? The employee will be notified.`,
      confirmText: "Yes, Reject",
      cancelText:  "Cancel",
      variant:     "destructive",
    });
    if (!confirmed) return;
    try {
      await rejectMutation.mutateAsync({ id: corr.CORRECTION_ID, approverId: user?.employee_id ?? user?.id });
      toast.success("Correction request rejected.");
    } catch (e) { toast.error(e?.message || "Failed to reject."); }
  };

  const handleDelete = async (corr) => {
    const confirmed = await showConfirmation({
      title:       "Cancel Correction Request?",
      description: `Cancel your correction request for ${fmtDate(corr.CORRECTION_DATE)}? Your supervisor will be notified.`,
      confirmText: "Yes, Cancel",
      cancelText:  "Keep It",
      variant:     "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(corr.CORRECTION_ID);
      toast.success("Correction request cancelled.");
    } catch (e) { toast.error(e?.message || "Failed to cancel."); }
  };

  const clearFilters     = () => { setFromDate(null); setToDate(null); setStatus(null); setPage(1); };
  const hasActiveFilters = fromDate || toDate || status;

  // ── Sorting ───────────────────────────────────────────────────────────────
  const sorting = useMemo(
    () => (sortBy ? [{ id: sortBy, desc: sortOrder === "DESC" }] : []),
    [sortBy, sortOrder],
  );

  const onSortingChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    if (next.length === 0) { setSortBy("CORRECTION_ID"); setSortOrder("DESC"); }
    else { setSortBy(SORT_COLUMN_MAP[next[0].id] ?? next[0].id); setSortOrder(next[0].desc ? "DESC" : "ASC"); setPage(1); }
  }, [sorting, setSortBy, setSortOrder, setPage]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const pagination = useMemo(() => ({ pageIndex: page - 1, pageSize: limit }), [page, limit]);

  const onPaginationChange = useCallback((updaterOrValue) => {
    const next = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
    setPage(next.pageIndex + 1); setLimit(next.pageSize);
  }, [pagination, setPage, setLimit]);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => buildColumns({
    isAdminOrHR, isSupervisor,
    onApprove:      handleApprove,
    onReject:       handleReject,
    onDelete:       handleDelete,
    approvePending: approveMutation.isPending,
    rejectPending:  rejectMutation.isPending,
    deletePending:  deleteMutation.isPending,
  }), [isAdminOrHR, isSupervisor, approveMutation.isPending, rejectMutation.isPending, deleteMutation.isPending]);

  // ── Table ─────────────────────────────────────────────────────────────────
  const table = useReactTable({
    data: rows, columns, pageCount,
    state:                    { pagination, columnVisibility, sorting },
    onPaginationChange, onSortingChange,
    onColumnVisibilityChange:  setColumnVisibility,
    getCoreRowModel:           getCoreRowModel(),
    getSortedRowModel:         getSortedRowModel(),
    manualPagination:          true,
    manualSorting:             true,
    manualFiltering:           true,
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div>
      <PageHeader />
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading correction requests...</p>
        </div>
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddSheetOpen(true)} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Correction Requests</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load correction requests."}</p>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
              {isFetching ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</> : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddSheetOpen(true)} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">

          {/* ── Filter Bar ────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              fromDate={fromDate} toDate={toDate}
              onChange={({ from, to }) => { setFromDate(from || null); setToDate(to || null); setPage(1); }}
              onClear={() => { setFromDate(null); setToDate(null); setPage(1); }}
            />
            <Select value={status || "all"} onValueChange={(v) => { setStatus(v === "all" ? null : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 border border-dashed text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                Reset <IconX className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* ── Toolbar ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isFetching ? "Loading..." : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} found`}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">Columns <ChevronDown className="ml-2 h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem key={col.id} className="capitalize"
                    checked={col.getIsVisible()} onCheckedChange={(v) => col.toggleVisibility(!!v)}>
                    {col.id.replace(/_/g, " ").toLowerCase()}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Table ─────────────────────────────────────────────────────── */}
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
                {rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><ClipboardEdit /></EmptyMedia>
                          <EmptyTitle>No Correction Requests Found</EmptyTitle>
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

      {isAddSheetOpen && (
        <AddCorrectionRequestSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ onAdd, onRefetch, isFetching }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Attendance Corrections</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Attendance Management</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground/80">Attendance Corrections</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button variant="outline" size="icon" onClick={onRefetch} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd}>
              <IconCircleDashedPlus className="mr-2 h-4 w-4" />
              Request Correction
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}