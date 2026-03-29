import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Trash2,
  AlertCircle,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconCircleDashedPlus, IconEdit, IconPlus } from "@tabler/icons-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useLeaveRequests, useDeleteLeaveRequest } from "./queries";
import AddLeaveRequestSheet from "./add-leave-request-sheet";
import UpdateLeaveRequestSheet from "./update-leave-request-sheet";

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  PENDING:   "warning",
  APPROVED:  "success",
  REJECTED:  "destructive",
  CANCELLED: "secondary",
};

function StatusBadge({ status }) {
  return (
    <Badge variant={STATUS_VARIANT[status] || "outline"}>
      {status || "N/A"}
    </Badge>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LeaveRequestList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: leaveData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useLeaveRequests();

  const deleteMutation = useDeleteLeaveRequest();

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setIsUpdateSheetOpen(true);
  };

  const handleDelete = async (leave) => {
    const confirmed = await showConfirmation({
      title: "Delete leave request?",
      description: `Are you sure you want to delete Leave #${leave.LEAVE_ID}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(leave.LEAVE_ID);
        toast.success("Leave request deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete leave request. Please try again.");
      }
    }
  };

  const columns = [
    // ── Select ──────────────────────────────────────────────────────────────
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // ── Leave ID ─────────────────────────────────────────────────────────────
    {
      accessorKey: "LEAVE_ID",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Leave ID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-muted-foreground">
          {row.getValue("LEAVE_ID")}
        </div>
      ),
    },

    // ── Employee Name + EMP_NO ───────────────────────────────────────────────
    {
      accessorKey: "EMPLOYEE_NAME",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const name  = row.getValue("EMPLOYEE_NAME");
        const empNo = row.original.EMP_NO;
        return (
          <div>
            <div className="font-medium">{name || "—"}</div>
            {empNo && (
              <div className="text-xs text-muted-foreground">{empNo}</div>
            )}
          </div>
        );
      },
    },

    // ── Leave Code (separate column) ─────────────────────────────────────────
    {
      accessorKey: "LEAVE_TYPE_CODE",
      header: "Code",
      cell: ({ row }) => {
        const code = row.getValue("LEAVE_TYPE_CODE");
        return code
          ? <Badge variant="outline" className="font-mono text-xs">{code}</Badge>
          : <span className="text-muted-foreground">—</span>;
      },
    },

    // ── Leave Name (separate column) ─────────────────────────────────────────
    {
      accessorKey: "LEAVE_TYPE_NAME",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Leave Type <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{row.getValue("LEAVE_TYPE_NAME") || "—"}</div>
      ),
    },

    // ── Start Date ───────────────────────────────────────────────────────────
    {
      accessorKey: "START_DATE",
      header: "Start Date",
      cell: ({ row }) => {
        const val = row.getValue("START_DATE");
        return <div>{val ? format(new Date(val), "dd MMM yyyy") : "N/A"}</div>;
      },
    },

    // ── End Date ─────────────────────────────────────────────────────────────
    {
      accessorKey: "END_DATE",
      header: "End Date",
      cell: ({ row }) => {
        const val = row.getValue("END_DATE");
        return <div>{val ? format(new Date(val), "dd MMM yyyy") : "N/A"}</div>;
      },
    },

    // ── Days ─────────────────────────────────────────────────────────────────
    {
      accessorKey: "DAYS",
      header: "Days",
      cell: ({ row }) => {
        const days = row.getValue("DAYS");
        return (
          <div className="font-medium">
            {days != null ? `${days}d` : "N/A"}
          </div>
        );
      },
    },

    // ── Reason ───────────────────────────────────────────────────────────────
    {
      accessorKey: "REASON",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-muted-foreground text-sm">
          {row.getValue("REASON") || "—"}
        </div>
      ),
    },

    // ── Status ───────────────────────────────────────────────────────────────
    {
      accessorKey: "STATUS",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("STATUS")} />,
    },

    // ── Applied On ───────────────────────────────────────────────────────────
    {
      accessorKey: "APPLIED_ON",
      header: "Applied On",
      cell: ({ row }) => {
        const val = row.getValue("APPLIED_ON");
        return (
          <div className="text-muted-foreground text-sm">
            {val ? format(new Date(val), "dd MMM yyyy") : "N/A"}
          </div>
        );
      },
    },

    // ── Actions ──────────────────────────────────────────────────────────────
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const leave = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(leave)}
            >
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(leave)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: leaveData,
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Leave Requests</h1>
            <Button disabled><IconPlus size={20} className="mr-2" />Apply Leave</Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading leave requests...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Leave Requests</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconPlus size={20} className="mr-2" />Apply Leave
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Leave Requests</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load leave requests. Please try again."}</p>
              <Button
                variant="outline" size="sm"
                onClick={() => refetch()} disabled={isFetching}
                className="w-fit"
              >
                {isFetching
                  ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                  : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Leave Requests</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Leave Management</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/80">
                    Leave Requests
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh data</span>
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus />
              Apply Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by employee, leave type, status..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {col.id.replace(/_/g, " ").toLowerCase()}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><CalendarDays /></EmptyMedia>
                          <EmptyTitle>No Leave Requests Found</EmptyTitle>
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

      {/* Sheets */}
      {isAddSheetOpen && (
        <AddLeaveRequestSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateSheetOpen && (
        <UpdateLeaveRequestSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          leaveRequest={selectedLeave}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}