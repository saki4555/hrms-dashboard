import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2, AlertCircle, RefreshCw, Globe } from "lucide-react";
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
import { Link } from "react-router";

import { useCountries, useDeleteCountry } from "./queries";
import AddCountryDialog from "./add-country-dialog";
import UpdateCountryDialog from "./update-country-dialog";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

export default function CountryList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: countriesData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCountries();

  const deleteCountryMutation = useDeleteCountry();

  const handleEdit = (country) => {
    setSelectedCountry(country);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (country) => {
    const confirmed = await showConfirmation({
      title: "Delete country?",
      description: `Are you sure you want to delete "${country.COUNTRY_NAME}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteCountryMutation.mutateAsync(country.COUNTRY_ID);
        toast.success("Country deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete country. Please try again.");
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
      accessorKey: "COUNTRY_NAME",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Country Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium ps-2">{row.getValue("COUNTRY_NAME")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const country = row.original;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(country)}
            >
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(country)}
              disabled={deleteCountryMutation.isPending}
            >
              {deleteCountryMutation.isPending ? (
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
    data: countriesData,
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

  // Loading State
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
                Countries
              </h1>
            </div>
            <Button disabled>
              <IconPlus />
              Add Country
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading countries...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
                Countries
              </h1>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Country
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Countries</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>
                {error?.message || "Failed to load countries. Please try again."}
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
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
              Countries
            </h1>
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
                  <BreadcrumbPage>Countries</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh data</span>
            </Button>

            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Country
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder="Search countries..."
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
                            <Globe />
                          </EmptyMedia>
                          <EmptyTitle>No Countries Found</EmptyTitle>
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
        <AddCountryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {isUpdateDialogOpen && (
        <UpdateCountryDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          showConfirmation={showConfirmation}
          country={selectedCountry}
        />
      )}

      <ConfirmationDialog />
    </div>
  );
}