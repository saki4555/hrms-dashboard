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
  ArrowUpDown, ChevronDown, Trash2, AlertCircle, RefreshCw, ClipboardListIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { IconCircleDashedPlus, IconEdit } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { useRequisitions, useDeleteRequisition } from "./queries";
import AddRequisitionSheet from "./add-requisition-sheet";
import UpdateRequisitionSheet from "./update-requisition-sheet";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_MAP = {
  1: { label: "Pending",    variant: "outline",     className: "text-yellow-600 border-yellow-400" },
  2: { label: "Approved",   variant: "secondary",   className: "text-blue-600 border-blue-400" },
 
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: String(status), variant: "outline", className: "" };
  return (
    <Badge variant={s.variant} className={`text-xs ${s.className}`}>
      {s.label}
    </Badge>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RequisitionList() {
  const [sorting,          setSorting]          = useState([]);
  const [columnFilters,    setColumnFilters]    = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection,     setRowSelection]     = useState({});
  const [globalFilter,     setGlobalFilter]     = useState("");
  const [isAddSheetOpen,    setIsAddSheetOpen]    = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedReq,       setSelectedReq]       = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: requisitions = [],
    isLoading, isError, error, refetch, isFetching,
  } = useRequisitions();

  const deleteMutation = useDeleteRequisition();

  const handleEdit = (req) => {
    setSelectedReq(req);
    setIsUpdateSheetOpen(true);
  };

  const handleDelete = async (req) => {
    const confirmed = await showConfirmation({
      title: "Delete requisition?",
      description: `Are you sure you want to delete TID #${req.TID}? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(req.TID);
      toast.success("Requisition deleted successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to delete.");
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = [
    // Select
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
      enableHiding: false,
    },

    // TID
    {
      accessorKey: "TID",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          TID <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-muted-foreground">#{row.getValue("TID")}</div>
      ),
    },

    // Date
    {
      accessorKey: "TDATE",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const val = row.getValue("TDATE");
        return <div>{val ? format(new Date(val), "dd MMM yyyy") : "—"}</div>;
      },
    },

    // From Store
    {
      accessorKey: "STORE_NAME_FROM",
      header: "From Store",
      cell: ({ row }) => <div>{row.getValue("STORE_NAME_FROM") ?? "—"}</div>,
    },

    // To Store
    {
      accessorKey: "STORE_NAME_TO",
      header: "To Store",
      cell: ({ row }) => <div>{row.getValue("STORE_NAME_TO") ?? "—"}</div>,
    },

    // Challan No
    {
      accessorKey: "CHALLAN_NO",
      header: "Challan No",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.getValue("CHALLAN_NO") || "—"}
        </Badge>
      ),
    },

    // Vehicle No
    {
      accessorKey: "VEHICLE_NO",
      header: "Vehicle No",
      cell: ({ row }) => <div>{row.getValue("VEHICLE_NO") || "—"}</div>,
    },

    // Status
    {
      accessorKey: "STATUS",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("STATUS")} />,
    },

    // Entry Date
    {
      accessorKey: "ENTRY_DATE",
      header: "Entry Date",
      cell: ({ row }) => {
        const val = row.getValue("ENTRY_DATE");
        return <div className="text-muted-foreground text-xs">{val ? format(new Date(val), "dd MMM yyyy") : "—"}</div>;
      },
    },

    // Remarks
    {
      accessorKey: "REMARKS",
      header: "Remarks",
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate text-sm text-muted-foreground">
          {row.getValue("REMARKS") || "—"}
        </div>
      ),
    },

    // Actions
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(req)}
            >
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(req)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? <Spinner data-icon="inline-start" />
                : <Trash2 className="h-4 w-4" />}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: requisitions,
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Requisitions</h1>
            <Button disabled><IconCircleDashedPlus className="mr-1" />New Requisition</Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading requisitions...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Requisitions</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />New Requisition
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Requisitions</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load requisitions."}</p>
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

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Requisitions</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Inventory</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/80">Requisitions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />New Requisition
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by store, challan, vehicle..."
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
                {table.getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize"
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(!!v)}
                    >
                      {col.id.replace(/_/g, " ").toLowerCase()}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                          <EmptyMedia variant="icon"><ClipboardListIcon /></EmptyMedia>
                          <EmptyTitle>No Requisitions Found</EmptyTitle>
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
        <AddRequisitionSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateSheetOpen && (
        <UpdateRequisitionSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          requisition={selectedReq}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}
