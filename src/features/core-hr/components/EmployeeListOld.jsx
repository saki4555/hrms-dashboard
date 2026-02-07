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
  MoreHorizontal,
  UserPlus,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import CreateEmployeeSheet from "./CreateEmployeeSheet";
import { useEmployees } from "../hooks/useEmployees";
import { DataTablePagination } from "@/components/DataTablePagination";
import { useNavigate } from "react-router";
import { usePersonTypes } from "../hooks/usePersonTypes";
import EditEmployeeModal from "./EditEmployeeModal";

import EditEmployeeDrawer from "./EditEmployeeDrawer";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

const getStatusLabel = (status) => {
  return status === "1" ? "Active" : "Inactive";
};

export default function EmployeeListOld() {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const navigate = useNavigate();

  const { data: employeeData = [], isLoading, isError } = useEmployees();
  console.log({ employeeData }, "from use employee hook");
  const { data: personTypes = [], isLoading: personTypesLoading } =
    usePersonTypes();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // console.log("Person types", personTypes);

  // console.log({ employeeData }, "from use employee hook");

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
            Employee No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("EMP_NO")}</div>
      ),
    },
    {
      accessorKey: "FIRST_NAME",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const firstName = row.getValue("FIRST_NAME");
        const lastName = row.original.LAST_NAME;
        const title = row.original.TITLE;
        return (
          <div>
            {title && (
              <span className="text-muted-foreground mr-1">{title}</span>
            )}
            {firstName} {lastName}
          </div>
        );
      },
    },
    {
      accessorKey: "GENDER",
      header: "Gender",
      cell: ({ row }) => <div>{row.getValue("GENDER") || "N/A"}</div>,
    },
    {
      accessorKey: "JOIN_DATE",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className=""
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Join Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("JOIN_DATE");
        return <div className="ml-2">{date ? date : "N/A"}</div>;
      },
    },
    {
      accessorKey: "PERSON_TYPE_ID",
      header: "Employee Type",
      cell: ({ row }) => (
        <div className="capitalize">
          {getPersonTypeName(row.getValue("PERSON_TYPE_ID"))}
        </div>
      ),
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "STATUS",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("STATUS");
        return (
          <Badge variant={status === "1" ? "success" : "destructive"}>
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
      enableHiding: false,
      cell: ({ row }) => {
        const employee = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigate(`/core-hr/employee/${employee.EMP_NO}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(employee.EMP_NO)}
              >
                Copy Employee ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
           <DropdownMenuItem onClick={() => navigate(`/core-hr/employee/edit/${employee.EMP_NO}`)}>
                Edit Employee Page
              </DropdownMenuItem>


              <DropdownMenuItem onClick={() => handleOpenEdit(employee)}>
                Edit Employee
              </DropdownMenuItem>

              <DropdownMenuItem className="text-red-600">
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

  const getPersonTypeName = (id) => {
    const type = personTypes.find((t) => t.PERSON_TYPE_ID === id);
    return type ? type.PERSON_TYPE : "Unknown";
  };

  const handleOpenEdit = (employee) => {
    setSelectedEmployee(employee);
    setIsEditOpen(true);
  };

  const handleSave = async (mode, formData) => {
    console.log("Edit modal saved:", { mode, formData });
    // Example: ask confirmation? (optional)
    if (mode === "update") {
      const confirmed = await showConfirmation({
        title: "Create new record?",
        description: "You are about to create a new employee record. Continue?",
        confirmText: "Proceed",
        cancelText: "Cancel",
      });
      if (!confirmed) {
        console.log("User cancelled update mode save.");
        return;
      }
    }
    // For now: just console log; later integrate your state update or API call.
    setIsEditOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Core HR</h1>
              <p className="text-muted-foreground mt-1">
                Manage employee information and records
              </p>
            </div>
            <Button onClick={() => navigate('/core-hr/employee/create-employee')}>Create Employee</Button>
            <CreateEmployeeSheet />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
          <div className="space-y-4">
            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search employees..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
              />

              <Select
                value={
                  table.getColumn("PERSON_TYPE_ID")?.getFilterValue() || "all"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("PERSON_TYPE_ID")
                    ?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Employee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {personTypes.map((type) => (
                    <SelectItem
                      key={type.PERSON_TYPE_ID}
                      value={type.PERSON_TYPE_ID}
                    >
                      {type.PERSON_TYPE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={table.getColumn("STATUS")?.getFilterValue() || "all"}
                onValueChange={(value) =>
                  table
                    .getColumn("STATUS")
                    ?.setFilterValue(value === "all" ? undefined : value)
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
                              header.getContext()
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
                              cell.getContext()
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
                          <UserPlus className="w-12 h-12 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No employees found
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
      <EditEmployeeModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        employee={selectedEmployee}
        onSave={handleSave}
        showConfirmation={showConfirmation} // ← Add this!
      />

    </div>
  );
}
