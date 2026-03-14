import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

import { useContracts, useDeleteContract } from "./queries";
import AddContractSheet from "./add-contract-sheet";
import UpdateContractSheet from "./update-contract-sheet";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";

/* ─── Avatar helpers (same as employee list) ─────────────────────────────── */
const hashName = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const AVATAR_COLORS = [
  "bg-red-500",    "bg-orange-500", "bg-amber-500",
  "bg-green-500",  "bg-teal-500",   "bg-blue-500",
  "bg-indigo-500", "bg-violet-500", "bg-pink-500",
  "bg-rose-500",   "bg-cyan-500",   "bg-emerald-500",
];

/* ─── Formatters ─────────────────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "MMM dd, yyyy"); }
  catch { return "Invalid date"; }
};

const formatCurrency = (amount, currency = "BDT") => {
  if (amount == null || amount === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/* ─── Employee Cell ──────────────────────────────────────────────────────── */
function EmployeeCell({ contract }) {
  const fullName = [contract.TITLE, contract.FIRST_NAME, contract.LAST_NAME]
    .filter(Boolean)
    .join(" ") || `Employee #${contract.EMPLOYEE_ID}`;

  const initials = [contract.FIRST_NAME?.[0], contract.LAST_NAME?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "#";

  const avatarColor = AVATAR_COLORS[hashName(fullName) % AVATAR_COLORS.length];

  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn("text-xs font-semibold text-white", avatarColor)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        {/* Name */}
        <span className="font-medium leading-tight truncate">
          {contract.TITLE && (
            <span className="text-muted-foreground mr-1">{contract.TITLE}</span>
          )}
          {[contract.FIRST_NAME, contract.LAST_NAME].filter(Boolean).join(" ") || `Employee #${contract.EMPLOYEE_ID}`}
        </span>
        {/* Emp No */}
        {contract.EMP_NO && (
          <span className="text-xs text-muted-foreground">{contract.EMP_NO}</span>
        )}
        {/* Org + Position */}
        {(contract.ORG_NAME || contract.POSITION_TITLE) && (
          <span className="text-xs text-muted-foreground/70 truncate">
            {[contract.ORG_NAME, contract.POSITION_TITLE].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ContractList() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: contractsData = [],
    isLoading, isError, error, refetch, isFetching,
  } = useContracts();

  const deleteContractMutation = useDeleteContract();

  const handleEdit = (contract) => {
    setSelectedContract(contract);
    setIsUpdateSheetOpen(true);
  };

  const handleDelete = async (contract) => {
    const fullName = [contract.FIRST_NAME, contract.LAST_NAME].filter(Boolean).join(" ")
      || `Employee #${contract.EMPLOYEE_ID}`;
    const confirmed = await showConfirmation({
      title: "Delete contract?",
      description: `Are you sure you want to delete the contract for "${fullName}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (confirmed) {
      try {
        await deleteContractMutation.mutateAsync(contract.CONTRACT_ID);
        toast.success("Contract deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete contract. Please try again.");
      }
    }
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      id: "employee",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Employee" />
      ),
      accessorFn: (row) =>
        [row.TITLE, row.FIRST_NAME, row.LAST_NAME].filter(Boolean).join(" "),
      cell: ({ row }) => <EmployeeCell contract={row.original} />,
    },
    {
      accessorKey: "CONTRACT_TYPE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Contract Type" />
      ),
      cell: ({ row }) => (
        <div className="ps-2">
          {row.getValue("CONTRACT_TYPE")
            ? <Badge variant="secondary">{row.getValue("CONTRACT_TYPE")}</Badge>
            : <span className="text-muted-foreground text-sm">—</span>
          }
        </div>
      ),
    },
    {
      accessorKey: "START_DATE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => (
        <div className="ps-2 font-light">{formatDate(row.getValue("START_DATE"))}</div>
      ),
    },
    {
      accessorKey: "END_DATE",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => (
        <div className="ps-2 font-light">{formatDate(row.getValue("END_DATE"))}</div>
      ),
    },
    {
      accessorKey: "SALARY_AMOUNT",
      header: ({ column }) => (
        <CustomDataTableColumnHeader column={column} title="Salary" />
      ),
      cell: ({ row }) => (
        <div className="ps-2 font-light">
          {formatCurrency(row.getValue("SALARY_AMOUNT"), row.original.SALARY_CURRENCY)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const contract = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => handleEdit(contract)}
            >
              <IconEdit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(contract)}
              disabled={deleteContractMutation.isPending}
            >
              {deleteContractMutation.isPending
                ? <Spinner data-icon="inline-start" />
                : <Trash2 className="h-4 w-4" />
              }
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: contractsData,
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

  /* ─── Loading ─────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Contracts</h1>
            <Button disabled><IconPlus />Add Contract</Button>
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading contracts...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error ───────────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <div>
        <div className="bg-card rounded-md shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Contracts</h1>
            <Button onClick={() => setIsAddSheetOpen(true)}><IconPlus />Add Contract</Button>
          </div>
        </div>
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Contracts</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load contracts. Please try again."}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="w-fit">
                {isFetching
                  ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                  : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>
                }
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  /* ─── Main ────────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Contracts</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Employee Management</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Contracts</BreadcrumbPage>
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
              <IconPlus />Add Contract
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <CustomDataTableToolbar table={table} searchPlaceholder="Search contracts..." />

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null
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
                          <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                          <EmptyTitle>No Contracts Found</EmptyTitle>
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

      {isAddSheetOpen && (
        <AddContractSheet
          open={isAddSheetOpen}
          onOpenChange={setIsAddSheetOpen}
          showConfirmation={showConfirmation}
        />
      )}

      {isUpdateSheetOpen && (
        <UpdateContractSheet
          open={isUpdateSheetOpen}
          onOpenChange={setIsUpdateSheetOpen}
          showConfirmation={showConfirmation}
          contract={selectedContract}
        />
      )}
      <ConfirmationDialog />
    </div>
  );
}