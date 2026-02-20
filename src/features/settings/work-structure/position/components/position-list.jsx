import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  BriefcaseIcon,
} from "lucide-react";
import { toast } from "sonner";

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
import AddPositionDialog from "./AddPositionDialog";

import { IconPlus } from "@tabler/icons-react";
import { useDeletePosition, useOrgPositions } from "../queries";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import UpdatePositionDialog from "./update-position-dialog";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";
import { useOrgTypes } from "../../organization-types/queries";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";

export default function PositionList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: positionData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useOrgPositions();

  const {
    data: organizationTypes = [],
    isLoading: isLoadingOrganizaitonTypes,
  } = useOrgTypes();

  console.log("org - positionData ---------", positionData);
  console.log("organizationTypes ---------", organizationTypes);

  const deletePositionMutation = useDeletePosition();

  const handleEdit = (position) => {
    setSelectedPosition(position);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (position) => {
    const confirmed = await showConfirmation({
      title: "Delete position?",
      description: `Are you sure you want to delete this position assignment? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deletePositionMutation.mutateAsync(position.ID);
        toast.success("Position deleted successfully!");
      } catch (error) {
        toast.error(
          error?.message || "Failed to delete position. Please try again.",
        );
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
      accessorKey: "POSITION_TITLE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Grade" />
      ),
      cell: ({ row }) => (
        <div className="font-medium ps-2">
          {row.getValue("POSITION_TITLE") || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "ORG_NAME",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Organization"/>,
      cell: ({ row }) => <div className="ps-2">{row.getValue("ORG_NAME") || "N/A"}</div>,

      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "FTE",
     
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="FTE"/>,
      cell: ({ row }) => <div className="ps-2">{row.getValue("FTE") ?? "N/A"}</div>,
    },
    {
      accessorKey: "ACTUAL_COUNT",
      // header: "Actual Count",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Actual Count"/>,
      cell: ({ row }) => <div className="ps-2">{row.getValue("ACTUAL_COUNT") ?? 0}</div>,
    },
    {
      accessorKey: "GRADE",
      // header: "Grade",
      header: ({ column }) => <CustomDataTableColumnHeader column={column} title="Grade"/>,
      cell: ({ row }) => <div className="ps-2">{row.getValue("GRADE") || "N/A"}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const position = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(position)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(position)}
              disabled={deletePositionMutation.isPending}
            >
              {deletePositionMutation.isPending ? (
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
    data: positionData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
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

  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Positions</h1>
              <p className="text-muted-foreground mt-1">
                Manage position assignments and records
              </p>
            </div>
            <Button disabled>
              <IconPlus size={20} className="mr-2" />
              Add Position
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading positions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Positions</h1>
              <p className="text-muted-foreground mt-1">
                Manage position assignments and records
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus size={20} className="mr-2" />
              Add Position
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Positions</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>
                {error?.message ||
                  "Failed to load positions. Please try again."}
              </p>
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

  return (
    <div>
      <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Positions</h1>
            <p className="text-muted-foreground mt-1">
              Manage position assignments and records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus size={20} className="mr-2" />
              Add Position
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder="Search positions..."
            filters={[
              {
                columnId: "ORG_NAME",
                title: "Organization",
                options: Array.from(
                  new Map(
                    positionData
                      .filter((pos) => pos.ORG_NAME)
                      .map((pos) => [
                        pos.ORG_NAME,
                        { label: pos.ORG_NAME, value: pos.ORG_NAME },
                      ]),
                  ).values(),
                ),
              },
            ]}
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
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <BriefcaseIcon />
                          </EmptyMedia>
                          <EmptyTitle>No Positions Found</EmptyTitle>
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

      <AddPositionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        showConfirmation={showConfirmation}
      />

      <UpdatePositionDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        showConfirmation={showConfirmation}
        position={selectedPosition}
      />

      <ConfirmationDialog />
    </div>
  );
}
