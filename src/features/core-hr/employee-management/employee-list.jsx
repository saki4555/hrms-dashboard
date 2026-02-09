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
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  Users,
  FileTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useDeleteEmployee, useEmployees } from "./queries";
import { Spinner } from "@/components/ui/spinner";
import { IconPlus } from "@tabler/icons-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useNavigate } from "react-router";
import UpdateEmployeeSheet from "./update-employee-sheet";

const GENDER_OPTIONS = [
  { value: "all", label: "All Genders" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  // Format: Feb 5, 2026 at 12:45 PM
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

const formatSimpleDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  // Format: Feb 5, 2026
  return format(date, "MMM d, yyyy");
};

export default function EmployeeList() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: employeeData = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEmployees();

  const deleteEmployeeMutation = useDeleteEmployee();

  console.log("Employee data:", employeeData);

  const handleEdit = (employee) => {
    console.log("Edit employee:", employee);
    setSelectedEmployee(employee);
    setIsUpdateSheetOpen(true);
  };

  const handleDelete = async (employee) => {
    const fullName = `${employee.FIRST_NAME} ${employee.LAST_NAME}`;
    const confirmed = await showConfirmation({
      title: "Delete employee?",
      description: `Are you sure you want to delete "${fullName}" (${employee.EMP_NO})? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteEmployeeMutation.mutateAsync(employee.PERSON_ID);
        console.log("Employee deleted successfully:", employee);
        toast.success("Employee deleted successfully!");
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error(
          error?.message || "Failed to delete employee. Please try again.",
        );
      }
    }
  };

  const handleRefetch = () => {
    refetch();
  };

  const handleAddEmployee = () => {
    navigate("/core-hr/employees/add");
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
      accessorKey: "EMP_NO",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employee ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("EMP_NO")}</div>
      ),
    },
    {
      id: "fullName",
      accessorFn: (row) =>
        `${row.TITLE || ""} ${row.FIRST_NAME} ${row.LAST_NAME}`.trim(),
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Full Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const title = row.original.TITLE;
        const firstName = row.original.FIRST_NAME;
        const lastName = row.original.LAST_NAME;
        return (
          <div className="font-medium">
            {title && <span className="text-muted-foreground">{title} </span>}
            {firstName} {lastName}
          </div>
        );
      },
    },
    {
      accessorKey: "GENDER",
      header: "Gender",
      cell: ({ row }) => <div>{row.getValue("GENDER") || "N/A"}</div>,
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "DATE_OF_BIRTH",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date of Birth
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("DATE_OF_BIRTH");
        return <div>{formatSimpleDate(date)}</div>;
      },
    },
    {
      accessorKey: "NID",
      header: "NID",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.getValue("NID") || "N/A"}</div>
      ),
    },
    {
      accessorKey: "NATIONALITY",
      header: "Nationality",
      cell: ({ row }) => <div>{row.getValue("NATIONALITY") || "N/A"}</div>,
    },
    {
      accessorKey: "JOIN_DATE",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Join Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("JOIN_DATE");
        return <div>{formatSimpleDate(date)}</div>;
      },
    },
    {
      accessorKey: "PERSON_TYPE_ID",
      header: "Type",
      cell: ({ row }) => {
        const typeId = row.getValue("PERSON_TYPE_ID");
        // You can map this to actual type names if you have the person types data
        return <Badge variant="outline">{typeId || "N/A"}</Badge>;
      },
    },

    {
      accessorKey: "CREATION_DATE",
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
        const date = row.getValue("CREATION_DATE");
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const employee = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleEdit(employee)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
              onClick={() => handleDelete(employee)}
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 "
              onClick={() =>
                navigate(
                  `/core-hr/employee-management/employee-details/${employee.PERSON_ID}`
                )
              }
            >
              <FileTextIcon className="w-4 h-4" />
              <span className="sr-only">Details</span>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: employeeData,
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
              <h1 className="text-2xl md:text-2xl font-bold">Employees</h1>
              <p className="text-muted-foreground mt-1">
                Manage employee information and records
              </p>
            </div>
            <Button disabled>
              <IconPlus size={20} className="mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading employees...</p>
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
              <h1 className="text-2xl md:text-2xl font-bold">Employees</h1>
              <p className="text-muted-foreground mt-1">
                Manage employee information and records
              </p>
            </div>
            <Button onClick={handleAddEmployee}>
              <IconPlus size={20} className="mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Employees</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>
                {error?.message ||
                  "Failed to load employees. Please try again."}
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
          <div>
            <h1 className="text-2xl md:text-2xl font-semibold">Employees</h1>
            <p className="text-muted-foreground mt-1">
              Manage employee information and records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefetch}
              disabled={isFetching}
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={handleAddEmployee}>
              <IconPlus size={20} className="mr-2" />
              Add Employee
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search employees..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />

            <Select
              value={
                table.getColumn("GENDER")?.getFilterValue()?.toString() || "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("GENDER")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                      <TableHead key={header.id} className="font-medium">
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
                            <Users />
                          </EmptyMedia>
                          <EmptyTitle>No Employees Found</EmptyTitle>
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

      <UpdateEmployeeSheet
        open={isUpdateSheetOpen}
        onOpenChange={setIsUpdateSheetOpen}
        employee={selectedEmployee}
        showConfirmation={showConfirmation}
      />
      <ConfirmationDialog />
    </div>
  );
}
