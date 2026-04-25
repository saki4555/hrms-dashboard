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
  Package,
} from "lucide-react";
import { toast } from "sonner";
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
import { IconCircleDashedPlus, IconEdit } from "@tabler/icons-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useItems, useDeleteItem } from "./queries";
import AddItemSheet from "./add-item-sheet";
import UpdateItemSheet from "./update-item-sheet";

export default function ItemList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useItems();
  const deleteMutation = useDeleteItem();

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsUpdateSheetOpen(true);
  };

  const handleDelete = async (item) => {
    const confirmed = await showConfirmation({
      title: "Delete item?",
      description: `Are you sure you want to delete "${item.NAME}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(item.ITEM_ID);
        toast.success("Item deleted successfully!");
      } catch (err) {
        toast.error(err?.message || "Failed to delete item. Please try again.");
      }
    }
  };

  const columns = [
    // Select
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

    // Item ID
    // {
    //   accessorKey: "ITEM_ID",
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    //       Item ID <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => (
    //     <div className="font-medium text-muted-foreground">{row.getValue("ITEM_ID")}</div>
    //   ),
    // },

    // Name + Model
    {
      accessorKey: "NAME",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("NAME") || "—"}</div>
          {row.original.MODEL && (
            <div className="text-xs text-muted-foreground">{row.original.MODEL}</div>
          )}
        </div>
      ),
    },

    // Description
    {
      accessorKey: "TYPE_NAME",
      header: "Type Name",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-muted-foreground text-sm">
          {row.getValue("TYPE_NAME") || "—"}
        </div>
      ),
    },
     {
      accessorKey: "MIN_LEVEL",
      header: "Min Level",
      cell: ({ row }) => <div>{row.getValue("MIN_LEVEL") ?? "—"}</div>,
    },

    // Brand
    // {
    //   accessorKey: "BRAND_ID",
    //   header: "Brand",
    //   cell: ({ row }) => (
    //     <Badge variant="outline" className="font-mono text-xs">
    //       {row.getValue("BRAND_ID") || "—"}
    //     </Badge>
    //   ),
    // },

    // Category
    // {
    //   accessorKey: "CATEGORY_ID",
    //   header: "Category",
    //   cell: ({ row }) => <div>{row.getValue("CATEGORY_ID") ?? "—"}</div>,
    // },

    // Price
    // {
    //   accessorKey: "PRICE",
    //   header: "Price",
    //   cell: ({ row }) => {
    //     const p = row.getValue("PRICE");
    //     return <div className="font-medium">{p != null ? Number(p).toFixed(2) : "—"}</div>;
    //   },
    // },

    // Unit
    {
      accessorKey: "UNIT",
      header: "Unit",
      cell: ({ row }) => <div>{row.getValue("UNIT") || "—"}</div>,
    },

    // Min Level
    {
      accessorKey: "MIN_LEVEL",
      header: "Min Level",
      cell: ({ row }) => <div>{row.getValue("MIN_LEVEL") ?? "—"}</div>,
    },

    // Status
    {
      accessorKey: "STATUS",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("STATUS") === 1 ? "success" : "secondary"}>
          {row.getValue("STATUS") === 1 ? "Active" : "Inactive"}
        </Badge>
      ),
    },

    // Actions
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(item)}
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
    data: items,
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

  // Loading
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Items</h1>
            <Button disabled><IconCircleDashedPlus className="mr-1" />Add Item</Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Items</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <IconCircleDashedPlus className="mr-1" />Add Item
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Items</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load items."}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="w-fit">
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

  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Items</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Inventory</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/80">Items</BreadcrumbPage>
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
              <IconCircleDashedPlus className="mr-1" />Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by name, brand, description..."
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
                {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
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
                          <EmptyMedia variant="icon"><Package /></EmptyMedia>
                          <EmptyTitle>No Items Found</EmptyTitle>
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
        <AddItemSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}
      {isUpdateSheetOpen && (
        <UpdateItemSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          item={selectedItem}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}