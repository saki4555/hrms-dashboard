import {  useState } from "react";
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
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  Building2Icon,
} from "lucide-react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useDeleteOrganization, useOrganizations } from "../queries";
import { Spinner } from "@/components/ui/spinner";
import UpdateOrganizationDialog from "./update-organization-dialog";
import AddOrganizationDialog from "./AddOrganizationDialog";
import { IconPlus } from "@tabler/icons-react";
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

export default function OrganizationList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: organizationData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useOrganizations();

  const deleteOrganizationMutation = useDeleteOrganization();

  console.log("Organization data:", organizationData);

  // Get unique organization types from the data
  const organizationTypes = Array.from(
    new Map(
      organizationData
        .filter((org) => org.ORG_TYPE && org.ORG_TYPE_ID)
        .map((org) => [
          org.ORG_TYPE_ID,
          { id: org.ORG_TYPE_ID, name: org.ORG_TYPE },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleEdit = (organization) => {
    console.log("Edit organization:", organization);
    setSelectedOrganization(organization);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = async (organization) => {
    const confirmed = await showConfirmation({
      title: "Delete organization?",
      description: `Are you sure you want to delete "${organization.NAME}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteOrganizationMutation.mutateAsync(organization.ID);
        console.log("Organization deleted successfully:", organization);
        toast.success("Organization deleted successfully!");
      } catch (error) {
        console.error("Error deleting organization:", error);
        toast.error(
          error?.message || "Failed to delete organization. Please try again.",
        );
      }
    }
  };

  const handleRefetch = () => {
    refetch();
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
      accessorKey: "NAME",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Organization Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("NAME")}</div>
      ),
    },
    {
      accessorKey: "ORG_TYPE",
      header: "Type",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("ORG_TYPE") || "N/A"}</div>
      ),
      filterFn: (row, id, value) => {
        return value === "all" || row.original.ORG_TYPE_ID === value;
      },
    },
    {
      accessorKey: "PARENT_ORG_NAME",
      header: "Parent Organization",
      cell: ({ row }) => <div>{row.getValue("PARENT_ORG_NAME") || "N/A"}</div>,
    },
    {
      accessorKey: "COST_CENTER_NAME",
      header: "Cost Center",
      cell: ({ row }) => <div>{row.getValue("COST_CENTER_NAME") || "N/A"}</div>,
    },
    {
      accessorKey: "LOCATION",
      header: "Location",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("LOCATION") || "N/A"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const organization = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(organization)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(organization)}
              disabled={deleteOrganizationMutation.isPending}
            >
              {deleteOrganizationMutation.isPending ? (
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
    data: organizationData,
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
      <div className="">
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Organization</h1>
              <p className="text-muted-foreground mt-1">
                Manage organization information and records
              </p>
            </div>
            <Button disabled>
              <IconPlus size={20} className="mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4 ">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="">
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Organization</h1>
              <p className="text-muted-foreground mt-1">
                Manage organization information and records
              </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus size={20} className="mr-2" />
              Add Organization
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4 ">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Organizations</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>
                {error?.message ||
                  "Failed to load organizations. Please try again."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefetch}
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
    <div className="">
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
           
           

            <h1 className="text-lg md:text-2xl font-semibold tracking-tight ">
              Organization
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
                  <BreadcrumbPage>Organization</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* <p className="text-sm text-muted-foreground leading-snug">
        Manage organization information and records
      </p> */}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefetch}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />

              <span className="sr-only">Refresh data</span>
            </Button>

            {/* 1. Icon size 16: Matches text-sm font size perfectly. 
           Anything larger (like 20) makes the button look "top-heavy."
      */}
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus />
              Add Organization
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-sm p-4 ">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search organizations..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />

            <Select
              value={
                table.getColumn("ORG_TYPE")?.getFilterValue()?.toString() ||
                "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("ORG_TYPE")
                  ?.setFilterValue(value === "all" ? undefined : Number(value))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Organization Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {organizationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id.replace(/_/g, " ")}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-12 px-4 font-medium"
                      >
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
                        <TableCell key={cell.id} className="h-16 px-4">
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
                            <Building2Icon />
                          </EmptyMedia>
                          <EmptyTitle>No Organizations Found</EmptyTitle>
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

      {
        isAddDialogOpen && <AddOrganizationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        showConfirmation={showConfirmation}
      />
      }
      
      
     {
      isUpdateDialogOpen &&  <UpdateOrganizationDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        showConfirmation={showConfirmation}
        organization={selectedOrganization}
      />
     }
     
      <ConfirmationDialog />
    </div>
  );
}
