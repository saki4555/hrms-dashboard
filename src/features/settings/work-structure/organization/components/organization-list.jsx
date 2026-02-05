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
  Building2,
  Pencil,
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import AddOrganizationDialog from "./AddOrganizationDialog";

import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useDeleteOrganization, useOrganizations } from "../queries";
import { Spinner } from "@/components/ui/spinner";
import UpdateOrganizationDialog from "./update-organization-dialog";

const ORGANIZATION_TYPES = [
  { id: 1, name: "Headquarters" },
  { id: 2, name: "Branch Office" },
  { id: 3, name: "Department" },
  { id: 4, name: "Division" },
  { id: 5, name: "Subsidiary" },
  { id: 6, name: "Regional Office" },
];

const getStatusLabel = (status) => {
  return status === 1 ? "Active" : "Inactive";
};

const getOrgTypeName = (id) => {
  const type = ORGANIZATION_TYPES.find((t) => t.id === id);
  return type ? type.name : "Unknown";
};

export default function OrganizationList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: organizationData = [],
    isLoading,
    isError,
  } = useOrganizations();
  const deleteOrganizationMutation = useDeleteOrganization();

  console.log("Organization data:", organizationData);

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
        toast.error("Failed to delete organization. Please try again.");
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
      accessorKey: "ORG_TYPE_ID",
      header: "Type",
      cell: ({ row }) => (
        <div className="capitalize">
          {getOrgTypeName(row.getValue("ORG_TYPE_ID"))}
        </div>
      ),
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
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
      accessorKey: "CREATED_DATE",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("CREATED_DATE");
        return <div>{date ? date : "N/A"}</div>;
      },
    },
    {
      accessorKey: "STATUS",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("STATUS");
        return (
          <Badge variant={status === 1 ? "success" : "destructive"}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="container mx-auto">
        {/* Data Table */}
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
          <div className="space-y-4">
            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search organizations..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
              />

              <Select
                value={
                  table
                    .getColumn("ORG_TYPE_ID")
                    ?.getFilterValue()
                    ?.toString() || "all"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("ORG_TYPE_ID")
                    ?.setFilterValue(
                      value === "all" ? undefined : Number(value),
                    )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Organization Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ORGANIZATION_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  table.getColumn("STATUS")?.getFilterValue()?.toString() ||
                  "all"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("STATUS")
                    ?.setFilterValue(
                      value === "all" ? undefined : Number(value),
                    )
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
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

            {/* Table */}
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
                        <div className="flex flex-col items-center justify-center py-8">
                          <Building2 className="w-12 h-12 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No organizations found
                          </p>
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
      </div>

      {/* Add Organization Dialog */}
      <AddOrganizationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        showConfirmation={showConfirmation}
      />

      {/* Update Organization Dialog */}
      <UpdateOrganizationDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        showConfirmation={showConfirmation}
        organization={selectedOrganization}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}