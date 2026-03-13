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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconEdit, IconPlus } from "@tabler/icons-react";
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
import { Badge } from "@/components/ui/badge";

import { useHolidays, useDeleteHoliday } from "./queries";
import AddHolidayDialog from "./add-holiday-dialog";
import UpdateHolidayDialog from "./update-holiday-dialog";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy");
  } catch {
    return "Invalid date";
  }
};

export default function HolidayList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: holidaysData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useHolidays();

  const deleteHolidayMutation = useDeleteHoliday();

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (holiday) => {
    const label = holiday.DESCRIPTION || formatDate(holiday.TDATE);
    const confirmed = await showConfirmation({
      title: "Delete holiday?",
      description: `Are you sure you want to delete "${label}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteHolidayMutation.mutateAsync(holiday.ID);
        toast.success("Holiday deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete holiday. Please try again.");
      }
    }
  };

  const columns = [
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
    {
      accessorKey: "LOCATION_NAME",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => (
        <div className="font-medium ps-2">{row.getValue("LOCATION_NAME") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "TDATE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Holiday Date" />
      ),
      cell: ({ row }) => (
        <div className="ps-2 font-light">{formatDate(row.getValue("TDATE"))}</div>
      ),
    },
    {
      accessorKey: "HOLIDAY_TYPE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Holiday Type" />
      ),
      cell: ({ row }) => (
        <div className="ps-2">
          <Badge variant="secondary">{row.getValue("HOLIDAY_TYPE") || "N/A"}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "DESCRIPTION",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <div className="ps-2 font-light text-muted-foreground">
          {row.getValue("DESCRIPTION") || "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const holiday = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(holiday)}
            >
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(holiday)}
              disabled={deleteHolidayMutation.isPending}
            >
              {deleteHolidayMutation.isPending ? (
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
    data: holidaysData,
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

  /* ─── Loading State ───────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Holiday Calendar</h1>
            </div>
            <Button disabled>
              <IconPlus />
              Add Holiday
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading holidays...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error State ─────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Holiday Calendar</h1>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Holiday
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Holidays</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load holidays. Please try again."}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
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
  }

  /* ─── Main View ───────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Holiday Calendar</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Work Structure</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Holiday Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh data</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Holiday
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder="Search holidays..."
          />

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
                          <EmptyMedia variant="icon">
                            <CalendarDays />
                          </EmptyMedia>
                          <EmptyTitle>No Holidays Found</EmptyTitle>
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

      {isAddDialogOpen && (
        <AddHolidayDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {isUpdateDialogOpen && (
        <UpdateHolidayDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          holiday={selectedHoliday}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}