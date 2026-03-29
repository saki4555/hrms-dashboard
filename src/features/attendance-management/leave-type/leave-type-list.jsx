import { useState } from "react";
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Trash2, AlertCircle, RefreshCw, CalendarDays } from "lucide-react";
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

import { useLeaveTypes, useDeleteLeaveType } from "./queries";
import AddLeaveTypeDialog from "./add-leave-type-dialog";
import UpdateLeaveTypeDialog from "./update-leave-type-dialog";

export default function LeaveTypeList() {
  const [sorting, setSorting]               = useState([]);
  const [columnFilters, setColumnFilters]   = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection]     = useState({});
  const [globalFilter, setGlobalFilter]     = useState("");
  const [isAddOpen, setIsAddOpen]           = useState(false);
  const [isUpdateOpen, setIsUpdateOpen]     = useState(false);
  const [selected, setSelected]             = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const { data: leaveTypes = [], isLoading, isError, error, refetch, isFetching } = useLeaveTypes();
  const deleteMutation = useDeleteLeaveType();

  const handleEdit = (leaveType) => {
    setSelected(leaveType);
    setIsUpdateOpen(true);
  };

  const handleDelete = async (leaveType) => {
    const confirmed = await showConfirmation({
      title: "Delete leave type?",
      description: `Are you sure you want to delete "${leaveType.NAME}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(leaveType.LEAVE_TYPE_ID);
      toast.success("Leave type deleted successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to delete leave type.");
    }
  };

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
      accessorKey: "CODE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Code" />,
      cell: ({ row }) => (
        <div className="font-mono font-medium ps-2">{row.getValue("CODE")}</div>
      ),
    },
    {
      accessorKey: "NAME",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="ps-2">{row.getValue("NAME")}</div>,
    },
    {
      accessorKey: "ACCRUAL_POLICY",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Accrual Policy" />,
      cell: ({ row }) => (
        <div className="ps-2">
          {row.getValue("ACCRUAL_POLICY")
            ? <Badge variant="outline">{row.getValue("ACCRUAL_POLICY")}</Badge>
            : <span className="text-muted-foreground text-sm">—</span>}
        </div>
      ),
    },
    {
      accessorKey: "MAX_BALANCE",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Max Balance" />,
      cell: ({ row }) => (
        <div className="ps-2 font-light">
          {row.getValue("MAX_BALANCE") != null
            ? `${row.getValue("MAX_BALANCE")} days`
            : <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const leaveType = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(leaveType)}>
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(leaveType)}
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
    data: leaveTypes,
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

  /* Loading */
  if (isLoading) return (
    <div>
      <PageHeader disabled />
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading leave types...</p>
        </div>
      </div>
    </div>
  );

  /* Error */
  if (isError) return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddOpen(true)} />
      <div className="bg-card rounded-md shadow-sm p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Leave Types</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-2">
            <p>{error?.message || "Failed to load leave types."}</p>
            <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
              {isFetching ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</> : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );

  /* Main */
  return (
    <div>
      <PageHeader onRefetch={refetch} isFetching={isFetching} onAdd={() => setIsAddOpen(true)} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search leave types..." />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                          <EmptyTitle>No Leave Types Found</EmptyTitle>
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
        <AddLeaveTypeDialog open={isAddOpen} onOpenChange={setIsAddOpen} showConfirmation={showConfirmation} />
      )}
      {isUpdateOpen && (
        <UpdateLeaveTypeDialog
          open={isUpdateOpen} onOpenChange={setIsUpdateOpen}
          showConfirmation={showConfirmation} leaveType={selected}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}

/* Page Header */
function PageHeader({ isFetching, onRefetch, onAdd, disabled }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Leave Types</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>Work Structure</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Leave Types</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {onRefetch && (
            <Button variant="outline" size="icon" onClick={onRefetch} disabled={isFetching || disabled}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button onClick={onAdd} disabled={disabled}>
            <IconPlus className="mr-1" size={18} />
            Add Leave Type
          </Button>
        </div>
      </div>
    </div>
  );
}
