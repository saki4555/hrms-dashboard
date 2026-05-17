// src/features/payroll/payroll-run-list.jsx
import { useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Lock,
  FileSpreadsheet,
  CpuIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

import { cn } from "@/lib/utils";
import { usePayrollRuns, useProcessPayrollRun, useApprovePayrollRun } from "./queries";
import CreateRunDialog from "./create-run-dialog";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: Clock,
    class: "bg-muted text-muted-foreground border-border",
  },
  PROCESSED: {
    label: "Processed",
    icon: CpuIcon,
    class: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    class: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    class: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmtDate = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "—"; }
};

const fmtCurrency = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const fmtMonth = (ym) => {
  if (!ym) return "—";
  try {
    const [y, m] = ym.split("-");
    return format(new Date(Number(y), Number(m) - 1, 1), "MMMM yyyy");
  } catch { return ym; }
};

// ─────────────────────────────────────────────────────────────────────────────
//  STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
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

function SummaryCards({ runs }) {
  const total     = runs.length;
  const draft     = runs.filter((r) => r.STATUS === "DRAFT").length;
  const processed = runs.filter((r) => r.STATUS === "PROCESSED").length;
  const approved  = runs.filter((r) => r.STATUS === "APPROVED").length;

  const cards = [
    { label: "Total Runs",  value: total,     icon: FileSpreadsheet, color: "text-foreground",       bg: "bg-muted/50" },
    { label: "Draft",       value: draft,     icon: Clock,           color: "text-muted-foreground", bg: "bg-muted/50" },
    { label: "Processed",   value: processed, icon: CpuIcon,         color: "text-blue-600",         bg: "bg-blue-500/10" },
    { label: "Approved",    value: approved,  icon: CheckCircle2,    color: "text-green-600",        bg: "bg-green-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-xl font-bold", color)}>{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PayrollRunList() {
  const [createOpen, setCreateOpen]               = useState(false);
  const [sorting, setSorting]                     = useState([]);
  const [columnFilters, setColumnFilters]         = useState([]);
  const [columnVisibility, setColumnVisibility]   = useState({});
  const [rowSelection, setRowSelection]           = useState({});
  const [globalFilter, setGlobalFilter]           = useState("");

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const { data: runs = [], isLoading, isError, error, refetch, isFetching } = usePayrollRuns();
  const { mutate: processRun, isPending: isProcessing } = useProcessPayrollRun();
  const { mutate: approveRun, isPending: isApproving }  = useApprovePayrollRun();

  const handleProcess = async (run) => {
    const month = fmtMonth(run.RUN_MONTH);
    const isReprocess = run.STATUS === "PROCESSED";

    const confirmed = await showConfirmation({
      title:       `${isReprocess ? "Re-process" : "Process"} Payroll — ${month}`,
      description: isReprocess
        ? "This will recalculate salaries for all active employees. Any previously calculated payslips for this run will be overwritten."
        : "This will calculate salaries for all active employees based on attendance and their pay structure.",
      confirmText: isReprocess ? "Yes, Re-process" : "Yes, Process",
      cancelText:  "Cancel",
      variant:     "destructive",
    });

    if (!confirmed) return;

    processRun(run.PAYROLL_ID, {
      onSuccess: (data) => toast.success(
        `Payroll for ${month} processed — ${data.employees_processed} employees calculated.`
      ),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleApprove = async (run) => {
    const month = fmtMonth(run.RUN_MONTH);

    const confirmed = await showConfirmation({
      title:       `Approve Payroll — ${month}`,
      description: "This will lock and finalize the payroll run. Once approved, payslips will be visible to employees and the run cannot be re-processed.",
      confirmText: "Yes, Approve & Lock",
      cancelText:  "Cancel",
      variant:     "destructive",
    });

    if (!confirmed) return;

    approveRun(run.PAYROLL_ID, {
      onSuccess: () => toast.success(`Payroll for ${month} has been approved and locked.`),
      onError:   (err) => toast.error(err.message),
    });
  };

  const columns = [
    {
      accessorKey: "RUN_MONTH",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Month" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{fmtMonth(row.getValue("RUN_MONTH"))}</span>
      ),
    },
    {
      accessorKey: "STATUS",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue("STATUS")} />,
    },
    {
      accessorKey: "TOTAL_GROSS",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Gross (BDT)" className="text-right justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {fmtCurrency(row.getValue("TOTAL_GROSS"))}
        </div>
      ),
    },
    {
      accessorKey: "TOTAL_NET",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Net (BDT)" className="text-right justify-end" />
      ),
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {fmtCurrency(row.getValue("TOTAL_NET"))}
        </div>
      ),
    },
    {
      accessorKey: "RUN_DATE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Run Date" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {fmtDate(row.getValue("RUN_DATE"))}
        </span>
      ),
    },
    {
      accessorKey: "RUN_BY",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Run By" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("RUN_BY") ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const run = row.original;
        return (
          <div className="flex items-center justify-end gap-2">

            {/* Process — DRAFT only */}
            {run.STATUS === "DRAFT" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => handleProcess(run)}
                    disabled={isProcessing}
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Process
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Calculate salaries for all employees</TooltipContent>
              </Tooltip>
            )}

            {/* Re-process — PROCESSED only */}
            {run.STATUS === "PROCESSED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-muted-foreground"
                    onClick={() => handleProcess(run)}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-process
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Recalculate salaries (overwrites existing)</TooltipContent>
              </Tooltip>
            )}

            {/* Approve — PROCESSED only */}
            {run.STATUS === "PROCESSED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleApprove(run)}
                    disabled={isApproving}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lock and finalize this payroll run</TooltipContent>
              </Tooltip>
            )}

            {/* View sheet — PROCESSED or APPROVED */}
            {(run.STATUS === "PROCESSED" || run.STATUS === "APPROVED") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    asChild
                  >
                    <Link to={`/payroll/runs/${run.PAYROLL_ID}/salary-sheet`}>
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Sheet
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View salary sheet</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: runs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div>
        <PageHeader onCreateClick={() => setCreateOpen(true)} />
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading payroll runs...</p>
          </div>
        </div>
      </div>
    );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError)
    return (
      <div>
        <PageHeader onCreateClick={() => setCreateOpen(true)} onRefetch={refetch} isFetching={isFetching} />
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Payroll Runs</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load payroll data."}</p>
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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader onCreateClick={() => setCreateOpen(true)} onRefetch={refetch} isFetching={isFetching} />

      <SummaryCards runs={runs} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search payroll runs..." />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileSpreadsheet className="h-10 w-10 opacity-30" />
                        <p className="font-medium">No payroll runs yet</p>
                        <p className="text-xs">Create your first run to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination table={table} />
        </div>
      </div>

      {createOpen && (
        <CreateRunDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
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

function PageHeader({ onCreateClick, onRefetch, isFetching }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Payroll Runs</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Payroll</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Payroll Runs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button variant="outline" onClick={onRefetch} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              <span className="sr-only">Refresh data</span>
            </Button>
          )}
          <Button onClick={onCreateClick}>
            <Plus className="h-4 w-4" />
            New Run
          </Button>
        </div>
      </div>
    </div>
  );
}