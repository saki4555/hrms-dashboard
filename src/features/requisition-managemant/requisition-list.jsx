import { useState } from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import {
  Trash2, AlertCircle, RefreshCw, ClipboardList,
  CheckCircle, Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

import {
  useRequisitions,
  useDeleteRequisition,
  useApproveDetail,
  useDispatchDetail,
} from "./queries";
import AddRequisitionDialog from "./add-requisition-dialog";
import UpdateRequisitionDialog from "./update-requisition-dialog";

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_MAP = {
  0: { label: "Pending",    variant: "secondary"    },
  1: { label: "Approved",   variant: "outline"      },
  2: { label: "Dispatched", variant: "default"      },
};

export default function RequisitionList() {
  const [sorting, setSorting]                   = useState([]);
  const [columnFilters, setColumnFilters]       = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]         = useState({});
  const [globalFilter, setGlobalFilter]         = useState("");
  const [isAddOpen, setIsAddOpen]               = useState(false);
  const [isUpdateOpen, setIsUpdateOpen]         = useState(false);
  const [selected, setSelected]                 = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: requisitions = [],
    isLoading, isError, error, refetch, isFetching,
  } = useRequisitions();

  const deleteMutation   = useDeleteRequisition();
  const approveMutation  = useApproveDetail();
  const dispatchMutation = useDispatchDetail();

  const handleEdit = (req) => {
    setSelected(req);
    setIsUpdateOpen(true);
  };

  const handleDelete = async (req) => {
    const confirmed = await showConfirmation({
      title: "Delete requisition?",
      description: `Are you sure you want to delete requisition #${req.TID}? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(req.TID);
      toast.success("Requisition deleted successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to delete requisition.");
    }
  };

  const handleApprove = async (req) => {
    const confirmed = await showConfirmation({
      title: "Approve requisition?",
      description: `Approve requisition #${req.TID}? Status will change to Approved.`,
      confirmText: "Approve",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await approveMutation.mutateAsync(req.TID);
      toast.success("Requisition approved!");
    } catch (err) {
      toast.error(err?.message || "Failed to approve.");
    }
  };

  const handleDispatch = async (req) => {
    const confirmed = await showConfirmation({
      title: "Dispatch requisition?",
      description: `Dispatch requisition #${req.TID}? Stock will be transferred automatically.`,
      confirmText: "Dispatch",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await dispatchMutation.mutateAsync(req.TID);
      toast.success("Dispatched! Stock updated via Oracle trigger.");
    } catch (err) {
      toast.error(err?.message || "Failed to dispatch.");
    }
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
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
      enableHiding: false,
    },
    {
      accessorKey: "TID",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="TID" />,
      cell: ({ row }) => (
        <div className="font-mono font-medium ps-2">{row.getValue("TID")}</div>
      ),
    },
    {
      accessorKey: "TDATE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <div className="ps-2">
          {row.getValue("TDATE")
            ? new Date(row.getValue("TDATE")).toLocaleDateString()
            : <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      accessorKey: "CHALLAN_NO",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Challan No" />,
      cell: ({ row }) => (
        <div className="ps-2">
          {row.getValue("CHALLAN_NO") || <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      accessorKey: "STORE_ID",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="From Store" />,
      cell: ({ row }) => <div className="ps-2">{row.getValue("STORE_ID")}</div>,
    },
    {
      accessorKey: "STORE_ID_TO",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="To Store" />,
      cell: ({ row }) => <div className="ps-2">{row.getValue("STORE_ID_TO")}</div>,
    },
    {
      accessorKey: "VEHICLE_NO",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Vehicle" />,
      cell: ({ row }) => (
        <div className="ps-2">
          {row.getValue("VEHICLE_NO") || <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      accessorKey: "STATUS",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const s = STATUS_MAP[row.getValue("STATUS")] ?? { label: "Unknown", variant: "secondary" };
        return (
          <div className="ps-2">
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const req    = row.original;
        const status = req.STATUS ?? 0;
        return (
          <div className="flex items-center gap-1">
            {/* Edit */}
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => handleEdit(req)}
            >
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            {/* Approve — only when STATUS = 0 */}
            {status === 0 && (
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700"
                onClick={() => handleApprove(req)}
                disabled={approveMutation.isPending}
                title="Approve"
              >
                {approveMutation.isPending
                  ? <Spinner data-icon="inline-start" />
                  : <CheckCircle className="h-4 w-4" />}
                <span className="sr-only">Approve</span>
              </Button>
            )}

            {/* Dispatch — only when STATUS = 1 */}
            {status === 1 && (
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700"
                onClick={() => handleDispatch(req)}
                disabled={dispatchMutation.isPending}
                title="Dispatch"
              >
                {dispatchMutation.isPending
                  ? <Spinner data-icon="inline-start" />
                  : <Truck className="h-4 w-4" />}
                <span className="sr-only">Dispatch</span>
              </Button>
            )}

            {/* Delete */}
            <Button
              variant="ghost" size="icon"
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

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div>
      <PageHeader disabled />
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading requisitions...</p>
        </div>
      </div>
    </div>
  );

  // ─── Error ────────────────────────────────────────────────────────────────
  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddOpen(true)} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Requisitions</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load requisitions."}</p>
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

  // ─── Main ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        onRefetch={refetch}
        isFetching={isFetching}
        onAdd={() => setIsAddOpen(true)}
      />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search requisitions..." />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
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
                          <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
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

      {isAddOpen && (
        <AddRequisitionDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateOpen && (
        <UpdateRequisitionDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          showConfirmation={showConfirmation}
          requisition={selected}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}

// ─── Page Header ───────────────────────────────────────────────────────────
function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
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
              <BreadcrumbItem>Store Management</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Requisitions</BreadcrumbPage>
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
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button onClick={onAdd} disabled={disabled}>
            <IconPlus className="mr-1" size={18} />
            Add Requisition
          </Button>
        </div>
      </div>
    </div>
  );
}