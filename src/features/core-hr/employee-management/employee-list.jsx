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
import { Link, useNavigate } from "react-router";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import CustomDataTableColumnHeader from "@/components/shared/custom-data-table-column-header";
import CustomDataTableToolbar from "@/components/shared/custom-data-table-toolbar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const GENDER_OPTIONS = [
  { value: "all", label: "All Genders" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const formatSimpleDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy");
};

export default function EmployeeList() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

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

  const handleEdit = (employee) => {
    navigate(`/core-hr/employee-management/update/${employee.PERSON_ID}`);
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
        toast.success("Employee deleted successfully!");
      } catch (error) {
        toast.error(
          error?.message || "Failed to delete employee. Please try again.",
        );
      }
    }
  };

  const handleRefetch = () => refetch();

  const handleAddEmployee = () => navigate("/core-hr/employees/add");

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
      header: ({ column }) => (
        // <Button
        //   variant="ghost"
        //   onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        // >
        //   Employee ID
        //   <ArrowUpDown className="ml-2 h-4 w-4" />
        // </Button>
        <CustomDataTableColumnHeader column={column} title="Employee ID" />
      ),
      cell: ({ row }) => (
        <div className="font-medium ps-2 ">{row.getValue("EMP_NO")}</div>
      ),
    },
    {
      id: "fullName",
      accessorFn: (row) =>
        `${row.TITLE || ""} ${row.FIRST_NAME} ${row.LAST_NAME}`.trim(),
      header: ({ column }) => (
        // <Button
        //   variant="ghost"
        //   onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        // >
        //   Full Name
        //   <ArrowUpDown className="ml-2 h-4 w-4" />
        // </Button>
        <CustomDataTableColumnHeader column={column} title="Employee ID" />
      ),
      cell: ({ row }) => {
        const title = row.original.TITLE;
        const firstName = row.original.FIRST_NAME;
        const lastName = row.original.LAST_NAME;
        return (
          <div className="font-medium ps-2">
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
      // filterFn: (row, id, value) =>
      //   value === "all" || row.getValue(id) === value,
      filterFn: (row, id, value) => value.includes(row.getValue(id)), // ← changed
    },
    {
      accessorKey: "JOIN_DATE",
      header: ({ column }) => (
        // <Button
        //   variant="ghost"
        //   onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        // >
        //   Join Date
        //   <ArrowUpDown className="ml-2 h-4 w-4" />
        // </Button>
        <CustomDataTableColumnHeader column={column} title="Join Date" />
      ),
      cell: ({ row }) => (
        <div className="ps-2">
          {formatSimpleDate(row.getValue("JOIN_DATE"))}
        </div>
      ),
    },
    {
      // Using the nested personType object for a readable label instead of raw PERSON_TYPE_ID
      id: "personType",
      accessorFn: (row) => row.personType?.PERSON_TYPE ?? row.PERSON_TYPE_ID,
      header: "Person Type",
      cell: ({ row }) => {
        const label =
          row.original.personType?.PERSON_TYPE ?? row.original.PERSON_TYPE_ID;
        return <Badge variant="outline">{label || "N/A"}</Badge>;
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)), // ← added
    },
    {
  id: "assignment",
  accessorFn: (row) => row.assignment?.POSITION_TITLE ?? "", // ← add this
  header: "Position",
  cell: ({ row }) => {
    const title = row.original.assignment?.POSITION_TITLE;
    return <div>{title || "N/A"}</div>;
  },
  enableSorting: false,
  filterFn: (row, id, value) => value.includes(row.getValue(id)),
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
              className="h-8 w-8"
              onClick={() =>
                navigate(
                  `/core-hr/employee-management/employee-details/${employee.PERSON_ID}`,
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

  const genderOptions = [
    ...new Map(
      employeeData
        .map((e) => e.GENDER)
        .filter(Boolean)
        .map((g) => [g, { label: g, value: g }]),
    ).values(),
  ];

  const personTypeOptions = [
    ...new Map(
      employeeData
        .map((e) => e.personType?.PERSON_TYPE ?? String(e.PERSON_TYPE_ID ?? ""))
        .filter(Boolean)
        .map((pt) => [pt, { label: pt, value: pt }]),
    ).values(),
  ];

  const positionOptions = [
    ...new Map(
      employeeData
        .map((e) => e.assignment?.POSITION_TITLE)
        .filter(Boolean)
        .map((p) => [p, { label: p, value: p }]),
    ).values(),
  ];
  // Loading State
  if (isLoading) {
    return (
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Employees</h1>
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
      <div>
        <div className="bg-card rounded-sm shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Employees</h1>
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
    <div>
      <div className="bg-card rounded-md shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-2xl font-semibold tracking-tight">Employees</h1>
             <Breadcrumb>
                          <BreadcrumbList>
                            <BreadcrumbItem>
                              <BreadcrumbLink asChild>
                                <Link to="/">Dashboard</Link>
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>Core HR</BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              <BreadcrumbPage className="text-muted-foreground/80 ">Employee Management</BreadcrumbPage>
                            </BreadcrumbItem>
                          </BreadcrumbList>
                        </Breadcrumb>
            
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
          {/* <div className="flex flex-col sm:flex-row gap-4">
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
                  .map((column) => (
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
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
          <CustomDataTableToolbar
            table={table}
            searchPlaceholder="Search employees..."
            filters={[
              { columnId: "GENDER", title: "Gender", options: genderOptions },
              {
                columnId: "personType",
                title: "Person Type",
                options: personTypeOptions,
              },
              {
                columnId: "assignment",
                title: "Position",
                options: positionOptions,
              },
            ]}
          />

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

      <ConfirmationDialog />
    </div>
  );
}
